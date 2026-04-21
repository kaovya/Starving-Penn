import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { sendJoinNotificationEmail } from '@/lib/email'

// GET /api/joins — get the current user's joins
export async function GET() {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('joins')
    .select('event_id')
    .eq('user_id', session.userId)

  if (error) {
    return Response.json({ error: 'Failed to fetch joins' }, { status: 500 })
  }

  return Response.json({ joins: data || [] })
}

// POST /api/joins — join an event
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { event_id } = await request.json()
  if (!event_id) {
    return Response.json({ error: 'event_id is required' }, { status: 400 })
  }

  // Fetch event + creator details in one query
  const { data: event } = await supabase
    .from('events')
    .select('total_swipes, creator_id, location, date, time, creator:users!creator_id(email, first_name)')
    .eq('id', event_id)
    .single()

  if (!event) {
    return Response.json({ error: 'Event not found' }, { status: 404 })
  }

  if (event.creator_id === session.userId) {
    return Response.json({ error: 'You cannot join your own event' }, { status: 400 })
  }

  const { count } = await supabase
    .from('joins')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event_id)

  if ((count ?? 0) >= event.total_swipes) {
    return Response.json({ error: 'No swipes remaining' }, { status: 400 })
  }

  // Fetch joiner's phone number from their profile
  const { data: joinerProfile } = await supabase
    .from('users')
    .select('phone_number')
    .eq('id', session.userId)
    .single()

  const joinerPhone = joinerProfile?.phone_number ?? 'N/A'

  // Insert the join record
  const { error } = await supabase.from('joins').insert({
    event_id,
    user_id: session.userId,
  })

  if (error) {
    if (error.code === '23505') {
      return Response.json({ error: 'Already joined' }, { status: 400 })
    }
    return Response.json({ error: 'Failed to join event' }, { status: 500 })
  }

  // Fire-and-forget notification email to the underclassman creator
  const creator = event.creator as unknown as { email: string; first_name: string } | null
  if (creator?.email) {
    sendJoinNotificationEmail({
      creatorEmail: creator.email,
      joinerName: session.firstName,
      joinerPhone,
      location: event.location,
      date: event.date,
      time: event.time,
    }).catch((err) => console.error('[joins] Notification email error:', err))
  }

  return Response.json({ success: true }, { status: 201 })
}

// DELETE /api/joins — leave an event
export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { event_id } = await request.json()
  if (!event_id) {
    return Response.json({ error: 'event_id is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('joins')
    .delete()
    .eq('event_id', event_id)
    .eq('user_id', session.userId)

  if (error) {
    return Response.json({ error: 'Failed to leave event' }, { status: 500 })
  }

  return Response.json({ success: true })
}
