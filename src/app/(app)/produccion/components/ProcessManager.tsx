'use client'

import { useCallback, useEffect, useState } from 'react'
import { getProductWithProcesses, getProcessTypes, getMachines, getMaterials, createManufacturingProcess, deleteManufacturingProcess, createProcessMaterial, deleteProcessMaterial } from '@/domains/production/actions/production.actions'
import { ManufacturingProcessItem, ProcessTypeItem, MachineItem, ProductCatalogItem } from '@/domains/production/types'

export default function ProcessManager({ product }: { product: ProductCatalogItem }) {
  const [processes, setProcesses] = useState<ManufacturingProcessItem[]>([])
  const [processTypes, setProcessTypes] = useState<ProcessTypeItem[]>([])
  const [machines, setMachines] = useState<MachineItem[]>([])
  const [materials, setMaterials] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProcess, setNewProcess] = useState({ processTypeId: '', machineId: '', estimatedMinutes: '' })
  const [newMaterial, setNewMaterial] = useState<Record<string, { materialId: string; quantity: string; unit: string }>>({})

  const load = useCallback(() => {
    setLoading(true)
    getProductWithProcesses(product.id).then((res) => { if ('ok' in res && res.ok) setProcesses(res.data.processes); setLoading(false) })
  }, [product.id])

  useEffect(() => {
    load()
    getProcessTypes().then((r) => { if ('ok' in r && r.ok) setProcessTypes(r.data) })
    getMachines().then((r) => { if ('ok' in r && r.ok) setMachines(r.data) })
    getMaterials().then((r) => { if ('ok' in r && r.ok) setMaterials(r.data) })
  }, [load])

  async function handleAddProcess() {
    if (!newProcess.processTypeId) return
    const res = await createManufacturingProcess({ catalogProductId: product.id, processTypeId: newProcess.processTypeId, order: processes.length + 1, machineId: newProcess.machineId || undefined, estimatedMinutes: newProcess.estimatedMinutes ? Number(newProcess.estimatedMinutes) : undefined })
    if ('ok' in res && res.ok) { setNewProcess({ processTypeId: '', machineId: '', estimatedMinutes: '' }); setShowAddForm(false); load() } else alert('Error al crear proceso')
  }
  async function handleDeleteProcess(id: string) {
    if (!confirm('¿Eliminar este proceso?')) return
    const res = await deleteManufacturingProcess(id)
    if ('ok' in res && res.ok) load(); else alert('Error al eliminar')
  }
  async function handleAddMaterial(processId: string) {
    const mat = newMaterial[processId]
    if (!mat || !mat.materialId || !mat.quantity || !mat.unit) return
    const res = await createProcessMaterial({ processId, materialId: mat.materialId, quantity: Number(mat.quantity), unit: mat.unit })
    if ('ok' in res && res.ok) { setNewMaterial((prev) => ({ ...prev, [processId]: { materialId: '', quantity: '', unit: '' } })); load() } else alert('Error al agregar material')
  }
  async function handleDeleteMaterial(id: string) {
    if (!confirm('¿Eliminar este material?')) return
    const res = await deleteProcessMaterial(id)
    if ('ok' in res && res.ok) load(); else alert('Error al eliminar material')
  }
  if (loading) return <div className="p-4">Cargando procesos...</div>

  return (
    <div className="p-4 border rounded bg-white">
      <div className="flex justify-between items-center mb-4"><div><h2 className="text-lg font-bold">{product.name}</h2><p className="text-sm text-gray-500">{product.code} · {product.geometryType}</p></div><button onClick={() => setShowAddForm(!showAddForm)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{showAddForm ? 'Cancelar' : '+ Agregar Proceso'}</button></div>
      {showAddForm && <div className="mb-4 p-3 border rounded bg-gray-50"><div className="grid grid-cols-3 gap-3"><select value={newProcess.processTypeId} onChange={(e) => setNewProcess({ ...newProcess, processTypeId: e.target.value })} className="px-3 py-2 border rounded"><option value="">Tipo de proceso...</option>{processTypes.map((pt) => <option key={pt.id} value={pt.id}>{pt.name}</option>)}</select><select value={newProcess.machineId} onChange={(e) => setNewProcess({ ...newProcess, machineId: e.target.value })} className="px-3 py-2 border rounded"><option value="">Máquina (opcional)...</option>{machines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select><input type="number" placeholder="Minutos estimados" value={newProcess.estimatedMinutes} onChange={(e) => setNewProcess({ ...newProcess, estimatedMinutes: e.target.value })} className="px-3 py-2 border rounded" /></div><button onClick={handleAddProcess} className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Guardar Proceso</button></div>}
      {processes.length === 0 && <p className="text-gray-500">Este producto no tiene procesos configurados.</p>}
      <div className="space-y-4">{processes.map((proc) => <div key={proc.id} className="border rounded p-3"><div className="flex justify-between items-start"><div><div className="font-bold">{proc.order}. {proc.processTypeName}{proc.machineName && <span className="text-sm font-normal text-gray-500"> → {proc.machineName}</span>}</div>{proc.estimatedMinutes != null && <div className="text-sm text-gray-500">{proc.estimatedMinutes} minutos estimados</div>}</div><button onClick={() => handleDeleteProcess(proc.id)} className="text-red-600 text-sm hover:underline">Eliminar</button></div><div className="mt-3"><div className="text-sm font-medium text-gray-700 mb-1">Materiales:</div>{proc.materials.length === 0 && <p className="text-xs text-gray-400">Sin materiales</p>}<div className="space-y-1">{proc.materials.map((mat) => <div key={mat.id} className="flex justify-between text-sm px-2 py-1 bg-gray-50 rounded"><span>{mat.materialName} — {mat.quantity} {mat.unit}</span><button onClick={() => handleDeleteMaterial(mat.id)} className="text-red-500 text-xs hover:underline">Quitar</button></div>)}</div><div className="mt-2 flex gap-2"><select value={newMaterial[proc.id]?.materialId || ''} onChange={(e) => setNewMaterial((prev) => ({ ...prev, [proc.id]: { ...prev[proc.id], materialId: e.target.value } }))} className="text-sm px-2 py-1 border rounded flex-1"><option value="">Material...</option>{materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select><input type="number" placeholder="Cant." value={newMaterial[proc.id]?.quantity || ''} onChange={(e) => setNewMaterial((prev) => ({ ...prev, [proc.id]: { ...prev[proc.id], quantity: e.target.value } }))} className="text-sm px-2 py-1 border rounded w-20" /><input type="text" placeholder="Unidad" value={newMaterial[proc.id]?.unit || ''} onChange={(e) => setNewMaterial((prev) => ({ ...prev, [proc.id]: { ...prev[proc.id], unit: e.target.value } }))} className="text-sm px-2 py-1 border rounded w-24" /><button onClick={() => handleAddMaterial(proc.id)} className="text-sm px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-900">+</button></div></div></div>)}</div>
    </div>
  )
}
