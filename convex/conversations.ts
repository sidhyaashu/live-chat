import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── Helper: generate a random 8-char invite code ─────────────────────────────
function generateCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// ── Helper: insert a system message and update lastMessageId ─────────────────
async function insertSystemMessage(ctx: any, conversationId: any, content: string, senderId: any) {
    const msgId = await ctx.db.insert("messages", {
        conversationId,
        senderId,
        content,
        type: "system",
        deleted: false,
    });
    await ctx.db.patch(conversationId, { lastMessageId: msgId });
    return msgId;
}

// ── Create or retrieve a 1:1 DM ───────────────────────────────────────────────
export const createOrGetConversation = mutation({
    args: { participantId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const myMemberships = await ctx.db
            .query("conversationMembers")
            .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
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

        const conversationId = await ctx.db.insert("conversations", { isGroup: false });
        await ctx.db.insert("conversationMembers", { conversationId, userId: user._id, lastReadTime: Date.now() });
        await ctx.db.insert("conversationMembers", { conversationId, userId: args.participantId, lastReadTime: 0 });
        return conversationId;
    },
});

// ── Create a group chat ────────────────────────────────────────────────────────
export const createGroup = mutation({
    args: {
        name: v.string(),
        participantIds: v.array(v.id("users")),
        imageUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const conversationId = await ctx.db.insert("conversations", {
            isGroup: true,
            name: args.name,
            imageUrl: args.imageUrl,
            creatorId: user._id,
        });

        // Add creator as admin
        await ctx.db.insert("conversationMembers", {
            conversationId, userId: user._id, lastReadTime: Date.now(), role: "admin",
        });

        // Add other members
        await Promise.all(
            args.participantIds.map((id) =>
                ctx.db.insert("conversationMembers", {
                    conversationId, userId: id, lastReadTime: 0, role: "member",
                })
            )
        );

        // System message: group created
        await insertSystemMessage(ctx, conversationId, `${user.name} created the group`, user._id);

        return conversationId;
    },
});

// ── Update group name / image ─────────────────────────────────────────────────
export const updateGroup = mutation({
    args: {
        conversationId: v.id("conversations"),
        name: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const isMember = await checkMembership(ctx, args.conversationId, user._id);
        if (!isMember) throw new Error("Not a member");

        const patch: Record<string, any> = {};
        if (args.name !== undefined) patch.name = args.name;
        if (args.imageUrl !== undefined) patch.imageUrl = args.imageUrl;

        await ctx.db.patch(args.conversationId, patch);

        if (args.name) {
            await insertSystemMessage(ctx, args.conversationId, `${user.name} renamed the group to "${args.name}"`, user._id);
        }
    },
});

// ── Add a member to a group ───────────────────────────────────────────────────
export const addMember = mutation({
    args: {
        conversationId: v.id("conversations"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const caller = await getCurrentUser(ctx);
        if (!caller) throw new Error("Unauthorized");

        const isMember = await checkMembership(ctx, args.conversationId, caller._id);
        if (!isMember) throw new Error("Not a member");

        const alreadyMember = await checkMembership(ctx, args.conversationId, args.userId);
        if (alreadyMember) return; // Already in group

        await ctx.db.insert("conversationMembers", {
            conversationId: args.conversationId,
            userId: args.userId,
            lastReadTime: 0,
            role: "member",
        });

        const targetUser = await ctx.db.get(args.userId);
        await insertSystemMessage(
            ctx, args.conversationId,
            `${targetUser?.name ?? "Someone"} was added by ${caller.name}`,
            caller._id
        );
    },
});

// ── Leave a group ─────────────────────────────────────────────────────────────
export const leaveGroup = mutation({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation || !conversation.isGroup) throw new Error("Not a group");

        // Emit system message BEFORE removing membership
        await insertSystemMessage(ctx, args.conversationId, `${user.name} left the group`, user._id);

        const membership = await ctx.db
            .query("conversationMembers")
            .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
            .filter((q: any) => q.eq(q.field("conversationId"), args.conversationId))
            .unique();

        if (membership) await ctx.db.delete(membership._id);

        const remainingMembers = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversationId", (q: any) => q.eq("conversationId", args.conversationId))
            .collect();

        if (remainingMembers.length === 0) {
            await ctx.db.delete(args.conversationId);
        }
    },
});

