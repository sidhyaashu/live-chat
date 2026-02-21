import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createOrGetConversation = mutation({
    args: { participantId: v.id("users") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) throw new Error("User not found");

        // Check if DM already exists
        const myMemberships = await ctx.db
            .query("conversationMembers")
            .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
            .collect();

        for (const membership of myMemberships) {
            const conversation = await ctx.db.get(membership.conversationId);
            if (conversation && !conversation.isGroup) {
                const otherMember = await ctx.db
                    .query("conversationMembers")
                    .withIndex("by_conversationId", (q: any) => q.eq("conversationId", conversation._id))
                    .filter((q: any) => q.eq(q.field("userId"), args.participantId))
                    .unique();

                if (otherMember) return conversation._id;
            }
        }

        // Create new DM
        const conversationId = await ctx.db.insert("conversations", {
            isGroup: false,
        });

        await ctx.db.insert("conversationMembers", {
            conversationId,
            userId: currentUser._id,
            lastReadTime: Date.now(),
        });

        await ctx.db.insert("conversationMembers", {
            conversationId,
            userId: args.participantId,
            lastReadTime: 0,
        });

        return conversationId;
    },
});

export const createGroup = mutation({
    args: {
        name: v.string(),
        participantIds: v.array(v.id("users")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        const conversationId = await ctx.db.insert("conversations", {
            isGroup: true,
            name: args.name,
        });

        // Add creator
        await ctx.db.insert("conversationMembers", {
            conversationId,
            userId: user._id,
            lastReadTime: Date.now(),
        });

        // Add other participants
        await Promise.all(
            args.participantIds.map((id) =>
                ctx.db.insert("conversationMembers", {
                    conversationId,
                    userId: id,
                    lastReadTime: 0,
                })
            )
        );

        return conversationId;
    },
});

export const getConversations = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        const memberships = await ctx.db
            .query("conversationMembers")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .collect();

        const results = await Promise.all(
            memberships.map(async (membership) => {
                const conv = await ctx.db.get(membership.conversationId);
                if (!conv) return null;

                const otherMembers = await ctx.db
                    .query("conversationMembers")
                    .withIndex("by_conversationId", (q) => q.eq("conversationId", conv._id))
                    .filter((q) => q.neq(q.field("userId"), user._id))
                    .collect();

                const otherMemberUsers = await Promise.all(
                    otherMembers.map(m => ctx.db.get(m.userId))
                );

                let lastMessage = null;
                if (conv.lastMessageId) {
                    lastMessage = await ctx.db.get(conv.lastMessageId);
                }

                // Count unread messages (excluding deleted)
                const unreadMessages = await ctx.db
                    .query("messages")
                    .withIndex("by_conversationId", (q: any) => q.eq("conversationId", conv._id))
                    .filter((q: any) => q.and(
                        q.gt(q.field("_creationTime"), membership.lastReadTime),
                        q.eq(q.field("deleted"), false)
                    ))
                    .collect();
                const unreadCount = unreadMessages.length;

                return {
                    ...conv,
                    otherUser: otherMemberUsers[0],
                    otherUsers: otherMemberUsers,
                    lastMessage,
                    unreadCount,
                };
            })
        );

        return results
            .filter((r): r is NonNullable<typeof r> => r !== null)
            .sort((a, b) => (b.lastMessage?._creationTime || b._creationTime) - (a.lastMessage?._creationTime || a._creationTime));
    },
});

export const markAsRead = mutation({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return;

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
    },
});

export const leaveGroup = mutation({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation || !conversation.isGroup) {
            throw new Error("Conversation not found or not a group");
        }

        const membership = await ctx.db
            .query("conversationMembers")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .filter((q) => q.eq(q.field("conversationId"), args.conversationId))
            .unique();

        if (membership) {
            await ctx.db.delete(membership._id);
        }

        // If no members left, delete conversation (optional)
        const remainingMembers = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
            .collect();

        if (remainingMembers.length === 0) {
            // Cleanup messages and reactions as well in a real app
            await ctx.db.delete(args.conversationId);
        }
    },
});

// ── Shared helper functions (not exported as Convex mutations/queries) ─────────
export async function getCurrentUser(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
        .unique();
}

export async function checkMembership(ctx: any, conversationId: any, userId: any) {
    const membership = await ctx.db
        .query("conversationMembers")
        .withIndex("by_userId", (q: any) => q.eq("userId", userId))
        .filter((q: any) => q.eq(q.field("conversationId"), conversationId))
        .unique();
    return !!membership;
}
