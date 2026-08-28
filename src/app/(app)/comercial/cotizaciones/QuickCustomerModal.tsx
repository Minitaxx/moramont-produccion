'use client'

import { useState } from 'react'
import { createCustomer } from '@/domains/commercial/actions/customer-actions'
import type { Customer } from '@prisma/client'

const ctrl =
  'w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'

interface QuickCustomerModalProps {
  onClose: () => void
  onCreated: (customer: Customer) => void
}

// Modal de alta rápida de cliente desde CotizacionForm (flujo unificado).
export default function QuickCustomerModal({ onClose, onCreated }: QuickCustomerModalProps) {
  const [form, setForm] = useState({ name: '', taxId: '', phone: '' })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleCreate() {
    if (!form.name.trim()) {
      setError('El nombre del cliente es requerido.')
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      const res = await createCustomer({
        name: form.name,
        taxId: form.taxId || null,
        phone: form.phone || null,
      })
      if ('error' in res) {
        setError(res.error ?? 'Error al crear el cliente')
        return
      }
      onCreated(res.data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Nuevo cliente</h2>

        <label className="mb-1.5 block text-sm font-semibold text-gray-700">Nombre *</label>
        <input
          type="text"
          autoFocus
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={`${ctrl} mb-4`}
          placeholder="Nombre del cliente"
        />

        <label className="mb-1.5 block text-sm font-semibold text-gray-700">RUC / DNI</label>
        <input
          type="text"
          value={form.taxId}
          onChange={(e) => setForm({ ...form, taxId: e.target.value })}
          className={`${ctrl} mb-4`}
          placeholder="20123456789 / 41234567"
        />

        <label className="mb-1.5 block text-sm font-semibold text-gray-700">Teléfono</label>
        <input
          type="text"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className={`${ctrl} mb-4`}
          placeholder="+51 987 654 321"
        />

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !form.name.trim()}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Guardando...' : 'Crear cliente'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}