'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createQuote, type CreateQuoteInput } from '@/domains/commercial/actions/quote-actions'
import type { Customer } from '@prisma/client'
import type { ProductOption } from '@/domains/production/actions/product-actions'
import QuickCustomerModal from './QuickCustomerModal'
import QuickProductModal from './QuickProductModal'

const ctrl =
  'w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'

interface CotizacionFormProps {
  customers: Customer[]
  products: ProductOption[]
}

export default function CotizacionForm({ customers, products }: CotizacionFormProps) {
  const router = useRouter()
  // Listas locales: permiten agregar recursos creados vía Quick Create sin recargar
  const [customerList, setCustomerList] = useState<Customer[]>(customers)
  const [productList, setProductList] = useState<ProductOption[]>(products)
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [modal, setModal] = useState<null | 'customer' | 'product'>(null)
  const [form, setForm] = useState<{
    code: string
    customerId: string
    total: string
    notes: string
  }>({ code: '', customerId: '', total: '', notes: '' })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-cálculo del total si el producto tiene precio fijo (editable a mano)
  function handleProductChange(value: string) {
    setProductId(value)
    const price = productList.find((p) => p.id === value)?.fixedPrice
    const qty = parseInt(quantity, 10)
    if (price != null && Number.isInteger(qty) && qty > 0) {
      setForm((prev) => ({ ...prev, total: (price * qty).toFixed(2) }))
    }
  }

  function handleQuantityChange(value: string) {
    setQuantity(value)
    const price = productList.find((p) => p.id === productId)?.fixedPrice
    const qty = parseInt(value, 10)
    if (price != null && Number.isInteger(qty) && qty > 0) {
      setForm((prev) => ({ ...prev, total: (price * qty).toFixed(2) }))
    }
  }

  async function handleSubmit() {
    setError(null)
    setIsSubmitting(true)
    try {
      const input: CreateQuoteInput = {
        code: form.code,
        customerId: form.customerId,
        productId: productId || null,
        quantity: quantity ? parseInt(quantity, 10) : null,
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
      setProductId('')
      setQuantity('')
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
          <div className="flex items-center gap-2">
            <select
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              className={ctrl}
            >
              <option value="">Seleccionar cliente...</option>
              {customerList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setModal('customer')}
              title="Crear nuevo cliente"
              className="shrink-0 rounded-xl border-2 border-gray-200 px-3 py-3 text-sm font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-50"
            >
              + Nuevo
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Producto
          </label>
          <div className="flex items-center gap-2">
            <select
              value={productId}
              onChange={(e) => handleProductChange(e.target.value)}
              className={ctrl}
            >
              <option value="">Seleccionar producto...</option>
              {productList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setModal('product')}
              title="Crear nuevo producto"
              className="shrink-0 rounded-xl border-2 border-gray-200 px-3 py-3 text-sm font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-50"
            >
              + Nuevo
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Cantidad
          </label>
          <input
            type="number"
            min={1}
            step={1}
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className={ctrl}
            placeholder="Ej: 10"
          />
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

      {modal === 'customer' && (
        <QuickCustomerModal
          onClose={() => setModal(null)}
          onCreated={(c) => {
            setCustomerList((prev) => [...prev, c])
            setForm((f) => ({ ...f, customerId: c.id }))
            setModal(null)
          }}
        />
      )}
      {modal === 'product' && (
        <QuickProductModal
          onClose={() => setModal(null)}
          onCreated={(p) => {
            setProductList((prev) => [...prev, p])
            setProductId(p.id)
            setModal(null)
          }}
        />
      )}
    </div>
  )
}