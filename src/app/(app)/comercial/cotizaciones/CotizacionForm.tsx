'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createQuote, type CreateQuoteInput } from '@/domains/commercial/actions/quote-actions'
import type { Customer } from '@prisma/client'

const ctrl =
  'w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'

export default function CotizacionForm({ customers }: { customers: Customer[] }) {
  const router = useRouter()
  const [form, setForm] = useState<{
    code: string
    customerId: string
    total: string
    notes: string
  }>({ code: '', customerId: '', total: '', notes: '' })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit() {
    setError(null)
    setIsSubmitting(true)
    try {
      const input: CreateQuoteInput = {
        code: form.code,
        customerId: form.customerId,
        total: parseFloat(form.total),
        notes: form.notes || null,
      }
      const res = await createQuote(input)
      if ('error' in res) {
        setError(res.error ?? 'Error al crear la cotización')
        return
      }
      router.refresh()
      setForm({ code: '', customerId: '', total: '', notes: '' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
        Nueva cotización
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Código *
          </label>
          <input
            type="text"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            className={ctrl}
            placeholder="COT-0001"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Cliente *
          </label>
          <select
            value={form.customerId}
            onChange={(e) => setForm({ ...form, customerId: e.target.value })}
            className={ctrl}
          >
            <option value="">Seleccionar cliente...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Total *
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.total}
            onChange={(e) => setForm({ ...form, total: e.target.value })}
            className={ctrl}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Notas
          </label>
          <input
            type="text"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className={ctrl}
            placeholder="Notas / condiciones"
          />
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Guardando...' : 'Crear cotización'}
        </button>
      </div>
    </div>
  )
}