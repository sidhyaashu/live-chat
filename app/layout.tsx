import type { Metadata } from 'next'
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import './globals.css'
import { ConvexClientProvider } from '@/components/providers/ConvexClientProvider'
import { UserSync } from '@/components/providers/UserSync'
import { Zap } from 'lucide-react'

const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'LiveChat — Real-time Messaging',
  description: 'Real-time messaging with groups, reactions, and more',
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
          <header className="glass sticky top-0 z-50 flex justify-between items-center px-5 h-16 border-b border-border/60 shadow-sm">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="font-extrabold text-lg gradient-text tracking-tight">LiveChat</span>
            </div>

            {/* Auth buttons */}
            <div className="flex items-center gap-3">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-accent">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-full px-5 py-2 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
                    Get Started
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </header>
          <main>{children}</main>
        </ConvexClientProvider>
      </body>
    </html>
  )
}