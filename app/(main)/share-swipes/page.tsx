'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, MapPin, Calendar, Users, Phone } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import EventModal, { EventFormData } from '@/components/EventModal'
import ConfirmDialog from '@/components/ConfirmDialog'
import Spinner from '@/components/Spinner'

interface Joiner {
  id: string
  joined_at: string
  user: {
    id: string
    first_name: string
    phone_number: string | null
  }
}

interface EventRow {
  id: string
  date: string
  time: string
  location: string
  total_swipes: number
  phone_number: string
  created_at: string
  join_count: number
  joiners: Joiner[]
}

// Handles "HH:MM:SS" (PostgreSQL), "HH:MM" (old time input), and "H:MM AM/PM" (new free text)
function parseEventDateTime(date: string, time: string): Date {
  const t = time.trim()
  // 24-hour: "HH:MM" or "HH:MM:SS"
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)) {
    const [h, m] = t.split(':').map(Number)
    return new Date(`${date}T${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`)
  }
  // Free-text 12-hour: "H:MM AM/PM"
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

function formatTime(timeStr: string): string {
  const t = timeStr.trim()
  // 24-hour with optional seconds: "HH:MM" or "HH:MM:SS"
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)) {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
  }
  // Already human-readable (e.g. "6:30 PM")
  return t
}

function isPast(date: string, time: string): boolean {
  const dt = parseEventDateTime(date, time)
  return !isNaN(dt.getTime()) && dt < new Date()
}

function smartDateLabel(dateStr: string, timeStr: string): string {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const eventDate = new Date(dateStr + 'T00:00:00')
  const time = formatTime(timeStr)
  if (eventDate.getTime() === today.getTime()) return `Today · ${time}`
  if (eventDate.getTime() === tomorrow.getTime()) return `Tomorrow · ${time}`
  const label = eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  return `${label} · ${time}`
}

