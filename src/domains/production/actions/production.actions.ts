'use server'

import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/auth'

export async function getProductProcesses(productId: string) {
  const auth = await requireSession()
  if ('error' in auth) return { error: auth.error }

  try {
    const processes = await prisma.manufacturingProcess.findMany({
      where: { catalogProductId: productId },
      include: {
        processType: { select: { id: true, code: true, name: true } },
        machine: { select: { id: true, code: true, name: true } },
        materials: {
          include: {
            material: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { order: 'asc' },
    })

    const serialized = processes.map((p) => ({
      ...p,
      materials: p.materials.map((m) => ({
        ...m,
        quantity: m.quantity ? Number(m.quantity) : null,
      })),
    }))

    return { ok: true, processes: serialized }
  } catch {
    return { error: 'Error al obtener procesos' }
  }
}
