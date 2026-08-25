'use server'

import { prisma } from '@/lib/prisma'

// ─────────────────────────────────────────────────────────────────────────────
// listOperators
// ─────────────────────────────────────────────────────────────────────────────

export async function listOperators() {
  try {
    const operators = await prisma.operator.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    return { ok: true as const, data: operators }
  } catch (e) {
    console.error('[listOperators]', e)
    return { error: 'Error al obtener la lista de operarios' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getOperatorTasks
// ─────────────────────────────────────────────────────────────────────────────

export async function getOperatorTasks(operatorId: string) {
  try {
    if (!operatorId) return { error: 'El id del operario es requerido' }

    // 1) Asignaciones del operario con su tarea (solo lo necesario para el shape plano)
    const assignments = await prisma.workOrderTaskOperator.findMany({
      where: { operatorId },
      include: {
        workOrderTask: {
          include: {
            workOrder: true,
            processType: true,
            timeRecords: {
              where: { operatorId },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    })

    const myTasks = assignments.map((a) => a.workOrderTask)

    // Excluir tareas COMPLETED (filtro en el servidor, no en el cliente)
    const visible = myTasks.filter((t) => t.status !== 'COMPLETED')

    if (visible.length === 0) return { ok: true as const, data: [] }

    // 2) Traer todas las tareas hermanas de los workOrders involucrados (una sola query)
    const workOrderIds = [...new Set(visible.map((t) => t.workOrderId))]
    const siblings = await prisma.workOrderTask.findMany({
      where: { workOrderId: { in: workOrderIds } },
      include: { processType: true },
      orderBy: { order: 'asc' },
    })

    // 3) Mapear al shape plano de la tablet (sin fechas ni objetos anidados innecesarios)
    const data = visible
      .map((t) => {
        // Bloqueo por orden: existe otra tarea del mismo workOrder con order menor sin completar
        const blockers = siblings
          .filter(
            (s) =>
              s.workOrderId === t.workOrderId &&
              s.id !== t.id &&
              s.order < t.order &&
              s.status !== 'COMPLETED',
          )
          .sort((a, b) => b.order - a.order) // la bloqueadora más cercana primero
        const blocker = blockers[0]

        const activeRecord =
          t.timeRecords.find((r) => r.status === 'IN_PROGRESS' || r.status === 'PAUSED') ?? null

        return {
          id: t.id,
          workOrderCode: t.workOrder.code,
          processTypeName: t.processType.name,
          order: t.order,
          status: t.status as 'PENDING' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED',
          isBlocked: blockers.length > 0,
          requiresProcessName: blocker ? blocker.processType.name : null,
          quantityTotal: Number(t.quantityTotal),
          instructions: t.instructions,
          activeRecordId: activeRecord?.id ?? null,
          myRecordStatus: (t.timeRecords[0]?.status ?? null) as
            | 'NOT_STARTED'
            | 'IN_PROGRESS'
            | 'PAUSED'
            | 'COMPLETED'
            | 'CANCELLED'
            | null,
        }
      })
      // Ordenar por secuencia del proceso: agrupado por OP y luego order ASC
      .sort((a, b) => a.workOrderCode.localeCompare(b.workOrderCode) || a.order - b.order)

    return { ok: true as const, data }
  } catch (e) {
    console.error('[getOperatorTasks]', e)
    return { error: 'Error al obtener las tareas del operario' }
  }
}
