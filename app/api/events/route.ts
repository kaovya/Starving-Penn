import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// GET /api/events — list all events (for join page)
// GET /api/events?mine=true — list my events (for share page)
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const mine = request.nextUrl.searchParams.get('mine') === 'true'

  let query = supabase
    .from('events')
    .select(`
      *,
      creator:users!creator_id(id, first_name, email),
      joiners:joins(id, joined_at, user:users!user_id(id, first_name, phone_number))
    `)
    .order('date', { ascending: true })
    .order('time', { ascending: true })

  if (mine) {
    query = query.eq('creator_id', session.userId)
  }

  const { data, error } = await query

  if (error) {
    console.error('events GET error:', error)
    return Response.json({ error: 'Failed to fetch events' }, { status: 500 })
  }

  // Derive join_count from the joiners array length
  const events = (data || []).map((e: any) => ({
    ...e,
    joiners: e.joiners ?? [],
    join_count: e.joiners?.length ?? 0,
  }))

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
