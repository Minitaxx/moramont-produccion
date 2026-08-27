import { PrismaClient } from '@prisma/client'
import { seedOperators } from './seed-operators'
import { seedWorkOrders } from './seed-workorders'

const prisma = new PrismaClient()

async function seedBase() {
  const processTypes = [
    { code: 'CORTE', name: 'Corte', description: 'Corte de materia prima' },
    { code: 'DOBLEZ', name: 'Doblez', description: 'Doblez de láminas' },
    { code: 'ENSAMBLE', name: 'Ensamble', description: 'Ensamble de piezas' },
    { code: 'PINTURA', name: 'Pintura', description: 'Aplicación de pintura' },
    { code: 'SOLDADURA', name: 'Soldadura', description: 'Unión por soldadura' },
    { code: 'PERFORACION', name: 'Perforación', description: 'Taladrado de piezas' },
    { code: 'LIMPIEZA', name: 'Limpieza', description: 'Limpieza y preparación' },
    { code: 'EMPAQUE', name: 'Empaque', description: 'Empaque final' },
  ]

  for (const pt of processTypes) {
    await prisma.processType.upsert({ where: { code: pt.code }, update: {}, create: pt })
  }

  const machines = [
    { code: 'CNC-01', name: 'CNC Corte 1' }, { code: 'CNC-02', name: 'CNC Corte 2' },
    { code: 'DOBL-01', name: 'Prensa Dobladora 1' }, { code: 'DOBL-02', name: 'Prensa Dobladora 2' },
    { code: 'ENS-01', name: 'Estación de Ensamble 1' }, { code: 'ENS-02', name: 'Estación de Ensamble 2' },
    { code: 'PINT-01', name: 'Cabina de Pintura 1' }, { code: 'PINT-02', name: 'Cabina de Pintura 2' },
    { code: 'SOLD-01', name: 'Estación de Soldadura 1' }, { code: 'PERF-01', name: 'Taladradora 1' },
    { code: 'LIMP-01', name: 'Estación de Limpieza 1' }, { code: 'EMP-01', name: 'Línea de Empaque 1' },
  ]

  for (const m of machines) {
    await prisma.machine.upsert({ where: { code: m.code }, update: {}, create: m })
  }

  const materials = [
    { name: 'Aluminio 5052' },
    { name: 'Aluminio 6061' },
    { name: 'Acero Galvanizado' },
    { name: 'Acero Inoxidable 304' },
    { name: 'Pintura Epóxica Negra' },
    { name: 'Pintura Epóxica Blanca' },
    { name: 'Tornillo M4x16' },
    { name: 'Tuerca M4' },
    { name: 'Silicona Industrial' },
    { name: 'Cinta de Embalaje' },
  ]

  for (const material of materials) {
    await prisma.material.upsert({ where: { name: material.name }, update: {}, create: material })
  }

  console.log('Seed base: ProcessTypes, Machines y Materials cargados.')
}

