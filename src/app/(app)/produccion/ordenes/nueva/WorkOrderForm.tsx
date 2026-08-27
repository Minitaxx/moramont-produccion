'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { createWorkOrder } from './actions'
import {
  getProductProcesses,
  listProcessTypes,
  type ProcessTemplate,
  type ProcessTypeOption,
} from '@/domains/production/actions/product-actions'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

interface ProductOption {
  id: string
  code: string
  name: string
}

interface OperatorOption {
  id: string
  name: string
}

interface DraftTask {
  tempId: string
  processTypeId: string
  processTypeName: string
  order: number
  quantityTotal: number
  instructions: string | null
  operatorIds: string[]
  // Referencia (solo lectura en UI):
  estimatedMinutes: number | null
  machineName: string | null
  materials: { materialName: string; quantity: number; unit: string }[]
}

interface WorkOrderFormProps {
  products: ProductOption[]
  operators: OperatorOption[]
}

const ctrl =
  'w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function newTempId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

function resequence(list: DraftTask[]): DraftTask[] {
  return list.map((t, i) => ({ ...t, order: i + 1 }))
}

interface SortableTaskCardProps {
  task: DraftTask
  index: number
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onStartDelete: () => void
  isDeleting: boolean
  onConfirmDelete: () => void
  onCancelDelete: () => void
  operators: OperatorOption[]
  onUpdateTask: (tempId: string, patch: Partial<DraftTask>) => void
  onToggleOperator: (tempId: string, operatorId: string) => void
  taskError?: string
}

