'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavChild {
  label: string
  href: string
}

interface NavItem {
  label: string
  href: string
  /** Prefijo usado para resaltar el módulo cuando la ruta actual empieza con él */
  basePath: string
  children?: NavChild[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuración de navegación: solo módulos con rutas reales existentes.
// ─────────────────────────────────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  {
    label: 'Comercial',
    href: '/comercial',
    basePath: '/comercial',
    children: [
      { label: 'Clientes', href: '/comercial/clientes' },
      { label: 'Cotizaciones', href: '/comercial/cotizaciones' },
    ],
  },
  {
    label: 'Producción',
    href: '/produccion/ordenes',
    basePath: '/produccion',
    children: [
      { label: 'Órdenes de trabajo', href: '/produccion/ordenes' },
      { label: 'Nueva orden', href: '/produccion/ordenes/nueva' },
      { label: 'Operarios', href: '/produccion/operarios' },
    ],
  },
]

// Módulos sin rutas implementadas todavía → placeholders no clickeables
const PLACEHOLDER_MODULES = [
  'Ingeniería',
  'Logística',
  'Compras',
  'Calidad',
  'Despacho',
  'Administración',
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-neutral-900 text-white">
      <div className="px-6 py-5">
        <div className="text-xs font-medium uppercase tracking-widest text-gray-400">MORAMONT</div>
        <div className="text-lg font-bold tracking-tight">ERP</div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.basePath + '/') ||
            (item.children?.some((c) => pathname.startsWith(c.href)) ?? false)

          // El hijo con el match más específico (href más largo) gana, para
          // evitar doble resaltado en rutas anidadas (ej. /ordenes/nueva).
          const activeChildHref = item.children
            ?.filter((c) => pathname === c.href || pathname.startsWith(c.href + '/'))
            .sort((a, b) => b.href.length - a.href.length)[0]?.href

          return (
            <div key={item.label}>
              <Link
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {item.label}
              </Link>

              {isActive && item.children && (
                <div className="ml-3 mt-1 space-y-1 border-l border-gray-700 pl-2">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`block rounded-md px-3 py-1.5 text-sm transition ${
                        child.href === activeChildHref
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {PLACEHOLDER_MODULES.map((item) => (
          <div
            key={item}
            title="Módulo en desarrollo"
            className="cursor-default rounded-md px-3 py-2 text-sm font-medium text-gray-600"
          >
            {item}
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-800 px-6 py-4 text-xs text-gray-500">v1.0.0 — base</div>
    </aside>
  )
}