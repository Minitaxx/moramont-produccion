'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { createWorkOrder, getProductProcesses } from '@/domains/production/actions/workorder-actions'
import { getProductCatalog } from '@/domains/production/actions/production.actions'
import { listOperators } from '@/domains/production/actions/operator-actions'

// ─────────────────────────────────────────────────────────────────────────────
// Types locales
// ─────────────────────────────────────────────────────────────────────────────

interface ProductOption {
  id: string
  code: string
  name: string
}

interface OperatorOption {
  id: string
  name: string
  employeeCode?: string | null
}

interface ProcessOption {
  id: string
  processTypeId: string
  order: number
  processType: { id: string; name: string }
}

interface TaskDraft {
  uid: string
  processTypeId: string
  processName: string
  quantityTotal: number
  instructions: string
  operatorIds: string[]
  requiresUid: string | null
}

const ctrl =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200'

export default function NuevaOrdenPage() {
  const router = useRouter()

  // Datos maestros
  const [products, setProducts] = useState<ProductOption[]>([])
  const [operators, setOperators] = useState<OperatorOption[]>([])

  // Formulario
  const [code, setCode] = useState('')
  const [productId, setProductId] = useState('')
  const [quantityTotal, setQuantityTotal] = useState(1)

  // Tareas generadas desde los procesos del producto
  const [tasks, setTasks] = useState<TaskDraft[]>([])
  const [loadingProcesses, setLoadingProcesses] = useState(false)

  // Envío
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uidCounter = useRef(0)
  const nextUid = () => `task-${++uidCounter.current}`

  useEffect(() => {
    getProductCatalog().then((res) => {
      if ('ok' in res && res.ok) setProducts(res.data)
    })
    listOperators().then((res) => {
      if ('ok' in res && res.ok) setOperators(res.data)
    })
  }, [])

  // ── Generación de tareas según el producto ────────────────────────────────
  function handleProductChange(value: string) {
    setProductId(value)
    setTasks([])
    setError(null)
    if (!value) return

    setLoadingProcesses(true)
    getProductProcesses(value).then((res) => {
      setLoadingProcesses(false)
      if ('ok' in res && res.ok) {
        setTasks(
          res.data.map((p: ProcessOption) => ({
            uid: nextUid(),
            processTypeId: p.processTypeId,
            processName: p.processType.name,
            quantityTotal,
            instructions: '',
            operatorIds: [],
            requiresUid: null,
          })),
        )
      }
    })
  }

  // Mantiene las referencias "requiere tarea previa" consistentes tras mover/eliminar
  function sanitizeRequires(list: TaskDraft[]): TaskDraft[] {
    return list.map((t) => {
      if (t.requiresUid == null) return t
      const reqIdx = list.findIndex((o) => o.uid === t.requiresUid)
      const selfIdx = list.findIndex((o) => o.uid === t.uid)
      if (reqIdx === -1 || reqIdx >= selfIdx) return { ...t, requiresUid: null }
      return t
    })
  }

  function updateTask(uid: string, patch: Partial<TaskDraft>) {
    setTasks((prev) => prev.map((t) => (t.uid === uid ? { ...t, ...patch } : t)))
  }

  function toggleOperator(uid: string, operatorId: string) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.uid !== uid) return t
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
    setTasks(sanitizeRequires(next))
  }

  function removeTask(index: number) {
    setTasks(sanitizeRequires(tasks.filter((_, i) => i !== index)))
  }

  // ── Envío ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setError(null)

    if (!code.trim()) {
      setError('El código de la orden es requerido')
      return
    }
    if (!productId) {
      setError('Seleccioná un producto')
      return
    }
    if (!quantityTotal || quantityTotal < 1) {
      setError('La cantidad debe ser mayor a 0')
      return
    }
    if (tasks.length === 0) {
      setError('La orden debe tener al menos una tarea')
      return
    }
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i]
      if (!t.quantityTotal || t.quantityTotal < 1) {
        setError(`La tarea ${i + 1} (${t.processName}) debe tener una cantidad mayor a 0`)
        return
      }
      if (t.operatorIds.length === 0) {
        setError(`La tarea ${i + 1} (${t.processName}) necesita al menos un operario asignado`)
        return
      }
    }

    setSubmitting(true)
    try {
      const payloadTasks = tasks.map((t, i) => {
        let requiresTaskId: string | null = null
        if (t.requiresUid) {
          const reqIdx = tasks.findIndex((o) => o.uid === t.requiresUid)
          if (reqIdx !== -1 && reqIdx < i) requiresTaskId = String(reqIdx + 1)
        }
        return {
          processTypeId: t.processTypeId,
          order: i + 1,
          quantityTotal: t.quantityTotal,
          instructions: t.instructions || undefined,
          operatorIds: t.operatorIds,
          requiresTaskId,
        }
      })

      const res = await createWorkOrder({
        code: code.trim(),
        productId,
        quantityTotal,
        tasks: payloadTasks,
      })

      if ('ok' in res && res.ok) {
        router.push('/produccion/ordenes')
      } else if ('error' in res) {
        setError(res.error)
      }
    } finally {
      setSubmitting(false)
    }
  }

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
        <div>
          <h2 className="text-xl font-bold text-gray-900">Nueva Orden de Trabajo</h2>
          <p className="mt-1 text-sm text-gray-500">
            Definí el producto, la cantidad y las tareas con sus operarios asignados
          </p>
        </div>
      </div>

      {/* Datos generales */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
          Datos generales
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Código OP *">
            <input
              type="text"
              required
              placeholder="OP-0826244"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={ctrl}
            />
          </Field>
          <Field label="Producto *">
            <select
              required
              value={productId}
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
          </Field>
          <Field label="Cantidad total *">
            <input
              type="number"
              required
              min={1}
              value={quantityTotal}
              onChange={(e) => setQuantityTotal(Number(e.target.value) || 0)}
              className={ctrl}
            />
          </Field>
        </div>
      </div>

      {/* Tareas */}
      {productId && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
            Tareas ({tasks.length})
          </h3>

          {loadingProcesses && (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
              Cargando procesos del producto...
            </div>
          )}

          {!loadingProcesses && tasks.length === 0 && (
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
              Este producto no tiene procesos configurados. Configurá los procesos en el catálogo
              para poder crear la orden.
            </div>
          )}

          {tasks.map((task, index) => {
            const preceding = tasks.slice(0, index)
            return (
              <div
                key={task.uid}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
              >
                {/* Cabecera de la tarea */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-gray-900">{task.processName}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveTask(index, 'up')}
                      disabled={index === 0}
                      title="Subir"
                      className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-gray-400 transition hover:border-gray-400 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveTask(index, 'down')}
                      disabled={index === tasks.length - 1}
                      title="Bajar"
                      className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-gray-400 transition hover:border-gray-400 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTask(index)}
                      title="Eliminar tarea"
                      className="rounded px-2 py-1 text-sm text-red-600 transition hover:text-red-800 hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                {/* Campos de la tarea */}
                <div className="mt-4 space-y-4">
                  <Field label={`Operarios * (seleccioná al menos 1)`}>
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
                              onChange={() => toggleOperator(task.uid, op.id)}
                            />
                            {op.name}
                          </label>
                        )
                      })}
                    </div>
                  </Field>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Cantidad *">
                      <input
                        type="number"
                        min={1}
                        value={task.quantityTotal}
                        onChange={(e) =>
                          updateTask(task.uid, { quantityTotal: Number(e.target.value) || 0 })
                        }
                        className={ctrl}
                      />
                    </Field>
                    <Field label="Requiere tarea previa">
                      <select
                        value={task.requiresUid ?? ''}
                        onChange={(e) =>
                          updateTask(task.uid, { requiresUid: e.target.value || null })
                        }
                        className={ctrl}
                      >
                        <option value="">Ninguna</option>
                        {preceding.map((p, i) => (
                          <option key={p.uid} value={p.uid}>
                            Tarea {i + 1}: {p.processName}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field label="Instrucciones (opcional)">
                    <textarea
                      rows={2}
                      placeholder="Observaciones para el operario..."
                      value={task.instructions}
                      onChange={(e) => updateTask(task.uid, { instructions: e.target.value })}
                      className={ctrl}
                    />
                  </Field>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Error y envío */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Creando orden...' : 'Crear orden'}
        </button>
      </div>
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