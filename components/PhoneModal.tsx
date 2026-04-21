'use client'

import { useState, useEffect, FormEvent } from 'react'
import { X, Phone } from 'lucide-react'

interface PhoneModalProps {
  open: boolean
  initialPhone: string
  loading: boolean
  onClose: () => void
  onConfirm: (phone: string) => void
}

export default function PhoneModal({ open, initialPhone, loading, onClose, onConfirm }: PhoneModalProps) {
  const [phone, setPhone] = useState(initialPhone)

  // Re-sync whenever the modal opens or the pre-fill changes
  useEffect(() => {
    if (open) setPhone(initialPhone)
  }, [open, initialPhone])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (phone.trim()) onConfirm(phone.trim())
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
          style={{ background: '#011F5B' }}>
          <div className="flex items-center gap-2">
            <Phone size={16} className="text-blue-200" />
            <h2 className="text-base font-bold text-white"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              Your Phone Number
            </h2>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-gray-500 mb-4">
            {initialPhone
              ? 'Confirm or update your phone number. The meal host will use this to coordinate.'
              : 'Enter your phone number so the meal host can reach you to coordinate.'}
          </p>

          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            type="tel"
            required
            autoFocus
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. (215) 555-1234"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 text-sm focus:outline-none transition-all"
            onFocus={(e) => (e.target.style.boxShadow = '0 0 0 3px rgba(1,31,91,0.15)')}
            onBlur={(e) => (e.target.style.boxShadow = '')}
          />

          <div className="flex gap-3 mt-5">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={loading || !phone.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
              style={{ background: '#16a34a' }}>
              {loading && <span className="spinner" />}
              {loading ? 'Joining…' : 'Confirm & Join'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
