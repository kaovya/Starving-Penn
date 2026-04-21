'use client'

import { X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title?: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  danger?: boolean
}

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
  loading,
  danger = true,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-scale-in">
        <div className="flex items-start justify-between p-6 pb-4">
          <h3 className="text-lg font-bold text-gray-800"
            style={{ fontFamily: "'Fredoka One', cursive" }}>{title}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 cursor-pointer ml-4 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        <p className="px-6 pb-6 text-sm text-gray-600">{message}</p>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60 cursor-pointer"
            style={{ background: danger ? '#DC2626' : '#F97316' }}>
            {loading && <span className="spinner" />}
            {loading ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
