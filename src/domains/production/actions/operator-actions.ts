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

    // Buscar todas las WorkOrderTask donde el operario esté asignado
    const assignments = await prisma.workOrderTaskOperator.findMany({
      where: { operatorId },
      include: {
        workOrderTask: {
          include: {
            workOrder: {
              include: { product: true },
            },
            processType: true,
            requires: {
              include: { processType: true },
            },
            // Solo los time records de este operario
            timeRecords: {
              where: { operatorId },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    })

    const tasks = assignments.map((a) => a.workOrderTask)

    return { ok: true as const, data: tasks }
  } catch (e) {
    console.error('[getOperatorTasks]', e)
    return { error: 'Error al obtener las tareas del operario' }
  }
}
