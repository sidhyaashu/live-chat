'use client';

import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { MobileConversationList } from "@/components/chat/MobileConversationList";
import { useState, useEffect, useRef } from "react";
import { MessageSquare, ArrowRight, Check, Star, Zap, Shield, Globe, Heart, ChevronDown, Menu, X } from "lucide-react";

/* ─── Data ──────────────────────────────────────────────────────────────────── */
const features = [
  { icon: Zap, title: "Instant messages", desc: "Your words arrive the moment you hit send. No delays, no refreshing — just real conversation." },
  { icon: Globe, title: "Group chats", desc: "Bring your family, friends, or team together in one place. Create a group in seconds." },
  { icon: Heart, title: "React & express", desc: "Sometimes a ❤️ says it all. React to any message with a single tap." },
  { icon: Shield, title: "Your privacy first", desc: "Control who can message you. Accept or decline requests from strangers." },
];

const steps = [
  { num: "01", title: "Create your free account", desc: "Sign up in under a minute. No credit card, no complicated forms — just your email and you're in." },
  { num: "02", title: "Find your people", desc: "Search for friends or family by name. Send a message request and start chatting once they accept." },
  { num: "03", title: "Start the conversation", desc: "Send texts, share photos, react to messages, and create group chats — all in one beautiful app." },
];

const testimonials = [
  { name: "Sarah M.", role: "Stay-at-home mom", text: "I use LiveChat every day to stay connected with my family across the country. It's so simple!", stars: 5 },
  { name: "James T.", role: "Small business owner", text: "Replaced three different apps with just this one. My team loves how fast everything is.", stars: 5 },
  { name: "Priya K.", role: "College student", text: "The group chats are perfect for my study groups. Easy to use and no nonsense.", stars: 5 },
];

const demoMessages = [
  { me: false, text: "Hey! Are you coming to dinner tonight? 🍝", time: "6:42 PM" },
  { me: true, text: "Yes! What time should I arrive?", time: "6:43 PM" },
  { me: false, text: "Around 7:30 works great!", time: "6:43 PM" },
  { me: true, text: "Perfect, see you then! 🎉", time: "6:44 PM" },
];

