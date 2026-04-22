'use client'

import { useState, useEffect, useCallback } from 'react'
import { MapPin, Calendar, Users, Phone } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import Spinner from '@/components/Spinner'

interface Creator {
  id: string
  first_name: string
  email: string
}

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
  phone_number: string | null
  created_at: string
  join_count: number
  joiners: Joiner[]
  creator: Creator
}

// Handles "HH:MM:SS" (PostgreSQL), "HH:MM" (old time input), and "H:MM AM/PM" (new free text)
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

function formatTime(timeStr: string): string {
  const t = timeStr.trim()
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)) {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
  }
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

export default function JoinMealPage() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [myJoins, setMyJoins] = useState<Set<string>>(new Set())
  const [myUserId, setMyUserId] = useState<string>('')
  const [myPhone, setMyPhone] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminMode, setAdminMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchAll = useCallback(async (withAdmin = false) => {
    setLoading(true)
    try {
      const eventsUrl = withAdmin ? '/api/events?admin=true' : '/api/events'
      const [eventsRes, joinsRes, meRes] = await Promise.all([
        fetch(eventsUrl),
        fetch('/api/joins'),
        fetch('/api/auth/me'),
      ])
      const eventsData = await eventsRes.json()
      const joinsData = await joinsRes.json()
      const meData = await meRes.json()

      if (eventsRes.ok) setEvents(eventsData.events || [])
      else toast.error(eventsData.error || 'Failed to load events')

      if (joinsRes.ok) {
        setMyJoins(new Set((joinsData.joins || []).map((j: { event_id: string }) => j.event_id)))
      }

      if (meRes.ok && meData.user) {
        setMyUserId(meData.user.userId ?? '')
        setMyPhone(meData.user.phoneNumber ?? null)
        setIsAdmin(meData.user.isAdmin === true)
      }
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll(false) }, [fetchAll])

  function handleAdminToggle() {
    const next = !adminMode
    setAdminMode(next)
    fetchAll(next)
  }

  async function handleJoin(eventId: string) {
    setActionLoading(eventId)
    try {
      const res = await fetch('/api/joins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Joined! Check the host\'s contact info to coordinate.')
        setMyJoins((prev) => new Set([...prev, eventId]))
        setEvents((prev) => prev.map((e) => {
          if (e.id !== eventId) return e
          const newJoiner: Joiner = {
            id: crypto.randomUUID(),
            joined_at: new Date().toISOString(),
            user: { id: myUserId, first_name: 'You', phone_number: myPhone },
          }
          return { ...e, join_count: e.join_count + 1, joiners: [...e.joiners, newJoiner] }
        }))
      } else {
        toast.error(data.error || 'Failed to join')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleLeave(eventId: string) {
    setActionLoading(eventId)
    try {
      const res = await fetch('/api/joins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Left the event.')
        setMyJoins((prev) => {
          const next = new Set(prev)
          next.delete(eventId)
          return next
        })
        setEvents((prev) => prev.map((e) => {
          if (e.id !== eventId) return e
          return {
            ...e,
            join_count: Math.max(0, e.join_count - 1),
            joiners: e.joiners.filter((j) => j.user.id !== myUserId),
          }
        }))
      } else {
        toast.error(data.error || 'Failed to leave')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setActionLoading(null)
    }
  }

  const upcoming = events
    .filter((e) => !isPast(e.date, e.time))
    .sort((a, b) => parseEventDateTime(a.date, a.time).getTime() - parseEventDateTime(b.date, b.time).getTime())
  const past = events
    .filter((e) => isPast(e.date, e.time))
    .sort((a, b) => parseEventDateTime(b.date, b.time).getTime() - parseEventDateTime(a.date, a.time).getTime())

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Top bar: back link + admin toggle */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/home" className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: '#92400E' }}>
          ← Back
        </Link>
        {isAdmin && (
          <button
            onClick={handleAdminToggle}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
            style={{
              background: adminMode ? '#DC2626' : 'rgba(220,38,38,0.08)',
              color: adminMode ? 'white' : '#DC2626',
              border: '1px solid #DC2626',
            }}
          >
            {adminMode ? '👁 Admin View ON' : '👁 Admin View'}
          </button>
        )}
      </div>

      {/* Page header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold" style={{ fontFamily: "'Fredoka One', cursive", color: '#B91C1C' }}>
          Join a Meal
        </h1>
        <p className="text-sm mt-1" style={{ color: '#92400E', fontFamily: "'Nunito', sans-serif" }}>
          {adminMode ? 'Admin view — all events with full details' : 'Browse available dining swipes from fellow Penn students'}
        </p>
      </div>

      {loading && <Spinner />}

      {!loading && events.length === 0 && (
        <div className="text-center py-20 animate-fade-in">
          <div className="text-5xl mb-4">🍴</div>
          <h3 className="text-lg font-semibold mb-2"
            style={{ fontFamily: "'Fredoka One', cursive", color: '#B91C1C' }}>No events available</h3>
          <p className="text-sm" style={{ color: '#92400E', fontFamily: "'Nunito', sans-serif" }}>Check back soon — underclassmen will be posting swipes!</p>
        </div>
      )}

      {!loading && (upcoming.length > 0 || past.length > 0) && (
        <div className="space-y-4">
          {upcoming.length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#92400E', fontFamily: "'Nunito', sans-serif" }}>
              Available Now
            </p>
          )}

          {upcoming.map((event) => (
            <JoinCard
              key={event.id}
              event={event}
              past={false}
              joined={myJoins.has(event.id)}
              myUserId={myUserId}
              adminMode={adminMode}
              loading={actionLoading === event.id}
              onJoin={() => handleJoin(event.id)}
              onLeave={() => handleLeave(event.id)}
            />
          ))}

          {past.length > 0 && (
            <div className="flex items-center gap-3 mt-8 mb-3">
              <div className="flex-1 h-px" style={{ background: '#FED7AA' }} />
              <p className="text-xs font-semibold uppercase tracking-widest shrink-0" style={{ color: '#92400E', fontFamily: "'Nunito', sans-serif" }}>
                Past Events
              </p>
              <div className="flex-1 h-px" style={{ background: '#FED7AA' }} />
            </div>
          )}

          {past.map((event) => (
            <JoinCard
              key={event.id}
              event={event}
              past={true}
              joined={myJoins.has(event.id)}
              myUserId={myUserId}
              adminMode={adminMode}
              loading={actionLoading === event.id}
              onJoin={() => handleJoin(event.id)}
              onLeave={() => handleLeave(event.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface JoinCardProps {
  event: EventRow
  past: boolean
  joined: boolean
  myUserId: string
  adminMode: boolean
  loading: boolean
  onJoin: () => void
  onLeave: () => void
}

function JoinCard({ event, past, joined, myUserId, adminMode, loading, onJoin, onLeave }: JoinCardProps) {
  const remaining = event.total_swipes - (event.join_count || 0)
  const isFull = remaining <= 0 && !joined
  const joiners = event.joiners ?? []
  const showDetails = joined || adminMode

  return (
    <div
      className="rounded-2xl shadow-sm border transition-all duration-200 hover:shadow-md animate-fade-in"
      style={{
        background: past ? '#F5F0E8' : '#FFFBF0',
        borderColor: adminMode ? 'rgba(220,38,38,0.3)' : (past ? '#e8ddd0' : '#FED7AA'),
        opacity: past ? 0.7 : 1,
      }}
    >
      {/* Admin badge on card */}
      {adminMode && (
        <div className="px-5 pt-3 pb-0">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(220,38,38,0.08)', color: '#DC2626' }}>
            👁 Admin
          </span>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            {/* Date & Time */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: '#B91C1C', fontFamily: "'Fredoka One', cursive" }}>
                <Calendar size={14} className="shrink-0" />
                {smartDateLabel(event.date, event.time)}
              </span>
            </div>

            {/* Creator name */}
            <p className="mt-1 text-sm" style={{ color: '#92400E', fontFamily: "'Nunito', sans-serif" }}>
              Posted by <span className="font-semibold" style={{ color: '#B91C1C' }}>{event.creator?.first_name || 'Penn Student'}</span>
              {adminMode && event.phone_number && (
                <span className="ml-2 font-semibold" style={{ color: '#DC2626' }}>
                  · 📞 {event.phone_number}
                </span>
              )}
            </p>

            {/* Location */}
            <div className="flex items-center gap-1.5 mt-1.5 text-sm" style={{ color: '#92400E', fontFamily: "'Nunito', sans-serif" }}>
              <MapPin size={13} className="shrink-0" style={{ opacity: 0.6 }} />
              <span className="truncate">{event.location}</span>
            </div>

            {/* Swipes */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-sm" style={{ color: '#92400E', fontFamily: "'Nunito', sans-serif" }}>
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
                {remaining > 0 ? `${remaining} remaining` : 'Full'}
              </span>
            </div>

            {/* Host contact — visible once joined (non-admin) */}
            {joined && !past && !adminMode && event.phone_number && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium animate-fade-in"
                style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontFamily: "'Nunito', sans-serif" }}>
                <Phone size={13} className="shrink-0" />
                <span>Host contact: <span className="font-bold">{event.phone_number}</span></span>
              </div>
            )}
          </div>

          {/* Join/Leave button */}
          {!past && (
            <div className="shrink-0 self-center">
              {joined ? (
                <button onClick={onLeave} disabled={loading}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-1.5 transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 cursor-pointer"
                  style={{ background: '#DC2626', minWidth: 80, fontFamily: "'Nunito', sans-serif" }}>
                  {loading ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : 'Leave'}
                </button>
              ) : isFull ? (
                <button disabled
                  className="px-4 py-2 rounded-xl text-sm font-semibold cursor-not-allowed"
                  style={{ background: '#D1C4B0', color: '#78716c', minWidth: 80, fontFamily: "'Nunito', sans-serif" }}>
                  Full
                </button>
              ) : (
                <button onClick={onJoin} disabled={loading}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-1.5 transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 cursor-pointer"
                  style={{ background: '#F97316', minWidth: 80, fontFamily: "'Nunito', sans-serif" }}>
                  {loading ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : 'Join'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Joiners list — shown when joined OR in admin mode */}
        {showDetails && joiners.length > 0 && (
          <div className="mt-4 pt-4 border-t animate-fade-in" style={{ borderColor: adminMode ? 'rgba(220,38,38,0.2)' : '#FED7AA' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: adminMode ? '#DC2626' : '#92400E', fontFamily: "'Nunito', sans-serif" }}>
              Who&apos;s coming ({joiners.length})
            </p>
            <div className="space-y-1.5">
              {joiners.map((j) => (
                <div key={j.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                  style={{
                    background: j.user.id === myUserId ? '#fff7ed' : '#fef9f0',
                    border: j.user.id === myUserId ? '1px solid #FED7AA' : '1px solid #f3ead8',
                  }}>
                  <span className="text-base">👤</span>
                  <span className="font-semibold" style={{ color: '#B91C1C', fontFamily: "'Nunito', sans-serif" }}>
                    {j.user.id === myUserId ? 'You' : j.user.first_name}
                  </span>
                  {j.user.phone_number && (
                    <>
                      <span style={{ color: '#FED7AA' }}>·</span>
                      <span className="flex items-center gap-1" style={{ color: '#92400E', fontFamily: "'Nunito', sans-serif" }}>
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
      </div>
    </div>
  )
}
