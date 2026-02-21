import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, checkMembership } from "./conversations";

export const toggleReaction = mutation({
    args: {
        messageId: v.id("messages"),
        emoji: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const message = await ctx.db.get(args.messageId);
        if (!message || message.deleted) {
            throw new Error("Message not found or deleted");
        }

        const isMember = await checkMembership(ctx, message.conversationId, user._id);
        if (!isMember) throw new Error("Not a member of this conversation");

        const existing = await ctx.db
            .query("reactions")
            .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
            .filter((q) => q.and(
                q.eq(q.field("userId"), user._id),
                q.eq(q.field("emoji"), args.emoji)
            ))
            .unique();

        if (existing) {
            await ctx.db.delete(existing._id);
        } else {
            await ctx.db.insert("reactions", {
                messageId: args.messageId,
                userId: user._id,
                emoji: args.emoji,
            });
        }
    },
});

export const getReactions = query({
    args: { messageIds: v.array(v.id("messages")) },
    handler: async (ctx, args) => {
        // Auth guard: unauthenticated users get no reactions
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return {};

        const results: Record<string, any[]> = {};

        for (const messageId of args.messageIds) {
            const reactions = await ctx.db
                .query("reactions")
                .withIndex("by_messageId", (q: any) => q.eq("messageId", messageId))
                .collect();
            results[messageId] = reactions;
        }

        return results;
    },
});
