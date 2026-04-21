import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ user: null }, { status: 401 })

  // Fetch live user record so we always have the latest phone_number
  const { data: user } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, phone_number')
    .eq('id', session.userId)
    .single()

  return Response.json({
    user: {
      ...session,
      lastName: user?.last_name ?? '',
      phoneNumber: user?.phone_number ?? null,
    },
  })
}
