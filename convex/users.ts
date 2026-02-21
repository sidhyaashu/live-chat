import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
            return null;
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .unique();

        if (user !== null) {
            // If user exists, update their profile
            await ctx.db.patch(user._id, {
                name: args.name,
                imageUrl: args.imageUrl,
                lastSeen: Date.now(),
            });
            return user._id;
        }

        // If user doesn't exist, create a new one
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

        const users = await ctx.db.query("users").collect();

        return users.filter(
            (user) =>
                user._id !== currentUser._id &&
                user.name.toLowerCase().includes(args.searchTerm.toLowerCase())
        );
    },
});
