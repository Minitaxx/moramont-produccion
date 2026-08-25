import { listActiveProducts } from '@/domains/production/actions/product-actions'
import { listOperators } from '@/domains/production/actions/operator-actions'
import WorkOrderForm from './WorkOrderForm'

export default async function NuevaOrdenPage() {
  const [productsRes, operatorsRes] = await Promise.all([listActiveProducts(), listOperators()])

  if ('error' in productsRes) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        {productsRes.error}
      </div>
    )
  }
  if ('error' in operatorsRes) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        {operatorsRes.error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-gray-900">Nueva Orden de Trabajo</h2>
        <p className="text-sm text-gray-500">
          Seleccioná un producto para clonar su secuencia de procesos como tareas
        </p>
      </div>

      <WorkOrderForm products={productsRes.data} operators={operatorsRes.data} />
    </div>
  )
}