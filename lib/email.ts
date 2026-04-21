import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOTPEmail(email: string, code: string): Promise<void> {
  // In dev, redirect delivery to DEV_EMAIL so Resend's free-tier restriction
  // (owner email only) doesn't block testing. The Penn email is still the
  // account identity — only the physical delivery address changes.
  const deliverTo = process.env.DEV_EMAIL ?? email

  const { data, error } = await resend.emails.send({
    from: 'Starving @ Penn <onboarding@resend.dev>',
    to: deliverTo,
    subject: `Your verification code: ${code}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <div style="background: #991B1B; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; font-family: Georgia, serif; font-size: 22px; margin: 0;">
            🍜 Starving @ Penn
          </h1>
        </div>
        <div style="background: #FFFBF0; border: 1px solid #FED7AA; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
          <p style="color: #B91C1C; font-size: 16px; margin: 0 0 24px;">
            Hi there! Here's your one-time verification code to log in to Starving @ Penn:
          </p>
          <div style="background: #FFF7ED; border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 24px; border: 1px solid #FED7AA;">
            <span style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #F97316; font-family: monospace;">
              ${code}
            </span>
          </div>
          <p style="color: #92400E; font-size: 14px; margin: 0;">
            This code expires in <strong>10 minutes</strong>. If you didn't request this, you can safely ignore this email.
          </p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 16px;">
          © Starving @ Penn · UPenn
        </p>
      </div>
    `,
  })

  if (error) {
    console.error('[Resend] Failed to send email:', error)
    throw new Error(`Email delivery failed: ${error.message} (${error.name})`)
  }

  console.log('[Resend] Email sent successfully, id:', data?.id)
}

interface JoinNotificationParams {
  creatorEmail: string
  joinerName: string
  joinerPhone: string
  location: string
  date: string   // e.g. "2026-04-25"
  time: string   // e.g. "12:30"
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

function fmtTime(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`
}

export async function sendJoinNotificationEmail(params: JoinNotificationParams): Promise<void> {
  const { creatorEmail, joinerName, joinerPhone, location, date, time } = params
  const deliverTo = process.env.DEV_EMAIL ?? creatorEmail

  const { data, error } = await resend.emails.send({
    from: 'Starving @ Penn <onboarding@resend.dev>',
    to: deliverTo,
    subject: `🍜 ${joinerName} joined your meal at ${location}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <div style="background: #991B1B; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; font-family: Georgia, serif; font-size: 22px; margin: 0;">
            🍜 Starving @ Penn
          </h1>
        </div>
        <div style="background: #FFFBF0; border: 1px solid #FED7AA; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
          <p style="color: #B91C1C; font-size: 16px; margin: 0 0 16px;">
            <strong>Good news!</strong> Someone is joining your meal.
          </p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 0 0 20px;">
            <p style="margin: 0 0 8px; color: #15803d; font-size: 15px;">
              <strong>${joinerName}</strong> has joined your meal at
              <strong>${location}</strong> on <strong>${fmtDate(date)}</strong> at <strong>${fmtTime(time)}</strong>.
            </p>
            <p style="margin: 0; color: #15803d; font-size: 15px;">
              📱 Their phone number: <strong>${joinerPhone}</strong>
            </p>
          </div>
          <p style="color: #92400E; font-size: 14px; margin: 0;">
            Reach out to coordinate the swipe handoff. Thanks for paying it forward!
          </p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 16px;">
          © Starving @ Penn · UPenn
        </p>
      </div>
    `,
  })

  if (error) {
    // Non-fatal — log but don't throw so the join action still succeeds
    console.error('[Resend] Join notification failed:', error)
    return
  }

  console.log('[Resend] Join notification sent, id:', data?.id)
}
