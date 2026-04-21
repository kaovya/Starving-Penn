import { cookies } from 'next/headers'
import { verifyJWT, JWTPayload } from './jwt'

export const SESSION_COOKIE = 'omf_session'

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifyJWT(token)
}
