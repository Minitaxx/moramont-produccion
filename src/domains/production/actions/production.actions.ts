'use server'

import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/auth'
import {
  ProductCatalogItem,
  ProcessTypeItem,
  MachineItem,
  ManufacturingProcessItem,
} from '../types'

export async function getProductCatalog(): Promise<
  { ok: true; data: ProductCatalogItem[] } | { error: string }
> {
  const auth = await requireSession()
  if ('error' in auth) return { error: auth.error }
  try {
    const products = await prisma.productCatalog.findMany({
      where: { active: true }, orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true, productType: true, geometryType: true },
    })
    return { ok: true, data: products }
  } catch { return { error: 'Error al cargar productos' } }
}

export async function getProductWithProcesses(productId: string): Promise<
  { ok: true; data: { product: ProductCatalogItem; processes: ManufacturingProcessItem[] } } | { error: string }
> {
  const auth = await requireSession()
  if ('error' in auth) return { error: auth.error }
  try {
    const product = await prisma.productCatalog.findUnique({
      where: { id: productId },
      select: { id: true, code: true, name: true, productType: true, geometryType: true },
    })
    if (!product) return { error: 'Producto no encontrado' }
    const processes = await prisma.manufacturingProcess.findMany({
      where: { catalogProductId: productId }, orderBy: { order: 'asc' },
      include: {
        processType: { select: { id: true, code: true, name: true } },
        machine: { select: { id: true, code: true, name: true } },
        materials: { include: { material: { select: { id: true, name: true } } } },
      },
    })
    const serialized: ManufacturingProcessItem[] = processes.map((p) => ({
      id: p.id, catalogProductId: p.catalogProductId, processTypeId: p.processTypeId,
      processTypeName: p.processType.name, processTypeCode: p.processType.code, order: p.order,
      machineId: p.machineId, machineName: p.machine?.name ?? null, machineCode: p.machine?.code ?? null,
      estimatedMinutes: p.estimatedMinutes ? Number(p.estimatedMinutes) : null,
      notes: p.notes ?? null,
      materials: p.materials.map((m) => ({
        id: m.id, processId: m.processId, materialId: m.materialId, materialName: m.material?.name ?? null,
        quantity: Number(m.quantity), unit: m.unit,
      })),
    }))
    return { ok: true, data: { product, processes: serialized } }
  } catch (e) { console.error(e); return { error: 'Error al cargar procesos del producto' } }
}

export async function getProcessTypes(): Promise<{ ok: true; data: ProcessTypeItem[] } | { error: string }> {
  const auth = await requireSession()
  if ('error' in auth) return { error: auth.error }
  try {
    const items = await prisma.processType.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, code: true, name: true, description: true, active: true } })
    return { ok: true, data: items }
  } catch { return { error: 'Error al cargar tipos de proceso' } }
}

export async function createProcessType(data: { code: string; name: string; description?: string }): Promise<{ ok: true; id: string } | { error: string }> {
  const auth = await requireSession(); if ('error' in auth) return { error: auth.error }
  try { const item = await prisma.processType.create({ data }); return { ok: true, id: item.id } } catch { return { error: 'Error al crear tipo de proceso' } }
}

export async function updateProcessType(id: string, data: { code?: string; name?: string; description?: string; active?: boolean }): Promise<{ ok: true } | { error: string }> {
  const auth = await requireSession(); if ('error' in auth) return { error: auth.error }
  try { await prisma.processType.update({ where: { id }, data }); return { ok: true } } catch { return { error: 'Error al actualizar tipo de proceso' } }
}

export async function getMachines(): Promise<{ ok: true; data: MachineItem[] } | { error: string }> {
  const auth = await requireSession(); if ('error' in auth) return { error: auth.error }
  try {
    const items = await prisma.machine.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, code: true, name: true, active: true } })
    return { ok: true, data: items }
  } catch { return { error: 'Error al cargar máquinas' } }
}

export async function createMachine(data: { code: string; name: string }): Promise<{ ok: true; id: string } | { error: string }> {
  const auth = await requireSession(); if ('error' in auth) return { error: auth.error }
  try { const item = await prisma.machine.create({ data }); return { ok: true, id: item.id } } catch { return { error: 'Error al crear máquina' } }
}

export async function updateMachine(id: string, data: { code?: string; name?: string; active?: boolean }): Promise<{ ok: true } | { error: string }> {
  const auth = await requireSession(); if ('error' in auth) return { error: auth.error }
  try { await prisma.machine.update({ where: { id }, data }); return { ok: true } } catch { return { error: 'Error al actualizar máquina' } }
}

