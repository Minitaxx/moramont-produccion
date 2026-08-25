'use server'

import { prisma } from '@/lib/prisma'

// ─────────────────────────────────────────────────────────────────────────────
// startTask
// ─────────────────────────────────────────────────────────────────────────────

export async function startTask({ taskId, operatorId }: { taskId: string; operatorId: string }) {
  try {
    if (!taskId || !operatorId) return { error: 'taskId y operatorId son requeridos' }

    // Verificar que el operario esté asignado a la tarea
    const assignment = await prisma.workOrderTaskOperator.findUnique({
      where: { workOrderTaskId_operatorId: { workOrderTaskId: taskId, operatorId } },
    })
    if (!assignment) return { error: 'El operario no está asignado a esta tarea' }

    // Obtener la tarea
    const task = await prisma.workOrderTask.findUnique({
      where: { id: taskId },
      include: { workOrder: true },
    })
    if (!task) return { error: 'Tarea no encontrada' }

    // Validar "una sola tarea en curso" por operario
    const activeElsewhere = await prisma.taskTimeRecord.findFirst({
      where: { operatorId, status: 'IN_PROGRESS' },
    })
    if (activeElsewhere) {
      return { error: 'Ya tiene una tarea en curso. Finalícela o cancélela primero.' }
    }

    // Validar dependencia por orden: ninguna tarea anterior del mismo workOrder sin completar
    const blocker = await prisma.workOrderTask.findFirst({
      where: {
        workOrderId: task.workOrderId,
        order: { lt: task.order },
        status: { not: 'COMPLETED' },
      },
      orderBy: { order: 'desc' },
    })
    if (blocker) {
      return { error: 'Esta tarea está bloqueada. Complete la tarea anterior primero.' }
    }

    // Verificar que no exista un record activo (IN_PROGRESS o PAUSED) para este par
    const activeRecord = await prisma.taskTimeRecord.findFirst({
      where: {
        workOrderTaskId: taskId,
        operatorId,
        status: { in: ['IN_PROGRESS', 'PAUSED'] },
      },
    })
    if (activeRecord) return { error: 'Ya existe un registro activo para esta tarea' }

    const now = new Date()

    const record = await prisma.$transaction(async (tx) => {
      // Crear el registro de tiempo
      const newRecord = await tx.taskTimeRecord.create({
        data: {
          workOrderTaskId: taskId,
          operatorId,
          status: 'IN_PROGRESS',
          startedAt: now,
        },
      })

      // Si la tarea estaba PENDING o BLOCKED, pasarla a IN_PROGRESS
      if (task.status === 'PENDING' || task.status === 'BLOCKED') {
        await tx.workOrderTask.update({
          where: { id: taskId },
          data: { status: 'IN_PROGRESS' },
        })
      }

      // Si la WorkOrder estaba PENDING, pasarla a IN_PROGRESS
      if (task.workOrder.status === 'PENDING') {
        await tx.workOrder.update({
          where: { id: task.workOrderId },
          data: { status: 'IN_PROGRESS' },
        })
      }

      return newRecord
    })

    // La tablet solo necesita confirmación (sin fechas ni objetos)
    return { ok: true as const }
  } catch (e) {
    console.error('[startTask]', e)
    return { error: 'Error al iniciar la tarea' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// pauseTask
// ─────────────────────────────────────────────────────────────────────────────

export async function pauseTask({ recordId, pauseReason }: { recordId: string; pauseReason: string }) {
  try {
    if (!recordId) return { error: 'recordId es requerido' }
    if (!pauseReason?.trim() || pauseReason.trim().length < 3) {
      return { error: 'El motivo de pausa debe tener al menos 3 caracteres.' }
    }

    const record = await prisma.taskTimeRecord.findUnique({ where: { id: recordId } })
    if (!record) return { error: 'Registro no encontrado' }
    if (record.status !== 'IN_PROGRESS') return { error: 'El registro no está en progreso' }

    await prisma.taskTimeRecord.update({
      where: { id: recordId },
      data: {
        status: 'PAUSED',
        pausedAt: new Date(),
        pauseReason: pauseReason.trim(),
      },
    })

    return { ok: true as const }
  } catch (e) {
    console.error('[pauseTask]', e)
    return { error: 'Error al pausar la tarea' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// resumeTask
// ─────────────────────────────────────────────────────────────────────────────

export async function resumeTask(recordId: string) {
  try {
    if (!recordId) return { error: 'recordId es requerido' }

    const record = await prisma.taskTimeRecord.findUnique({ where: { id: recordId } })
    if (!record) return { error: 'Registro no encontrado' }
    if (record.status !== 'PAUSED') return { error: 'El registro no está pausado' }

    // Crear un NUEVO registro en curso; el pausado queda inmutable (trazabilidad)
    await prisma.$transaction(async (tx) => {
      await tx.taskTimeRecord.create({
        data: {
          workOrderTaskId: record.workOrderTaskId,
          operatorId: record.operatorId,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      })

      await tx.workOrderTask.update({
        where: { id: record.workOrderTaskId },
        data: { status: 'IN_PROGRESS' },
      })
    })

    return { ok: true as const }
  } catch (e) {
    console.error('[resumeTask]', e)
    return { error: 'Error al reanudar la tarea' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// completeTask
// ─────────────────────────────────────────────────────────────────────────────

export async function completeTask({
  recordId,
  piecesProduced,
}: {
  recordId: string
  piecesProduced?: number
}) {
  try {
    if (!recordId) return { error: 'recordId es requerido' }

    const record = await prisma.taskTimeRecord.findUnique({
      where: { id: recordId },
      include: {
        workOrderTask: {
          include: {
            assignedOperators: true,
            workOrder: { include: { tasks: true } },
            requiredBy: true,
          },
        },
      },
    })
    if (!record) return { error: 'Registro no encontrado' }
    if (record.status !== 'IN_PROGRESS' && record.status !== 'PAUSED') {
      return { error: 'El registro debe estar en progreso o pausado para completarse' }
    }

    const now = new Date()

    // Si estaba PAUSED, calcular tiempo pausado adicional
    let additionalPausedMs = 0
    if (record.status === 'PAUSED' && record.pausedAt) {
      additionalPausedMs = now.getTime() - record.pausedAt.getTime()
    }

    await prisma.$transaction(async (tx) => {
      // 1. Completar el record
      await tx.taskTimeRecord.update({
        where: { id: recordId },
        data: {
          status: 'COMPLETED',
          completedAt: now,
          pausedAt: null,
          totalPausedMs: record.totalPausedMs + additionalPausedMs,
          ...(piecesProduced != null && piecesProduced > 0 ? { piecesProduced } : {}),
        },
      })

      // 2. Verificar si TODOS los operarios asignados tienen al menos un record COMPLETED
      const assignedOperatorIds = record.workOrderTask.assignedOperators.map((a) => a.operatorId)

      // Obtener todos los records COMPLETED de esta tarea (incluyendo el que acabamos de completar)
      const completedRecords = await tx.taskTimeRecord.findMany({
        where: {
          workOrderTaskId: record.workOrderTaskId,
          status: 'COMPLETED',
        },
        select: { operatorId: true },
      })
      const completedOperatorIds = new Set(completedRecords.map((r) => r.operatorId))

      const allOperatorsCompleted = assignedOperatorIds.every((id) => completedOperatorIds.has(id))

      if (allOperatorsCompleted) {
        // 3. Completar la WorkOrderTask
        await tx.workOrderTask.update({
          where: { id: record.workOrderTaskId },
          data: { status: 'COMPLETED' },
        })

        // 4. Desbloquear tareas que dependían de esta (si todas sus dependencias están COMPLETED)
        for (const dependentTask of record.workOrderTask.requiredBy) {
          const depFull = await tx.workOrderTask.findUnique({
            where: { id: dependentTask.id },
            include: { requires: true },
          })
          if (depFull?.requires?.status === 'COMPLETED') {
            await tx.workOrderTask.update({
              where: { id: dependentTask.id },
              data: { status: 'PENDING' },
            })
          }
        }

        // 5. Verificar si TODAS las tareas de la WorkOrder están COMPLETED
        const allTasksDone = record.workOrderTask.workOrder.tasks.every(
          (t) => t.id === record.workOrderTaskId || t.status === 'COMPLETED',
        )
        if (allTasksDone) {
          await tx.workOrder.update({
            where: { id: record.workOrderTask.workOrderId },
            data: { status: 'COMPLETED' },
          })
        }
      }
    })

    return { ok: true as const }
  } catch (e) {
    console.error('[completeTask]', e)
    return { error: 'Error al completar la tarea' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// cancelTask
// ─────────────────────────────────────────────────────────────────────────────

export async function cancelTask(recordId: string) {
  try {
    if (!recordId) return { error: 'recordId es requerido' }

    const record = await prisma.taskTimeRecord.findUnique({ where: { id: recordId } })
    if (!record) return { error: 'Registro no encontrado' }
    if (record.status !== 'IN_PROGRESS' && record.status !== 'PAUSED') {
      return { error: 'Solo se pueden cancelar registros en progreso o pausados' }
    }

    // Nunca borrar startedAt: se preserva la trazabilidad
    await prisma.taskTimeRecord.update({
      where: { id: recordId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    })

    return { ok: true as const }
  } catch (e) {
    console.error('[cancelTask]', e)
    return { error: 'Error al cancelar el registro' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getTaskTimeRecords
// ─────────────────────────────────────────────────────────────────────────────

export async function getTaskTimeRecords({
  workOrderTaskId,
  operatorId,
}: {
  workOrderTaskId?: string
  operatorId?: string
}) {
  try {
    const where: Record<string, string> = {}
    if (workOrderTaskId) where.workOrderTaskId = workOrderTaskId
    if (operatorId) where.operatorId = operatorId

    const records = await prisma.taskTimeRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        operator: true,
        workOrderTask: {
          include: {
            workOrder: true,
            processType: true,
          },
        },
      },
    })

    return { ok: true as const, data: records }
  } catch (e) {
    console.error('[getTaskTimeRecords]', e)
    return { error: 'Error al obtener los registros de tiempo' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getAllTaskTimeRecords
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllTaskTimeRecords({
  operatorId,
  workOrderId,
  fromDate,
  toDate,
}: {
  operatorId?: string
  workOrderId?: string
  fromDate?: string
  toDate?: string
} = {}) {
  try {
    const where: any = {}
    if (operatorId) where.operatorId = operatorId
    if (workOrderId) where.workOrderTask = { workOrderId }
    // Filtrar por startedAt cubriendo todo el día (00:00:00 a 23:59:59)
    if (fromDate || toDate) {
      where.startedAt = {}
      if (fromDate) where.startedAt.gte = new Date(`${fromDate}T00:00:00`)
      if (toDate) where.startedAt.lte = new Date(`${toDate}T23:59:59`)
    }

    const records = await prisma.taskTimeRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        operator: true,
        workOrderTask: {
          include: {
            workOrder: true,
            processType: true,
          },
        },
      },
    })

    return { ok: true as const, data: records }
  } catch (e) {
    console.error('[getAllTaskTimeRecords]', e)
    return { error: 'Error al obtener registros de tiempo' }
  }
}