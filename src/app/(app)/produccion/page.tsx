import Link from 'next/link'
import CatalogView from './components/CatalogView'

const tabs = [
  { label: 'Catálogo de productos', href: '/produccion' },
  { label: 'Operarios', href: '/produccion/operarios' },
  { label: 'Órdenes de trabajo', href: '/produccion/ordenes' },
]

export default function ProduccionPage() {
  return (
    <div className="space-y-6">
      {/* Tabs de navegación interna */}
      <nav className="flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="rounded-t-md px-5 py-2.5 text-sm font-medium text-gray-500 transition hover:text-gray-900 aria-[current=page]:border-b-2 aria-[current=page]:border-gray-900 aria-[current=page]:text-gray-900"
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {/* Contenido: catálogo */}
      <CatalogView />
    </div>
  )
}
