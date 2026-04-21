import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'Starving @ Penn',
  description: 'Connecting UPenn students — share or join a dining swipe',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col" style={{ fontFamily: "'Nunito', sans-serif" }}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "'Nunito', sans-serif",
              fontSize: '14px',
              borderRadius: '12px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            },
            success: {
              iconTheme: { primary: '#F97316', secondary: 'white' },
            },
            error: {
              iconTheme: { primary: '#DC2626', secondary: 'white' },
            },
          }}
        />
      </body>
    </html>
  )
}
