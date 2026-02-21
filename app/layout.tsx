import type { Metadata } from 'next'
import {
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import './globals.css'
import { ConvexClientProvider } from '@/components/providers/ConvexClientProvider'
import { UserSync } from '@/components/providers/UserSync'
import { GitMerge } from 'lucide-react'

const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'LiveChat — Real-time Messaging',
  description: 'Real-time messaging built on Convex, Next.js and Clerk',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased font-sans`}>
        <ConvexClientProvider>
          <UserSync />
          {/*
            The header is ONLY shown to signed-in users (app shell).
            The landing page gets zero navbar — it renders its own full-screen layout.
          */}
          <SignedIn>
            <header className="sticky top-0 z-50 h-14 flex items-center justify-between px-4 border-b border-border bg-card">
              {/* Brand mark */}
              <div className="flex items-center gap-2 select-none">
                <div className="h-7 w-7 rounded-md bg-foreground flex items-center justify-center">
                  <GitMerge className="h-4 w-4 text-background" />
                </div>
                <span className="font-semibold text-sm gh-title">LiveChat</span>
              </div>
              <UserButton afterSignOutUrl="/" />
            </header>
          </SignedIn>

          <main className="h-[calc(100vh-56px)]">
            <SignedIn>
              {children}
            </SignedIn>
            <SignedOut>
              {/* Landing page gets the full 100vh */}
              <div className="h-screen overflow-y-auto">
                {children}
              </div>
            </SignedOut>
          </main>
        </ConvexClientProvider>
      </body>
    </html>
  )
}