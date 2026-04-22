'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Stats {
  swipesSaved: number
  users: number
  events: number
}

export default function WhoWeArePage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {})
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Back */}
      <Link
        href="/home"
        className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors mb-8"
        style={{ color: '#92400E', fontFamily: "'Nunito', sans-serif" }}
      >
        <ArrowLeft size={15} />
        Back to home
      </Link>

      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1
          className="text-4xl font-bold mb-3"
          style={{ fontFamily: "'Fredoka One', cursive", color: '#B91C1C' }}
        >
          Who We Are
        </h1>
        <div className="h-1 w-16 rounded-full" style={{ background: '#F97316' }} />
      </div>

      {/* Body text */}
      <div className="space-y-5 leading-relaxed animate-fade-in text-[15px]" style={{ color: '#B91C1C', fontFamily: "'Nunito', sans-serif" }}>
        <p>
          <strong>Starving @ Penn</strong> is an initiative started on UPenn&apos;s campus. Every semester, underclassmen on the mandatory meal plans end up with <em>hundreds</em> of unused meal swipes and dining dollars that go to waste. We wanted to find a sustainable solution to this problem.
        </p>
        <p>
          Underclassmen can post open meal invites on the <em>&lsquo;Share Swipes&rsquo;</em> page, sharing their extra swipes with upperclassmen who aren&apos;t on the meal plan. Upperclassmen can browse open invites on the <strong>&lsquo;Join a Meal&rsquo;</strong> page, claim a spot, and show up.
        </p>
        <p>
          Once you join an event as an upperclassmen, you can see the underclassmen&apos;s number and coordinate with them. If you&apos;re an underclassmen who posted an invite, you can see the upperclassmen who joined and their numbers on the <em>&lsquo;Share Swipes&rsquo;</em> page.
        </p>
        <p>
          We created this app as a way to not only try and solve this problem, but also to strengthen the Penn community and help students find ways to broaden their circles. Our platform is built entirely by students, for students. Penn is full of so many inspiring, accomplished, and passionate student leaders that meeting someone new here can be the thing that <em>changes your life</em>. So give us a chance and grab a meal with a stranger!
        </p>
      </div>

      {/* Impact stats */}
      <div className="mt-12 animate-fade-in">
        <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: '#92400E', fontFamily: "'Nunito', sans-serif" }}>
          Our Impact
        </p>
        <div className="grid grid-cols-3 gap-4">
          <StatCard value={stats?.swipesSaved ?? null} label="Swipes Saved" />
          <StatCard value={stats?.users ?? null} label="Users" />
          <StatCard value={stats?.events ?? null} label="Events" />
        </div>
      </div>

    </div>
  )
}

function StatCard({ value, label }: { value: number | null; label: string }) {
  return (
    <div
      className="rounded-2xl p-5 text-center shadow-sm border"
      style={{ background: '#FFFBF0', borderColor: '#FED7AA' }}
    >
      <p
        className="text-3xl font-bold mb-1 tabular-nums"
        style={{ fontFamily: "'Fredoka One', cursive", color: '#16A34A' }}
      >
        {value === null ? (
          <span className="inline-block w-10 h-8 bg-gray-200 rounded animate-pulse" />
        ) : (
          value.toLocaleString()
        )}
      </p>
      <p className="text-xs font-bold" style={{ color: '#92400E', fontFamily: "'Nunito', sans-serif" }}>{label}</p>
    </div>
  )
}
