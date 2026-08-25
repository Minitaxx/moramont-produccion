'use server'

import { prisma } from '@/lib/prisma'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductOption {
  id: string
  code: string
  name: string
}

export interface ProcessTypeOption {
  id: string
  name: string
}

export interface ProcessTemplateMaterial {
  materialName: string
  quantity: number
  unit: string
}

export interface ProcessTemplate {
  id: string // manufacturingProcess.id
  processTypeId: string
  processTypeName: string
  order: number
  estimatedMinutes: number | null
  machineId: string | null
  machineName: string | null
  notes: string | null
  materials: ProcessTemplateMaterial[]
}

// ─────────────────────────────────────────────────────────────────────────────
// listActiveProducts
// ─────────────────────────────────────────────────────────────────────────────

export async function listActiveProducts(): Promise<
  { ok: true; data: ProductOption[] } | { error: string }
> {
  try {
    const products = await prisma.productCatalog.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    })
    return {
      ok: true,
      data: products.map((p) => ({ id: p.id, code: p.code, name: p.name })),
    }
  } catch (e) {
    console.error('[listActiveProducts]', e)
    return { error: 'Error al cargar los productos' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getProductProcesses
// ─────────────────────────────────────────────────────────────────────────────

export async function getProductProcesses(
  productId: string,
): Promise<{ ok: true; data: ProcessTemplate[] } | { error: string }> {
  try {
    if (!productId) return { error: 'El id del producto es requerido' }

    const processes = await prisma.manufacturingProcess.findMany({
      where: { catalogProductId: productId },
      include: {
        processType: true,
        machine: true,
        materials: { include: { material: true } },
      },
      orderBy: { order: 'asc' },
    })

    // Convertir Decimal a number antes de devolver (serialización a Client Components)
    const data: ProcessTemplate[] = processes.map((p) => ({
      id: p.id,
      processTypeId: p.processTypeId,
      processTypeName: p.processType.name,
      order: p.order,
      estimatedMinutes: p.estimatedMinutes != null ? Number(p.estimatedMinutes) : null,
      machineId: p.machineId,
      machineName: p.machine?.name ?? null,
      notes: p.notes,
      materials: p.materials.map((m) => ({
        materialName: m.material?.name ?? '—',
        quantity: Number(m.quantity),
        unit: m.unit,
      })),
    }))

    return { ok: true, data }
  } catch (e) {
    console.error('[getProductProcesses]', e)
    return { error: 'Error al obtener los procesos del producto' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// listProcessTypes
// ─────────────────────────────────────────────────────────────────────────────

export async function listProcessTypes(): Promise<
  { ok: true; data: ProcessTypeOption[] } | { error: string }
> {
  try {
    const items = await prisma.processType.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    })
    return { ok: true, data: items.map((pt) => ({ id: pt.id, name: pt.name })) }
  } catch (e) {
    console.error('[listProcessTypes]', e)
    return { error: 'Error al cargar los tipos de proceso' }
  }
}