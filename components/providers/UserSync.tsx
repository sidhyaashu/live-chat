'use client';

import { useUser } from '@clerk/nextjs';
import { useMutation, useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useEffect } from 'react';

export function UserSync() {
    const { user } = useUser();
    const { isAuthenticated } = useConvexAuth();
    const storeUser = useMutation(api.users.storeUser);
    const updatePresence = useMutation(api.presence.updatePresence);

    useEffect(() => {
        if (!user || !isAuthenticated) return;

        const syncUser = async () => {
            try {
                await storeUser({
                    name: user.fullName || user.username || 'Anonymous',
                    // Safe-access: social auth users may have no email address
                    email: user.emailAddresses[0]?.emailAddress ?? '',
                    imageUrl: user.imageUrl,
                    clerkId: user.id,
                });
            } catch (error) {
                console.error('Error syncing user:', error);
            }
        };

        syncUser();

        // Heartbeat for online status
        const interval = setInterval(() => {
            updatePresence({ isOnline: true, isTyping: false });
        }, 5000);

        return () => clearInterval(interval);
    }, [user, isAuthenticated, storeUser, updatePresence]);

    return null;
}
