'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getProductWithProcesses, getProcessTypes, getMachines, getMaterials,
  createManufacturingProcess, deleteManufacturingProcess, updateManufacturingProcess,
  createProcessMaterial, deleteProcessMaterial, updateProcessMaterial,
} from '@/domains/production/actions/production.actions'
import { ManufacturingProcessItem, ProcessTypeItem, MachineItem, ProductCatalogItem } from '@/domains/production/types'

export default function ProcessManager({ product, onBack }: { product: ProductCatalogItem; onBack: () => void }) {
  const [processes, setProcesses] = useState<ManufacturingProcessItem[]>([])
  const [processTypes, setProcessTypes] = useState<ProcessTypeItem[]>([])
  const [machines, setMachines] = useState<MachineItem[]>([])
  const [materials, setMaterials] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)

  // Form: nuevo proceso
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProcess, setNewProcess] = useState({ processTypeId: '', machineId: '', estimatedMinutes: '', order: '', notes: '' })
  const [newProcessError, setNewProcessError] = useState<string | null>(null)

  // Form: nuevo material (por processId)
  const [newMaterial, setNewMaterial] = useState<Record<string, { materialId: string; quantity: string; unit: string }>>({})

  // Edición inline: proceso
  const [editingProcessId, setEditingProcessId] = useState<string | null>(null)
  const [editProcess, setEditProcess] = useState({ processTypeId: '', machineId: '', estimatedMinutes: '', order: '', notes: '' })
  const [editProcessError, setEditProcessError] = useState<string | null>(null)

  // Edición inline: material
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null)
  const [editMaterial, setEditMaterial] = useState({ materialId: '', quantity: '', unit: '' })
  const [editMaterialError, setEditMaterialError] = useState<string | null>(null)

  const ctrl = 'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200'

  const load = useCallback(() => {
    setLoading(true)
    getProductWithProcesses(product.id).then((res) => {
      if ('ok' in res && res.ok) setProcesses(res.data.processes)
      setLoading(false)
    })
  }, [product.id])

  useEffect(() => {
    load()
    getProcessTypes().then((r) => { if ('ok' in r && r.ok) setProcessTypes(r.data) })
    getMachines().then((r) => { if ('ok' in r && r.ok) setMachines(r.data) })
    getMaterials().then((r) => { if ('ok' in r && r.ok) setMaterials(r.data) })
  }, [load])

  // ── Handlers: nuevo proceso ──────────────────────────────────────────────
  async function handleAddProcess() {
    if (!newProcess.processTypeId) return
    setNewProcessError(null)
    const orderNum = newProcess.order ? Number(newProcess.order) : processes.length + 1
    const res = await createManufacturingProcess({
      catalogProductId: product.id,
      processTypeId: newProcess.processTypeId,
      order: orderNum,
      machineId: newProcess.machineId || undefined,
      estimatedMinutes: newProcess.estimatedMinutes ? Number(newProcess.estimatedMinutes) : undefined,
      notes: newProcess.notes || undefined,
    })
    if ('ok' in res && res.ok) {
      setNewProcess({ processTypeId: '', machineId: '', estimatedMinutes: '', order: '', notes: '' })
      setShowAddForm(false)
      load()
    } else if ('error' in res) {
      setNewProcessError(res.error)
    }
  }

  async function handleDeleteProcess(id: string) {
    if (!confirm('¿Eliminar este proceso y todos sus materiales?')) return
    const res = await deleteManufacturingProcess(id)
    if ('ok' in res && res.ok) load(); else alert('Error al eliminar proceso')
  }

  // ── Handlers: edición de proceso ─────────────────────────────────────────
  function handleStartEditProcess(proc: ManufacturingProcessItem) {
    setEditingProcessId(proc.id)
    setEditProcessError(null)
    setEditProcess({
      processTypeId: proc.processTypeId,
      machineId: proc.machineId ?? '',
      estimatedMinutes: proc.estimatedMinutes != null ? String(proc.estimatedMinutes) : '',
      order: String(proc.order),
      notes: proc.notes ?? '',
    })
  }

  async function handleSaveProcess(procId: string) {
    setEditProcessError(null)
    const res = await updateManufacturingProcess(procId, {
      processTypeId: editProcess.processTypeId || undefined,
      order: editProcess.order ? Number(editProcess.order) : undefined,
      machineId: editProcess.machineId || null,
      estimatedMinutes: editProcess.estimatedMinutes ? Number(editProcess.estimatedMinutes) : null,
      notes: editProcess.notes || null,
    })
    if ('ok' in res && res.ok) {
      setEditingProcessId(null)
      load()
    } else if ('error' in res) {
      setEditProcessError(res.error)
    }
  }

  // ── Handlers: materiales ─────────────────────────────────────────────────
  async function handleAddMaterial(processId: string) {
    const mat = newMaterial[processId]
    if (!mat || !mat.materialId || !mat.quantity || !mat.unit) return
    const res = await createProcessMaterial({ processId, materialId: mat.materialId, quantity: Number(mat.quantity), unit: mat.unit })
    if ('ok' in res && res.ok) {
      setNewMaterial((prev) => ({ ...prev, [processId]: { materialId: '', quantity: '', unit: '' } }))
      load()
    } else alert('Error al agregar material')
  }

  async function handleDeleteMaterial(id: string) {
    if (!confirm('¿Quitar este material?')) return
    const res = await deleteProcessMaterial(id)
    if ('ok' in res && res.ok) load(); else alert('Error al eliminar material')
  }

  function handleStartEditMaterial(mat: { id: string; materialId: string; quantity: number; unit: string | null }) {
    setEditingMaterialId(mat.id)
    setEditMaterialError(null)
    setEditMaterial({ materialId: mat.materialId, quantity: String(mat.quantity), unit: mat.unit ?? '' })
  }

  async function handleSaveMaterial(matId: string) {
    setEditMaterialError(null)
    const res = await updateProcessMaterial(matId, {
      materialId: editMaterial.materialId || undefined,
      quantity: editMaterial.quantity ? Number(editMaterial.quantity) : undefined,
      unit: editMaterial.unit || undefined,
    })
    if ('ok' in res && res.ok) {
      setEditingMaterialId(null)
      load()
    } else if ('error' in res) {
      setEditMaterialError(res.error)
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Cargando procesos...</div>

  return (
    <div className="space-y-6">
      {/* ── Cabecera del producto ── */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <button onClick={onBack} className="mb-2 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
              ← Volver al catálogo
            </button>
            <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
            <p className="mt-0.5 text-sm text-gray-500">
              {product.code} · <span className="capitalize">{product.geometryType}</span>
            </p>
          </div>
          <button
            onClick={() => { setShowAddForm(!showAddForm); setNewProcessError(null) }}
            className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            {showAddForm ? 'Cancelar' : '+ Agregar proceso'}
          </button>
        </div>
      </div>

      {/* ── Formulario: nuevo proceso ── */}
      {showAddForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">Nuevo proceso</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Tipo de proceso">
              <select value={newProcess.processTypeId} onChange={(e) => setNewProcess({ ...newProcess, processTypeId: e.target.value })} className={ctrl}>
                <option value="">Seleccionar...</option>
                {processTypes.map((pt) => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
              </select>
            </Field>
            <Field label="Máquina">
              <select value={newProcess.machineId} onChange={(e) => setNewProcess({ ...newProcess, machineId: e.target.value })} className={ctrl}>
                <option value="">Sin máquina</option>
                {machines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
            <Field label={`Orden (sugerido: ${processes.length + 1})`}>
              <input
                type="number" min={1}
                placeholder={String(processes.length + 1)}
                value={newProcess.order}
                onChange={(e) => setNewProcess({ ...newProcess, order: e.target.value })}
                className={ctrl}
              />
            </Field>
            <Field label="Minutos estimados">
              <input type="number" placeholder="Ej: 45" value={newProcess.estimatedMinutes} onChange={(e) => setNewProcess({ ...newProcess, estimatedMinutes: e.target.value })} className={ctrl} />
            </Field>
            <Field label="Notas" className="sm:col-span-2">
              <textarea rows={2} placeholder="Observaciones del proceso..." value={newProcess.notes} onChange={(e) => setNewProcess({ ...newProcess, notes: e.target.value })} className={ctrl} />
            </Field>
          </div>
          {newProcessError && <p className="mt-3 text-sm font-medium text-red-600">{newProcessError}</p>}
          <div className="mt-4 flex justify-end">
            <button onClick={handleAddProcess} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800">
              Guardar proceso
            </button>
          </div>
        </div>
      )}

      {/* ── Lista de procesos ── */}
      <div className="space-y-4">
        {processes.length === 0 && !showAddForm && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
            Este producto no tiene procesos configurados. Hacé clic en &quot;Agregar proceso&quot; para comenzar.
          </div>
        )}

        {processes.map((proc) => (
          <div key={proc.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">

            {/* Cabecera del proceso: vista o edición */}
            {editingProcessId === proc.id ? (
              <div className="border-b border-gray-100 bg-gray-50 p-5">
                <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-700">Editar proceso</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Tipo de proceso">
                    <select value={editProcess.processTypeId} onChange={(e) => setEditProcess({ ...editProcess, processTypeId: e.target.value })} className={ctrl}>
                      {processTypes.map((pt) => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Máquina">
                    <select value={editProcess.machineId} onChange={(e) => setEditProcess({ ...editProcess, machineId: e.target.value })} className={ctrl}>
                      <option value="">Sin máquina</option>
                      {machines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Orden">
                    <input type="number" min={1} value={editProcess.order} onChange={(e) => setEditProcess({ ...editProcess, order: e.target.value })} className={ctrl} />
                  </Field>
                  <Field label="Minutos estimados">
                    <input type="number" value={editProcess.estimatedMinutes} onChange={(e) => setEditProcess({ ...editProcess, estimatedMinutes: e.target.value })} className={ctrl} />
                  </Field>
                  <Field label="Notas" className="sm:col-span-2">
                    <textarea rows={2} value={editProcess.notes} onChange={(e) => setEditProcess({ ...editProcess, notes: e.target.value })} className={ctrl} />
                  </Field>
                </div>
                {editProcessError && <p className="mt-3 text-sm font-medium text-red-600">{editProcessError}</p>}
                <div className="mt-4 flex items-center gap-3">
                  <button onClick={() => handleSaveProcess(proc.id)} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800">
                    Guardar
                  </button>
                  <button
                    onClick={() => { setEditingProcessId(null); setEditProcessError(null) }}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between border-b border-gray-100 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700">
                    {proc.order}
                  </span>
                  <div>
                    <div className="font-semibold text-gray-900">{proc.processTypeName}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {proc.machineName && (
                        <span className="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {proc.machineName}
                        </span>
                      )}
                      {proc.estimatedMinutes != null && (
                        <span className="inline-flex items-center rounded bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700">
                          {proc.estimatedMinutes} min
                        </span>
                      )}
                    </div>
                    {proc.notes && <p className="mt-1 text-xs text-gray-400">{proc.notes}</p>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 pl-4">
                  <button onClick={() => handleStartEditProcess(proc)} className="text-sm text-gray-500 hover:text-gray-800 hover:underline">
                    Editar
                  </button>
                  <button onClick={() => handleDeleteProcess(proc.id)} className="text-sm text-red-600 hover:text-red-800 hover:underline">
                    Eliminar
                  </button>
                </div>
              </div>
            )}

            {/* Sección de materiales */}
            <div className="bg-gray-50/50 p-5">
              <h5 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">Materiales</h5>

              {proc.materials.length === 0 && (
                <p className="mb-3 text-sm text-gray-400">Sin materiales asignados</p>
              )}

              {proc.materials.length > 0 && (
                <div className="mb-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-2 text-left text-xs font-medium uppercase text-gray-500">Material</th>
                        <th className="py-2 text-left text-xs font-medium uppercase text-gray-500">Cantidad</th>
                        <th className="py-2 text-left text-xs font-medium uppercase text-gray-500">Unidad</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {proc.materials.map((mat) =>
                        editingMaterialId === mat.id ? (
                          <tr key={mat.id} className="bg-white">
                            <td className="py-1.5 pr-2">
                              <select value={editMaterial.materialId} onChange={(e) => setEditMaterial({ ...editMaterial, materialId: e.target.value })} className={ctrl}>
                                {materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                              </select>
                            </td>
                            <td className="py-1.5 pr-2 w-28">
                              <input type="number" value={editMaterial.quantity} onChange={(e) => setEditMaterial({ ...editMaterial, quantity: e.target.value })} className={ctrl} />
                            </td>
                            <td className="py-1.5 pr-2 w-28">
                              <input type="text" value={editMaterial.unit} onChange={(e) => setEditMaterial({ ...editMaterial, unit: e.target.value })} className={ctrl} />
                            </td>
                            <td className="py-1.5 text-right whitespace-nowrap">
                              {editMaterialError && <span className="mr-2 text-xs text-red-600">{editMaterialError}</span>}
                              <button onClick={() => handleSaveMaterial(mat.id)} className="mr-1.5 rounded bg-gray-900 px-2 py-1 text-xs font-medium text-white hover:bg-gray-800">✓</button>
                              <button onClick={() => { setEditingMaterialId(null); setEditMaterialError(null) }} className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">✗</button>
                            </td>
                          </tr>
                        ) : (
                          <tr key={mat.id} className="transition hover:bg-white">
                            <td className="py-2 text-gray-800">{mat.materialName ?? '—'}</td>
                            <td className="py-2 text-gray-600">{mat.quantity}</td>
                            <td className="py-2 text-gray-600">{mat.unit}</td>
                            <td className="py-2 text-right whitespace-nowrap">
                              <button onClick={() => handleStartEditMaterial(mat)} className="mr-3 text-xs text-gray-500 hover:text-gray-800 hover:underline">Editar</button>
                              <button onClick={() => handleDeleteMaterial(mat.id)} className="text-xs text-red-600 hover:text-red-800 hover:underline">Quitar</button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Agregar material */}
              <div className="flex flex-wrap items-end gap-3">
                <Field label="Material" className="min-w-[200px] flex-1">
                  <select value={newMaterial[proc.id]?.materialId || ''} onChange={(e) => setNewMaterial((prev) => ({ ...prev, [proc.id]: { ...prev[proc.id], materialId: e.target.value } }))} className={ctrl}>
                    <option value="">Seleccionar...</option>
                    {materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </Field>
                <Field label="Cantidad" className="w-28">
                  <input type="number" placeholder="0.00" value={newMaterial[proc.id]?.quantity || ''} onChange={(e) => setNewMaterial((prev) => ({ ...prev, [proc.id]: { ...prev[proc.id], quantity: e.target.value } }))} className={ctrl} />
                </Field>
                <Field label="Unidad" className="w-32">
                  <input type="text" placeholder="kg, m, und..." value={newMaterial[proc.id]?.unit || ''} onChange={(e) => setNewMaterial((prev) => ({ ...prev, [proc.id]: { ...prev[proc.id], unit: e.target.value } }))} className={ctrl} />
                </Field>
                <button onClick={() => handleAddMaterial(proc.id)} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800">
                  Agregar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Field({ label, className = '', children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">{label}</label>
      {children}
    </div>
  )
}
