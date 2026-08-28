'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCustomer, type CreateCustomerInput } from '@/domains/commercial/actions/customer-actions'

const ctrl =
  'w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'

export default function ClienteForm() {
  const router = useRouter()
  const [form, setForm] = useState<CreateCustomerInput>({
    name: '',
    email: '',
    phone: '',
    taxId: '',
    address: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function update(field: keyof CreateCustomerInput, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    setError(null)
    setIsSubmitting(true)
    try {
      const res = await createCustomer(form)
      if ('error' in res) {
        setError(res.error ?? 'Error al crear el cliente')
        return
      }
      router.refresh()
      setForm({ name: '', email: '', phone: '', taxId: '', address: '' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
        Nuevo cliente
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Nombre *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className={ctrl}
            placeholder="Nombre del cliente"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email</label>
          <input
            type="email"
            value={form.email ?? ''}
            onChange={(e) => update('email', e.target.value)}
            className={ctrl}
            placeholder="cliente@empresa.com"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">Teléfono</label>
          <input
            type="text"
            value={form.phone ?? ''}
            onChange={(e) => update('phone', e.target.value)}
            className={ctrl}
            placeholder="+51 987 654 321"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">RUC / DNI</label>
          <input
            type="text"
            value={form.taxId ?? ''}
            onChange={(e) => update('taxId', e.target.value)}
            className={ctrl}
            placeholder="20123456789 / 41234567"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">Dirección</label>
          <input
            type="text"
            value={form.address ?? ''}
            onChange={(e) => update('address', e.target.value)}
            className={ctrl}
            placeholder="Dirección"
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
          {isSubmitting ? 'Guardando...' : 'Crear cliente'}
        </button>
      </div>
    </div>
  )
}