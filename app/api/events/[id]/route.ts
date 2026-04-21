import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// PUT /api/events/[id] — update an event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { date, time, location, total_swipes } = body

  // Verify ownership
  const { data: existing } = await supabase
    .from('events')
    .select('creator_id')
    .eq('id', id)
    .single()

  if (!existing || existing.creator_id !== session.userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // phone_number stays as originally stored — not user-editable
  const { data, error } = await supabase
    .from('events')
    .update({ date, time, location, total_swipes: Number(total_swipes) })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return Response.json({ error: 'Failed to update event' }, { status: 500 })
  }

  return Response.json({ event: data })
}

// DELETE /api/events/[id] — delete an event
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify ownership
  const { data: existing } = await supabase
    .from('events')
    .select('creator_id')
    .eq('id', id)
    .single()

  if (!existing || existing.creator_id !== session.userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase.from('events').delete().eq('id', id)

  if (error) {
    return Response.json({ error: 'Failed to delete event' }, { status: 500 })
  }

  return Response.json({ success: true })
}