function SortableTaskCard({
  task,
  index,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onStartDelete,
  isDeleting,
  onConfirmDelete,
  onCancelDelete,
  operators,
  onUpdateTask,
  onToggleOperator,
  taskError,
}: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.tempId,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  }

  const refs: string[] = []
  if (task.estimatedMinutes != null) refs.push(`${task.estimatedMinutes} min`)
  if (task.machineName) refs.push(task.machineName)
  if (task.materials.length > 0) {
    refs.push(
      task.materials.map((m) => `${m.materialName} (${m.quantity} ${m.unit})`).join(', '),
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border-2 bg-white p-5 shadow-sm transition ${
        isDragging ? 'border-blue-400 shadow-xl opacity-90' : 'border-gray-200'
      } ${isDeleting ? 'border-red-300 bg-red-50/40' : ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="flex h-8 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700 active:cursor-grabbing"
            title="Arrastrar para reordenar"
          >
            {task.order}
          </button>
          <div>
            <span className="font-bold text-gray-900">{task.processTypeName}</span>
            {refs.length > 0 && <p className="mt-0.5 text-xs text-gray-400">{refs.join(' · ')}</p>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            title="Subir"
            className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-gray-400 transition hover:border-gray-400 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            ⬆️
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            title="Bajar"
            className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-gray-400 transition hover:border-gray-400 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            ⬇️
          </button>

          {isDeleting ? (
            <span className="flex items-center gap-2">
              <span className="text-sm font-medium text-red-600">¿Eliminar?</span>
              <button
                type="button"
                onClick={onConfirmDelete}
                className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-600"
              >
                Confirmar eliminar
              </button>
              <button
                type="button"
                onClick={onCancelDelete}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancelar
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={onStartDelete}
              title="Eliminar tarea"
              className="rounded px-2 py-1 text-sm text-red-600 transition hover:text-red-800 hover:underline"
            >
              🗑️ Eliminar
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">Cantidad *</label>
          <input
            type="number"
            min={1}
            step={1}
            value={task.quantityTotal}
            onChange={(e) => onUpdateTask(task.tempId, { quantityTotal: Number(e.target.value) || 0 })}
            className={ctrl}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">Operarios</label>
          <div className="flex flex-wrap gap-2">
            {operators.length === 0 && (
              <span className="text-sm text-gray-400">No hay operarios activos</span>
            )}
            {operators.map((op) => {
              const checked = task.operatorIds.includes(op.id)
              return (
                <label
                  key={op.id}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition ${
                    checked
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-blue-600"
                    checked={checked}
                    onChange={() => onToggleOperator(task.tempId, op.id)}
                  />
                  {op.name}
                </label>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-semibold text-gray-700">Instrucciones</label>
        <textarea
          rows={2}
          placeholder="Observaciones para el operario..."
          value={task.instructions ?? ''}
          onChange={(e) => onUpdateTask(task.tempId, { instructions: e.target.value })}
          className={ctrl}
        />
      </div>

      {taskError && <p className="mt-2 text-sm text-red-600">{taskError}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────────────

export default function WorkOrderForm({ products, operators }: WorkOrderFormProps) {
  const router = useRouter()

  // Formulario
  const [code, setCode] = useState('')
  const [productId, setProductId] = useState<string | null>(null)
  const [quantityTotal, setQuantityTotal] = useState('1')
  const [tasks, setTasks] = useState<DraftTask[]>([])

  // Errores
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [taskErrors, setTaskErrors] = useState<Record<string, string>>({})

  // Envío
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Procesos del producto seleccionado (cache)
  const [productProcesses, setProductProcesses] = useState<ProcessTemplate[] | null>(null)
  const [loadingProcesses, setLoadingProcesses] = useState(false)

  // Agregar proceso genérico
  const [showAddProcess, setShowAddProcess] = useState(false)
  const [processTypes, setProcessTypes] = useState<ProcessTypeOption[]>([])
  const [loadingProcessTypes, setLoadingProcessTypes] = useState(false)

  // Confirmación inline de eliminación
  const [deletingTempId, setDeletingTempId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function parseQuantityInt(): number {
    const n = Number(quantityTotal)
    return quantityTotal.trim() !== '' && Number.isInteger(n) ? n : 0
  }

  function templateToDraft(tpl: ProcessTemplate, inheritedQty: number): DraftTask {
    return {
      tempId: newTempId(),
      processTypeId: tpl.processTypeId,
      processTypeName: tpl.processTypeName,
      order: 0, // se recalcula al final
      quantityTotal: inheritedQty > 0 ? inheritedQty : 1,
      instructions: tpl.notes,
      operatorIds: [],
      estimatedMinutes: tpl.estimatedMinutes,
      machineName: tpl.machineName,
      materials: tpl.materials,
    }
  }

  // ── A. Selección de producto ───────────────────────────────────────────────
  function handleProductChange(value: string) {
    setProductId(value || null)
    setTasks([])
    setFormError(null)
    setFieldErrors({})
    setTaskErrors({})
    setDeletingTempId(null)
    setShowAddProcess(false)

    if (!value) {
      setProductProcesses(null)
      return
    }

    setLoadingProcesses(true)
    getProductProcesses(value).then((res) => {
      setLoadingProcesses(false)
      if ('ok' in res && res.ok) {
        setProductProcesses(res.data)
        const qty = parseQuantityInt()
        setTasks(resequence(res.data.map((tpl) => templateToDraft(tpl, qty))))
      } else {
        setProductProcesses(null)
        setFormError('error' in res ? res.error : 'Error al cargar los procesos del producto.')
      }
    })
  }

  // ── B/C. Mutaciones de tareas ──────────────────────────────────────────────
  function updateTask(tempId: string, patch: Partial<DraftTask>) {
    setTasks((prev) => prev.map((t) => (t.tempId === tempId ? { ...t, ...patch } : t)))
  }

  function toggleOperator(tempId: string, operatorId: string) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.tempId !== tempId) return t
        const has = t.operatorIds.includes(operatorId)
        return {
          ...t,
          operatorIds: has
            ? t.operatorIds.filter((id) => id !== operatorId)
            : [...t.operatorIds, operatorId],
        }
      }),
    )
  }

  function moveTask(index: number, direction: 'up' | 'down') {
    const swap = direction === 'up' ? index - 1 : index + 1
    if (swap < 0 || swap >= tasks.length) return
    const next = [...tasks]
    ;[next[index], next[swap]] = [next[swap], next[index]]
    setTasks(resequence(next))
  }

  function confirmDelete() {
    if (!deletingTempId) return
    const removedId = deletingTempId
    setDeletingTempId(null)
    setTasks((prev) => resequence(prev.filter((t) => t.tempId !== removedId)))
    setTaskErrors((prev) => {
      const copy = { ...prev }
      delete copy[removedId]
      return copy
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setTasks((prev) => {
      const oldIndex = prev.findIndex((t) => t.tempId === active.id)
      const newIndex = prev.findIndex((t) => t.tempId === over.id)
      if (oldIndex === -1 || newIndex === -1) return prev
      return resequence(arrayMove(prev, oldIndex, newIndex))
    })
  }

  // ── D. Agregar proceso genérico ────────────────────────────────────────────
  function openAddProcess() {
    setShowAddProcess(true)
    if (processTypes.length === 0 && !loadingProcessTypes) {
      setLoadingProcessTypes(true)
      listProcessTypes().then((res) => {
        setLoadingProcessTypes(false)
        if ('ok' in res && res.ok) setProcessTypes(res.data)
      })
    }
  }

  function handleAddProcessType(value: string) {
    const pt = processTypes.find((p) => p.id === value)
    if (!pt) return
    const qty = parseQuantityInt()
    setTasks((prev) => [
      ...resequence(prev),
      {
        tempId: newTempId(),
        processTypeId: pt.id,
        processTypeName: pt.name,
        order: prev.length + 1,
        quantityTotal: qty > 0 ? qty : 1,
        instructions: null,
        operatorIds: [],
        estimatedMinutes: null,
        machineName: null,
        materials: [],
      },
    ])
    setShowAddProcess(false)
    setTaskErrors((prev) => {
      const copy = { ...prev }
      delete copy['new']
      return copy
    })
  }

  // ── E. Validación frontend ─────────────────────────────────────────────────
  function validate(): boolean {
    const fe: Record<string, string> = {}
    const te: Record<string, string> = {}

    if (code.trim().length < 2) {
      fe.code = 'El código es requerido (mínimo 2 caracteres).'
    }
    if (!productId) {
      fe.productId = 'Seleccioná un producto.'
    }
    const qty = Number(quantityTotal)
    if (quantityTotal.trim() === '' || !Number.isInteger(qty) || qty <= 0) {
      fe.quantityTotal = 'La cantidad debe ser un número entero mayor a 0.'
    }

    if (tasks.length === 0) {
      setFieldErrors(fe)
      setTaskErrors(te)
      setFormError('La orden debe tener al menos una tarea.')
      return false
    }

    // Sin orders duplicados (defensivo; el recálculo debería evitarlo)
    const seen = new Set<number>()
    for (const t of tasks) {
      if (seen.has(t.order)) te[t.tempId] = 'Orden duplicado.'
      seen.add(t.order)
      if (!Number.isInteger(t.quantityTotal) || t.quantityTotal <= 0) {
        te[t.tempId] = te[t.tempId] ?? 'La cantidad debe ser un entero mayor a 0.'
      }
    }

    setFieldErrors(fe)
    setTaskErrors(te)

    if (Object.keys(fe).length > 0 || Object.keys(te).length > 0) {
      setFormError('Revisá los campos marcados en rojo.')
      return false
    }

    setFormError(null)
    return true
  }

  // ── F. Guardar ─────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const res = await createWorkOrder({
        code: code.trim(),
        productId: productId as string,
        quantityTotal: Number(quantityTotal),
        tasks: tasks.map((t) => ({
          processTypeId: t.processTypeId,
          order: t.order,
          quantityTotal: t.quantityTotal,
          instructions: t.instructions && t.instructions.trim() !== '' ? t.instructions.trim() : null,
          operatorIds: t.operatorIds,
        })),
      })

      if ('ok' in res && res.ok) {
        router.push('/produccion/ordenes')
      } else {
        setFormError('error' in res ? res.error : 'Error al crear la orden de producción.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Datos generales */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
          Datos generales
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Código OP *
            </label>
            <input
              type="text"
              placeholder="OP-0826244"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={ctrl}
            />
            {fieldErrors.code && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.code}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Producto *
            </label>
            <select
              value={productId ?? ''}
              onChange={(e) => handleProductChange(e.target.value)}
              className={ctrl}
            >
              <option value="">Seleccionar producto...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
            {fieldErrors.productId && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.productId}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Cantidad total *
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={quantityTotal}
              onChange={(e) => setQuantityTotal(e.target.value)}
              className={ctrl}
            />
            {fieldErrors.quantityTotal && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.quantityTotal}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tareas */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
            Tareas ({tasks.length})
          </h3>
          {productId && !loadingProcesses && (
            <button
              type="button"
              onClick={openAddProcess}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              + Agregar proceso
            </button>
          )}
        </div>

        {/* Selector para agregar proceso genérico */}
        {showAddProcess && (
          <div className="mb-4 rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-4">
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Tipo de proceso a agregar
            </label>
            {loadingProcessTypes ? (
              <p className="text-sm text-gray-500">Cargando tipos de proceso...</p>
            ) : (
              <select
                value=""
                onChange={(e) => handleAddProcessType(e.target.value)}
                className={ctrl}
                autoFocus
              >
                <option value="">Seleccionar tipo de proceso...</option>
                {processTypes.map((pt) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.name}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => setShowAddProcess(false)}
              className="mt-2 text-sm text-gray-500 hover:text-gray-700 hover:underline"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Contenido de la lista */}
        {!productId ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
            Seleccioná un producto para clonar automáticamente su secuencia de procesos.
          </div>
        ) : loadingProcesses ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
            Cargando procesos del producto...
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
            Este producto no tiene procesos configurados. Usá "Agregar proceso" para
            crear tareas manualmente.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={tasks.map((task) => task.tempId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
                {tasks.map((task, index) => (
                  <SortableTaskCard
                    key={task.tempId}
                    task={task}
                    index={index}
                    isFirst={index === 0}
                    isLast={index === tasks.length - 1}
                    onMoveUp={() => moveTask(index, 'up')}
                    onMoveDown={() => moveTask(index, 'down')}
                    onStartDelete={() => setDeletingTempId(task.tempId)}
                    isDeleting={deletingTempId === task.tempId}
                    onConfirmDelete={confirmDelete}
                    onCancelDelete={() => setDeletingTempId(null)}
                    operators={operators}
                    onUpdateTask={updateTask}
                    onToggleOperator={toggleOperator}
                    taskError={taskErrors[task.tempId]}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Error general */}
      {formError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {formError}
        </div>
      )}

      {/* Barra inferior fija: Guardar / Cancelar */}
      <div className="sticky bottom-0 z-10 mt-6 flex items-center justify-end gap-3 border-t border-gray-200 bg-white/95 py-4 backdrop-blur">
        <Link
          href="/produccion/ordenes"
          className="h-14 rounded-xl border-2 border-gray-200 px-6 text-base font-medium leading-[3.25rem] text-gray-700 transition hover:bg-gray-50"
        >
          Cancelar
        </Link>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="h-14 rounded-xl bg-blue-600 px-8 text-base font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Guardando...' : 'GUARDAR'}
        </button>
      </div>
    </div>
  )
}