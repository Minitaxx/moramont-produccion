import { prisma } from '../src/lib/prisma'

async function main() {
  const processTypes = [
    { code: 'CORTE', name: 'Corte' },
    { code: 'ENSAMBLE', name: 'Ensamble' },
    { code: 'PINTURA', name: 'Pintura' },
    { code: 'DOBLEZ', name: 'Doblez' },
  ]
  for (const pt of processTypes) {
    await prisma.processType.upsert({ where: { code: pt.code }, update: {}, create: pt })
  }

  const machines = [
    { code: 'CORTADORA-01', name: 'Cortadora 01' },
    { code: 'ENSAMBLADORA-01', name: 'Ensambladora 01' },
    { code: 'PINTURA-01', name: 'Cabina de Pintura 01' },
    { code: 'DOBLADORA-01', name: 'Dobladora 01' },
  ]
  for (const m of machines) {
    await prisma.machine.upsert({ where: { code: m.code }, update: {}, create: m })
  }

  const product = await prisma.productCatalog.upsert({
    where: { code: 'RRAC-BL' },
    update: {},
    create: {
      code: 'RRAC-BL',
      name: 'Rejilla Rectangular Black',
      productType: 'rejilla',
      geometryType: 'rectangular',
      active: true,
    },
  })

  const corteId = (await prisma.processType.findUnique({ where: { code: 'CORTE' } }))!.id
  const cortadoraId = (await prisma.machine.findUnique({ where: { code: 'CORTADORA-01' } }))!.id

  await prisma.manufacturingProcess.upsert({
    where: { catalogProductId_order: { catalogProductId: product.id, order: 1 } },
    update: {},
    create: {
      catalogProductId: product.id,
      processTypeId: corteId,
      order: 1,
      machineId: cortadoraId,
    },
  })

  console.log('Seed completado')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
