import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── Store / upsert user on login ─────────────────────────────────────────────
export const storeUser = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        imageUrl: v.string(),
        clerkId: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            // JWT template not configured or Convex auth misconfigured —
            // throw so callers can surface a real error rather than silently fail.
            throw new Error(
                "Convex authentication failed. Make sure the Clerk JWT template named 'convex' exists in your Clerk dashboard."
            );
        }

        const existing = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .unique();

        if (existing !== null) {
            // Update profile fields on every login
            await ctx.db.patch(existing._id, {
                name: args.name,
                imageUrl: args.imageUrl,
                isOnline: true,
                lastSeen: Date.now(),
            });
            return existing._id;
        }

        // First login — create the record
        return await ctx.db.insert("users", {
            name: args.name,
            email: args.email,
            imageUrl: args.imageUrl,
            clerkId: args.clerkId,
            isOnline: true,
            lastSeen: Date.now(),
        });
    },
});

// ── Mark user offline on logout / tab close ──────────────────────────────────
export const setOffline = mutation({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .unique();
        if (user) {
            await ctx.db.patch(user._id, { isOnline: false, lastSeen: Date.now() });
        }
    },
});

// ── Get all users except self (no search term needed) ────────────────────────
export const getUsers = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) return [];

        return await ctx.db
            .query("users")
            .filter((q) => q.neq(q.field("_id"), currentUser._id))
            .collect();
    },
});

// ── Search users by name (empty string returns all) ──────────────────────────
export const searchUsers = query({
    args: { searchTerm: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) return [];

        const allUsers = await ctx.db.query("users").collect();
        const term = args.searchTerm.toLowerCase().trim();

        return allUsers.filter(
            (user) =>
                user._id !== currentUser._id &&
                // If no search term, return everyone
                (term === "" || user.name.toLowerCase().includes(term))
        );
    },
});

// ── Check if the current user's Convex record exists ─────────────────────────
export const getCurrentUserStatus = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return { convexAuthenticated: false, hasRecord: false };
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        return { convexAuthenticated: true, hasRecord: !!user };
    },
});

// ── Update current user's display name ────────────────────────────────────────
export const updateProfile = mutation({
    args: { name: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");
        await ctx.db.patch(user._id, { name: args.name.trim() });
    },
});

// ── Get the current authenticated user ────────────────────────────────────────
export const getMe = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        return await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
    },
});

