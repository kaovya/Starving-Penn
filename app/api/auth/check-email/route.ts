import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { signJWT } from '@/lib/jwt'
import { SESSION_COOKIE } from '@/lib/auth'

function logSupabaseError(label: string, error: unknown) {
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>
    console.error(`[check-email] ${label}:`, {
      code: e.code,
      message: e.message,
      details: e.details,
      hint: e.hint,
      full: e,
    })
  } else {
    console.error(`[check-email] ${label}:`, error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return Response.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const domain = normalizedEmail.split('@')[1] ?? ''
    if (domain !== 'upenn.edu' && !domain.endsWith('.upenn.edu')) {
      return Response.json(
        { error: 'Only upenn.edu email addresses are allowed' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, phone_number')
      .eq('email', normalizedEmail)
      .single()

    if (fetchError) {
      // PostgREST returns code PGRST116 when no row is found — that's not a real error
      if ((fetchError as any).code !== 'PGRST116') {
        logSupabaseError('fetch user', fetchError)
      }
    }

    if (!user) {
      // Brand-new user — tell the frontend to show the registration form
      return Response.json({ exists: false })
    }

    // Legacy account check: existing row but missing one or more required fields
    const isComplete =
      user.first_name?.trim() &&
      user.last_name?.trim() &&
      user.phone_number?.trim()

    if (!isComplete) {
      // Tell the frontend to show the profile-completion form (no session yet)
      return Response.json({ exists: true, complete: false })
    }

    // Fully complete returning user — create session immediately
    const token = await signJWT({
      userId: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name ?? '',
    })

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return Response.json({ exists: true, complete: true, user: { firstName: user.first_name } })
  } catch (err) {
    console.error('[check-email] unexpected error:', err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
