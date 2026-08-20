'use client'

import { useEffect, useState } from 'react'
import { getProductCatalog } from '@/domains/production/actions/production.actions'
import { ProductCatalogItem } from '@/domains/production/types'

export default function ProductSelector({ onSelect }: { onSelect: (product: ProductCatalogItem) => void }) {
  const [products, setProducts] = useState<ProductCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getProductCatalog().then((res) => {
      if ('ok' in res && res.ok) setProducts(res.data)
      setLoading(false)
    })
  }, [])

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase()),
  )
  if (loading) return <div className="p-4">Cargando productos...</div>

  return (
    <div className="p-4 border rounded bg-white">
      <h2 className="text-lg font-bold mb-3">Catálogo de Productos</h2>
      <input type="text" placeholder="Buscar por nombre o código..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full mb-3 px-3 py-2 border rounded" />
      <div className="max-h-96 overflow-y-auto space-y-1">
        {filtered.length === 0 && <p className="text-gray-500 text-sm">Sin resultados</p>}
        {filtered.map((p) => (
          <button key={p.id} onClick={() => onSelect(p)} className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 border-b last:border-b-0">
            <div className="font-medium">{p.name}</div>
            <div className="text-xs text-gray-500">{p.code} · {p.productType} · {p.geometryType}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
