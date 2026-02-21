import type { Metadata } from 'next'
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ConvexClientProvider } from '@/components/providers/ConvexClientProvider'
import { UserSync } from '@/components/providers/UserSync'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Live Chat',
  description: 'Real-time messaging app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ConvexClientProvider>
          <UserSync />
          <header className="flex justify-end items-center p-4 gap-4 h-16 border-b">
            <SignedOut>
              <SignInButton mode="modal" />
              <SignUpButton mode="modal">
                <button className="bg-primary text-primary-foreground rounded-full font-medium text-sm sm:text-base h-10 px-4 cursor-pointer">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </header>
          <main>{children}</main>
        </ConvexClientProvider>
      </body>
    </html>
  )
}