async function seedProducts(prisma: PrismaClient) {
  const products = [
    {
      code: 'PANEL-CTRL-01',
      name: 'Panel de Control Industrial',
      productType: 'panel',
      geometryType: 'rectangular',
      active: true,
      processes: [
        { order: 1, processTypeCode: 'CORTE',       machineCode: 'CNC-01', estimatedMinutes: 45, materials: [{ name: 'Aluminio 5052', quantity: 2.5, unit: 'm²' }] },
        { order: 2, processTypeCode: 'DOBLEZ',      machineCode: 'DOBL-01', estimatedMinutes: 30, materials: [{ name: 'Aluminio 5052', quantity: 0.5, unit: 'm²' }] },
        { order: 3, processTypeCode: 'PERFORACION', machineCode: 'PERF-01', estimatedMinutes: 20, materials: [] },
        { order: 4, processTypeCode: 'SOLDADURA',   machineCode: 'SOLD-01', estimatedMinutes: 60, materials: [] },
        { order: 5, processTypeCode: 'LIMPIEZA',    machineCode: 'LIMP-01', estimatedMinutes: 15, materials: [] },
        { order: 6, processTypeCode: 'PINTURA',     machineCode: 'PINT-01', estimatedMinutes: 40, materials: [{ name: 'Pintura Epóxica Negra', quantity: 0.3, unit: 'L' }] },
        { order: 7, processTypeCode: 'ENSAMBLE',    machineCode: 'ENS-01', estimatedMinutes: 50, materials: [{ name: 'Tornillo M4x16', quantity: 8, unit: 'un' }, { name: 'Tuerca M4', quantity: 8, unit: 'un' }] },
        { order: 8, processTypeCode: 'EMPAQUE',     machineCode: 'EMP-01', estimatedMinutes: 10, materials: [{ name: 'Cinta de Embalaje', quantity: 1, unit: 'm' }] },
      ],
    },
    {
      code: 'CARCASA-SRV-01',
      name: 'Carcasa de Servidor',
      productType: 'carcasa',
      geometryType: 'rectangular',
      active: true,
      processes: [
        { order: 1, processTypeCode: 'CORTE',       machineCode: 'CNC-02', estimatedMinutes: 60, materials: [{ name: 'Acero Galvanizado', quantity: 2.0, unit: 'm²' }] },
        { order: 2, processTypeCode: 'DOBLEZ',      machineCode: 'DOBL-02', estimatedMinutes: 45, materials: [] },
        { order: 3, processTypeCode: 'PERFORACION', machineCode: 'PERF-01', estimatedMinutes: 30, materials: [] },
        { order: 4, processTypeCode: 'SOLDADURA',   machineCode: 'SOLD-01', estimatedMinutes: 90, materials: [] },
        { order: 5, processTypeCode: 'LIMPIEZA',    machineCode: 'LIMP-01', estimatedMinutes: 20, materials: [] },
        { order: 6, processTypeCode: 'PINTURA',     machineCode: 'PINT-02', estimatedMinutes: 50, materials: [{ name: 'Pintura Epóxica Blanca', quantity: 0.4, unit: 'L' }] },
        { order: 7, processTypeCode: 'ENSAMBLE',    machineCode: 'ENS-02', estimatedMinutes: 40, materials: [{ name: 'Tornillo M4x16', quantity: 12, unit: 'un' }, { name: 'Silicona Industrial', quantity: 0.1, unit: 'L' }] },
        { order: 8, processTypeCode: 'EMPAQUE',     machineCode: 'EMP-01', estimatedMinutes: 15, materials: [] },
      ],
    },
    {
      code: 'SOPORTE-MNT-01',
      name: 'Soporte de Montaje',
      productType: 'soporte',
      geometryType: 'rectangular',
      active: true,
      processes: [
        { order: 1, processTypeCode: 'CORTE',     machineCode: 'CNC-01', estimatedMinutes: 30, materials: [{ name: 'Acero Inoxidable 304', quantity: 1.5, unit: 'm²' }] },
        { order: 2, processTypeCode: 'DOBLEZ',    machineCode: 'DOBL-01', estimatedMinutes: 20, materials: [] },
        { order: 3, processTypeCode: 'SOLDADURA', machineCode: 'SOLD-01', estimatedMinutes: 45, materials: [] },
        { order: 4, processTypeCode: 'LIMPIEZA',  machineCode: 'LIMP-01', estimatedMinutes: 10, materials: [] },
        { order: 5, processTypeCode: 'PINTURA',   machineCode: 'PINT-01', estimatedMinutes: 25, materials: [{ name: 'Pintura Epóxica Negra', quantity: 0.2, unit: 'L' }] },
        { order: 6, processTypeCode: 'EMPAQUE',   machineCode: 'EMP-01', estimatedMinutes: 5, materials: [] },
      ],
    },
  ]

  let loaded = 0
  for (const product of products) {
    // Si el producto ya existe, saltar sus procesos y materiales (no duplicar)
    const existing = await prisma.productCatalog.findUnique({ where: { code: product.code } })
    if (existing) {
      console.log(`Seed products: ${product.code} ya existe, saltando.`)
      continue
    }

    await prisma.$transaction(async (tx) => {
      const created = await tx.productCatalog.create({
        data: {
          code: product.code,
          name: product.name,
          productType: product.productType,
          geometryType: product.geometryType,
          active: product.active,
        },
      })

      for (const proc of product.processes) {
        const processType = await tx.processType.findUnique({ where: { code: proc.processTypeCode } })
        if (!processType) throw new Error(`ProcessType no encontrado: ${proc.processTypeCode}`)
        const machine = proc.machineCode
          ? await tx.machine.findUnique({ where: { code: proc.machineCode } })
          : null
        if (proc.machineCode && !machine) throw new Error(`Machine no encontrada: ${proc.machineCode}`)

        const process = await tx.manufacturingProcess.create({
          data: {
            catalogProductId: created.id,
            processTypeId: processType.id,
            order: proc.order,
            machineId: machine?.id ?? null,
            // estimatedMinutes es Decimal en Prisma; pasar número (lo convierte)
            estimatedMinutes: proc.estimatedMinutes,
          },
        })

        for (const mat of proc.materials) {
          const material = await tx.material.findUnique({ where: { name: mat.name } })
          if (!material) throw new Error(`Material no encontrado: ${mat.name}`)
          await tx.processMaterial.create({
            data: { processId: process.id, materialId: material.id, quantity: mat.quantity, unit: mat.unit },
          })
        }
      }
    })
    loaded++
  }

  console.log(`Seed: ${loaded} productos cargados con procesos y materiales.`)
}

async function main() {
  await seedBase()
  await seedProducts(prisma)
  await seedOperators(prisma)
  await seedWorkOrders(prisma)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
