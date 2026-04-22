import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { signJWT } from '@/lib/jwt'
import { SESSION_COOKIE } from '@/lib/auth'
import { sendAdminSignupNotification } from '@/lib/email'

function logSupabaseError(label: string, error: unknown) {
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>
    console.error(`[register] ${label}:`, {
      code: e.code,
      message: e.message,
      details: e.details,
      hint: e.hint,
      full: e,
    })
  } else {
    console.error(`[register] ${label}:`, error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, lastName, phoneNumber } = await request.json()

    if (!email || !firstName || !lastName || !phoneNumber) {
      return Response.json(
        { error: 'Email, first name, last name, and phone number are all required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()
    const domain = normalizedEmail.split('@')[1] ?? ''
    if (domain !== 'upenn.edu' && !domain.endsWith('.upenn.edu')) {
      return Response.json(
        { error: 'Only upenn.edu email addresses are allowed' },
        { status: 400 }
      )
    }

    // Check existence first — determines INSERT vs UPDATE
    const { data: existing, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single()

    if (fetchError) {
      // PGRST116 = no row found, expected for new users
      if ((fetchError as any).code !== 'PGRST116') {
        logSupabaseError('fetch existing user', fetchError)
      }
    }

    let user: { id: string; email: string; first_name: string; last_name: string } | null = null

    if (existing) {
      // Legacy account — fill in the missing fields
      console.log(`[register] updating existing user id=${existing.id} email=${normalizedEmail}`)
      const { data: updated, error: updateError } = await supabase
        .from('users')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone_number: phoneNumber.trim(),
        })
        .eq('id', existing.id)
        .select('id, email, first_name, last_name')
        .single()

      if (updateError || !updated) {
        logSupabaseError('update user', updateError)
        return Response.json({ error: 'Failed to update account' }, { status: 500 })
      }
      user = updated
    } else {
      // Brand-new user — insert fresh row
      console.log(`[register] inserting new user email=${normalizedEmail}`)
      const { data: inserted, error: insertError } = await supabase
        .from('users')
        .insert({
          email: normalizedEmail,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone_number: phoneNumber.trim(),
        })
        .select('id, email, first_name, last_name')
        .single()

      if (insertError || !inserted) {
        logSupabaseError('insert user', insertError)
        return Response.json({ error: 'Failed to create account' }, { status: 500 })
      }
      user = inserted

      // Fire-and-forget admin notification — never blocks the signup response
      ;(async () => {
        try {
          const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
          await sendAdminSignupNotification({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: normalizedEmail,
            phoneNumber: phoneNumber.trim(),
            totalUsers: count ?? 0,
          })
        } catch (err) {
          console.error('[register] admin notification error (non-fatal):', err)
        }
      })()
    }

    const token = await signJWT({
      userId: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
    })

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return Response.json(
      { success: true, user: { firstName: user.first_name } },
      { status: 201 }
    )
  } catch (err) {
    console.error('[register] unexpected error:', err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
