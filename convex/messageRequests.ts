import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./conversations";

// ── Send a message request ────────────────────────────────────────────────────
export const sendRequest = mutation({
    args: { toUserId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");
        if (user._id === args.toUserId) throw new Error("Cannot send request to yourself");

        // Check if a request already exists in either direction
        const existing = await ctx.db
            .query("messageRequests")
            .withIndex("by_pair", (q) => q.eq("fromUserId", user._id).eq("toUserId", args.toUserId))
            .unique();

        if (existing) return existing._id; // Already sent

        // Check reverse direction too
        const reverse = await ctx.db
            .query("messageRequests")
            .withIndex("by_pair", (q) => q.eq("fromUserId", args.toUserId).eq("toUserId", user._id))
            .unique();

        if (reverse && reverse.status === "accepted") return null; // Already friends

        return await ctx.db.insert("messageRequests", {
            fromUserId: user._id,
            toUserId: args.toUserId,
            status: "pending",
        });
    },
});

// ── Accept a message request ──────────────────────────────────────────────────
export const acceptRequest = mutation({
    args: { requestId: v.id("messageRequests") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const request = await ctx.db.get(args.requestId);
        if (!request || request.toUserId !== user._id) throw new Error("Not authorized");

        await ctx.db.patch(args.requestId, { status: "accepted" });

        // Create the DM conversation
        const conversationId = await ctx.db.insert("conversations", { isGroup: false });
        await ctx.db.insert("conversationMembers", {
            conversationId,
            userId: request.fromUserId,
            lastReadTime: 0,
        });
        await ctx.db.insert("conversationMembers", {
            conversationId,
            userId: user._id,
            lastReadTime: Date.now(),
        });

        return conversationId;
    },
});

// ── Decline a message request ─────────────────────────────────────────────────
export const declineRequest = mutation({
    args: { requestId: v.id("messageRequests") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const request = await ctx.db.get(args.requestId);
        if (!request || request.toUserId !== user._id) throw new Error("Not authorized");

        await ctx.db.patch(args.requestId, { status: "declined" });
    },
});

// ── Get all pending incoming requests (with sender info) ──────────────────────
export const getPendingIncoming = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        const requests = await ctx.db
            .query("messageRequests")
            .withIndex("by_toUserId", (q) => q.eq("toUserId", user._id))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();

        return await Promise.all(
            requests.map(async (req) => {
                const sender = await ctx.db.get(req.fromUserId);
                return { ...req, sender };
            })
        );
    },
});

// ── Get the request status between current user and another user ──────────────
export const getRequestStatus = query({
    args: { otherUserId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return null;

        // Sent by me
        const sent = await ctx.db
            .query("messageRequests")
            .withIndex("by_pair", (q) => q.eq("fromUserId", user._id).eq("toUserId", args.otherUserId))
            .unique();

        if (sent) return { direction: "sent" as const, status: sent.status, requestId: sent._id };

        // Received from them
        const received = await ctx.db
            .query("messageRequests")
            .withIndex("by_pair", (q) => q.eq("fromUserId", args.otherUserId).eq("toUserId", user._id))
            .unique();

        if (received) return { direction: "received" as const, status: received.status, requestId: received._id };

        return null;
    },
});

// ── Get count of pending incoming requests ─────────────────────────────────────
export const getPendingCount = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return 0;

        const requests = await ctx.db
            .query("messageRequests")
            .withIndex("by_toUserId", (q) => q.eq("toUserId", user._id))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();

        return requests.length;
    },
});
