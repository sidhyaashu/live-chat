'use client';

import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery, useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function UserSync() {
    const { user } = useUser();
    const { isAuthenticated } = useConvexAuth();
    const storeUser = useMutation(api.users.storeUser);
    const setOffline = useMutation(api.users.setOffline);
    const updatePresence = useMutation(api.presence.updatePresence);

    // Query auth status to detect JWT template misconfiguration
    const authStatus = useQuery(api.users.getCurrentUserStatus);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const retryCountRef = useRef(0);
    const syncedRef = useRef(false);

    // ── MAIN SYNC: store user record on login ────────────────────────────────
    useEffect(() => {
        if (!user || !isAuthenticated) return;
        if (syncedRef.current) return; // Only run once per session

        const syncUser = async (attempt = 1) => {
            try {
                await storeUser({
                    name: user.fullName || user.username || 'Anonymous',
                    email: user.emailAddresses[0]?.emailAddress ?? '',
                    imageUrl: user.imageUrl,
                    clerkId: user.id,
                });
                syncedRef.current = true;
                setSyncError(null);
                setShowBanner(false);
                retryCountRef.current = 0;
                console.log('[UserSync] ✅ User stored in Convex successfully');
            } catch (error: any) {
                const msg = error?.message || 'Unknown error';
                console.error(`[UserSync] ❌ Attempt ${attempt} failed:`, msg);
                retryCountRef.current = attempt;

                // Show the error banner after 2 failed attempts
                if (attempt >= 2) {
                    setSyncError(msg);
                    setShowBanner(true);
                }

                // Retry up to 5 times with exponential backoff: 1s, 2s, 4s, 8s, 16s
                if (attempt < 5) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 16000);
                    console.log(`[UserSync] Retrying in ${delay}ms...`);
                    setTimeout(() => syncUser(attempt + 1), delay);
                }
            }
        };

        syncUser();
    }, [user, isAuthenticated, storeUser]);

    // ── Reset sync flag when user changes (switch accounts) ─────────────────
    useEffect(() => {
        syncedRef.current = false;
    }, [user?.id]);

    // ── HEARTBEAT: keep online status alive every 10s ────────────────────────
    useEffect(() => {
        if (!user || !isAuthenticated) return;

        const interval = setInterval(() => {
            updatePresence({ isOnline: true, isTyping: false })
                .catch(() => { }); // Silently ignore heartbeat errors
        }, 10_000);

        return () => clearInterval(interval);
    }, [user, isAuthenticated, updatePresence]);

    // ── OFFLINE: mark offline on tab close / logout ──────────────────────────
    useEffect(() => {
        if (!user) return;

        const markOffline = () => {
            // Use sendBeacon for reliable delivery on tab close
            navigator.sendBeacon(
                '/api/offline',
                JSON.stringify({ clerkId: user.id })
            );
        };

        // Also try Convex directly before unload
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                updatePresence({ isOnline: false, isTyping: false }).catch(() => { });
            } else {
                updatePresence({ isOnline: true, isTyping: false }).catch(() => { });
            }
        };

        window.addEventListener('beforeunload', markOffline);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('beforeunload', markOffline);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            // Mark offline when component unmounts (user logs out)
            if (user?.id) {
                updatePresence({ isOnline: false, isTyping: false }).catch(() => { });
            }
        };
    }, [user, updatePresence]);

    // ── AUTH MISCONFIGURATION BANNER ─────────────────────────────────────────
    // Show when: Clerk says logged in, but Convex can't authenticate
    const showMisconfigBanner =
        user &&
        isAuthenticated === false &&
        authStatus !== undefined;

    if (showMisconfigBanner || (showBanner && syncError)) {
        return (
            <div className="fixed top-16 left-0 right-0 z-[100] flex justify-center px-4">
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-lg shadow-lg px-4 py-3 flex items-start gap-3 max-w-xl w-full">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
                    <div className="flex-1 text-sm">
                        <p className="font-semibold">Convex authentication is not configured</p>
                        <p className="mt-1 text-amber-700 dark:text-amber-300">
                            Go to your{' '}
                            <a
                                href="https://dashboard.clerk.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline font-medium"
                            >
                                Clerk Dashboard
                            </a>
                            {' '}→ Configure → JWT Templates → click{' '}
                            <strong>&quot;New template&quot;</strong> → select{' '}
                            <strong>Convex</strong> → name it <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">convex</code> → Save.
                            Then sign out and sign back in.
                        </p>
                        {syncError && (
                            <p className="mt-1.5 text-xs opacity-70 font-mono">{syncError}</p>
                        )}
                        <p className="mt-1.5 text-xs opacity-60">
                            Retried {retryCountRef.current} time{retryCountRef.current !== 1 ? 's' : ''}.
                            Check browser console for details.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowBanner(false)}
                        className="shrink-0 p-1 hover:bg-amber-100 dark:hover:bg-amber-900 rounded-full transition"
                        aria-label="Dismiss"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
