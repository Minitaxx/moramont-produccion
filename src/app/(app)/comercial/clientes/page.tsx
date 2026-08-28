import Link from 'next/link'
import { listCustomers } from '@/domains/commercial/actions/customer-actions'
import ClienteForm from './ClienteForm'

export default async function ClientesPage() {
  const res = await listCustomers()

  if ('error' in res) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {res.error}
        </div>
      </div>
    )
  }

  const customers = res.data

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <Link
          href="/comercial"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          ← Volver
        </Link>
        <h2 className="text-xl font-bold text-gray-900">Clientes</h2>
      </div>

      <ClienteForm />

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Nombre
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Email
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Teléfono
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                RUC / DNI
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-gray-500">
                  No hay clientes cargados.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="transition hover:bg-gray-50">
                  <td className="px-5 py-3 font-semibold text-gray-900">
                    {c.name}
                    {!c.isActive && (
                      <span className="ml-2 inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{c.email ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{c.phone ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{c.taxId ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}