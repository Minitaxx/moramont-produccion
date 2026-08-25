import Link from 'next/link'
import { getOperatorTasks, listOperators } from '@/domains/production/actions/operator-actions'
import TaskList from './TaskList'

const statusOrder: Record<string, number> = {
  IN_PROGRESS: 0,
  PAUSED: 1,
  PENDING: 2,
  BLOCKED: 3,
  COMPLETED: 4,
}

export default async function OperatorPage({
  params,
}: {
  params: Promise<{ operatorId: string }>
}) {
  const { operatorId } = await params

  const [tasksRes, operatorsRes] = await Promise.all([
    getOperatorTasks(operatorId),
    listOperators(),
  ])

  if ('error' in tasksRes) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        {tasksRes.error}
      </div>
    )
  }

  const operator =
    'ok' in operatorsRes && operatorsRes.data ? operatorsRes.data.find((o) => o.id === operatorId) : null

  const sorted = [...tasksRes.data].sort(
    (a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9),
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Operario</p>
          <h2 className="text-2xl font-bold text-gray-900">
            {operator?.name ?? 'Mis tareas'}
          </h2>
        </div>
        <Link
          href="/produccion/operarios"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          ← Operarios
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          Este operario no tiene tareas asignadas.
        </div>
      ) : (
        <TaskList tasks={sorted} operatorId={operatorId} />
      )}
    </div>
  )
}