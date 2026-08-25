'use server'

import { prisma } from '@/lib/prisma'
import { WorkOrderStatus } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CreateWorkOrderTaskInput {
  processTypeId: string
  order: number
  quantityTotal: number
  instructions?: string
  operatorIds: string[]
  requiresTaskId?: string | null
}

interface CreateWorkOrderInput {
  code: string
  productId: string
  quantityTotal: number
  tasks: CreateWorkOrderTaskInput[]
}

// ─────────────────────────────────────────────────────────────────────────────
// createWorkOrder
// ─────────────────────────────────────────────────────────────────────────────

export async function createWorkOrder(input: CreateWorkOrderInput) {
  try {
    const { code, productId, quantityTotal, tasks } = input

    if (!code?.trim()) return { error: 'El código de la orden es requerido' }
    if (!productId) return { error: 'El producto es requerido' }
    if (!quantityTotal || quantityTotal < 1) return { error: 'La cantidad debe ser mayor a 0' }
    if (!tasks || tasks.length === 0) return { error: 'La orden debe tener al menos una tarea' }

    // Verificar que el código no exista ya
    const existing = await prisma.workOrder.findUnique({ where: { code: code.trim() } })
    if (existing) return { error: `Ya existe una orden con el código "${code.trim()}"` }

    const workOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.workOrder.create({
        data: {
          code: code.trim(),
          productId,
          quantityTotal,
          status: 'PENDING',
        },
      })

      // Crear tareas en dos pasadas para resolver referencias de requiresTaskId
      // Pasada 1: crear todas las tareas sin requiresTaskId (usamos mapa order → id)
      const createdTaskMap: Record<number, string> = {}

      for (const task of tasks) {
        const created = await tx.workOrderTask.create({
          data: {
            workOrderId: order.id,
            processTypeId: task.processTypeId,
            order: task.order,
            quantityTotal: task.quantityTotal,
            instructions: task.instructions || null,
            status: 'PENDING', // se actualiza abajo si tiene dependencia
          },
        })
        createdTaskMap[task.order] = created.id
      }

      // Pasada 2: establecer dependencias y corregir status BLOCKED
      for (const task of tasks) {
        if (task.requiresTaskId) {
          // requiresTaskId puede ser un id real o un order temporal — aceptamos id directo
          await tx.workOrderTask.update({
            where: { id: createdTaskMap[task.order] },
            data: {
              // El formulario envía el "order" de la tarea previa; lo resolvemos al id real
              requiresTaskId: createdTaskMap[Number(task.requiresTaskId)] ?? task.requiresTaskId,
              status: 'BLOCKED',
            },
          })
        }

        // Crear asignaciones de operarios
        if (task.operatorIds && task.operatorIds.length > 0) {
          await tx.workOrderTaskOperator.createMany({
            data: task.operatorIds.map((operatorId) => ({
              workOrderTaskId: createdTaskMap[task.order],
              operatorId,
            })),
            skipDuplicates: true,
          })
        }
      }

      return order
    })

    return { ok: true as const, data: workOrder }
  } catch (e) {
    console.error('[createWorkOrder]', e)
    return { error: 'Error al crear la orden de producción' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getWorkOrderByCode
// ─────────────────────────────────────────────────────────────────────────────

export async function getWorkOrderByCode(code: string) {
  try {
    const workOrder = await prisma.workOrder.findUnique({
      where: { code },
      include: {
        product: true,
        tasks: {
          orderBy: { order: 'asc' },
          include: {
            processType: true,
            requires: { include: { processType: true } },
            assignedOperators: { include: { operator: true } },
            timeRecords: { orderBy: { createdAt: 'desc' }, include: { operator: true } },
          },
        },
      },
    })

    if (!workOrder) return { error: `No se encontró la orden "${code}"` }
    return { ok: true as const, data: workOrder }
  } catch (e) {
    console.error('[getWorkOrderByCode]', e)
    return { error: 'Error al obtener la orden' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// listWorkOrders
// ─────────────────────────────────────────────────────────────────────────────

export async function listWorkOrders({
  status,
  page = 1,
  limit = 20,
}: {
  status?: WorkOrderStatus
  page?: number
  limit?: number
} = {}) {
  try {
    const skip = (page - 1) * limit
    const where = status ? { status } : {}

    const [items, total] = await Promise.all([
      prisma.workOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: true,
          tasks: { select: { id: true, status: true, order: true } },
        },
      }),
      prisma.workOrder.count({ where }),
    ])

    return {
      ok: true as const,
      data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
    }
  } catch (e) {
    console.error('[listWorkOrders]', e)
    return { error: 'Error al listar órdenes de producción' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getProductProcesses
// ─────────────────────────────────────────────────────────────────────────────

export async function getProductProcesses(productId: string) {
  try {
    const processes = await prisma.manufacturingProcess.findMany({
      where: { catalogProductId: productId },
      orderBy: { order: 'asc' },
      include: { processType: true },
    })

    // Convertir Decimal a number para serialización en Client Components
    const serialized = processes.map((p) => ({
      ...p,
      estimatedMinutes: p.estimatedMinutes ? Number(p.estimatedMinutes) : null,
    }))

    return { ok: true as const, data: serialized }
  } catch (e) {
    console.error('[getProductProcesses]', e)
    return { error: 'Error al obtener procesos del producto' }
  }
}
