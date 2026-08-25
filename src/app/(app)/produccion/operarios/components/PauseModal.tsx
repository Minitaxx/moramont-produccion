'use client'

import { useState, useEffect } from 'react'

interface PauseModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (pauseReason: string) => void
  taskName: string
  isPending?: boolean
}

export default function PauseModal({
  isOpen,
  onClose,
  onConfirm,
  taskName,
  isPending,
}: PauseModalProps) {
  const [reason, setReason] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setReason('')
      setFormError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const reasonValid = reason.trim().length >= 3

  function handleConfirm() {
    setFormError(null)
    if (!reasonValid) {
      setFormError('El motivo de pausa debe tener al menos 3 caracteres.')
      return
    }
    onConfirm(reason.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-1 text-xl font-bold text-gray-900">⏸ Pausar tarea</h2>
        <p className="mb-5 truncate text-sm text-gray-500">{taskName}</p>

        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
          Motivo de la pausa
        </label>
        <textarea
          rows={3}
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mb-4 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-base focus:border-blue-400 focus:outline-none"
          placeholder="Ej: esperando material, cambio de herramienta..."
        />

        {formError && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={isPending || !reasonValid}
            title={!reasonValid ? 'Ingresá un motivo de al menos 3 caracteres' : undefined}
            className="flex h-14 flex-1 items-center justify-center rounded-xl bg-yellow-500 text-base font-bold text-white transition hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? 'Pausando...' : '⏸ Confirmar pausa'}
          </button>
          <button
            onClick={onClose}
            disabled={isPending}
            className="h-14 rounded-xl border-2 border-gray-200 px-6 text-base font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}