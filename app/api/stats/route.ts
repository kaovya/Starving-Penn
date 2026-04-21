import { supabase } from '@/lib/supabase'

// GET /api/stats — public impact stats (no auth required)
export async function GET() {
  const [
    { count: totalJoins },
    { count: totalUsers },
    { count: totalEvents },
  ] = await Promise.all([
    // Swipes Saved = total joins ever made (each join = one swipe claimed)
    supabase.from('joins').select('*', { count: 'exact', head: true }),
    // Users = total accounts ever created (email is unique, so count = distinct)
    supabase.from('users').select('*', { count: 'exact', head: true }),
    // Events = total events ever posted
    supabase.from('events').select('*', { count: 'exact', head: true }),
  ])

  return Response.json({
    swipesSaved: totalJoins ?? 0,
    users: totalUsers ?? 0,
    events: totalEvents ?? 0,
  })
}
