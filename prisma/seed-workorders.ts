import { PrismaClient } from '@prisma/client'

export async function seedWorkOrders(prisma: PrismaClient) {
  // Usar el primer ProductCatalog existente
  const product = await prisma.productCatalog.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!product) {
    console.log('Seed workorders: no hay productos en BD, saltando.')
    return
  }

  // Usar los primeros 3 ProcessType existentes
  const processTypes = await prisma.processType.findMany({ take: 3, orderBy: { createdAt: 'asc' } })
  if (processTypes.length < 3) {
    console.log('Seed workorders: se necesitan al menos 3 tipos de proceso, saltando.')
    return
  }

  // Usar los primeros 3 operarios
  const operators = await prisma.operator.findMany({ take: 3, orderBy: { createdAt: 'asc' } })
  if (operators.length < 2) {
    console.log('Seed workorders: se necesitan al menos 2 operarios, saltando.')
    return
  }

  // Evitar duplicado en re-seed
  const existing = await prisma.workOrder.findUnique({ where: { code: 'OP-TEST-001' } })
  if (existing) {
    console.log('Seed workorders: OP-TEST-001 ya existe, saltando.')
    return
  }

  // Crear WorkOrder con las 3 tareas en transacción
  await prisma.$transaction(async (tx) => {
    const workOrder = await tx.workOrder.create({
      data: {
        code: 'OP-TEST-001',
        productId: product.id,
        quantityTotal: 100,
        status: 'PENDING',
      },
    })

    // Tarea 1 — sin dependencia → PENDING
    const task1 = await tx.workOrderTask.create({
      data: {
        workOrderId: workOrder.id,
        processTypeId: processTypes[0].id,
        order: 1,
        quantityTotal: 100,
        instructions: 'Cortar la materia prima según plano técnico adjunto.',
        status: 'PENDING',
        // Sin requiresTaskId
      },
    })

    // Tarea 2 — depende de tarea 1 → BLOCKED
    const task2 = await tx.workOrderTask.create({
      data: {
        workOrderId: workOrder.id,
        processTypeId: processTypes[1].id,
        order: 2,
        quantityTotal: 100,
        instructions: 'Realizar el doblez según ángulos especificados.',
        status: 'BLOCKED',
        requiresTaskId: task1.id,
      },
    })

    // Tarea 3 — depende de tarea 2 → BLOCKED
    await tx.workOrderTask.create({
      data: {
        workOrderId: workOrder.id,
        processTypeId: processTypes[2].id,
        order: 3,
        quantityTotal: 100,
        instructions: 'Ensamblar las piezas y verificar tolerancias.',
        status: 'BLOCKED',
        requiresTaskId: task2.id,
      },
    })

    // Asignar 1 operario a tarea 1
    await tx.workOrderTaskOperator.create({
      data: { workOrderTaskId: task1.id, operatorId: operators[0].id },
    })

    // Asignar 2 operarios a tarea 2
    await tx.workOrderTaskOperator.create({
      data: { workOrderTaskId: task2.id, operatorId: operators[0].id },
    })
    await tx.workOrderTaskOperator.create({
      data: { workOrderTaskId: task2.id, operatorId: operators[1].id },
    })
  })

  console.log('Seed: WorkOrder OP-TEST-001 creada con 3 tareas y asignaciones.')
}
