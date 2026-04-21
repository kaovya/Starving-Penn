import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifyOTP } from '@/lib/otp'
import { signJWT } from '@/lib/jwt'
import { supabase } from '@/lib/supabase'
import { SESSION_COOKIE } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, code, firstName } = await request.json()

    if (!email || !code) {
      return Response.json({ error: 'Email and code are required' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const isValid = await verifyOTP(normalizedEmail, code.trim())

    if (!isValid) {
      return Response.json(
        { error: 'Invalid or expired verification code' },
        { status: 401 }
      )
    }

    // Upsert user
    const name = (firstName || '').trim() || 'Penn Student'
    const { data: user, error } = await supabase
      .from('users')
      .upsert(
        { email: normalizedEmail, first_name: name },
        { onConflict: 'email', ignoreDuplicates: false }
      )
      .select()
      .single()

    if (error || !user) {
      console.error('upsert user error:', error)
      return Response.json({ error: 'Failed to create user' }, { status: 500 })
    }

    const token = await signJWT({
      userId: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: (user as any).last_name ?? '',
    })

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return Response.json({
      success: true,
      user: { id: user.id, email: user.email, firstName: user.first_name },
    })
  } catch (err) {
    console.error('verify-otp error:', err)
    return Response.json({ error: 'Verification failed' }, { status: 500 })
  }
}
