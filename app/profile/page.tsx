'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import { Camera, Save, User } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
    const { user: clerkUser } = useUser();
    const me = useQuery(api.users.getMe);
    const updateProfile = useMutation(api.users.updateProfile);

    const [name, setName] = useState('');
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleEdit = () => {
        setName(me?.name ?? clerkUser?.fullName ?? '');
        setEditing(true);
        setSaved(false);
    };

    const handleSave = async () => {
        if (!name.trim()) return;
        setSaving(true);
        await updateProfile({ name: name.trim() });
        setSaving(false);
        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 border-b px-6 py-4 flex items-center gap-4">
                <Link href="/" className="text-sm text-primary hover:underline">← Back to Chat</Link>
                <h1 className="text-xl font-bold flex-1">Profile Settings</h1>
            </div>

            <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
                {/* Avatar Section — managed by Clerk */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border p-6">
                    <h2 className="font-semibold text-sm uppercase text-zinc-500 tracking-wider mb-4">Profile Photo</h2>
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <img
                                src={clerkUser?.imageUrl ?? '/placeholder-user.png'}
                                alt={me?.name ?? 'You'}
                                className="h-20 w-20 rounded-full object-cover border-4 border-zinc-100 dark:border-zinc-800"
                            />
                            <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5 border-2 border-white dark:border-zinc-900">
                                <Camera className="h-3.5 w-3.5 text-white" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium mb-1">{me?.name ?? clerkUser?.fullName}</p>
                            <p className="text-xs text-zinc-500 mb-3">Manage your avatar through your Clerk account settings.</p>
                            {/* Clerk's built-in profile management */}
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-zinc-400" />
                                <UserButton afterSignOutUrl="/" />
                                <span className="text-xs text-zinc-400">Click the avatar above to manage Clerk account</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Display Name Section */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border p-6">
                    <h2 className="font-semibold text-sm uppercase text-zinc-500 tracking-wider mb-4">Display Name</h2>
                    <p className="text-xs text-zinc-400 mb-4">
                        This is the name other users see in chats. It can differ from your Clerk account name.
                    </p>

                    {editing ? (
                        <div className="space-y-3">
                            <input
                                autoFocus
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
                                placeholder="Your display name"
                                className="w-full bg-zinc-50 dark:bg-zinc-800 border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                maxLength={50}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !name.trim()}
                                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 transition"
                                >
                                    <Save className="h-4 w-4" />
                                    {saving ? 'Saving...' : 'Save Name'}
                                </button>
                                <button
                                    onClick={() => setEditing(false)}
                                    className="px-4 py-2 rounded-xl text-sm font-medium border hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{me?.name ?? clerkUser?.fullName ?? 'Loading...'}</p>
                                {saved && <p className="text-xs text-green-600 mt-1">✓ Display name updated</p>}
                            </div>
                            <button
                                onClick={handleEdit}
                                className="text-sm text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition"
                            >
                                Edit
                            </button>
                        </div>
                    )}
                </div>

                {/* Email — read only from Clerk */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border p-6">
                    <h2 className="font-semibold text-sm uppercase text-zinc-500 tracking-wider mb-4">Email</h2>
                    <p className="text-sm font-medium">{clerkUser?.emailAddresses[0]?.emailAddress ?? 'No email'}</p>
                    <p className="text-xs text-zinc-400 mt-1">Email is managed through your Clerk account and cannot be changed here.</p>
                </div>

                {/* Account info */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border p-6">
                    <h2 className="font-semibold text-sm uppercase text-zinc-500 tracking-wider mb-4">Account</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Status</span>
                            <span className="text-green-600 font-medium">● Online</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Member since</span>
                            <span>{clerkUser?.createdAt ? new Date(clerkUser.createdAt).toLocaleDateString() : '—'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
