import Link from 'next/link'
import { listOperators } from '@/domains/production/actions/operator-actions'
import { listWorkOrders } from '@/domains/production/actions/workorder-actions'
import { getAllTaskTimeRecords } from '@/domains/production/actions/tasktime-actions'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos locales
// ─────────────────────────────────────────────────────────────────────────────

interface TimeRecordRow {
  id: string
  status: string
  startedAt: Date | null
  pausedAt: Date | null
  completedAt: Date | null
  totalPausedMs: number
  piecesAdvanced: number | null
  pauseReason: string | null
  operator: { name: string }
  workOrderTask: {
    workOrder: { code: string }
    processType: { name: string }
  }
}

const ctrl =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200'

const recordStatusStyles: Record<string, string> = {
  NOT_STARTED: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-green-100 text-green-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

const recordStatusLabels: Record<string, string> = {
  NOT_STARTED: 'No iniciado',
  IN_PROGRESS: 'En curso',
  PAUSED: 'Pausado',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de formato
// ─────────────────────────────────────────────────────────────────────────────

function formatDateTime(d: Date | null): string {
  if (!d) return '—'
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return formatter.format(d).replace(',', '')
}

function formatDuration(ms: number): string {
  const safe = Math.max(0, ms)
  const totalMinutes = Math.floor(safe / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h ${minutes}m`
}

function tiempoReal(r: TimeRecordRow): string {
  if (r.status === 'COMPLETED' && r.startedAt && r.completedAt) {
    return formatDuration(r.completedAt.getTime() - r.startedAt.getTime() - r.totalPausedMs)
  }
  if (r.status === 'IN_PROGRESS') return 'En curso'
  if (r.status === 'PAUSED' && r.startedAt && r.pausedAt) {
    return `${formatDuration(r.pausedAt.getTime() - r.startedAt.getTime() - r.totalPausedMs)} (pausado)`
  }
  return '—'
}

// ─────────────────────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────────────────────

export default async function ControlTiemposPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const operatorId = typeof params.operatorId === 'string' ? params.operatorId : undefined
  const workOrderId = typeof params.workOrderId === 'string' ? params.workOrderId : undefined
  const fromDate = typeof params.fromDate === 'string' ? params.fromDate : undefined
  const toDate = typeof params.toDate === 'string' ? params.toDate : undefined

  const [operatorsRes, ordersRes, recordsRes] = await Promise.all([
    listOperators(),
    listWorkOrders({ limit: 100 }),
    getAllTaskTimeRecords({ operatorId, workOrderId, fromDate, toDate }),
  ])

  if ('error' in operatorsRes) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        {operatorsRes.error}
      </div>
    )
  }
  if ('error' in ordersRes) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        {ordersRes.error}
      </div>
    )
  }
  if ('error' in recordsRes) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        {recordsRes.error}
      </div>
    )
  }

  const operators = operatorsRes.data
  const orders = ordersRes.data.items
  const records: TimeRecordRow[] = recordsRes.data

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <Link
          href="/produccion/ordenes"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          ← Volver
        </Link>
        <h2 className="text-xl font-bold text-gray-900">Control de Tiempos</h2>
      </div>

      {/* Filtros */}
      <form
        method="get"
        className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-5"
      >
        <Field label="Operario">
          <select name="operatorId" defaultValue={operatorId ?? ''} className={ctrl}>
            <option value="">Todos</option>
            {operators.map((op) => (
              <option key={op.id} value={op.id}>
                {op.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Orden de trabajo">
          <select name="workOrderId" defaultValue={workOrderId ?? ''} className={ctrl}>
            <option value="">Todas</option>
            {orders.map((wo) => (
              <option key={wo.id} value={wo.id}>
                {wo.code}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fecha desde">
          <input type="date" name="fromDate" defaultValue={fromDate ?? ''} className={ctrl} />
        </Field>
        <Field label="Fecha hasta">
          <input type="date" name="toDate" defaultValue={toDate ?? ''} className={ctrl} />
        </Field>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Filtrar
          </button>
        </div>
      </form>

      {/* Tabla */}
      {records.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          No hay registros de tiempo para los filtros seleccionados.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">OP</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Tarea</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Operario</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Inicio</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Pausa</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Finalización</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Tiempo real</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Piezas avanzadas</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Motivo pausa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((r) => (
                <tr key={r.id} className="transition hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">
                    {r.workOrderTask?.workOrder?.code ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-800">
                    {r.workOrderTask?.processType?.name ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-800">
                    {r.operator?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${recordStatusStyles[r.status] || 'bg-gray-100 text-gray-700'}`}
                    >
                      {recordStatusLabels[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {formatDateTime(r.startedAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {formatDateTime(r.pausedAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {formatDateTime(r.completedAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-800">
                    {tiempoReal(r)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.piecesAdvanced ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{r.pauseReason ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
        {label}
      </label>
      {children}
    </div>
  )
}