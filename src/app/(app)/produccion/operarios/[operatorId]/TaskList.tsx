'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import PauseModal from '../components/PauseModal'
import {
  startTask,
  pauseTask,
  resumeTask,
  completeTask,
  cancelTask,
} from '@/domains/production/actions/tasktime-actions'

interface TaskListProps {
  tasks: any[]
  operatorId: string
}

const statusStyles: Record<string, string> = {
  BLOCKED: 'bg-gray-100 text-gray-700',
  PENDING: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-green-100 text-green-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
}

export default function TaskList({ tasks, operatorId }: TaskListProps) {
  const router = useRouter()

  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null)
  const [taskErrors, setTaskErrors] = useState<Record<string, string>>({})
  const [pausingTask, setPausingTask] = useState<{ id: string; name: string } | null>(null)

  const visibleTasks = useMemo(
    () =>
      tasks.filter((task: any) => {
        if (task.status === 'COMPLETED') return false
        return true
      }),
    [tasks],
  )

  const handleAsyncAction = async (
    task: any,
    action: () => Promise<{ error?: string; ok?: boolean } | undefined>,
  ) => {
    setPendingTaskId(task.id)
    setTaskErrors(prev => {
      const copy = { ...prev }
      delete copy[task.id]
      return copy
    })

    try {
      const result = await action()

      if (result?.error) {
        setTaskErrors(prev => ({
          ...prev,
          [task.id]: result.error || 'No se pudo completar la acción.',
        }))
        return
      }

      if (result?.ok === true) {
        router.refresh()
      }
    } finally {
      setPendingTaskId(null)
    }
  }

  const renderActionButtons = (task: any) => {
    const activeRecord = task.timeRecords?.find(
      (r: any) => r.status === 'IN_PROGRESS' || r.status === 'PAUSED',
    )

    if (task.status === 'BLOCKED') {
      return (
        <p className="mt-4 text-sm text-gray-600 italic">
          Bloqueado: esperando {task.requires?.processType?.name}
        </p>
      )
    }

    const latestRecord = task.timeRecords?.[0]
    if (latestRecord?.status === 'COMPLETED' && task.status !== 'COMPLETED') {
      const otherOperators = task.assignedOperators
        ?.filter((ao: any) => ao.operatorId !== operatorId)
        ?.map((ao: any) => ao.operator?.name)
        ?.join(', ') || 'otros operarios'

      return (
        <div className="mt-4">
          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
            Completado por vos
          </span>
          <p className="mt-2 text-sm text-gray-500 italic">
            Esperando a: {otherOperators}
          </p>
        </div>
      )
    }

    if (!activeRecord) {
      return (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="h-14 min-w-[120px] rounded-xl bg-green-600 px-4 text-base font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pendingTaskId === task.id}
            onClick={() =>
              handleAsyncAction(task, async () => {
                const result = await startTask({
                  taskId: task.id,
                  operatorId,
                })
                return result
              })
            }
          >
            ▶ INICIAR TAREA
          </button>
        </div>
      )
    }

    if (activeRecord.status === 'IN_PROGRESS') {
      return (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="h-14 min-w-[120px] rounded-xl bg-yellow-500 px-4 text-base font-bold text-white hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pendingTaskId === task.id}
            onClick={() => {
              setPausingTask({ id: task.id, name: task.processType?.name || 'Tarea' })
            }}
          >
            ⏸ PAUSAR
          </button>

          <button
            type="button"
            className="h-14 min-w-[120px] rounded-xl bg-blue-600 px-4 text-base font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pendingTaskId === task.id}
            onClick={() => {
              if (!window.confirm('¿Estás seguro de que querés finalizar esta tarea? No se podrá revertir.')) return;
              handleAsyncAction(task, async () => {
                const result = await completeTask(activeRecord.id)
                return result
              })
            }}
          >
            ✓ FINALIZAR
          </button>

          <button
            type="button"
            className="h-14 min-w-[120px] rounded-xl bg-red-500 px-4 text-base font-bold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pendingTaskId === task.id}
            onClick={() => {
              if (!window.confirm('¿Estás seguro? Se perderá el progreso de esta tarea.')) return;
              handleAsyncAction(task, async () => {
                const result = await cancelTask(activeRecord.id)
                return result
              })
            }}
          >
            ✕ CANCELAR
          </button>
        </div>
      )
    }

    if (activeRecord.status === 'PAUSED') {
      return (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="h-14 min-w-[120px] rounded-xl bg-green-600 px-4 text-base font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pendingTaskId === task.id}
            onClick={() =>
              handleAsyncAction(task, async () => {
                const result = await resumeTask(activeRecord.id)
                return result
              })
            }
          >
            ▶ REANUDAR
          </button>

          <button
            type="button"
            className="h-14 min-w-[120px] rounded-xl bg-blue-600 px-4 text-base font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pendingTaskId === task.id}
            onClick={() => {
              if (!window.confirm('¿Estás seguro de que querés finalizar esta tarea? No se podrá revertir.')) return;
              handleAsyncAction(task, async () => {
                const result = await completeTask(activeRecord.id)
                return result
              })
            }}
          >
            ✓ FINALIZAR
          </button>

          <button
            type="button"
            className="h-14 min-w-[120px] rounded-xl bg-red-500 px-4 text-base font-bold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pendingTaskId === task.id}
            onClick={() => {
              if (!window.confirm('¿Estás seguro? Se perderá el progreso de esta tarea.')) return;
              handleAsyncAction(task, async () => {
                const result = await cancelTask(activeRecord.id)
                return result
              })
            }}
          >
            ✕ CANCELAR
          </button>
        </div>
      )
    }

    return null
  }

  return (
    <div>
      {visibleTasks.map((task: any) => {
        const activeRecord = task.timeRecords?.find(
          (r: any) => r.status === 'IN_PROGRESS' || r.status === 'PAUSED',
        )

        const statusLabel =
          task.status === 'BLOCKED'
            ? 'Bloqueado'
            : task.status === 'PENDING'
              ? 'Pendiente'
              : task.status === 'IN_PROGRESS'
                ? 'En curso'
                : task.status === 'PAUSED'
                  ? 'Pausada'
                  : task.status

        return (
          <div
            key={task.id}
            className="mb-4 rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold text-gray-900">
                OP-{task.workOrder?.code} — {task.processType?.name}
              </h3>

              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[task.status] || 'bg-gray-100 text-gray-700'}`}
              >
                {statusLabel}
              </span>
            </div>

            {task.instructions ? (
              <p className="mt-2 text-sm italic text-gray-600">{task.instructions}</p>
            ) : null}

            <p className="mt-3 text-sm font-medium text-gray-700">
              Piezas: {task.quantityTotal}
            </p>

            {renderActionButtons(task)}

            {taskErrors[task.id] ? (
              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {taskErrors[task.id]}
              </div>
            ) : null}
          </div>
        )
      })}

      <PauseModal
        isOpen={!!pausingTask}
        onClose={() => setPausingTask(null)}
        onConfirm={async (piecesAdvanced, pauseReason) => {
          if (!pausingTask) return

          const task = visibleTasks.find((item: any) => item.id === pausingTask.id)
          const activeRecord = task?.timeRecords?.find(
            (r: any) => r.status === 'IN_PROGRESS' || r.status === 'PAUSED',
          )

          if (!activeRecord) {
            setPausingTask(null)
            return
          }

          const result = await pauseTask({
            recordId: activeRecord.id,
            piecesAdvanced,
            pauseReason,
          })

          setPausingTask(null)

          if (result?.error) {
            setTaskErrors(prev => ({
              ...prev,
              [pausingTask.id]: result.error,
            }))
            return
          }

          if (result?.ok === true) {
            router.refresh()
          }
        }}
        taskName={pausingTask?.name || ''}
        isPending={false}
      />
    </div>
  )
}