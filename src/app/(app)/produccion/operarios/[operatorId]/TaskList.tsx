'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import PauseModal from '../components/PauseModal'
import ConfirmModal from '../components/ConfirmModal'
import {
  startTask,
  pauseTask,
  resumeTask,
  completeTask,
  cancelTask,
} from '@/domains/production/actions/tasktime-actions'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos (shape plano que viene del server)
// ─────────────────────────────────────────────────────────────────────────────

export type TaskItemStatus = 'PENDING' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'

export interface TaskItem {
  id: string
  workOrderCode: string
  processTypeName: string
  order: number
  status: TaskItemStatus
  isBlocked: boolean
  requiresProcessName: string | null
  quantityTotal: number
  instructions: string | null
  activeRecordId: string | null
  myRecordStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | null
}

interface TaskListProps {
  tasks: TaskItem[]
  operatorId: string
  operatorName: string
}

type ActionResult = { ok?: boolean; error?: string } | undefined

const statusStyles: Record<string, string> = {
  PENDING: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-green-100 text-green-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En curso',
  PAUSED: 'Pausada',
}

export default function TaskList({ tasks: initialTasks, operatorId, operatorName }: TaskListProps) {
  const router = useRouter()

  // Estado local para actualizaciones optimistas
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks)
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null)
  const [taskErrors, setTaskErrors] = useState<Record<string, string>>({})

  // Modales
  const [pausingTask, setPausingTask] = useState<TaskItem | null>(null)
  const [completingTask, setCompletingTask] = useState<TaskItem | null>(null)
  const [piecesProduced, setPiecesProduced] = useState('')
  const [cancellingTask, setCancellingTask] = useState<TaskItem | null>(null)

  // Sincronizar con props cuando el server refresca (comparación simple, sin flicker)
  const lastSyncRef = useRef(JSON.stringify(initialTasks))
  useEffect(() => {
    const next = JSON.stringify(initialTasks)
    if (lastSyncRef.current !== next) {
      lastSyncRef.current = next
      setTasks(initialTasks)
    }
  }, [initialTasks])

  // Regla de UI: solo una tarea en curso a la vez
  const hasActiveTask = tasks.some((t) => t.status === 'IN_PROGRESS')

  // ── Ejecutor de acciones con actualización optimista ──────────────────────
  async function runAction(
    taskId: string,
    optimistic: Partial<TaskItem>,
    action: () => Promise<ActionResult>,
  ) {
    const prevTask = tasks.find((t) => t.id === taskId)
    if (!prevTask) return

    setPendingTaskId(taskId)
    setTaskErrors((prev) => {
      const copy = { ...prev }
      delete copy[taskId]
      return copy
    })

    // Actualización optimista inmediata
    setTasks((ts) => ts.map((t) => (t.id === taskId ? { ...t, ...optimistic } : t)))

    try {
      const result = await action()

      if (result?.error) {
        // Revertir al estado anterior y mostrar el error inline
        setTasks((ts) => ts.map((t) => (t.id === taskId ? prevTask : t)))
        setTaskErrors((prev) => ({
          ...prev,
          [taskId]: result.error || 'No se pudo completar la acción.',
        }))
      } else {
        // Sincronización de fondo con el server (trae los ids de registros nuevos)
        await router.refresh()
      }
    } finally {
      setPendingTaskId(null)
    }
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleStart(task: TaskItem) {
    return runAction(
      task.id,
      { status: 'IN_PROGRESS', myRecordStatus: 'IN_PROGRESS' },
      () => startTask({ taskId: task.id, operatorId }),
    )
  }

  function handleResume(task: TaskItem) {
    if (!task.activeRecordId) return
    const recordId = task.activeRecordId
    return runAction(
      task.id,
      { status: 'IN_PROGRESS', myRecordStatus: 'IN_PROGRESS' },
      () => resumeTask(recordId),
    )
  }

  function handleConfirmPause(pauseReason: string) {
    const task = pausingTask
    if (!task?.activeRecordId) return
    const recordId = task.activeRecordId
    setPausingTask(null)
    return runAction(
      task.id,
      { status: 'PAUSED', myRecordStatus: 'PAUSED' },
      () => pauseTask({ recordId, pauseReason }),
    )
  }

  function handleConfirmComplete() {
    const task = completingTask
    if (!task?.activeRecordId) return
    const recordId = task.activeRecordId
    const parsedPieces = piecesProduced.trim() === '' ? undefined : Number(piecesProduced)
    setCompletingTask(null)
    setPiecesProduced('')
    return runAction(
      task.id,
      { myRecordStatus: 'COMPLETED', activeRecordId: null },
      () => completeTask({ recordId, piecesProduced: parsedPieces }),
    )
  }

  function handleConfirmCancel() {
    const task = cancellingTask
    if (!task?.activeRecordId) return
    const recordId = task.activeRecordId
    setCancellingTask(null)
    return runAction(
      task.id,
      { status: 'PENDING', activeRecordId: null, myRecordStatus: 'CANCELLED' },
      () => cancelTask(recordId),
    )
  }

  // ── Render de acciones por tarea ───────────────────────────────────────────
  function renderActions(task: TaskItem) {
    const isPending = pendingTaskId === task.id

    // Bloqueada por secuencia (dato del server)
    if (task.isBlocked && task.status === 'PENDING') {
      return (
        <div className="mt-4">
          <p className="text-sm italic text-gray-600">
            🔒 Bloqueado: esperando {task.requiresProcessName ?? 'la tarea anterior'}
          </p>
          <button
            type="button"
            disabled
            className="mt-3 h-14 min-w-[120px] cursor-not-allowed rounded-xl bg-gray-300 px-4 text-base font-bold text-white"
          >
            ▶ INICIAR TAREA
          </button>
        </div>
      )
    }

    // Ya la completé yo; esperando al resto de operarios asignados
    if (task.myRecordStatus === 'COMPLETED' && task.status !== 'COMPLETED') {
      return (
        <div className="mt-4">
          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
            Completado por vos
          </span>
          <p className="mt-2 text-sm italic text-gray-500">Esperando a otros operarios...</p>
        </div>
      )
    }

    // En curso
    if (task.status === 'IN_PROGRESS') {
      return (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="h-14 min-w-[120px] rounded-xl bg-yellow-500 px-4 text-base font-bold text-white hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            onClick={() => setPausingTask(task)}
          >
            ⏸ PAUSAR
          </button>

          <button
            type="button"
            className="h-14 min-w-[120px] rounded-xl bg-blue-600 px-4 text-base font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            onClick={() => {
              setPiecesProduced('')
              setCompletingTask(task)
            }}
          >
            ✓ FINALIZAR
          </button>

          <button
            type="button"
            className="h-14 min-w-[120px] rounded-xl bg-red-500 px-4 text-base font-bold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            onClick={() => setCancellingTask(task)}
          >
            ✕ CANCELAR
          </button>
        </div>
      )
    }

    // Pausada
    if (task.status === 'PAUSED') {
      return (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="h-14 min-w-[120px] rounded-xl bg-green-600 px-4 text-base font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            onClick={() => handleResume(task)}
          >
            ▶ REANUDAR
          </button>

          <button
            type="button"
            className="h-14 min-w-[120px] rounded-xl bg-blue-600 px-4 text-base font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            onClick={() => {
              setPiecesProduced('')
              setCompletingTask(task)
            }}
          >
            ✓ FINALIZAR
          </button>

          <button
            type="button"
            className="h-14 min-w-[120px] rounded-xl bg-red-500 px-4 text-base font-bold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            onClick={() => setCancellingTask(task)}
          >
            ✕ CANCELAR
          </button>
        </div>
      )
    }

    // Solo las PENDING llegan acá; el resto no muestra acciones
    if (task.status !== 'PENDING') return null

    // Iniciar, salvo que ya haya otra tarea en curso
    const blockedByActive = hasActiveTask
    return (
      <div className="mt-4">
        <button
          type="button"
          className="h-14 min-w-[120px] rounded-xl bg-green-600 px-4 text-base font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending || blockedByActive}
          onClick={() => handleStart(task)}
        >
          ▶ INICIAR TAREA
        </button>
        {blockedByActive && (
          <p className="mt-2 text-xs text-gray-400">Ya hay una tarea en curso</p>
        )}
      </div>
    )
  }

  // ── Render principal ───────────────────────────────────────────────────────
  return (
    <div>
      {operatorName && (
        <p className="mb-4 text-sm text-gray-500">
          Tareas de <span className="font-medium text-gray-700">{operatorName}</span>
        </p>
      )}

      {tasks.map((task) => {
        const statusLabel = statusLabels[task.status] ?? task.status

        return (
          <div
            key={task.id}
            className="mb-4 rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold text-gray-900">
                {task.workOrderCode} — {task.processTypeName}
              </h3>

              <span
                className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[task.status] || 'bg-gray-100 text-gray-700'}`}
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

            {renderActions(task)}

            {taskErrors[task.id] ? (
              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {taskErrors[task.id]}
              </div>
            ) : null}
          </div>
        )
      })}

      {/* Modal de pausa (solo motivo) */}
      <PauseModal
        isOpen={!!pausingTask}
        onClose={() => setPausingTask(null)}
        onConfirm={handleConfirmPause}
        taskName={
          pausingTask ? `${pausingTask.workOrderCode} — ${pausingTask.processTypeName}` : ''
        }
        isPending={!!pausingTask && pendingTaskId === pausingTask.id}
      />

      {/* Modal de finalización (con piezas producidas opcionales) */}
      <ConfirmModal
        isOpen={!!completingTask}
        onClose={() => setCompletingTask(null)}
        onConfirm={handleConfirmComplete}
        title="Finalizar tarea"
        description={
          completingTask
            ? `${completingTask.workOrderCode} — ${completingTask.processTypeName}`
            : undefined
        }
        confirmText="Confirmar"
        confirmVariant="primary"
        isPending={!!completingTask && pendingTaskId === completingTask.id}
      >
        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
          Piezas producidas (opcional)
        </label>
        <input
          type="number"
          min="0"
          value={piecesProduced}
          onChange={(e) => setPiecesProduced(e.target.value)}
          className="mb-5 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-xl focus:border-blue-400 focus:outline-none"
          placeholder="—"
        />
      </ConfirmModal>

      {/* Modal de cancelación */}
      <ConfirmModal
        isOpen={!!cancellingTask}
        onClose={() => setCancellingTask(null)}
        onConfirm={handleConfirmCancel}
        title="¿Cancelar tarea?"
        description="Esta acción no se puede deshacer."
        confirmText="Sí, cancelar"
        confirmVariant="danger"
        isPending={!!cancellingTask && pendingTaskId === cancellingTask.id}
      />
    </div>
  )
}