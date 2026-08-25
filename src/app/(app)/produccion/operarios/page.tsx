import Link from 'next/link'
import { listOperators } from '@/domains/production/actions/operator-actions'

export default async function OperariosPage() {
  const res = await listOperators()

  if ('error' in res) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        {res.error}
      </div>
    )
  }

  const operators = res.data

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/produccion"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          ← Volver
        </Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Operarios</h2>
          <p className="mt-1 text-sm text-gray-500">Seleccioná un operario para ver y registrar sus tareas</p>
        </div>
      </div>

      {operators.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          No hay operarios activos configurados.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {operators.map((op) => (
            <Link
              key={op.id}
              href={`/produccion/operarios/${op.id}`}
              className="flex min-h-[120px] flex-col items-center justify-center rounded-xl border-2 border-gray-200 bg-white p-5 text-center shadow-sm transition hover:border-blue-400 hover:shadow-md active:scale-95"
            >
              {/* Avatar con inicial */}
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-xl font-bold text-blue-700">
                {op.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-lg font-bold leading-tight text-gray-900">{op.name}</span>
              {op.employeeCode && (
                <span className="mt-1 text-sm text-gray-400">{op.employeeCode}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
