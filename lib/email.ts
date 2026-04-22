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

interface AdminSignupParams {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  totalUsers: number
}

export async function sendAdminSignupNotification(params: AdminSignupParams): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.warn('[Resend] ADMIN_EMAIL not set — skipping admin signup notification')
    return
  }

  const deliverTo = process.env.DEV_EMAIL ?? adminEmail
  const { firstName, lastName, email, phoneNumber, totalUsers } = params

  const signedUpAt = new Date().toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York',
  })

  const { data, error } = await resend.emails.send({
    from: 'Starving @ Penn <onboarding@resend.dev>',
    to: deliverTo,
    subject: '🍜 New Starving @ Penn signup!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <div style="background: #991B1B; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; font-family: Georgia, serif; font-size: 22px; margin: 0;">
            🍜 Starving @ Penn
          </h1>
        </div>
        <div style="background: #FFFBF0; border: 1px solid #FED7AA; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
          <p style="color: #B91C1C; font-size: 16px; margin: 0 0 20px;">
            A new user just joined Starving @ Penn!
          </p>
          <table style="width: 100%; border-collapse: collapse; font-size: 15px; color: #92400E;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 40%;">Name</td>
              <td style="padding: 8px 0;">${firstName} ${lastName}</td>
            </tr>
            <tr style="background: #FFF7ED;">
              <td style="padding: 8px 6px; font-weight: bold;">Email</td>
              <td style="padding: 8px 6px;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Phone</td>
              <td style="padding: 8px 0;">${phoneNumber}</td>
            </tr>
            <tr style="background: #FFF7ED;">
              <td style="padding: 8px 6px; font-weight: bold;">Signed up at</td>
              <td style="padding: 8px 6px;">${signedUpAt}</td>
            </tr>
          </table>
          <div style="margin-top: 24px; padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #15803d; font-size: 18px; font-weight: bold;">
              Total users so far: ${totalUsers}
            </p>
          </div>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 16px;">
          © Starving @ Penn · UPenn
        </p>
      </div>
    `,
  })

  if (error) {
    console.error('[Resend] Admin signup notification failed:', error)
    return
  }

  console.log('[Resend] Admin signup notification sent, id:', data?.id)
}
