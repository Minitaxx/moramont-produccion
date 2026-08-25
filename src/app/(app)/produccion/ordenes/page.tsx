import Link from 'next/link'
import { listWorkOrders } from '@/domains/production/actions/workorder-actions'
import type { WorkOrderStatus } from '@prisma/client'

const statusStyles: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

const statusLabels: Record<WorkOrderStatus, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
}

export default async function OrdenesPage() {
  const res = await listWorkOrders()

  if ('error' in res) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        {res.error}
      </div>
    )
  }

  const orders = res.data.items

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <Link
          href="/produccion"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          ← Volver
        </Link>
        <h2 className="text-xl font-bold text-gray-900">Órdenes de trabajo</h2>
        <Link
          href="/produccion/control-tiempos"
          className="ml-auto rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Control de tiempos
        </Link>
        <Link
          href="/produccion/ordenes/nueva"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          + Crear nueva orden
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          No hay órdenes de trabajo creadas.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Código OP
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Producto
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Cantidad
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Estado
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((wo) => (
                <tr key={wo.id} className="transition hover:bg-gray-50">
                  <td className="px-5 py-3 font-semibold text-gray-900">{wo.code}</td>
                  <td className="px-5 py-3 text-gray-800">{wo.product?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{wo.quantityTotal}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[wo.status] || 'bg-gray-100 text-gray-700'}`}
                    >
                      {statusLabels[wo.status] ?? wo.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/produccion/ordenes/${wo.code}`}
                      className="inline-flex rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}