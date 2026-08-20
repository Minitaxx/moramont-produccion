'use client'

import { useState } from 'react'

type Process = {
  id: string
  order: number
  processType: { code: string; name: string }
  machine: { code: string; name: string } | null
  materials: { id: string; material: { name: string }; quantity: number | null; unit: string | null }[]
}

export default function ProductionView({ initialProcesses }: { initialProcesses: Process[] }) {
  const [processes] = useState<Process[]>(initialProcesses)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Procesos de Fabricación</h1>
      {processes.length === 0 ? (
        <p className="text-gray-500">No hay procesos configurados para este producto.</p>
      ) : (
        <ul className="space-y-3">
          {processes.map((p) => (
            <li key={p.id} className="border p-4 rounded">
              <div className="font-semibold">
                Orden {p.order}: {p.processType.name}
              </div>
              <div className="text-sm text-gray-600">
                Máquina: {p.machine?.name ?? 'Sin asignar'}
              </div>
              {p.materials.length > 0 && (
                <ul className="mt-2 text-sm">
                  {p.materials.map((m) => (
                    <li key={m.id}>
                      - {m.material.name}: {m.quantity ?? '-'} {m.unit ?? ''}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
