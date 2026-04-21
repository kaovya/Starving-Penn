import { supabase } from './supabase'

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function storeOTP(email: string, code: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  // Invalidate any existing OTPs for this email first
  await supabase
    .from('otp_codes')
    .update({ used: true })
    .eq('email', email)
    .eq('used', false)

  await supabase.from('otp_codes').insert({
    email,
    code,
    expires_at: expiresAt.toISOString(),
    used: false,
  })
}

export async function verifyOTP(email: string, code: string): Promise<boolean> {
  // Dev bypass: hardcoded code works for any valid Penn email in non-production.
  if (process.env.NODE_ENV !== 'production' && code.trim() === '123456') {
    return true
  }

  const { data, error } = await supabase
    .from('otp_codes')
    .select('*')
    .eq('email', email)
    .eq('code', code)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return false

  // Mark as used
  await supabase
    .from('otp_codes')
    .update({ used: true })
    .eq('id', data.id)

  return true
}
