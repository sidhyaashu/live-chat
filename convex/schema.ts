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
        name: v.optional(v.string()),         // Group chat name
        isGroup: v.boolean(),
        lastMessageId: v.optional(v.id("messages")),
        imageUrl: v.optional(v.string()),     // Group avatar image URL
        inviteCode: v.optional(v.string()),   // Short code for invite links
        creatorId: v.optional(v.id("users")), // Original group creator
    }).index("by_inviteCode", ["inviteCode"]),

    conversationMembers: defineTable({
        conversationId: v.id("conversations"),
        userId: v.id("users"),
        lastReadTime: v.number(),
        role: v.optional(v.union(v.literal("admin"), v.literal("member"))),
    }).index("by_conversationId", ["conversationId"])
        .index("by_userId", ["userId"]),

    messages: defineTable({
        conversationId: v.id("conversations"),
        senderId: v.id("users"),
        content: v.string(),
        type: v.union(v.literal("text"), v.literal("system")),
        deleted: v.boolean(),
        // Image attachment (Convex File Storage)
        imageStorageId: v.optional(v.id("_storage")),
        // Reply threading
        replyToMessageId: v.optional(v.id("messages")),
        // Cached Open Graph link preview
        linkPreview: v.optional(v.object({
            url: v.string(),
            title: v.optional(v.string()),
            description: v.optional(v.string()),
            image: v.optional(v.string()),
            siteName: v.optional(v.string()),
        })),
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

    messageRequests: defineTable({
        fromUserId: v.id("users"),
        toUserId: v.id("users"),
        status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("declined")),
    }).index("by_toUserId", ["toUserId"])
        .index("by_fromUserId", ["fromUserId"])
        .index("by_pair", ["fromUserId", "toUserId"]),
});
