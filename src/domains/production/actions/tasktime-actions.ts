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

    // Obtener la tarea con su dependencia
    const task = await prisma.workOrderTask.findUnique({
      where: { id: taskId },
      include: { requires: true, workOrder: true },
    })
    if (!task) return { error: 'Tarea no encontrada' }

    // Validar dependencia: la tarea requerida debe estar COMPLETED
    if (task.requiresTaskId && task.requires?.status !== 'COMPLETED') {
      return { error: 'La tarea previa debe estar completada antes de iniciar esta' }
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

    return { ok: true as const, data: record }
  } catch (e) {
    console.error('[startTask]', e)
    return { error: 'Error al iniciar la tarea' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// pauseTask
// ─────────────────────────────────────────────────────────────────────────────

export async function pauseTask({
  recordId,
  piecesAdvanced,
  pauseReason,
}: {
  recordId: string
  piecesAdvanced: number
  pauseReason: string
}) {
  try {
    if (!recordId) return { error: 'recordId es requerido' }
    if (piecesAdvanced == null || piecesAdvanced < 0) return { error: 'piecesAdvanced debe ser un número mayor o igual a 0' }
    if (!pauseReason?.trim()) return { error: 'El motivo de pausa es requerido' }

    const record = await prisma.taskTimeRecord.findUnique({ where: { id: recordId } })
    if (!record) return { error: 'Registro no encontrado' }
    if (record.status !== 'IN_PROGRESS') return { error: 'El registro no está en progreso' }

    await prisma.taskTimeRecord.update({
      where: { id: recordId },
      data: {
        status: 'PAUSED',
        pausedAt: new Date(),
        piecesAdvanced,
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
    if (!record.pausedAt) return { error: 'El registro no tiene fecha de pausa' }

    const pausedMs = Date.now() - record.pausedAt.getTime()

    await prisma.taskTimeRecord.update({
      where: { id: recordId },
      data: {
        status: 'IN_PROGRESS',
        pausedAt: null,
        totalPausedMs: record.totalPausedMs + pausedMs,
      },
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

export async function completeTask(recordId: string) {
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

    await prisma.taskTimeRecord.update({
      where: { id: recordId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        startedAt: null,
        pausedAt: null,
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
