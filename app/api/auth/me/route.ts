import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// Server-side admin check — email never sent to the client
const ADMIN_EMAIL = '620843kavs@upenn.edu'

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
      // isAdmin is computed server-side from the verified session.
      // The client receives only a boolean — the admin email is never exposed.
      isAdmin: session.email === ADMIN_EMAIL,
    },
  })
}
