'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface NavbarProps {
  firstName?: string
}

export default function Navbar({ firstName }: NavbarProps) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
      router.refresh()
    } catch {
      toast.error('Logout failed. Please try again.')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <nav
      className="sticky top-0 z-40 w-full shadow-sm"
      style={{ background: '#991B1B' }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={() => router.push('/home')}
          className="group cursor-pointer flex items-center gap-2"
        >
          <span className="text-2xl leading-none">🍽️</span>
          <span
            className="text-white text-sm sm:text-base tracking-wide group-hover:opacity-80 transition-opacity"
            style={{ fontFamily: "'Fredoka One', cursive" }}
          >
            Still Hungry
          </span>
        </button>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {firstName && (
            <span className="hidden sm:block text-sm" style={{ color: 'rgba(255,253,247,0.75)', fontFamily: "'Nunito', sans-serif" }}>
              Hey, <span className="font-semibold text-white">{firstName}</span>!
            </span>
          )}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-60 cursor-pointer active:scale-95 text-white"
            style={{ background: '#F97316', fontFamily: "'Nunito', sans-serif" }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.background = '#ea6510')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.background = '#F97316')}
          >
            {loggingOut ? 'Logging out…' : 'Log Out'}
          </button>
        </div>
      </div>
    </nav>
  )
}
