import { NextRequest } from 'next/server'
import { generateOTP, storeOTP } from '@/lib/otp'
import { sendOTPEmail } from '@/lib/email'

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

    const code = generateOTP()
    await storeOTP(normalizedEmail, code)
    await sendOTPEmail(normalizedEmail, code)

    // Tell the frontend where the code was actually delivered so it can show
    // the dev-mode notice. Only populated when DEV_EMAIL overrides delivery.
    const devEmail = process.env.DEV_EMAIL ?? null
    return Response.json({ success: true, devEmail })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send verification code'
    console.error('[send-otp]', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
