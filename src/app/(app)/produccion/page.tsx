import { prisma } from '@/lib/prisma'
import ProductionView from './ProductionView'

export default async function ProduccionPage() {
  const product = await prisma.productCatalog.findUnique({
    where: { code: 'RRAC-BL' },
    select: { id: true },
  })

  if (!product) {
    return <div>Producto de prueba no encontrado. Ejecuta el seed primero.</div>
  }

  const result = await import('@/domains/production/actions/production.actions').then((m) =>
    m.getProductProcesses(product.id)
  )

  if ('error' in result) {
    return <div>Error: {result.error}</div>
  }

  return <ProductionView initialProcesses={result.processes} />
}
