import Link from 'next/link'
import { listQuotes } from '@/domains/commercial/actions/quote-actions'
import { listCustomers } from '@/domains/commercial/actions/customer-actions'
import CotizacionForm from './CotizacionForm'

const quoteStatusStyles: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
}

const quoteStatusLabels: Record<string, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
}

export default async function CotizacionesPage() {
  const [quotesRes, customersRes] = await Promise.all([listQuotes(), listCustomers({ activeOnly: true })])

  if ('error' in quotesRes) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {quotesRes.error}
        </div>
      </div>
    )
  }
  if ('error' in customersRes) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {customersRes.error}
        </div>
      </div>
    )
  }

  const quotes = quotesRes.data
  const customers = customersRes.data

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
        <h2 className="text-xl font-bold text-gray-900">Cotizaciones</h2>
      </div>

      <CotizacionForm customers={customers} />

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Código
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Cliente
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Total
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {quotes.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-gray-500">
                  No hay cotizaciones cargadas.
                </td>
              </tr>
            ) : (
              quotes.map((q) => (
                <tr key={q.id} className="transition hover:bg-gray-50">
                  <td className="px-5 py-3 font-semibold text-gray-900">{q.code}</td>
                  <td className="px-5 py-3 text-gray-800">{q.customer?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-600">
                    ${Number(q.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        quoteStatusStyles[q.status] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {quoteStatusLabels[q.status] ?? q.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}