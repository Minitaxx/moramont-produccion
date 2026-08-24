import { PrismaClient } from '@prisma/client'

const OPERATORS = [
  { name: 'Carlos Martínez', employeeCode: 'OP-001' },
  { name: 'Ana López',       employeeCode: 'OP-002' },
  { name: 'Luis Hernández',  employeeCode: 'OP-003' },
  { name: 'Sebastián Rojas', employeeCode: 'OP-004' },
  { name: 'María González',  employeeCode: 'OP-005' },
]

export async function seedOperators(prisma: PrismaClient) {
  for (const op of OPERATORS) {
    await prisma.operator.upsert({
      where: { employeeCode: op.employeeCode },
      update: {},
      create: { name: op.name, employeeCode: op.employeeCode, isActive: true },
    })
  }
  console.log(`Seed: ${OPERATORS.length} operarios cargados.`)
}
