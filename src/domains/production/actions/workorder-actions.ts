'use server'

import { prisma } from '@/lib/prisma'
import { WorkOrderStatus } from '@prisma/client'

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