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

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase()))
  if (loading) return <div className="p-8 text-gray-500">Cargando productos...</div>

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><h3 className="text-base font-semibold text-gray-900">Catálogo de productos</h3><p className="mt-0.5 text-sm text-gray-500">Seleccioná un producto para configurar sus procesos de fabricación.</p></div>
        <input type="text" placeholder="Buscar por código o nombre..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 sm:w-72" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50"><tr><th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Código</th><th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Nombre</th><th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Tipo</th><th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Geometría</th><th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acción</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">Sin resultados</td></tr>}
            {filtered.map((p) => <tr key={p.id} className="transition hover:bg-gray-50"><td className="px-5 py-3 font-medium text-gray-900">{p.code}</td><td className="px-5 py-3 text-gray-700">{p.name}</td><td className="px-5 py-3"><span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{p.productType}</span></td><td className="px-5 py-3 capitalize text-gray-500">{p.geometryType}</td><td className="px-5 py-3 text-right"><button onClick={() => onSelect(p)} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50">Configurar</button></td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  )
}
