export const metadata = {
  title: 'MORAMONT - Producción',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col bg-neutral-900 text-white">
        <div className="px-6 py-5">
          <div className="text-xs font-medium uppercase tracking-widest text-gray-400">MORAMONT</div>
          <div className="text-lg font-bold tracking-tight">ERP</div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {['Comercial', 'Ingeniería', 'Producción', 'Logística', 'Compras', 'Calidad', 'Despacho', 'Administración'].map((item) => (
            <div key={item} className={`cursor-default rounded-md px-3 py-2 text-sm font-medium ${item === 'Producción' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              {item}
            </div>
          ))}
        </nav>
        <div className="border-t border-gray-800 px-6 py-4 text-xs text-gray-500">v1.0.0 — base</div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-gray-200 bg-white px-8 py-5">
          <div className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">Módulo</div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Producción</h1>
        </header>
        <div className="flex-1 overflow-auto p-8">{children}</div>
      </main>
    </div>
  )
}
