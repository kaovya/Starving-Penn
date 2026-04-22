'use client'

import { useState, FormEvent, useEffect } from 'react'
import { X } from 'lucide-react'

export interface EventFormData {
  date: string
  time: string
  location: string
  total_swipes: number
}

interface EventModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: EventFormData) => Promise<void>
  initial?: EventFormData | null
  loading?: boolean
}

const EMPTY: EventFormData = {
  date: '',
  time: '',
  location: '',
  total_swipes: 1,
}

function parseEventDateTime(date: string, time: string): Date {
  const t = time.trim()
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)) {
    const [h, m] = t.split(':').map(Number)
    return new Date(`${date}T${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`)
  }
  const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (match) {
    let h = parseInt(match[1])
    const min = match[2]
    if (match[3].toUpperCase() === 'PM' && h !== 12) h += 12
    if (match[3].toUpperCase() === 'AM' && h === 12) h = 0
    return new Date(`${date}T${h.toString().padStart(2, '0')}:${min}:00`)
  }
  return new Date(NaN)
}

const FOCUS_RING = '0 0 0 3px rgba(249,115,22,0.25)'

export default function EventModal({ open, onClose, onSubmit, initial, loading }: EventModalProps) {
  const [form, setForm] = useState<EventFormData>(initial || EMPTY)
  const [dateTimeError, setDateTimeError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(initial || EMPTY)
      setDateTimeError('')
    }
  }, [open, initial])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setDateTimeError('')

    if (form.date && form.time) {
      const dt = parseEventDateTime(form.date, form.time)
      if (isNaN(dt.getTime())) {
        setDateTimeError('Please enter a valid time (e.g. 6:30 PM).')
        return
      }
      if (dt < new Date()) {
        setDateTimeError("Please select a date and time that hasn't passed yet.")
        return
      }
    }

    await onSubmit(form)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl shadow-2xl animate-scale-in overflow-hidden" style={{ background: '#FFFBF0' }}>
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ background: '#991B1B', borderBottom: '1px solid #7f1d1d' }}>
          <h2 className="text-lg font-bold text-white"
            style={{ fontFamily: "'Fredoka One', cursive" }}>
            {initial ? 'Edit Event' : 'Post a New Event'}
          </h2>
          <button onClick={onClose} className="hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/10" style={{ color: 'rgba(255,253,247,0.7)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#92400E' }}>Date</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => { setForm({ ...form, date: e.target.value }); setDateTimeError('') }}
              className="w-full px-4 py-2.5 rounded-xl text-gray-800 text-sm focus:outline-none transition-all"
              style={{ border: '1px solid #FED7AA', background: '#FFFDF7' }}
              onFocus={(e) => (e.target.style.boxShadow = FOCUS_RING)}
              onBlur={(e) => (e.target.style.boxShadow = '')}
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#92400E' }}>Time</label>
            <input
              type="text"
              required
              placeholder="e.g. 6:30 PM"
              value={form.time}
              onChange={(e) => { setForm({ ...form, time: e.target.value }); setDateTimeError('') }}
              className="w-full px-4 py-2.5 rounded-xl text-gray-800 text-sm focus:outline-none transition-all"
              style={{ border: '1px solid #FED7AA', background: '#FFFDF7' }}
              onFocus={(e) => (e.target.style.boxShadow = FOCUS_RING)}
              onBlur={(e) => (e.target.style.boxShadow = '')}
            />
          </div>

          {dateTimeError && (
            <p className="text-sm text-red-600 -mt-2 animate-fade-in">⚠️ {dateTimeError}</p>
          )}

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#92400E' }}>Location</label>
            <input
              type="text"
              required
              placeholder="e.g. 1920 Commons, Hill House"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl text-gray-800 text-sm focus:outline-none transition-all"
              style={{ border: '1px solid #FED7AA', background: '#FFFDF7' }}
              onFocus={(e) => (e.target.style.boxShadow = FOCUS_RING)}
              onBlur={(e) => (e.target.style.boxShadow = '')}
            />
          </div>

          {/* Swipes */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#92400E' }}>Number of Swipes You Can Share (not including yourself)</label>
            <input
              type="number"
              min={1}
              max={20}
              required
              value={form.total_swipes}
              onChange={(e) => setForm({ ...form, total_swipes: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-2.5 rounded-xl text-gray-800 text-sm focus:outline-none transition-all"
              style={{ border: '1px solid #FED7AA', background: '#FFFDF7' }}
              onFocus={(e) => (e.target.style.boxShadow = FOCUS_RING)}
              onBlur={(e) => (e.target.style.boxShadow = '')}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              style={{ color: '#92400E', border: '1px solid #FED7AA', background: 'transparent' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#FEF3C7')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
              style={{ background: '#F97316' }}>
              {loading && <span className="spinner" />}
              {loading ? 'Saving…' : initial ? 'Save Changes' : 'Post Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
