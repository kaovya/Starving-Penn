import { getSession } from '@/lib/auth'
import Link from 'next/link'

export default async function HomePage() {
  const session = await getSession()

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-4 py-12">
      {/* Greeting */}
      <div className="text-center mb-10 animate-fade-in">
        <div className="text-6xl mb-3">🍽️</div>
        <h1
          className="text-4xl sm:text-5xl font-bold mb-3"
          style={{ fontFamily: "'Fredoka One', cursive", color: '#B91C1C' }}
        >
          Welcome{session?.firstName ? `, ${session.firstName}` : ''}!
        </h1>
        <p className="text-lg max-w-sm mx-auto" style={{ color: '#92400E', fontFamily: "'Nunito', sans-serif" }}>
          What would you like to do today?
        </p>
      </div>

      {/* Two big buttons */}
      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl animate-fade-in">
        {/* Share Swipes */}
        <Link
          href="/share-swipes"
          className="flex-1 group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] cursor-pointer"
          style={{ background: '#F97316' }}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'linear-gradient(135deg, #ea6510, #F97316)' }} />
          <div className="relative p-8 sm:p-10 text-center">
            <div className="text-5xl mb-4">🎓</div>
            <h2
              className="text-2xl sm:text-3xl font-bold text-white mb-2"
              style={{ fontFamily: "'Fredoka One', cursive" }}
            >
              Share Swipes
            </h2>
            <p className="text-sm font-semibold tracking-wide uppercase" style={{ color: 'rgba(255,255,255,0.8)', fontFamily: "'Nunito', sans-serif" }}>
              For Underclassmen
            </p>
            <p className="text-sm mt-3 leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: "'Nunito', sans-serif" }}>
              Post your extra dining swipes and help a fellow Penn student.
            </p>
            <div className="mt-6 inline-flex items-center gap-1 text-white/80 text-sm font-bold group-hover:gap-2 transition-all"
              style={{ fontFamily: "'Fredoka One', cursive", fontSize: '16px' }}>
              Get started <span className="text-lg">→</span>
            </div>
          </div>
        </Link>

        {/* Join a Meal */}
        <Link
          href="/join-meal"
          className="flex-1 group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] cursor-pointer"
          style={{ background: '#B91C1C' }}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'linear-gradient(135deg, #7f1d1d, #B91C1C)' }} />
          <div className="relative p-8 sm:p-10 text-center">
            <div className="text-5xl mb-4">🍴</div>
            <h2
              className="text-2xl sm:text-3xl font-bold text-white mb-2"
              style={{ fontFamily: "'Fredoka One', cursive" }}
            >
              Join a Meal
            </h2>
            <p className="text-sm font-semibold tracking-wide uppercase" style={{ color: 'rgba(255,253,247,0.8)', fontFamily: "'Nunito', sans-serif" }}>
              For Upperclassmen
            </p>
            <p className="text-sm mt-3 leading-relaxed" style={{ color: 'rgba(255,253,247,0.6)', fontFamily: "'Nunito', sans-serif" }}>
              Browse available swipes and join a dining session near you.
            </p>
            <div className="mt-6 inline-flex items-center gap-1 text-white/80 text-sm font-bold group-hover:gap-2 transition-all"
              style={{ fontFamily: "'Fredoka One', cursive", fontSize: '16px' }}>
              Browse meals <span className="text-lg">→</span>
            </div>
          </div>
        </Link>
      </div>

      {/* WHO WE ARE link */}
      <div className="mt-8 animate-fade-in">
        <Link
          href="/who-we-are"
          className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-80"
          style={{ background: 'rgba(185,28,28,0.08)', color: '#B91C1C', fontFamily: "'Nunito', sans-serif" }}
        >
          Who We Are →
        </Link>
      </div>
    </div>
  )
}
