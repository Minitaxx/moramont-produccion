'use server'

import { prisma } from '@/lib/prisma'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

interface CreateWorkOrderTaskInput {
  processTypeId: string
  order: number
  quantityTotal: number
  instructions: string | null
  operatorIds: string[]
}

interface CreateWorkOrderInput {
  code: string
  productId: string
  quantityTotal: number
  quoteId?: string | null
  tasks: CreateWorkOrderTaskInput[]
}

// ─────────────────────────────────────────────────────────────────────────────
// createWorkOrder
// ─────────────────────────────────────────────────────────────────────────────

export async function createWorkOrder(
  data: CreateWorkOrderInput,
): Promise<{ ok: true; data: { id: string; code: string } } | { error: string }> {
  try {
    const code = data.code?.trim()
    if (!code) return { error: 'El código de la orden es requerido.' }
    if (!data.productId) return { error: 'El producto es requerido.' }
    if (!Number.isInteger(data.quantityTotal) || data.quantityTotal <= 0) {
      return { error: 'La cantidad total debe ser un número entero mayor a 0.' }
    }
    if (!data.tasks || data.tasks.length === 0) {
      return { error: 'La orden debe tener al menos una tarea.' }
    }

    // Validaciones por tarea
    for (const task of data.tasks) {
      if (!task.processTypeId) return { error: 'Cada tarea debe tener un tipo de proceso.' }
      if (!Number.isInteger(task.order) || task.order <= 0) {
        return { error: 'El orden de cada tarea debe ser un número entero mayor a 0.' }
      }
      if (!Number.isInteger(task.quantityTotal) || task.quantityTotal <= 0) {
        return { error: 'La cantidad de cada tarea debe ser un número entero mayor a 0.' }
      }
    }

    // Sin orders duplicados dentro de la misma OP
    const orders = data.tasks.map((t) => t.order)
    if (new Set(orders).size !== orders.length) {
      return { error: 'Hay tareas con orden duplicado.' }
    }

    const workOrder = await prisma.$transaction(async (tx) => {
      // Unicidad del código
      const existing = await tx.workOrder.findUnique({ where: { code } })
      if (existing) throw new Error('DUPLICATE_CODE')

      // Integridad: si viene quoteId, verificar que la cotización exista
      let validQuoteId: string | null = null
      if (data.quoteId) {
        const quote = await tx.quote.findUnique({ where: { id: data.quoteId }, select: { id: true } })
        if (!quote) throw new Error('QUOTE_NOT_FOUND')
        validQuoteId = quote.id
      }

      // Crear la WorkOrder
      const order = await tx.workOrder.create({
        data: {
          code,
          productId: data.productId,
          quantityTotal: data.quantityTotal,
          quoteId: validQuoteId,
          status: 'PENDING',
        },
      })

      // Crear las tareas en cadena ascendente por order:
      // - requiresTaskId apunta a la tarea anterior creada (order - 1), null para la primera
      // - Primera tarea PENDING, resto BLOCKED por depender de la anterior
      const sortedTasks = [...data.tasks].sort((a, b) => a.order - b.order)
      let previousTaskId: string | null = null

      for (const task of sortedTasks) {
        // Anotación explícita: evita inferencia circular con previousTaskId
        const created: { id: string } = await tx.workOrderTask.create({
          data: {
            workOrderId: order.id,
            processTypeId: task.processTypeId,
            order: task.order,
            quantityTotal: task.quantityTotal,
            instructions: task.instructions || null,
            requiresTaskId: previousTaskId,
            status: previousTaskId ? 'BLOCKED' : 'PENDING',
          },
        })

        // Asignaciones de operarios (opcionales)
        if (task.operatorIds && task.operatorIds.length > 0) {
          await tx.workOrderTaskOperator.createMany({
            data: task.operatorIds.map((operatorId) => ({
              workOrderTaskId: created.id,
              operatorId,
            })),
            skipDuplicates: true,
          })
        }

        previousTaskId = created.id
      }

      return order
    })

    // Solo id y code, sin fechas ni objetos anidados
    return { ok: true, data: { id: workOrder.id, code: workOrder.code } }
  } catch (e) {
    if (e instanceof Error && e.message === 'DUPLICATE_CODE') {
      return { error: 'Ya existe una orden con ese código.' }
    }
    if (e instanceof Error && e.message === 'QUOTE_NOT_FOUND') {
      return { error: 'La cotización asociada no existe.' }
    }
    console.error('[createWorkOrder]', e)
    return { error: 'Error al crear la orden de producción.' }
  }
}