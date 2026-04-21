'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'email' | 'register'

const FOCUS_RING = '0 0 0 3px rgba(249,115,22,0.25)'

export default function LandingPage() {
  const router = useRouter()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isLegacy, setIsLegacy] = useState(false)

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const trimmed = email.trim().toLowerCase()

    const domain = trimmed.split('@')[1] ?? ''
    if (domain !== 'upenn.edu' && !domain.endsWith('.upenn.edu')) {
      setError('Only upenn.edu email addresses are allowed (e.g. @seas.upenn.edu, @wharton.upenn.edu).')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return }

      if (data.exists && data.complete) {
        router.push('/home')
      } else if (data.exists && !data.complete) {
        setIsLegacy(true)
        setStep('register')
      } else {
        setIsLegacy(false)
        setStep('register')
      }
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  async function handleRegisterSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phoneNumber: phoneNumber.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed.'); return }
      router.push('/home')
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4"
      style={{ background: 'linear-gradient(135deg, #991B1B 0%, #7f1d1d 55%, #92400E 100%)' }}
    >
      {/* Decorative bg blobs */}
      <div className="absolute top-[-100px] left-[-100px] w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.15), transparent 70%)' }} />
      <div className="absolute bottom-[-80px] right-[-80px] w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(22,163,74,0.2), transparent 70%)' }} />

      <div className="w-full max-w-md z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🍜</div>
          <h1 className="text-4xl font-bold text-white leading-tight"
            style={{ fontFamily: "'Fredoka One', cursive" }}>
            Starving @ Penn
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-2xl shadow-2xl p-8 animate-scale-in" style={{ background: '#FFFBF0' }}>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm font-medium text-red-700 bg-red-50 border border-red-200 animate-fade-in">
              ⚠️ {error}
            </div>
          )}

          {/* ── Step 1: Email ── */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="animate-fade-in">
              <h2 className="text-2xl font-semibold mb-1" style={{ fontFamily: "'Fredoka One', cursive", color: '#B91C1C' }}>
                Welcome
              </h2>
              <p className="text-sm mb-5" style={{ color: '#92400E', fontFamily: "'Nunito', sans-serif" }}>
                Enter your Penn email to sign in or create an account.
              </p>

              <label className="block text-sm font-semibold mb-1" style={{ color: '#92400E', fontFamily: "'Nunito', sans-serif" }}>Penn Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@upenn.edu" required autoFocus
                className="w-full px-4 py-3 rounded-xl text-gray-800 text-sm focus:outline-none transition-all"
                style={{ border: '1px solid #FED7AA', background: '#FFFDF7', fontFamily: "'Nunito', sans-serif" }}
                onFocus={(e) => (e.target.style.boxShadow = FOCUS_RING)}
                onBlur={(e) => (e.target.style.boxShadow = '')}
              />
              <button type="submit" disabled={loading}
                className="mt-4 w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                style={{ background: '#F97316', fontFamily: "'Fredoka One', cursive", fontSize: '16px', letterSpacing: '0.02em' }}>
                {loading && <span className="spinner" />}
                {loading ? 'Checking…' : 'Continue →'}
              </button>
            </form>
          )}

          {/* ── Step 2: Register / Complete Profile ── */}
          {step === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="animate-fade-in">
              <h2 className="text-2xl font-semibold mb-1" style={{ fontFamily: "'Fredoka One', cursive", color: '#B91C1C' }}>
                {isLegacy ? 'Complete Your Profile' : 'Create Your Account'}
              </h2>
              <p className="text-sm mb-5" style={{ color: '#92400E', fontFamily: "'Nunito', sans-serif" }}>
                {isLegacy
                  ? 'We need a couple more details to finish setting up your account.'
                  : 'First time here! Tell us a bit about yourself.'}
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: '#92400E', fontFamily: "'Nunito', sans-serif" }}>First Name</label>
                    <input
                      type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Alex" required autoFocus
                      className="w-full px-4 py-2.5 rounded-xl text-gray-800 text-sm focus:outline-none transition-all"
                      style={{ border: '1px solid #FED7AA', background: '#FFFDF7', fontFamily: "'Nunito', sans-serif" }}
                      onFocus={(e) => (e.target.style.boxShadow = FOCUS_RING)}
                      onBlur={(e) => (e.target.style.boxShadow = '')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: '#92400E', fontFamily: "'Nunito', sans-serif" }}>Last Name</label>
                    <input
                      type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                      placeholder="Smith" required
                      className="w-full px-4 py-2.5 rounded-xl text-gray-800 text-sm focus:outline-none transition-all"
                      style={{ border: '1px solid #FED7AA', background: '#FFFDF7', fontFamily: "'Nunito', sans-serif" }}
                      onFocus={(e) => (e.target.style.boxShadow = FOCUS_RING)}
                      onBlur={(e) => (e.target.style.boxShadow = '')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#92400E', fontFamily: "'Nunito', sans-serif" }}>Phone Number</label>
                  <input
                    type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="(215) 555-1234" required
                    className="w-full px-4 py-2.5 rounded-xl text-gray-800 text-sm focus:outline-none transition-all"
                    style={{ border: '1px solid #FED7AA', background: '#FFFDF7', fontFamily: "'Nunito', sans-serif" }}
                    onFocus={(e) => (e.target.style.boxShadow = FOCUS_RING)}
                    onBlur={(e) => (e.target.style.boxShadow = '')}
                  />
                  <p className="text-xs mt-1" style={{ color: '#92400E', opacity: 0.7, fontFamily: "'Nunito', sans-serif" }}>
                    Shared with meal partners so you can coordinate.
                  </p>
                </div>
              </div>

              <button type="submit"
                disabled={loading || !firstName.trim() || !lastName.trim() || !phoneNumber.trim()}
                className="mt-5 w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                style={{ background: '#F97316', fontFamily: "'Fredoka One', cursive", fontSize: '16px', letterSpacing: '0.02em' }}>
                {loading && <span className="spinner" />}
                {loading ? 'Saving…' : isLegacy ? 'Save & Sign In →' : 'Create Account & Sign In →'}
              </button>
              <button type="button"
                onClick={() => { setStep('email'); setError('') }}
                className="mt-3 w-full py-2 text-sm transition-colors cursor-pointer"
                style={{ color: '#92400E', fontFamily: "'Nunito', sans-serif" }}>
                ← Use a different email
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,253,247,0.35)', fontFamily: "'Nunito', sans-serif" }}>
          © 2026 Starving @ Penn · University of Pennsylvania
        </p>
      </div>
    </main>
  )
}