/* ─── Component ─────────────────────────────────────────────────────────────── */
export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [visibleMessages, setVisibleMessages] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);

  /* Nav scroll state */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Stagger chat messages when widget enters viewport */
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let i = 1;
        interval = setInterval(() => {
          setVisibleMessages(i);
          i++;
          if (i > demoMessages.length) clearInterval(interval);
        }, 600);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    if (chatRef.current) observer.observe(chatRef.current);
    return () => { observer.disconnect(); clearInterval(interval); };
  }, []);

  /* Smooth-scroll for anchor links */
  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* ── Authenticated shell ──────────────────────────────────────────── */}
      <SignedIn>
        <ChatLayout>
          <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="h-14 w-14 rounded-full border-2 border-foreground/20 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-base mb-1 text-foreground">Select a conversation</h2>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Choose from the sidebar or search for someone to start chatting.
              </p>
            </div>
          </div>
          <MobileConversationList />
        </ChatLayout>
      </SignedIn>

      {/* ── Landing page ────────────────────────────────────────────────── */}
      <SignedOut>
        <div className="lp-root">

          {/* ─ Styles ──────────────────────────────────────────────────── */}
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

            html { scroll-behavior: smooth; }

            .lp-root {
              min-height: 100vh;
              background: #fff;
              color: #111;
              font-family: 'DM Sans', system-ui, sans-serif;
              -webkit-font-smoothing: antialiased;
            }

            /* ── Typography ── */
            .lp-display { font-family: 'Playfair Display', Georgia, serif; }
            .lp-body    { font-family: 'DM Sans', system-ui, sans-serif; }

            /* ── Section shell ── */
            .lp-section {
              padding: 96px 24px;
            }
            .lp-inner {
              max-width: 1100px;
              margin: 0 auto;
            }

            /* ── Section label ── */
            .lp-label {
              display: inline-block;
              font-family: 'DM Sans', system-ui, sans-serif;
              font-size: 11px;
              font-weight: 500;
              letter-spacing: 0.13em;
              text-transform: uppercase;
              color: #888;
              margin-bottom: 16px;
            }

            /* ── Divider ── */
            .lp-divider { height: 1px; background: #ebebeb; }

            /* ── Buttons ── */
            .lp-btn {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 13px 28px;
              font-family: 'DM Sans', system-ui, sans-serif;
              font-size: 15px;
              font-weight: 500;
              letter-spacing: 0.01em;
              border-radius: 6px;
              cursor: pointer;
              transition: all 0.2s ease;
              white-space: nowrap;
              border: 2px solid transparent;
            }
            .lp-btn-primary {
              background: #111;
              color: #fff;
              border-color: #111;
            }
            .lp-btn-primary:hover {
              background: #333;
              border-color: #333;
              transform: translateY(-1px);
              box-shadow: 0 8px 24px rgba(0,0,0,0.14);
            }
            .lp-btn-outline {
              background: transparent;
              color: #111;
              border-color: #d4d4d4;
            }
            .lp-btn-outline:hover {
              border-color: #111;
              background: #f9f9f9;
            }
            .lp-btn-ghost {
              background: transparent;
              color: #555;
              border-color: transparent;
              padding: 10px 16px;
              font-size: 14px;
            }
            .lp-btn-ghost:hover { color: #111; }

            /* ── Navbar ── */
            .lp-nav {
              position: fixed;
              top: 0; left: 0; right: 0;
              z-index: 100;
              padding: 0 24px;
              transition: background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
            }
            .lp-nav.scrolled {
              background: rgba(255,255,255,0.92);
              border-bottom: 1px solid #ebebeb;
              backdrop-filter: blur(14px);
              -webkit-backdrop-filter: blur(14px);
              box-shadow: 0 1px 0 #ebebeb;
            }
            .lp-nav-inner {
              max-width: 1100px;
              margin: 0 auto;
              height: 68px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 24px;
            }
            .lp-logo {
              display: flex;
              align-items: center;
              gap: 10px;
              text-decoration: none;
            }
            .lp-logo-icon {
              width: 34px; height: 34px;
              background: #111;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
            .lp-logo-name {
              font-family: 'Playfair Display', Georgia, serif;
              font-size: 19px;
              font-weight: 600;
              color: #111;
              letter-spacing: -0.01em;
            }
            .lp-nav-links {
              display: flex;
              align-items: center;
              gap: 32px;
            }
            .lp-nav-link {
              font-family: 'DM Sans', system-ui, sans-serif;
              font-size: 14px;
              color: #555;
              background: none;
              border: none;
              padding: 4px 0;
              cursor: pointer;
              transition: color 0.15s;
              text-decoration: none;
            }
            .lp-nav-link:hover { color: #111; }
            .lp-nav-auth { display: flex; align-items: center; gap: 8px; }
            .lp-hamburger {
              display: none;
              background: none;
              border: none;
              padding: 6px;
              cursor: pointer;
              color: #111;
            }

            /* ── Mobile drawer ── */
            .lp-mobile-menu {
              display: none;
              position: fixed;
              inset: 0;
              z-index: 200;
              background: #fff;
              flex-direction: column;
              padding: 24px;
            }
            .lp-mobile-menu.open { display: flex; }
            .lp-mobile-nav-top {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 40px;
            }
            .lp-mobile-links {
              display: flex;
              flex-direction: column;
              gap: 28px;
              margin-bottom: 48px;
            }
            .lp-mobile-link {
              font-family: 'Playfair Display', Georgia, serif;
              font-size: 2rem;
              font-weight: 600;
              color: #111;
              background: none;
              border: none;
              text-align: left;
              cursor: pointer;
              letter-spacing: -0.01em;
            }
            .lp-mobile-auth {
              display: flex;
              flex-direction: column;
              gap: 12px;
            }
            .lp-mobile-auth .lp-btn {
              width: 100%;
              justify-content: center;
            }

            /* ── Hero ── */
            .lp-hero {
              padding-top: 136px;
              padding-bottom: 80px;
              padding-left: 24px;
              padding-right: 24px;
            }
            .lp-hero-grid {
              max-width: 1100px;
              margin: 0 auto;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 72px;
              align-items: center;
            }
            .lp-hero h1 {
              font-family: 'Playfair Display', Georgia, serif;
              font-size: clamp(2.6rem, 5vw, 4rem);
              font-weight: 700;
              line-height: 1.08;
              letter-spacing: -0.025em;
              margin: 0 0 24px 0;
              color: #111;
            }
            .lp-hero h1 em { font-style: italic; font-weight: 400; }
            .lp-hero-sub {
              font-size: clamp(16px, 2vw, 18px);
              color: #555;
              line-height: 1.75;
              margin: 0 0 36px 0;
              max-width: 440px;
            }
            .lp-hero-btns {
              display: flex;
              gap: 12px;
              flex-wrap: wrap;
              margin-bottom: 32px;
            }
            .lp-trust {
              display: flex;
              flex-wrap: wrap;
              gap: 20px;
            }
            .lp-trust-item {
              display: flex;
              align-items: center;
              gap: 7px;
              font-size: 13px;
              color: #888;
            }

            /* ── Chat mockup ── */
            .lp-chat-card {
              border-radius: 16px;
              border: 1px solid #e8e8e8;
              overflow: hidden;
              box-shadow: 0 24px 64px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04);
              background: #fff;
            }
            .lp-chat-header {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 16px 20px;
              border-bottom: 1px solid #f2f2f2;
              background: #fafafa;
            }
            .lp-chat-avatar {
              width: 40px; height: 40px;
              border-radius: 50%;
              background: #111;
              display: flex; align-items: center; justify-content: center;
              color: #fff; font-weight: 700; font-size: 15px;
              flex-shrink: 0;
            }
            .lp-chat-messages {
              padding: 20px 16px;
              display: flex;
              flex-direction: column;
              gap: 10px;
              min-height: 200px;
              background: #fff;
            }
            .lp-msg-row { display: flex; }
            .lp-msg-row.right { justify-content: flex-end; }
            .lp-bubble {
              max-width: 76%;
              padding: 10px 15px;
              font-size: 14px;
              line-height: 1.5;
              border-radius: 18px;
            }
            .lp-bubble.them { background: #f4f4f4; color: #111; border-radius: 18px 18px 18px 4px; }
            .lp-bubble.me   { background: #111;    color: #fff; border-radius: 18px 18px 4px 18px; }
            .lp-bubble-time { font-size: 10px; margin-top: 4px; opacity: 0.45; text-align: right; }
            .lp-typing {
              display: flex;
              padding: 10px 16px;
              border-radius: 18px 18px 18px 4px;
              background: #f4f4f4;
              gap: 4px;
              align-items: center;
              width: fit-content;
            }
            .lp-dot {
              width: 6px; height: 6px;
              border-radius: 50%;
              background: #bbb;
              animation: lp-bounce 1.2s ease infinite;
            }
            .lp-dot:nth-child(2) { animation-delay: 0.2s; }
            .lp-dot:nth-child(3) { animation-delay: 0.4s; }
            @keyframes lp-bounce {
              0%, 60%, 100% { transform: translateY(0); }
              30%            { transform: translateY(-6px); }
            }
            .lp-chat-input {
              display: flex;
              gap: 8px;
              padding: 12px 16px;
              border-top: 1px solid #f2f2f2;
              background: #fafafa;
              align-items: center;
            }
            .lp-chat-input-field {
              flex: 1;
              background: #fff;
              border: 1px solid #e8e8e8;
              border-radius: 24px;
              padding: 8px 16px;
              font-size: 13px;
              color: #bbb;
              font-family: 'DM Sans', system-ui, sans-serif;
            }
            .lp-send-btn {
              width: 38px; height: 38px;
              border-radius: 50%;
              background: #111;
              border: none;
              display: flex; align-items: center; justify-content: center;
              cursor: pointer;
              flex-shrink: 0;
              transition: background 0.15s;
            }
            .lp-send-btn:hover { background: #333; }

            /* ── Scroll hint ── */
            .lp-scroll-hint {
              display: flex;
              justify-content: center;
              padding-bottom: 64px;
            }
            .lp-scroll-inner {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 6px;
              opacity: 0.35;
            }
            .lp-scroll-label {
              font-size: 11px;
              letter-spacing: 0.1em;
              text-transform: uppercase;
            }
            @keyframes lp-bob {
              0%, 100% { transform: translateY(0); }
              50%       { transform: translateY(4px); }
            }
            .lp-scroll-icon { animation: lp-bob 1.8s ease infinite; }

            /* ── How it works ── */
            .lp-steps-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              border-top: 1px solid #ebebeb;
              border-left: 1px solid #ebebeb;
            }
            .lp-step {
              padding: 52px 40px;
              border-right: 1px solid #ebebeb;
              border-bottom: 1px solid #ebebeb;
              transition: background 0.2s;
            }
            .lp-step:hover { background: #fafafa; }
            .lp-step-num {
              font-family: 'Playfair Display', Georgia, serif;
              font-size: 4.5rem;
              font-weight: 700;
              color: #ebebeb;
              line-height: 1;
              margin-bottom: 20px;
              user-select: none;
            }
            .lp-step h3 {
              font-family: 'Playfair Display', Georgia, serif;
              font-size: 1.2rem;
              font-weight: 600;
              margin: 0 0 12px 0;
              color: #111;
            }
            .lp-step p { font-size: 15px; color: #666; line-height: 1.75; margin: 0; }

            /* ── Features ── */
            .lp-features-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 1px;
              background: #ebebeb;
              border: 1px solid #ebebeb;
            }
            .lp-feat {
              background: #fff;
              padding: 44px 40px;
              position: relative;
              overflow: hidden;
              transition: background 0.25s ease;
              cursor: default;
            }
            .lp-feat::after {
              content: '';
              position: absolute;
              inset: 0;
              background: #111;
              transform: scaleY(0);
              transform-origin: bottom;
              transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
              z-index: 0;
            }
            .lp-feat:hover::after { transform: scaleY(1); }
            .lp-feat-content { position: relative; z-index: 1; transition: color 0.25s; }
            .lp-feat:hover .lp-feat-content { color: #fff; }
            .lp-feat-icon {
              width: 48px; height: 48px;
              border-radius: 10px;
              background: #f5f5f5;
              border: 1px solid #e8e8e8;
              display: flex; align-items: center; justify-content: center;
              margin-bottom: 24px;
              transition: background 0.25s, border-color 0.25s;
            }
            .lp-feat:hover .lp-feat-icon {
              background: rgba(255,255,255,0.15);
              border-color: rgba(255,255,255,0.25);
            }
            .lp-feat-title {
              font-family: 'Playfair Display', Georgia, serif;
              font-size: 1.15rem;
              font-weight: 600;
              margin: 0 0 10px 0;
              color: inherit;
            }
            .lp-feat-desc { font-size: 15px; color: #666; line-height: 1.75; margin: 0; transition: color 0.25s; }
            .lp-feat:hover .lp-feat-desc { color: rgba(255,255,255,0.7); }

            /* ── Testimonials ── */
            .lp-testi-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 24px;
            }
            .lp-testi-card {
              border: 1px solid #e8e8e8;
              padding: 32px;
              border-radius: 6px;
              background: #fff;
              transition: box-shadow 0.2s, transform 0.2s;
            }
            .lp-testi-card:hover {
              box-shadow: 0 8px 32px rgba(0,0,0,0.07);
              transform: translateY(-2px);
            }
            .lp-stars { display: flex; gap: 3px; margin-bottom: 20px; }
            .lp-testi-quote {
              font-size: 15px;
              line-height: 1.8;
              color: #333;
              font-style: italic;
              margin: 0 0 24px 0;
            }
            .lp-testi-author { display: flex; align-items: center; gap: 12px; }
            .lp-testi-avatar {
              width: 38px; height: 38px;
              border-radius: 50%;
              background: #111;
              display: flex; align-items: center; justify-content: center;
              color: #fff; font-weight: 700; font-size: 13px;
              flex-shrink: 0;
            }

            /* ── CTA ── */
            .lp-cta-section { padding: 120px 24px; }
            .lp-cta-inner {
              max-width: 620px;
              margin: 0 auto;
              text-align: center;
            }
            .lp-cta-inner h2 {
              font-family: 'Playfair Display', Georgia, serif;
              font-size: clamp(2.2rem, 5vw, 3.2rem);
              font-weight: 700;
              line-height: 1.1;
              margin: 0 0 20px 0;
              letter-spacing: -0.02em;
            }
            .lp-cta-inner h2 em { font-style: italic; font-weight: 400; }
            .lp-cta-sub { font-size: 17px; color: #666; margin: 0 0 48px 0; line-height: 1.75; }

            /* ── Footer ── */
            .lp-footer {
              border-top: 1px solid #ebebeb;
              padding: 40px 24px;
            }
            .lp-footer-inner {
              max-width: 1100px;
              margin: 0 auto;
              display: flex;
              align-items: center;
              justify-content: space-between;
              flex-wrap: wrap;
              gap: 20px;
            }
            .lp-footer-links { display: flex; gap: 24px; }
            .lp-footer-link {
              font-size: 13px;
              color: #888;
              text-decoration: none;
              transition: color 0.15s;
            }
            .lp-footer-link:hover { color: #111; }

            /* ── Entrance animations ── */
            @keyframes lp-fadeUp {
              from { opacity: 0; transform: translateY(20px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes lp-slideIn {
              from { opacity: 0; transform: translateX(-10px); }
              to   { opacity: 1; transform: translateX(0); }
            }
            .lp-anim-1 { animation: lp-fadeUp 0.8s ease both; }
            .lp-anim-2 { animation: lp-fadeUp 0.8s ease 0.12s both; }
            .lp-anim-3 { animation: lp-fadeUp 0.8s ease 0.24s both; }
            .lp-anim-4 { animation: lp-fadeUp 0.8s ease 0.36s both; }
            .lp-msg-in { animation: lp-slideIn 0.35s ease both; }

            /* ── Responsive ── */
            @media (max-width: 900px) {
              .lp-hero-grid { grid-template-columns: 1fr; gap: 48px; }
              .lp-chat-card { max-width: 420px; }
              .lp-steps-grid { grid-template-columns: 1fr; }
              .lp-step { border-right: 1px solid #ebebeb; }
              .lp-features-grid { grid-template-columns: 1fr; }
              .lp-testi-grid { grid-template-columns: 1fr; }
              .lp-nav-links { display: none; }
              .lp-hamburger { display: block; }
              .lp-nav-auth .lp-btn-outline { display: none; }
              .lp-section { padding: 64px 20px; }
              .lp-hero { padding-top: 100px; padding-bottom: 56px; padding-left: 20px; padding-right: 20px; }
              .lp-step { padding: 36px 24px; }
              .lp-feat { padding: 36px 28px; }
              .lp-cta-section { padding: 80px 20px; }
            }

            @media (max-width: 640px) {
              .lp-hero-btns { flex-direction: column; }
              .lp-hero-btns .lp-btn { width: 100%; justify-content: center; }
              .lp-testi-grid { gap: 16px; }
              .lp-footer-inner { flex-direction: column; align-items: flex-start; }
              .lp-trust { gap: 14px; }
            }
          `}</style>

          {/* ─ Mobile drawer ─────────────────────────────────────────────────── */}
          <div className={`lp-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
            <div className="lp-mobile-nav-top">
              <div className="lp-logo">
                <div className="lp-logo-icon"><MessageSquare size={16} color="#fff" /></div>
                <span className="lp-logo-name">LiveChat</span>
              </div>
              <button className="lp-hamburger" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                <X size={22} />
              </button>
            </div>
            <div className="lp-mobile-links">
              {[["features", "Features"], ["how", "How it works"], ["testimonials", "Reviews"]].map(([id, label]) => (
                <button key={id} className="lp-mobile-link" onClick={() => scrollTo(id)}>{label}</button>
              ))}
            </div>
            <div className="lp-mobile-auth">
              <SignInButton mode="modal">
                <button className="lp-btn lp-btn-outline" onClick={() => setMobileMenuOpen(false)}>Sign in</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="lp-btn lp-btn-primary" onClick={() => setMobileMenuOpen(false)}>Get started free</button>
              </SignUpButton>
            </div>
          </div>

          {/* ─ Navbar ────────────────────────────────────────────────────────── */}
          <nav className={`lp-nav ${scrolled ? 'scrolled' : ''}`} aria-label="Main navigation">
            <div className="lp-nav-inner">
              <div className="lp-logo">
                <div className="lp-logo-icon"><MessageSquare size={16} color="#fff" /></div>
                <span className="lp-logo-name">LiveChat</span>
              </div>

              <div className="lp-nav-links">
                {[["features", "Features"], ["how", "How it works"], ["testimonials", "Reviews"]].map(([id, label]) => (
                  <button key={id} className="lp-nav-link" onClick={() => scrollTo(id)}>{label}</button>
                ))}
              </div>

              <div className="lp-nav-auth">
                <SignInButton mode="modal">
                  <button className="lp-btn lp-btn-ghost">Sign in</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="lp-btn lp-btn-primary" style={{ padding: "10px 20px", fontSize: 14 }}>
                    Get started
                  </button>
                </SignUpButton>
                <button className="lp-hamburger" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
                  <Menu size={22} />
                </button>
              </div>
            </div>
          </nav>

          {/* ─ Hero ──────────────────────────────────────────────────────────── */}
          <section className="lp-hero" aria-label="Hero">
            <div className="lp-hero-grid">

              {/* Copy */}
              <div>
                <div className="lp-label lp-anim-1">✦ Free forever for personal use</div>
                <h1 className="lp-anim-2">
                  Chat that just<br />
                  <em>feels right</em>
                </h1>
                <p className="lp-body lp-hero-sub lp-anim-3">
                  Stay connected with the people who matter. LiveChat makes messaging simple, fast, and enjoyable — whether it&apos;s family, friends, or your whole team.
                </p>
                <div className="lp-hero-btns lp-anim-3">
                  <SignUpButton mode="modal">
                    <button className="lp-btn lp-btn-primary">
                      Start chatting free <ArrowRight size={16} />
                    </button>
                  </SignUpButton>
                  <SignInButton mode="modal">
                    <button className="lp-btn lp-btn-outline">Sign in</button>
                  </SignInButton>
                </div>
                <div className="lp-trust lp-anim-4">
                  {["No credit card", "Free to use", "Any device"].map(t => (
                    <div key={t} className="lp-trust-item">
                      <Check size={13} strokeWidth={2.5} color="#888" />{t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat demo */}
              <div ref={chatRef}>
                <div className="lp-chat-card lp-anim-2">
                  <div className="lp-chat-header">
                    <div className="lp-chat-avatar">M</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Mom</div>
                      <div style={{ fontSize: 12, color: "#22c55e", display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                        Online
                      </div>
                    </div>
                  </div>
                  <div className="lp-chat-messages">
                    {demoMessages.slice(0, visibleMessages).map((msg, i) => (
                      <div key={i} className={`lp-msg-row lp-msg-in ${msg.me ? 'right' : ''}`}>
                        <div className={`lp-bubble ${msg.me ? 'me' : 'them'}`}>
                          {msg.text}
                          <div className="lp-bubble-time">{msg.time}</div>
                        </div>
                      </div>
                    ))}
                    {visibleMessages >= demoMessages.length && (
                      <div className="lp-msg-row">
                        <div className="lp-typing">
                          <div className="lp-dot" /><div className="lp-dot" /><div className="lp-dot" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="lp-chat-input">
                    <div className="lp-chat-input-field">Type a message...</div>
                    <button className="lp-send-btn" aria-label="Send">
                      <ArrowRight size={16} color="#fff" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* ─ Scroll hint ───────────────────────────────────────────────────── */}
          <div className="lp-scroll-hint" aria-hidden="true">
            <div className="lp-scroll-inner">
              <span className="lp-scroll-label lp-body">Scroll</span>
              <ChevronDown size={15} className="lp-scroll-icon" />
            </div>
          </div>

          <div className="lp-divider" />

          {/* ─ How it works ──────────────────────────────────────────────────── */}
          <section id="how" className="lp-section" aria-label="How it works">
            <div className="lp-inner">
              <div style={{ maxWidth: 580, marginBottom: 52 }}>
                <div className="lp-label">How it works</div>
                <h2 className="lp-display" style={{ fontSize: "clamp(1.9rem, 4vw, 2.6rem)", fontWeight: 600, margin: 0, lineHeight: 1.2 }}>
                  Up and running in 3 steps
                </h2>
              </div>
              <div className="lp-steps-grid">
                {steps.map((s, i) => (
                  <div key={i} className="lp-step">
                    <div className="lp-step-num">{s.num}</div>
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="lp-divider" />

          {/* ─ Features ──────────────────────────────────────────────────────── */}
          <section id="features" className="lp-section" aria-label="Features">
            <div className="lp-inner">
              <div style={{ maxWidth: 580, marginBottom: 52 }}>
                <div className="lp-label">Features</div>
                <h2 className="lp-display" style={{ fontSize: "clamp(1.9rem, 4vw, 2.6rem)", fontWeight: 600, margin: "0 0 14px 0", lineHeight: 1.2 }}>
                  Everything you need,<br />nothing you don&apos;t
                </h2>
                <p className="lp-body" style={{ fontSize: 16, color: "#666", maxWidth: 460, margin: 0, lineHeight: 1.75 }}>
                  Built for everyday people, not tech experts. Simple, clean, and genuinely delightful.
                </p>
              </div>
              <div className="lp-features-grid">
                {features.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="lp-feat">
                    <div className="lp-feat-content">
                      <div className="lp-feat-icon">
                        <Icon size={20} color="#111" />
                      </div>
                      <h3 className="lp-feat-title">{title}</h3>
                      <p className="lp-feat-desc">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="lp-divider" />

          {/* ─ Testimonials ──────────────────────────────────────────────────── */}
          <section id="testimonials" className="lp-section" style={{ background: "#fafafa" }} aria-label="Testimonials">
            <div className="lp-inner">
              <div style={{ textAlign: "center", marginBottom: 56 }}>
                <div className="lp-label">Reviews</div>
                <h2 className="lp-display" style={{ fontSize: "clamp(1.9rem, 4vw, 2.6rem)", fontWeight: 600, margin: 0, lineHeight: 1.2 }}>
                  Loved by real people
                </h2>
              </div>
              <div className="lp-testi-grid">
                {testimonials.map(t => (
                  <div key={t.name} className="lp-testi-card">
                    <div className="lp-stars">
                      {Array.from({ length: t.stars }).map((_, i) => (
                        <Star key={i} size={14} fill="#111" color="#111" />
                      ))}
                    </div>
                    <p className="lp-testi-quote lp-body">&ldquo;{t.text}&rdquo;</p>
                    <div className="lp-testi-author">
                      <div className="lp-testi-avatar">{t.name[0]}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</div>
                        <div style={{ fontSize: 12, color: "#888" }}>{t.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="lp-divider" />

          {/* ─ CTA ───────────────────────────────────────────────────────────── */}
          <section className="lp-cta-section" aria-label="Call to action">
            <div className="lp-cta-inner">
              <div className="lp-label">Get started today</div>
              <h2>
                Your people are<br />
                <em>waiting for you</em>
              </h2>
              <p className="lp-body lp-cta-sub">
                Join thousands of people who use LiveChat to stay close with those who matter most.
              </p>
              <SignUpButton mode="modal">
                <button className="lp-btn lp-btn-primary" style={{ fontSize: 17, padding: "15px 44px" }}>
                  Create your free account <ArrowRight size={18} />
                </button>
              </SignUpButton>
              <div className="lp-body" style={{ marginTop: 18, fontSize: 13, color: "#aaa" }}>
                Free forever &middot; No credit card &middot; Takes 60 seconds
              </div>
            </div>
          </section>

          {/* ─ Footer ────────────────────────────────────────────────────────── */}
          <footer className="lp-footer" aria-label="Footer">
            <div className="lp-footer-inner">
              <div className="lp-logo">
                <div className="lp-logo-icon" style={{ width: 28, height: 28 }}><MessageSquare size={13} color="#fff" /></div>
                <span className="lp-logo-name" style={{ fontSize: 16 }}>LiveChat</span>
              </div>
              <p className="lp-body" style={{ fontSize: 13, color: "#aaa", margin: 0 }}>
                &copy; {new Date().getFullYear()} LiveChat. Made for everyone.
              </p>
              <div className="lp-footer-links">
                {["Privacy", "Terms", "Support"].map(l => (
                  <a key={l} href="#" className="lp-footer-link">{l}</a>
                ))}
              </div>
            </div>
          </footer>

        </div>
      </SignedOut>
    </>
  );
}