import { getWorkOrderByCode } from '@/domains/production/actions/workorder-actions'

const statusStyles: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  BLOCKED: 'Bloqueada',
}

export default async function DetalleOrdenPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const res = await getWorkOrderByCode(id)

  if ('error' in res) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {res.error}
        </div>
      </div>
    )
  }

  const wo = res.data

  const formatDate = (d: Date | null | undefined) =>
    d ? new Date(d).toLocaleDateString('es-AR') : '—'

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center gap-3">
        <a
          href="/produccion/ordenes"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          ← Volver
        </a>
        <h2 className="text-xl font-bold text-gray-900">{wo.code}</h2>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
            statusStyles[wo.status] || 'bg-gray-100 text-gray-700'
          }`}
        >
          {statusLabels[wo.status] ?? wo.status}
        </span>
      </div>

      {/* Información general */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
          Información general
        </h3>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Producto
            </dt>
            <dd className="mt-1 font-medium text-gray-900">
              {wo.product?.name ?? '—'}{' '}
              <span className="text-sm text-gray-500">
                ({wo.product?.code ?? '—'})
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Cantidad total
            </dt>
            <dd className="mt-1 font-medium text-gray-900">{wo.quantityTotal}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Estado
            </dt>
            <dd className="mt-1 font-medium text-gray-900">
              {statusLabels[wo.status] ?? wo.status}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Creada el
            </dt>
            <dd className="mt-1 text-gray-700">{formatDate(wo.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Última actualización
            </dt>
            <dd className="mt-1 text-gray-700">{formatDate(wo.updatedAt)}</dd>
          </div>
        </dl>
      </div>

      {/* Tareas asociadas */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
          Tareas asociadas ({wo.tasks.length})
        </h3>
        {wo.tasks.length === 0 ? (
          <p className="text-sm text-gray-500">Esta orden no tiene tareas.</p>
        ) : (
          <div className="space-y-3">
            {wo.tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-lg border border-gray-200 bg-gray-50/50 p-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-200 px-2 text-xs font-bold text-gray-700">
                    {task.order}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {task.processType?.name ?? 'Proceso'}
                  </span>
                  <span className="text-sm text-gray-500">
                    Cantidad {task.quantityTotal}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      statusStyles[task.status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {statusLabels[task.status] ?? task.status}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {task.requires ? (
                    <span>
                      🔒 Requiere: {task.requires.processType?.name ?? 'proceso anterior'}
                    </span>
                  ) : (
                    <span>Sin dependencia</span>
                  )}
                  <span className="mx-2 text-gray-300">·</span>
                  <span>
                    Operarios:{' '}
                    {task.assignedOperators.length > 0
                      ? task.assignedOperators.map((o) => o.operator.name).join(', ')
                      : 'Ninguno'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}