export default function ShareSwipesPage() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [editTarget, setEditTarget] = useState<EventRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EventRow | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/events?mine=true')
      const data = await res.json()
      if (res.ok) setEvents(data.events || [])
      else toast.error(data.error || 'Failed to load events')
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  async function handleCreate(form: EventFormData) {
    setModalLoading(true)
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Event posted!')
        setModalOpen(false)
        fetchEvents()
      } else {
        toast.error(data.error || 'Failed to post event')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setModalLoading(false)
    }
  }

  async function handleEdit(form: EventFormData) {
    if (!editTarget) return
    setModalLoading(true)
    try {
      const res = await fetch(`/api/events/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Event updated!')
        setEditTarget(null)
        fetchEvents()
      } else {
        toast.error(data.error || 'Failed to update event')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setModalLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/events/${deleteTarget.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        toast.success('Event deleted')
        setDeleteTarget(null)
        fetchEvents()
      } else {
        toast.error(data.error || 'Failed to delete event')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Upcoming: soonest first. Past: most recently passed first.
  const upcoming = events
    .filter((e) => !isPast(e.date, e.time))
    .sort((a, b) => parseEventDateTime(a.date, a.time).getTime() - parseEventDateTime(b.date, b.time).getTime())
  const past = events
    .filter((e) => isPast(e.date, e.time))
    .sort((a, b) => parseEventDateTime(b.date, b.time).getTime() - parseEventDateTime(a.date, a.time).getTime())

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link href="/home" className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors mb-6"
        style={{ color: '#92400E' }}>
        ← Back
      </Link>

      {/* Page header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "'Fredoka One', cursive", color: '#B91C1C' }}>
            Share Swipes
          </h1>
          <p className="text-sm mt-1" style={{ color: '#92400E' }}>Your active and past dining events</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all hover:opacity-90 active:scale-[0.97] cursor-pointer"
          style={{ background: '#F97316' }}
        >
          <Plus size={18} />
          <span className="hidden sm:inline">New Event</span>
        </button>
      </div>

      {/* Loading */}
      {loading && <Spinner />}

      {/* Empty state */}
      {!loading && events.length === 0 && (
        <div className="text-center py-20 animate-fade-in">
          <div className="text-5xl mb-4">🍽️</div>
          <h3 className="text-lg font-semibold mb-2"
            style={{ fontFamily: "'Fredoka One', cursive", color: '#B91C1C' }}>No events yet</h3>
          <p className="text-sm mb-6" style={{ color: '#92400E' }}>Post your first event to share your dining swipes.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-6 py-3 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all cursor-pointer"
            style={{ background: '#F97316' }}
          >
            + Post an Event
          </button>
        </div>
      )}

      {/* Event cards */}
      {!loading && (upcoming.length > 0 || past.length > 0) && (
        <div className="space-y-4">
          {/* Upcoming section */}
          {upcoming.length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#92400E' }}>
              Upcoming
            </p>
          )}
          {upcoming.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              past={false}
              onEdit={() => setEditTarget(event)}
              onDelete={() => setDeleteTarget(event)}
            />
          ))}

          {/* Past events section */}
          {past.length > 0 && (
            <div className="flex items-center gap-3 mt-8 mb-3">
              <div className="flex-1 h-px" style={{ background: '#FED7AA' }} />
              <p className="text-xs font-semibold uppercase tracking-widest shrink-0" style={{ color: '#92400E' }}>
                Past Events
              </p>
              <div className="flex-1 h-px" style={{ background: '#FED7AA' }} />
            </div>
          )}
          {past.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              past={true}
              onEdit={() => setEditTarget(event)}
              onDelete={() => setDeleteTarget(event)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <EventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        loading={modalLoading}
      />

      {/* Edit Modal */}
      <EventModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
        initial={
          editTarget
            ? {
                date: editTarget.date,
                time: editTarget.time,
                location: editTarget.location,
                total_swipes: editTarget.total_swipes,
              }
            : null
        }
        loading={modalLoading}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Event?"
        message="Are you sure you want to delete this event? Anyone who joined will lose access."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
        danger
      />
    </div>
  )
}

// ---- Event Card Sub-component ----
interface EventCardProps {
  event: EventRow
  past: boolean
  onEdit: () => void
  onDelete: () => void
}

function EventCard({ event, past, onEdit, onDelete }: EventCardProps) {
  const remaining = event.total_swipes - (event.join_count || 0)
  const joiners = event.joiners ?? []

  return (
    <div
      className="rounded-2xl shadow-sm border transition-all duration-200 hover:shadow-md animate-fade-in"
      style={{
        background: past ? '#F5F0E8' : '#FFFBF0',
        borderColor: past ? '#e8ddd0' : '#FED7AA',
        opacity: past ? 0.7 : 1,
      }}
    >
      <div className="p-5">
        <div className="flex items-center gap-4">
          {/* Left: info */}
          <div className="flex-1 min-w-0">
            {/* Date & Time */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: '#B91C1C' }}>
                <Calendar size={14} className="shrink-0" />
                {smartDateLabel(event.date, event.time)}
              </span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1.5 mt-1.5 text-sm" style={{ color: '#92400E' }}>
              <MapPin size={13} className="shrink-0" style={{ color: '#92400E', opacity: 0.6 }} />
              <span className="truncate">{event.location}</span>
            </div>

            {/* Swipes info */}
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-sm" style={{ color: '#92400E' }}>
                <Users size={13} className="shrink-0" />
                {event.total_swipes} swipes total
              </span>
              <span
                className="text-sm font-semibold px-2 py-0.5 rounded-full"
                style={
                  remaining > 0
                    ? { background: '#f0fdf4', color: '#16A34A' }
                    : { background: '#f3f4f6', color: '#9ca3af' }
                }
              >
                {remaining} remaining
              </span>
              {past && <span className="text-xs italic" style={{ color: '#92400E' }}>Past event</span>}
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onEdit}
              className="p-2 rounded-lg transition-all cursor-pointer"
              style={{ color: '#92400E' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#FED7AA'; (e.currentTarget as HTMLElement).style.color = '#B91C1C' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#92400E' }}
              title="Edit">
              <Pencil size={16} />
            </button>
            <button onClick={onDelete}
              className="p-2 rounded-lg transition-all cursor-pointer"
              style={{ color: '#92400E' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fee2e2'; (e.currentTarget as HTMLElement).style.color = '#DC2626' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#92400E' }}
              title="Delete">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Joiners list */}
        {joiners.length > 0 && (
          <div className="mt-4 pt-4 border-t animate-fade-in" style={{ borderColor: '#FED7AA' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#92400E' }}>
              Who&apos;s coming ({joiners.length} / {event.total_swipes})
            </p>
            <div className="space-y-1.5">
              {joiners.map((j) => (
                <div key={j.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                  style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <span className="text-base">👤</span>
                  <span className="font-semibold text-gray-800">{j.user.first_name}</span>
                  {j.user.phone_number && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="flex items-center gap-1" style={{ color: '#92400E' }}>
                        <Phone size={11} className="shrink-0" />
                        {j.user.phone_number}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state for joiners */}
        {joiners.length === 0 && !past && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: '#FED7AA' }}>
            <p className="text-xs italic" style={{ color: '#92400E', opacity: 0.6 }}>No one has joined yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
