import { ChatLayout } from "@/components/chat/ChatLayout";
import { MobileConversationList } from "@/components/chat/MobileConversationList";
import { MessageSquare } from "lucide-react";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export default function Home() {
  return (
    <>
      <SignedIn>
        <ChatLayout>
          {/* Desktop: empty state prompt */}
          <div className="hidden md:flex flex-1 flex-col items-center justify-center p-4 text-center">
            <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-full mb-4">
              <MessageSquare className="h-12 w-12 text-zinc-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Your Messages</h2>
            <p className="text-zinc-500 max-w-sm">
              Select a conversation from the sidebar or search for users to start a new chat.
            </p>
          </div>
          {/* Mobile: show conversation list inline */}
          <MobileConversationList />
        </ChatLayout>
      </SignedIn>
      <SignedOut>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 text-center">
          <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-full mb-6">
            <MessageSquare className="h-16 w-16 text-zinc-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Welcome to Live Chat</h1>
          <p className="text-zinc-500 mb-8 max-w-md">
            A real-time messaging application built with Next.js, Convex, and Clerk.
            Sign in to start messaging your friends.
          </p>
          <p className="text-sm text-zinc-400">Use the Sign In / Sign Up buttons above to get started.</p>
        </div>
      </SignedOut>
    </>
  );
}
