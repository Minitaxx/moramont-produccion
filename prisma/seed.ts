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

async function main() {
  await seedBase()
  await seedOperators(prisma)
  await seedWorkOrders(prisma)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
