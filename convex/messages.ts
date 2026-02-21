import { v } from "convex/values";
import { mutation, query, internalAction, internalMutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { getCurrentUser, checkMembership } from "./conversations";
import { internal } from "./_generated/api";

// ── Send a message ─────────────────────────────────────────────────────────────
export const send = mutation({
    args: {
        conversationId: v.id("conversations"),
        content: v.string(),
        imageStorageId: v.optional(v.id("_storage")),
        replyToMessageId: v.optional(v.id("messages")),
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
            imageStorageId: args.imageStorageId,
            replyToMessageId: args.replyToMessageId,
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

        // Detect URLs and schedule a link preview fetch
        // Strip trailing punctuation that commonly gets included in URL regex matches
        const urlRegex = /(https?:\/\/[^\s]+?)(?:[.,)\]]+)?$/gm;
        const urls = args.content.match(/(https?:\/\/[^\s.,)\]]+)/g);
        if (urls && urls.length > 0 && !args.imageStorageId) {
            await ctx.scheduler.runAfter(0, internal.messages.fetchLinkPreviewAndPatch, {
                messageId,
                url: urls[0],
            });
        }

        return messageId;
    },
});

// ── Paginated message list ─────────────────────────────────────────────────────
export const list = query({
    args: {
        conversationId: v.id("conversations"),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return { page: [], isDone: true, continueCursor: "" };

        const isMember = await checkMembership(ctx, args.conversationId, user._id);
        if (!isMember) return { page: [], isDone: true, continueCursor: "" };

        const result = await ctx.db
            .query("messages")
            .withIndex("by_conversationId", (q: any) => q.eq("conversationId", args.conversationId))
            .order("desc")
            .paginate(args.paginationOpts);

        const enrichedPage = await Promise.all(
            result.page.map(async (msg) => {
                const sender = await ctx.db.get(msg.senderId);

                // Resolve reply-to message data
                let replyToMessage: {
                    senderName: string;
                    content: string;
                    imageStorageId?: string;
                } | null = null;
                if (msg.replyToMessageId) {
                    const replyMsg = await ctx.db.get(msg.replyToMessageId);
                    if (replyMsg) {
                        const replySender = await ctx.db.get(replyMsg.senderId);
                        replyToMessage = {
                            senderName: replySender?.name || "Unknown",
                            content: replyMsg.deleted ? "This message was deleted" : replyMsg.content,
                            imageStorageId: replyMsg.imageStorageId as string | undefined,
                        };
                    }
                }

                return {
                    ...msg,
                    senderName: sender?.name || "Unknown User",
                    senderImage: sender?.imageUrl || "",
                    isMe: msg.senderId === user._id,
                    replyToMessage,
                };
            })
        );

        return { ...result, page: enrichedPage };
    },
});

// ── Soft-delete a message ──────────────────────────────────────────────────────
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

        // Cleanup reactions for deleted message
        const reactions = await ctx.db
            .query("reactions")
            .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
            .collect();

        for (const reaction of reactions) {
            await ctx.db.delete(reaction._id);
        }
    },
});

// ── Generate upload URL for image attachments ──────────────────────────────────
export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");
        return await ctx.storage.generateUploadUrl();
    },
});

// ── Get signed URL for an image in storage ─────────────────────────────────────
export const getImageUrl = query({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return null; // Auth guard: unauthenticated users cannot access storage
        return await ctx.storage.getUrl(args.storageId);
    },
});


// ── Internal action: HTTP fetch OG tags then patch message ────────────────────
export const fetchLinkPreviewAndPatch = internalAction({
    args: {
        messageId: v.id("messages"),
        url: v.string(),
    },
    handler: async (ctx: any, args: { messageId: any; url: string }) => {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(args.url, {
                signal: controller.signal,
                headers: { "User-Agent": "LiveChatBot/1.0 (link preview)" },
            });
            clearTimeout(timeout);

            if (!res.ok) return;
            const html = await res.text();

            const getOg = (property: string) => {
                const match = html.match(
                    new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]+content=["']([^"']+)["']`, "i")
                ) ||
                    html.match(
                        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${property}["']`, "i")
                    );
                return match?.[1]?.trim() || undefined;
            };

            const getMeta = (name: string) => {
                const match = html.match(
                    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "i")
                );
                return match?.[1]?.trim() || undefined;
            };

            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

            const preview = {
                url: args.url,
                title: getOg("title") || getMeta("title") || titleMatch?.[1]?.trim(),
                description: getOg("description") || getMeta("description"),
                image: getOg("image"),
                siteName: getOg("site_name"),
            };

            // Only store if we got at least a title
            if (preview.title) {
                await ctx.runMutation(internal.messages.patchLinkPreview, {
                    messageId: args.messageId,
                    linkPreview: preview,
                });
            }
        } catch {
            // Network error or timeout — silently ignore
        }
    },
});

// ── Internal mutation: patch a message with link preview data ─────────────────
export const patchLinkPreview = internalMutation({
    args: {
        messageId: v.id("messages"),
        linkPreview: v.object({
            url: v.string(),
            title: v.optional(v.string()),
            description: v.optional(v.string()),
            image: v.optional(v.string()),
            siteName: v.optional(v.string()),
        }),
    },
    handler: async (ctx, args) => {
        const message = await ctx.db.get(args.messageId);
        if (!message || message.deleted) return;
        await ctx.db.patch(args.messageId, { linkPreview: args.linkPreview });
    },
});