// ── Generate or retrieve an invite code for a group ──────────────────────────
export const generateInviteCode = mutation({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const isMember = await checkMembership(ctx, args.conversationId, user._id);
        if (!isMember) throw new Error("Not a member");

        const conv = await ctx.db.get(args.conversationId);
        if (!conv) throw new Error("Conversation not found");

        // Reuse existing code if one exists
        if (conv.inviteCode) return conv.inviteCode;

        const code = generateCode();
        await ctx.db.patch(args.conversationId, { inviteCode: code });
        return code;
    },
});

// ── Join a group via invite code ──────────────────────────────────────────────
export const joinByInviteCode = mutation({
    args: { code: v.string() },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Use index instead of full table scan
        const conv = await ctx.db
            .query("conversations")
            .withIndex("by_inviteCode", (q: any) => q.eq("inviteCode", args.code.toUpperCase()))
            .unique();
        if (!conv) throw new Error("Invalid invite code");

        const alreadyMember = await checkMembership(ctx, conv._id, user._id);
        if (alreadyMember) return conv._id; // Already in group

        await ctx.db.insert("conversationMembers", {
            conversationId: conv._id,
            userId: user._id,
            lastReadTime: Date.now(),
            role: "member",
        });

        await insertSystemMessage(ctx, conv._id, `${user.name} joined via invite link`, user._id);

        return conv._id;
    },
});

// ── Get group details with full member list ───────────────────────────────────
export const getGroupDetails = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return null;

        const conv = await ctx.db.get(args.conversationId);
        if (!conv || !conv.isGroup) return null;

        const isMember = await checkMembership(ctx, args.conversationId, user._id);
        if (!isMember) return null;

        const memberships = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversationId", (q: any) => q.eq("conversationId", args.conversationId))
            .collect();

        const members = await Promise.all(
            memberships.map(async (m) => {
                const u = await ctx.db.get(m.userId);
                return u ? { ...u, role: m.role ?? "member", isMe: u._id === user._id } : null;
            })
        );

        return {
            ...conv,
            members: members.filter(Boolean),
            isAdmin: conv.creatorId === user._id,
        };
    },
});

// ── List all conversations ────────────────────────────────────────────────────
export const getConversations = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];

        const memberships = await ctx.db
            .query("conversationMembers")
            .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
            .collect();

        const results = await Promise.all(
            memberships.map(async (membership) => {
                const conv = await ctx.db.get(membership.conversationId);
                if (!conv) return null;

                const otherMembers = await ctx.db
                    .query("conversationMembers")
                    .withIndex("by_conversationId", (q: any) => q.eq("conversationId", conv._id))
                    .filter((q: any) => q.neq(q.field("userId"), user._id))
                    .collect();

                const otherMemberUsers = await Promise.all(otherMembers.map(m => ctx.db.get(m.userId)));

                let lastMessage = null;
                if (conv.lastMessageId) lastMessage = await ctx.db.get(conv.lastMessageId);

                const unreadMessages = await ctx.db
                    .query("messages")
                    .withIndex("by_conversationId", (q: any) => q.eq("conversationId", conv._id))
                    .filter((q: any) => q.and(
                        q.gt(q.field("_creationTime"), membership.lastReadTime),
                        q.eq(q.field("deleted"), false),
                        q.eq(q.field("type"), "text"),  // Don't count system messages as unread
                        q.neq(q.field("senderId"), user._id)  // Don't count own messages as unread
                    ))
                    .collect();

                return {
                    ...conv,
                    otherUser: otherMemberUsers[0],
                    otherUsers: otherMemberUsers,
                    lastMessage,
                    unreadCount: unreadMessages.length,
                };
            })
        );

        return results
            .filter((r): r is NonNullable<typeof r> => r !== null)
            .sort((a, b) => (b.lastMessage?._creationTime || b._creationTime) - (a.lastMessage?._creationTime || a._creationTime));
    },
});

// ── Mark conversation as read ─────────────────────────────────────────────────
export const markAsRead = mutation({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return;

        const membership = await ctx.db
            .query("conversationMembers")
            .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
            .filter((q: any) => q.eq(q.field("conversationId"), args.conversationId))
            .unique();

        if (membership) {
            await ctx.db.patch(membership._id, { lastReadTime: Date.now() });
        }
    },
});

// ── Shared helper functions ───────────────────────────────────────────────────
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

// ── Get read status for all members of a conversation ─────────────────────────
export const getReadStatus = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return {};

        const isMember = await checkMembership(ctx, args.conversationId, user._id);
        if (!isMember) return {};

        const memberships = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversationId", (q: any) => q.eq("conversationId", args.conversationId))
            .collect();

        const result: Record<string, number> = {};
        for (const m of memberships) {
            if (m.userId !== user._id) {
                result[m.userId] = m.lastReadTime;
            }
        }
        return result;
    },
});