export async function createManufacturingProcess(data: { catalogProductId: string; processTypeId: string; order: number; machineId?: string; estimatedMinutes?: number; notes?: string }): Promise<{ ok: true; id: string } | { error: string }> {
  const auth = await requireSession(); if ('error' in auth) return { error: auth.error }
  if (!data.processTypeId) return { error: 'El tipo de proceso es requerido' }
  if (data.order < 1) return { error: 'El orden debe ser al menos 1' }
  if (data.estimatedMinutes != null && data.estimatedMinutes < 0) return { error: 'Los minutos no pueden ser negativos' }
  try {
    const conflict = await prisma.manufacturingProcess.findFirst({ where: { catalogProductId: data.catalogProductId, order: data.order } })
    if (conflict) return { error: 'Ya existe un proceso con ese orden en este producto' }
    const item = await prisma.manufacturingProcess.create({ data: { catalogProductId: data.catalogProductId, processTypeId: data.processTypeId, order: data.order, machineId: data.machineId || null, estimatedMinutes: data.estimatedMinutes != null ? data.estimatedMinutes : null, notes: data.notes || null } })
    return { ok: true, id: item.id }
  } catch { return { error: 'Error al crear proceso' } }
}

export async function updateManufacturingProcess(id: string, data: { processTypeId?: string; order?: number; machineId?: string | null; estimatedMinutes?: number | null; notes?: string | null }): Promise<{ ok: true } | { error: string }> {
  const auth = await requireSession(); if ('error' in auth) return { error: auth.error }
  if (data.order !== undefined && data.order < 1) return { error: 'El orden debe ser al menos 1' }
  if (data.estimatedMinutes != null && data.estimatedMinutes < 0) return { error: 'Los minutos no pueden ser negativos' }
  try {
    if (data.order !== undefined) {
      const proc = await prisma.manufacturingProcess.findUnique({ where: { id }, select: { catalogProductId: true } })
      if (!proc) return { error: 'Proceso no encontrado' }
      const conflict = await prisma.manufacturingProcess.findFirst({ where: { catalogProductId: proc.catalogProductId, order: data.order, NOT: { id } } })
      if (conflict) return { error: 'Ya existe un proceso con ese orden en este producto' }
    }
    await prisma.manufacturingProcess.update({ where: { id }, data: { processTypeId: data.processTypeId, order: data.order, machineId: data.machineId === undefined ? undefined : data.machineId, estimatedMinutes: data.estimatedMinutes === undefined ? undefined : data.estimatedMinutes, notes: data.notes === undefined ? undefined : data.notes } })
    return { ok: true }
  } catch { return { error: 'Error al actualizar proceso' } }
}

export async function deleteManufacturingProcess(id: string): Promise<{ ok: true } | { error: string }> {
  const auth = await requireSession(); if ('error' in auth) return { error: auth.error }
  try { await prisma.manufacturingProcess.delete({ where: { id } }); return { ok: true } } catch { return { error: 'Error al eliminar proceso' } }
}

export async function reorderManufacturingProcesses(productId: string, orderedIds: string[]): Promise<{ ok: true } | { error: string }> {
  const auth = await requireSession(); if ('error' in auth) return { error: auth.error }
  try {
    await prisma.$transaction(async (tx) => {
      // Paso 1: órdenes temporales altos para liberar el espacio único
      for (let i = 0; i < orderedIds.length; i++) {
        await tx.manufacturingProcess.update({
          where: { id: orderedIds[i] },
          data: { order: 10000 + i + 1 },
        })
      }
      // Paso 2: órdenes finales consecutivos
      for (let i = 0; i < orderedIds.length; i++) {
        await tx.manufacturingProcess.update({
          where: { id: orderedIds[i] },
          data: { order: i + 1 },
        })
      }
    })
    return { ok: true }
  } catch { return { error: 'Error al reordenar procesos' } }
}

export async function createProcessMaterial(data: { processId: string; materialId: string; quantity: number; unit: string }): Promise<{ ok: true; id: string } | { error: string }> {
  const auth = await requireSession(); if ('error' in auth) return { error: auth.error }
  if (!data.materialId) return { error: 'El material es requerido' }
  if (data.quantity <= 0) return { error: 'La cantidad debe ser mayor a 0' }
  if (!data.unit?.trim()) return { error: 'La unidad es requerida' }
  try { const item = await prisma.processMaterial.create({ data }); return { ok: true, id: item.id } } catch { return { error: 'Error al crear material de proceso' } }
}

export async function updateProcessMaterial(id: string, data: { materialId?: string; quantity?: number; unit?: string }): Promise<{ ok: true } | { error: string }> {
  const auth = await requireSession(); if ('error' in auth) return { error: auth.error }
  if (data.quantity !== undefined && data.quantity <= 0) return { error: 'La cantidad debe ser mayor a 0' }
  if (data.unit !== undefined && !data.unit.trim()) return { error: 'La unidad no puede estar vacía' }
  try { await prisma.processMaterial.update({ where: { id }, data }); return { ok: true } } catch { return { error: 'Error al actualizar material de proceso' } }
}

export async function deleteProcessMaterial(id: string): Promise<{ ok: true } | { error: string }> {
  const auth = await requireSession(); if ('error' in auth) return { error: auth.error }
  try { await prisma.processMaterial.delete({ where: { id } }); return { ok: true } } catch { return { error: 'Error al eliminar material de proceso' } }
}

export async function getMaterials(): Promise<{ ok: true; data: { id: string; name: string }[] } | { error: string }> {
  const auth = await requireSession(); if ('error' in auth) return { error: auth.error }
  try {
    const items = await prisma.material.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } })
    return { ok: true, data: items }
  } catch { return { error: 'Error al cargar materiales' } }
}
