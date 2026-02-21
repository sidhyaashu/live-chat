import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, checkMembership } from "./conversations";

export const send = mutation({
    args: {
        conversationId: v.id("conversations"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const isMember = await checkMembership(ctx, args.conversationId, user._id);
        if (!isMember) throw new Error("Not a member of this conversation");

        const messageId = await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderId: user._id,
            content: args.content,
            type: "text",
            deleted: false,
        });

        await ctx.db.patch(args.conversationId, {
            lastMessageId: messageId,
        });

        // Update lastReadTime for the sender
        const membership = await ctx.db
            .query("conversationMembers")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .filter((q) => q.eq(q.field("conversationId"), args.conversationId))
            .unique();

        if (membership) {
            await ctx.db.patch(membership._id, {
                lastReadTime: Date.now(),
            });
        }

        return messageId;
    },
});

export const list = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        const isMember = await checkMembership(ctx, args.conversationId, user._id);
        if (!isMember) return [];

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversationId", (q: any) => q.eq("conversationId", args.conversationId))
            .collect();

        return await Promise.all(
            messages.map(async (msg) => {
                const sender = await ctx.db.get(msg.senderId);
                return {
                    ...msg,
                    senderName: sender?.name || "Unknown User",
                    senderImage: sender?.imageUrl || "",
                    isMe: msg.senderId === user._id,
                };
            })
        );
    },
});

export const remove = mutation({
    args: { messageId: v.id("messages") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const message = await ctx.db.get(args.messageId);
        if (!message || message.senderId !== user._id) {
            throw new Error("Unauthorized or message not found");
        }

        await ctx.db.patch(args.messageId, {
            deleted: true,
            content: "This message was deleted",
        });

        // Optional: Cleanup reactions for deleted message
        const reactions = await ctx.db
            .query("reactions")
            .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
            .collect();

        for (const reaction of reactions) {
            await ctx.db.delete(reaction._id);
        }
    },
});
