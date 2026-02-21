'use client';

import { ChatLayout } from "@/components/chat/ChatLayout";
import { MobileConversationList } from "@/components/chat/MobileConversationList";
import { MessageSquare, Zap, Users, Smile, Image, ShieldCheck, ArrowRight } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";

const features = [
  { icon: Zap, label: "Real-time", desc: "Instant delivery, zero delay", color: "from-yellow-400 to-orange-500" },
  { icon: Users, label: "Groups", desc: "Chat with up to hundreds", color: "from-blue-400 to-indigo-500" },
  { icon: Smile, label: "Reactions", desc: "Express yourself with emoji", color: "from-pink-400 to-rose-500" },
  { icon: Image, label: "Media", desc: "Share images seamlessly", color: "from-emerald-400 to-teal-500" },
  { icon: ShieldCheck, label: "Secure", desc: "End-to-end protected", color: "from-violet-400 to-purple-600" },
];

const bubbles = [
  { from: "Hey! Are you free later? 🎉", align: "left", top: "15%", delay: "0s" },
  { from: "Sure! What did you have in mind?", align: "right", top: "28%", delay: "0.4s" },
  { from: "Let's catch up over video 🎥", align: "left", top: "41%", delay: "0.8s" },
  { from: "Sounds amazing, see you then! 👋", align: "right", top: "54%", delay: "1.2s" },
];

export default function Home() {
  return (
    <>
      <SignedIn>
        <ChatLayout>
          {/* Desktop: empty state prompt */}
          <div className="hidden md:flex flex-1 flex-col items-center justify-center p-4 text-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-150" />
              <div className="relative bg-gradient-to-br from-violet-500 to-indigo-600 p-6 rounded-3xl shadow-xl">
                <MessageSquare className="h-12 w-12 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Your Messages</h2>
              <p className="text-muted-foreground max-w-sm text-sm">
                Select a conversation from the sidebar or search for people to start chatting.
              </p>
            </div>
          </div>
          {/* Mobile: show conversation list inline */}
          <MobileConversationList />
        </ChatLayout>
      </SignedIn>

      <SignedOut>
        <div className="min-h-[calc(100vh-64px)] overflow-hidden relative">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-indigo-50 to-sky-50 dark:from-zinc-950 dark:via-violet-950/20 dark:to-zinc-950" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-400/10 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 flex flex-col items-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border border-violet-200 dark:border-violet-800 rounded-full px-4 py-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300 mb-8 shadow-sm">
              <Zap className="h-3.5 w-3.5 fill-current" />
              Powered by Convex real-time
            </div>

            {/* Hero heading */}
            <h1 className="text-5xl md:text-7xl font-extrabold text-center leading-[1.1] mb-6 tracking-tight max-w-4xl">
              Chat that feels{" "}
              <span className="gradient-text">alive</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl text-center max-w-2xl mb-10 leading-relaxed">
              Real-time messaging with groups, reactions, image sharing, message requests, and link previews — all in a beautiful, fast interface.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 mb-20">
              <SignUpButton mode="modal">
                <button className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-2xl px-8 py-4 shadow-lg hover:shadow-violet-300/40 dark:hover:shadow-violet-900/40 hover:shadow-xl transition-all duration-300 hover:scale-105 text-base">
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="flex items-center gap-2 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border border-border hover:border-primary/50 text-foreground font-semibold rounded-2xl px-8 py-4 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 text-base">
                  Sign in
                </button>
              </SignInButton>
            </div>

            {/* Floating chat bubbles mockup */}
            <div className="relative w-full max-w-lg h-72 mb-20 hidden sm:block">
              <div className="absolute inset-0 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md rounded-3xl border border-white/80 dark:border-zinc-700/60 shadow-2xl overflow-hidden">
                {/* Mock header */}
                <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-white/50 dark:bg-zinc-800/50">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600" />
                  <div>
                    <div className="text-sm font-semibold">Dev Team ✨</div>
                    <div className="text-[10px] text-muted-foreground">3 members · 2 online</div>
                  </div>
                </div>
                {/* Mock messages */}
                {bubbles.map((b, i) => (
                  <div
                    key={i}
                    className={`flex px-4 py-1 ${b.align === 'right' ? 'justify-end' : ''}`}
                    style={{ animation: `fadeInUp 0.5s ease ${b.delay} both` }}
                  >
                    <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-sm ${b.align === 'right'
                      ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-br-sm'
                      : 'bg-white dark:bg-zinc-800 border rounded-bl-sm text-foreground'}`}
                    >
                      {b.from}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 w-full max-w-4xl mb-16">
              {features.map(({ icon: Icon, label, desc, color }) => (
                <div
                  key={label}
                  className="group bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm border border-white/80 dark:border-zinc-700/60 rounded-2xl p-4 flex flex-col items-center gap-3 text-center shadow-sm hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 cursor-default"
                >
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{label}</div>
                    <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer note */}
            <p className="text-xs text-muted-foreground/60 text-center">
              Built with Next.js · Convex · Clerk · TypeScript
            </p>
          </div>
        </div>

        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </SignedOut>
    </>
  );
}
