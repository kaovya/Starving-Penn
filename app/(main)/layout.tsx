import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/')

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8f9fc' }}>
      <Navbar firstName={session.firstName} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
