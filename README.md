# LiveChat — Real-Time Messaging Application

> **A production-quality, real-time chat app built with Next.js 16, Convex, and Clerk.** Features include one-on-one DMs, group chats, image attachments, message replies, read receipts, link previews, presence indicators, infinite scroll pagination, and more — all powered by Convex's real-time subscriptions.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Convex Schema](#convex-schema)
6. [Getting Started](#getting-started)
7. [Environment Variables](#environment-variables)
8. [Convex + Clerk Auth Setup](#convex--clerk-auth-setup)
9. [Key Implementation Details](#key-implementation-details)
10. [Deployment](#deployment)
11. [Contributing](#contributing)

---

## Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | Clerk-powered email + social login with avatar display |
| 👥 **User Discovery** | Search all registered users by name in real time |
| 💬 **Direct Messages** | One-on-one private conversations |
| 👫 **Group Chats** | Create groups, manage members, rename, upload group avatar |
| 🔗 **Invite Links** | Share a short invite code to let anyone join a group |
| 🖼 **Image Attachments** | Send images via Convex File Storage; previewed inline |
| ↩️ **Message Replies** | Reply to any message with a quoted preview thread |
| 📖 **Read Receipts** | ✓ Sent / ✓✓ Read (blue) powered by `lastReadTime` |
| 🔗 **Link Previews** | OpenGraph card auto-generated for any URL in a message |
| ♾️ **Infinite Scroll** | Cursor-based pagination via `usePaginatedQuery` + IntersectionObserver |
| 🕐 **Smart Timestamps** | Time-only today, date+time same year, full date+year otherwise |
| 🟢 **Online Presence** | Real-time green indicators; clears on tab close |
| ✍️ **Typing Indicators** | Animated dots with name(s); clears after 2 s of inactivity |
| 🔔 **Unread Badges** | Real-time badge count; clears on conversation open |
| 🗑 **Soft Delete** | "This message was deleted" — record preserved for integrity |
| 😀 **Reactions** | 6 emoji reactions with toggle & count per message |
| 📱 **Responsive** | Desktop sidebar + chat; Mobile full-screen with back button |
| ⬇️ **Auto-scroll** | Snaps to latest, shows "↓ New messages" button if scrolled up |
| 💀 **Skeleton Loaders** | Every loading state has a polished animated skeleton |
| ⚠️ **Error + Retry** | Failed sends show a dismissable banner with a Retry action |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Backend / DB / Realtime** | [Convex](https://convex.dev/) |
| **Authentication** | [Clerk](https://clerk.com/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| **Date Formatting** | [date-fns](https://date-fns.org/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Deployment** | [Vercel](https://vercel.com/) + [Convex Cloud](https://dashboard.convex.dev/) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Next.js (App Router)                     │
│                                                              │
│   ┌────────────┐      ┌──────────────────────────────────┐   │
│   │  Sidebar   │      │   /conversations/[id]/page.tsx   │   │
│   │  (desktop) │      │   usePaginatedQuery (messages)   │   │
│   └────────────┘      │   useQuery (presence, reactions, │   │
│   ┌────────────┐      │             readStatus)          │   │
│   │  Mobile    │      └──────────────────────────────────┘   │
│   │  Conv List │                        │                     │
│   └────────────┘                        │ Convex React SDK    │
└────────────────────────────────────────┼─────────────────────┘
                                         │
                     ┌───────────────────▼────────────────────┐
                     │              Convex Cloud               │
                     │                                        │
                     │  ┌───────────┐  ┌──────────────────┐  │
                     │  │  queries  │  │    mutations     │  │
                     │  │  messages │  │  send (image,    │  │
                     │  │  .list    │  │  reply, link     │  │
                     │  │  (paged)  │  │  preview)        │  │
                     │  └───────────┘  └──────────────────┘  │
                     │  ┌────────────────────────────────┐   │
                     │  │   internalAction               │   │
                     │  │   fetchLinkPreviewAndPatch      │   │
                     │  │   (HTTP fetch → OG tags)        │   │
                     │  └────────────────────────────────┘   │
                     │  ┌────────────────────────────────┐   │
                     │  │   File Storage                 │   │
                     │  │   generateUploadUrl → PUT      │   │
                     │  │   getUrl (signed CDN URL)      │   │
                     │  └────────────────────────────────┘   │
                     └────────────────────────────────────────┘
                                         │
                     ┌───────────────────▼────────────────────┐
                     │              Clerk                      │
                     │  JWT Template "convex" → Convex auth  │
                     └────────────────────────────────────────┘
```

---

## Project Structure

```
live-chat/
├── app/
│   ├── conversations/
│   │   └── [id]/
│   │       └── page.tsx          # Chat page (paginated, infinite scroll)
│   ├── join/
│   │   └── page.tsx              # Group invite-link landing page
│   ├── profile/
│   │   └── page.tsx              # User profile settings
│   ├── globals.css               # Tailwind base + design tokens
│   └── layout.tsx                # Root layout (ClerkProvider, ConvexProvider)
│
├── components/
│   ├── chat/
│   │   ├── Message.tsx           # Message bubble (images, replies, reactions, read receipts, link cards)
│   │   ├── MessageInput.tsx      # Input (image upload, reply banner, error retry)
│   │   ├── Sidebar.tsx           # Desktop sidebar (search, tabs, conversation list)
│   │   ├── MobileConversationList.tsx
│   │   ├── ChatLayout.tsx        # Responsive wrapper
│   │   ├── GroupManagementDrawer.tsx
│   │   ├── CreateGroupModal.tsx
│   │   └── AddMemberModal.tsx
│   ├── providers/
│   │   ├── UserSync.tsx          # Syncs Clerk identity → Convex users table
│   │   └── ...
│   └── ui/                       # shadcn/ui components
│
├── convex/
│   ├── schema.ts                 # Full data model
│   ├── messages.ts               # Paginated query, send, image upload, link preview
│   ├── conversations.ts          # CRUD, group management, read status
│   ├── users.ts                  # User sync, search, presence
│   ├── presence.ts               # Typing & online indicators
│   ├── reactions.ts              # Emoji reactions
│   └── auth.config.js            # Clerk JWT issuer
│
└── lib/
    └── utils.ts                  # cn(), formatMessageTime(), formatConversationTime()
```

---

## Convex Schema

```typescript
// convex/schema.ts (summarized)

users: {
    name, email, imageUrl, clerkId,
    isOnline: boolean,
    lastSeen: number,
}

conversations: {
    name?,            // Group chat name
    isGroup: boolean,
    lastMessageId?,
    imageUrl?,        // Group avatar
    inviteCode?,      // 8-char invite code
    creatorId?,
}

conversationMembers: {
    conversationId, userId,
    lastReadTime: number,   // Used for unread badge + read receipts
    role?: "admin" | "member",
}

messages: {
    conversationId, senderId,
    content: string,
    type: "text" | "system",
    deleted: boolean,
    imageStorageId?,        // Convex File Storage ID
    replyToMessageId?,      // Reply threading
    linkPreview?: {         // Cached OG metadata
        url, title?, description?, image?, siteName?
    },
}

reactions: { messageId, userId, emoji }

presence: {
    userId, isTyping: boolean,
    conversationId?,
    lastActive: number,
}
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A free [Convex account](https://dashboard.convex.dev/signup)
- A free [Clerk account](https://clerk.com/)

### 1. Clone & Install

```bash
git clone https://github.com/sidhyaashu/live-chat.git
cd live-chat
npm install
```

### 2. Set Up Convex

```bash
npx convex dev
```

Follow the prompt to log in and create a new Convex project. This will:
- Push your schema and functions to Convex Cloud
- Write `NEXT_PUBLIC_CONVEX_URL` to `.env.local`

### 3. Configure Clerk

1. Create a new application in the [Clerk Dashboard](https://dashboard.clerk.com/)
2. Go to **JWT Templates** → **New template** → pick **Convex**
3. Copy the **Issuer** URL shown in the template

### 4. Connect Clerk to Convex

Edit `convex/auth.config.js`:

```js
export default {
    providers: [
        {
            domain: "https://YOUR_CLERK_FRONTEND_API_URL",
            applicationID: "convex",
        },
    ],
};
```

Re-run `npx convex dev` to push the auth config.

### 5. Add Environment Variables

Create/edit `.env.local`:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### 6. Run Locally

Open two terminals:

**Terminal 1 — Convex:**
```bash
npx convex dev
```

**Terminal 2 — Next.js:**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Your Convex deployment URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key (server-only) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Clerk sign-in redirect URL |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Clerk sign-up redirect URL |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Post-login redirect |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Post-signup redirect |

---

## Convex + Clerk Auth Setup

The auth flow works as follows:

1. User signs in via **Clerk** (email, Google, GitHub, etc.)
2. Clerk issues a **JWT** using the "convex" JWT template
3. Convex validates the JWT against the Clerk **JWKS endpoint** configured in `auth.config.js`
4. `UserSync.tsx` calls `api.users.storeUser` which upserts the user record in the `users` table
5. All Convex queries/mutations call `getCurrentUser(ctx)` which looks up the user by `clerkId`

**Key files:**
- `convex/auth.config.js` — Clerk issuer domain
- `components/providers/UserSync.tsx` — Client-side user sync on auth state change
- `app/layout.tsx` — `<ClerkProvider>` + `<ConvexProviderWithClerk>`

---

## Key Implementation Details

### Real-time Subscriptions

Every `useQuery` in this app is a **live subscription** — Convex automatically pushes updates to connected clients when data changes. No polling, no WebSocket boilerplate.

### Infinite Scroll Pagination

Messages are fetched using Convex's `paginatedQuery` (cursor-based):

```typescript
// convex/messages.ts
export const list = query({
    args: { conversationId, paginationOpts: paginationOptsValidator },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("messages")
            .withIndex("by_conversationId", q => q.eq("conversationId", args.conversationId))
            .order("desc")          // newest first for client-side reversal
            .paginate(args.paginationOpts);
    },
});
```

On the client, an `IntersectionObserver` on the top sentinel calls `loadMore(30)` when the user scrolls to the top.

### Image Attachments (Convex File Storage)

Upload flow:
1. Client calls `generateUploadUrl` mutation → gets a **pre-signed PUT URL**
2. Client `fetch PUT` the raw file to that URL
3. Response contains `{ storageId }` — saved in the `messages` record
4. Any component can call `getImageUrl({ storageId })` to get a signed CDN URL

### Link Previews (Convex Scheduled Actions)

When a message is sent containing a URL:
1. `send` mutation detects the URL via regex
2. Schedules `internal.messages.fetchLinkPreviewAndPatch` via `ctx.scheduler.runAfter(0, ...)`
3. The `internalAction` fetches the URL's HTML, parses `og:title / og:description / og:image`
4. Patches the message record with the structured `linkPreview` object
5. All subscribed clients see the card appear within ~1–2 seconds

### Read Receipts

The `conversationMembers.lastReadTime` field drives read receipts:
- When you **open** a conversation, `markAsRead` sets your `lastReadTime = Date.now()`
- When you **send** a message, your `lastReadTime` is also bumped
- `getReadStatus` query returns `{ [userId]: lastReadTime }` for other members
- In `Message.tsx`: if `otherUserLastReadTime > msg._creationTime` → show **✓✓ blue**

### Smart Timestamps

`lib/utils.ts` exports `formatMessageTime`:

```typescript
export function formatMessageTime(ts: number): string {
    const date = new Date(ts)
    if (isToday(date))   return format(date, 'h:mm a')          // "2:34 PM"
    if (isThisYear(date)) return format(date, 'MMM d, h:mm a')  // "Feb 15, 2:34 PM"
    return format(date, 'MMM d, yyyy, h:mm a')                   // "Feb 15, 2023, 2:34 PM"
}
```

---

## Deployment

### 1. Deploy Convex Backend

```bash
npx convex deploy
```

This pushes your schema and functions to a production Convex deployment. Note the **production URL**.

### 2. Deploy to Vercel

```bash
vercel --prod
```

Or connect your GitHub repo to Vercel and set environment variables in the Vercel dashboard.

**Required Vercel Environment Variables:**
- All variables from `.env.local` above
- Update `NEXT_PUBLIC_CONVEX_URL` to your **production** Convex URL

### 3. Update Clerk Allowed Origins

In the Clerk Dashboard → **Domains**, add your `*.vercel.app` URL (and custom domain if applicable).

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes and ensure `npm run build` passes
4. Submit a Pull Request with a clear description

---

## License

MIT — feel free to use this project for learning, assignments, or as a starter for your own chat app.
