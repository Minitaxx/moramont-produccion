'use client'

import { useState } from 'react'
import {
  createBasicProduct,
  type ProductOption,
} from '@/domains/production/actions/product-actions'

const ctrl =
  'w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'

const PRODUCT_TYPE_SUGGESTIONS = ['panel', 'carcasa', 'soporte']

interface QuickProductModalProps {
  onClose: () => void
  onCreated: (product: ProductOption) => void
}

// Modal de alta rápida de producto del catálogo desde CotizacionForm
// (flujo unificado). Crea el producto básico y activo; los procesos de
// manufactura se definen luego desde Producción.
export default function QuickProductModal({ onClose, onCreated }: QuickProductModalProps) {
  const [form, setForm] = useState({ code: '', name: '', productType: '', fixedPrice: '' })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleCreate() {
    setError(null)
    setIsSubmitting(true)
    try {
      const res = await createBasicProduct({
        code: form.code,
        name: form.name,
        productType: form.productType,
        fixedPrice: form.fixedPrice ? parseFloat(form.fixedPrice) : null,
      })
      if ('error' in res) {
        setError(res.error ?? 'Error al crear el producto')
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
        <h2 className="mb-4 text-lg font-bold text-gray-900">Nuevo producto</h2>

        <label className="mb-1.5 block text-sm font-semibold text-gray-700">Código *</label>
        <input
          type="text"
          autoFocus
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          className={`${ctrl} mb-4`}
          placeholder="PANEL-CTRL-02"
        />

        <label className="mb-1.5 block text-sm font-semibold text-gray-700">Nombre *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={`${ctrl} mb-4`}
          placeholder="Nombre del producto"
        />

        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
          Tipo de producto *
        </label>
        <input
          type="text"
          list="product-type-suggestions"
          value={form.productType}
          onChange={(e) => setForm({ ...form, productType: e.target.value })}
          className={`${ctrl} mb-1`}
          placeholder="panel, carcasa, soporte..."
        />
        <datalist id="product-type-suggestions">
          {PRODUCT_TYPE_SUGGESTIONS.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
        <p className="mb-4 text-xs text-gray-400">
          Si el producto tiene precio fijo, se usará para calcular el total de la cotización.
        </p>

        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
          Precio fijo (opcional)
        </label>
        <input
          type="number"
          min={0}
          step="0.01"
          value={form.fixedPrice}
          onChange={(e) => setForm({ ...form, fixedPrice: e.target.value })}
          className={`${ctrl} mb-4`}
          placeholder="0.00"
        />

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !form.code.trim() || !form.name.trim() || !form.productType.trim()}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Guardando...' : 'Crear producto'}
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