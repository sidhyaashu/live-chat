import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./conversations";

export const updatePresence = mutation({
    args: {
        isOnline: v.boolean(),
        isTyping: v.boolean(),
        conversationId: v.optional(v.id("conversations")),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return;

        await ctx.db.patch(user._id, {
            isOnline: args.isOnline,
            lastSeen: Date.now(),
        });

        const existingPresence = await ctx.db
            .query("presence")
            .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
            .unique();

        if (existingPresence) {
            await ctx.db.patch(existingPresence._id, {
                isTyping: args.isTyping,
                conversationId: args.conversationId,
                lastActive: Date.now(),
            });
        } else {
            await ctx.db.insert("presence", {
                userId: user._id,
                isTyping: args.isTyping,
                conversationId: args.conversationId,
                lastActive: Date.now(),
            });
        }
    },
});

export const getPresence = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        const presences = await ctx.db
            .query("presence")
            .withIndex("by_conversationId", (q: any) => q.eq("conversationId", args.conversationId))
            .filter((q: any) => q.neq(q.field("userId"), user._id))
            .collect();

        const results = await Promise.all(
            presences.map(async (p) => {
                const userData = await ctx.db.get(p.userId);
                return {
                    ...p,
                    user: userData,
                };
            })
        );

        // Filter out stale presence (> 10 seconds)
        return results.filter(r => r.lastActive > Date.now() - 10000);
    },
});
