'use client'

import { useState } from 'react'
import ProductSelector from './components/ProductSelector'
import ProcessManager from './components/ProcessManager'
import { ProductCatalogItem } from '@/domains/production/types'

export default function ProduccionPage() {
  const [selectedProduct, setSelectedProduct] = useState<ProductCatalogItem | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-sm text-gray-500">
          {selectedProduct ? <span className="cursor-pointer hover:text-gray-700" onClick={() => setSelectedProduct(null)}>← Catálogo de productos</span> : 'Catálogo de productos'}
        </p>
        <h2 className="text-xl font-bold text-gray-900">{selectedProduct ? selectedProduct.name : 'Seleccionar producto'}</h2>
        {selectedProduct && <p className="mt-1 text-sm text-gray-500">{selectedProduct.code} · {selectedProduct.geometryType} · {selectedProduct.productType}</p>}
      </div>
      {!selectedProduct ? <ProductSelector onSelect={setSelectedProduct} /> : <ProcessManager product={selectedProduct} onBack={() => setSelectedProduct(null)} />}
    </div>
  )
}
