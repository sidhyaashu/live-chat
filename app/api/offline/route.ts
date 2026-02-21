import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

/**
 * POST /api/offline
 * Called via navigator.sendBeacon on tab close / beforeunload to mark the
 * user as offline in Convex without waiting for a response.
 *
 * Body: { clerkId: string }
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { clerkId } = body;

        if (!clerkId || typeof clerkId !== 'string') {
            return NextResponse.json({ error: 'Missing clerkId' }, { status: 400 });
        }

        const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
        await convex.mutation(api.users.setOffline, { clerkId });

        return NextResponse.json({ ok: true });
    } catch (err) {
        // Non-critical: best-effort offline marker
        console.error('[api/offline] Failed to mark user offline:', err);
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
