'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter, useParams } from 'next/navigation';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { Users, Link2, LogIn } from 'lucide-react';

// ── We need the group info from the invite code ───────────────────────────────
// This component fetches by scanning (since we can't query by inviteCode directly).
// For prod, you'd add a by_inviteCode index.

export default function JoinGroupPage() {
    const router = useRouter();
    const params = useParams();
    const code = params?.code as string;
    const joinByInviteCode = useMutation(api.conversations.joinByInviteCode);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleJoin = async () => {
        if (!code) return;
        setJoining(true);
        setError(null);
        try {
            const conversationId = await joinByInviteCode({ code: code });
            router.push(`/conversations/${conversationId}`);
        } catch (e: any) {
            setError(e?.message ?? 'Failed to join. The invite link may be invalid or expired.');
            setJoining(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-background flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border max-w-sm w-full overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary/20 to-primary/5 px-6 py-8 flex flex-col items-center gap-3">
                    <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
                        <Users className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-xl font-bold text-center">You&apos;re invited to join a group!</h1>
                    <div className="flex items-center gap-2 bg-white/70 dark:bg-zinc-800/70 rounded-full px-3 py-1">
                        <Link2 className="h-3.5 w-3.5 text-zinc-500" />
                        <code className="text-xs text-zinc-600 dark:text-zinc-300 font-mono">{code}</code>
                    </div>
                </div>

                <div className="px-6 py-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <SignedIn>
                        <p className="text-sm text-zinc-500 text-center">
                            Click below to join this group chat and start messaging.
                        </p>
                        <button
                            onClick={handleJoin}
                            disabled={joining}
                            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm disabled:opacity-50 transition hover:bg-primary/90"
                        >
                            {joining ? 'Joining...' : 'Join Group'}
                        </button>
                    </SignedIn>

                    <SignedOut>
                        <p className="text-sm text-zinc-500 text-center">
                            You need to sign in before you can join this group.
                        </p>
                        <SignInButton mode="modal">
                            <button className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm transition hover:bg-primary/90">
                                <LogIn className="h-4 w-4" />
                                Sign In to Join
                            </button>
                        </SignInButton>
                    </SignedOut>

                    <p className="text-xs text-center text-zinc-400">
                        Live Chat · Real-time messaging
                    </p>
                </div>
            </div>
        </div>
    );
}
