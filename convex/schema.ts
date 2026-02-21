import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        imageUrl: v.string(),
        clerkId: v.string(),
        isOnline: v.boolean(),
        lastSeen: v.number(),
    }).index("by_clerkId", ["clerkId"]),

    conversations: defineTable({
        name: v.optional(v.string()), // For group chats
        isGroup: v.boolean(),
        lastMessageId: v.optional(v.id("messages")),
    }),

    conversationMembers: defineTable({
        conversationId: v.id("conversations"),
        userId: v.id("users"),
        lastReadTime: v.number(),
    }).index("by_conversationId", ["conversationId"])
        .index("by_userId", ["userId"]),

    messages: defineTable({
        conversationId: v.id("conversations"),
        senderId: v.id("users"),
        content: v.string(),
        type: v.union(v.literal("text"), v.literal("system")),
        deleted: v.boolean(),
    }).index("by_conversationId", ["conversationId"]),

    reactions: defineTable({
        messageId: v.id("messages"),
        userId: v.id("users"),
        emoji: v.string(),
    }).index("by_messageId", ["messageId"]),

    presence: defineTable({
        userId: v.id("users"),
        isTyping: v.boolean(),
        conversationId: v.optional(v.id("conversations")),
        lastActive: v.number(),
    }).index("by_userId", ["userId"])
        .index("by_conversationId", ["conversationId"]),
});
