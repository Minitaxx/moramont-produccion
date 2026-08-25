'use client'

import { ReactNode } from 'react'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmText?: string
  confirmVariant?: 'danger' | 'primary'
  isPending?: boolean
  children?: ReactNode // para inputs adicionales (ej: piezas producidas)
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  confirmVariant = 'primary',
  isPending,
  children,
}: ConfirmModalProps) {
  if (!isOpen) return null

  const confirmClasses =
    confirmVariant === 'danger'
      ? 'bg-red-500 text-white hover:bg-red-600'
      : 'bg-blue-600 text-white hover:bg-blue-700'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-1 text-xl font-bold text-gray-900">{title}</h2>
        {description && <p className="mb-5 text-sm text-gray-500">{description}</p>}
        {!description && <div className="mb-5" />}

        {children}

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={`flex h-14 flex-1 items-center justify-center rounded-xl text-base font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${confirmClasses}`}
          >
            {isPending ? 'Procesando...' : confirmText}
          </button>
          <button
            onClick={onClose}
            disabled={isPending}
            className="h-14 rounded-xl border-2 border-gray-200 px-6 text-base font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  )
}