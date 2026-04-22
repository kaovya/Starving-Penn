import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// Admin email is checked server-side against the verified JWT session only.
// The ?admin=true query param is meaningless without a matching session email —
// a non-admin user sending ?admin=true gets identical output to a normal request.
const ADMIN_EMAIL = '620843kavs@upenn.edu'

// GET /api/events            — list all events (for join page)
// GET /api/events?mine=true  — list my events (for share page)
// GET /api/events?admin=true — admin only: all events with full phone numbers
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const mine = request.nextUrl.searchParams.get('mine') === 'true'
  // isAdmin is derived exclusively from the server-verified JWT session email.
  // The client cannot influence this value — it comes from the signed httpOnly cookie.
  const isAdmin = session.email === ADMIN_EMAIL
  // adminMode requires BOTH a matching session AND the opt-in param.
  // If isAdmin is false, adminMode is always false regardless of query params.
  const adminMode = isAdmin && request.nextUrl.searchParams.get('admin') === 'true'

  let query = supabase
    .from('events')
    .select(`
      *,
      creator:users!creator_id(id, first_name, email),
      joiners:joins(id, joined_at, user:users!user_id(id, first_name, phone_number))
    `)
    .order('date', { ascending: true })
    .order('time', { ascending: true })

  // Admin mode bypasses the mine filter — returns all events
  if (!adminMode && mine) {
    query = query.eq('creator_id', session.userId)
  }

  const { data, error } = await query

  if (error) {
    console.error('events GET error:', error)
    return Response.json({ error: 'Failed to fetch events' }, { status: 500 })
  }

  // Fetch which events the current user has joined (skip in admin mode — not needed)
  let joinedEventIds = new Set<string>()
  if (!adminMode) {
    const { data: userJoins } = await supabase
      .from('joins')
      .select('event_id')
      .eq('user_id', session.userId)
    joinedEventIds = new Set((userJoins || []).map((j: any) => j.event_id))
  }

  const events = (data || []).map((e: any) => {
    const joiners = e.joiners ?? []
    // Admin mode sees everything. Otherwise: creator or joined user sees phones.
    const canSeePhones =
      adminMode ||
      e.creator_id === session.userId ||
      joinedEventIds.has(e.id)

    return {
      ...e,
      phone_number: canSeePhones ? e.phone_number : null,
      joiners: joiners.map((j: any) => ({
        ...j,
        user: {
          ...j.user,
          phone_number: canSeePhones ? j.user?.phone_number ?? null : null,
        },
      })),
      join_count: joiners.length,
    }
  })

  return Response.json({ events })
}

// POST /api/events — create a new event
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { date, time, location, total_swipes } = body

  if (!date || !time || !location || !total_swipes) {
    return Response.json({ error: 'Date, time, location, and swipe count are required' }, { status: 400 })
  }

  // Pull creator's phone number from their user profile automatically
  const { data: creator } = await supabase
    .from('users')
    .select('phone_number')
    .eq('id', session.userId)
    .single()

  const { data, error } = await supabase
    .from('events')
    .insert({
      creator_id: session.userId,
      date,
      time,
      location,
      total_swipes: Number(total_swipes),
      phone_number: creator?.phone_number ?? '',
    })
    .select()
    .single()

  if (error) {
    console.error('events POST error:', error)
    return Response.json({ error: 'Failed to create event' }, { status: 500 })
  }

  return Response.json({ event: data }, { status: 201 })
}
