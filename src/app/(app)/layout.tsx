import Sidebar from './Sidebar'

export const metadata = {
  title: 'MORAMONT - Producción',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
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
