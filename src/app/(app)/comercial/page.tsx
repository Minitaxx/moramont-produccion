import Link from 'next/link'

export default function ComercialIndexPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/produccion"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          ← Volver
        </Link>
        <h2 className="text-xl font-bold text-gray-900">Módulo Comercial</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/comercial/clientes"
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow"
        >
          <h3 className="text-lg font-bold text-gray-900">Clientes</h3>
          <p className="mt-1 text-sm text-gray-500">
            Gestionar clientes y sus datos de contacto.
          </p>
        </Link>
        <Link
          href="/comercial/cotizaciones"
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow"
        >
          <h3 className="text-lg font-bold text-gray-900">Cotizaciones</h3>
          <p className="mt-1 text-sm text-gray-500">
            Crear y listar cotizaciones para clientes.
          </p>
        </Link>
      </div>
    </div>
  )
}