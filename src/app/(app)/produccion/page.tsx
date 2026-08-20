'use client'

import { useState } from 'react'
import ProductSelector from './components/ProductSelector'
import ProcessManager from './components/ProcessManager'
import { ProductCatalogItem } from '@/domains/production/types'

export default function ProduccionPage() {
  const [selectedProduct, setSelectedProduct] = useState<ProductCatalogItem | null>(null)

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6">Módulo de Producción</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <ProductSelector onSelect={setSelectedProduct} />
        </div>
        <div className="md:col-span-2">
          {selectedProduct ? (
            <ProcessManager product={selectedProduct} />
          ) : (
            <div className="p-4 border rounded bg-white text-gray-500">
              Seleccioná un producto del catálogo para ver y gestionar sus procesos de fabricación.
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
