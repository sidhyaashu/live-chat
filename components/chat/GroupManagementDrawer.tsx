'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Users, Camera, Link2, Copy, Check, Crown, LogOut, Settings, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AddMemberModal } from './AddMemberModal';

interface GroupManagementDrawerProps {
    conversationId: Id<"conversations">;
    open: boolean;
    onClose: () => void;
}

export function GroupManagementDrawer({ conversationId, open, onClose }: GroupManagementDrawerProps) {
    const router = useRouter();
    const group = useQuery(api.conversations.getGroupDetails, { conversationId });
    const updateGroup = useMutation(api.conversations.updateGroup);
    const generateInviteCode = useMutation(api.conversations.generateInviteCode);
    const leaveGroup = useMutation(api.conversations.leaveGroup);

    const [editingName, setEditingName] = useState(false);
    const [name, setName] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [editingImage, setEditingImage] = useState(false);
    const [inviteCode, setInviteCode] = useState<string | null>(group?.inviteCode ?? null);
    const [copied, setCopied] = useState(false);
    const [showLeaveDialog, setShowLeaveDialog] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);

    const handleGenerateInvite = async () => {
        const code = await generateInviteCode({ conversationId });
        setInviteCode(code);
    };

    const handleCopyLink = async () => {
        const url = `${window.location.origin}/join/${inviteCode ?? group?.inviteCode}`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveName = async () => {
        if (!name.trim()) return;
        setSaving(true);
        await updateGroup({ conversationId, name: name.trim() });
        setSaving(false);
        setEditingName(false);
    };

    const handleSaveImage = async () => {
        setSaving(true);
        await updateGroup({ conversationId, imageUrl: imageUrl.trim() });
        setSaving(false);
        setEditingImage(false);
    };

    const handleLeave = async () => {
        await leaveGroup({ conversationId });
        onClose();
        router.push('/');
    };

    if (!group) return null;

    const inviteLinkAvailable = inviteCode || group.inviteCode;

    return (
        <>
            <Sheet open={open} onOpenChange={onClose}>
                <SheetContent side="right" className="w-full sm:w-96 p-0 overflow-y-auto">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Group Settings</SheetTitle>
                        <SheetDescription>Manage group members, name, image, and invite links.</SheetDescription>
                    </SheetHeader>

                    {/* Hero section */}
                    <div className="bg-gradient-to-b from-primary/10 to-transparent pt-8 pb-4 flex flex-col items-center gap-3">
                        <div className="relative">
                            {group.imageUrl ? (
                                <img
                                    src={group.imageUrl}
                                    alt={group.name ?? 'Group'}
                                    className="h-24 w-24 rounded-full object-cover border-4 border-white dark:border-zinc-900 shadow"
                                />
                            ) : (
                                <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center border-4 border-white dark:border-zinc-900 shadow">
                                    <Users className="h-12 w-12 text-primary" />
                                </div>
                            )}
                            <button
                                onClick={() => { setEditingImage(true); setImageUrl(group.imageUrl ?? ''); }}
                                className="absolute bottom-0 right-0 bg-white dark:bg-zinc-800 border rounded-full p-1.5 shadow hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
                                aria-label="Change group image"
                            >
                                <Camera className="h-4 w-4 text-zinc-600" />
                            </button>
                        </div>

                        {editingName ? (
                            <div className="flex items-center gap-2 px-6 w-full">
                                <input
                                    autoFocus
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                                    className="flex-1 text-center text-lg font-bold bg-white dark:bg-zinc-800 border rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <button onClick={handleSaveName} disabled={saving} className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-medium">
                                    {saving ? '...' : 'Save'}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => { setEditingName(true); setName(group.name ?? ''); }}
                                className="flex items-center gap-1.5 group/name"
                            >
                                <span className="text-xl font-bold">{group.name ?? 'Group Chat'}</span>
                                <Settings className="h-4 w-4 text-zinc-400 opacity-0 group-hover/name:opacity-100 transition" />
                            </button>
                        )}

                        <p className="text-xs text-zinc-500">
                            {group.members?.length ?? 0} members · Created by group admin
                        </p>
                    </div>

                    {/* Image URL edit */}
                    {editingImage && (
                        <div className="mx-4 mb-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border space-y-2">
                            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Group Image URL</p>
                            <input
                                autoFocus
                                type="url"
                                value={imageUrl}
                                onChange={e => setImageUrl(e.target.value)}
                                placeholder="https://example.com/image.png"
                                className="w-full text-sm bg-white dark:bg-zinc-900 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <div className="flex gap-2">
                                <button onClick={handleSaveImage} disabled={saving} className="flex-1 bg-primary text-white text-sm py-1.5 rounded-lg font-medium">
                                    {saving ? 'Saving...' : 'Save Image'}
                                </button>
                                <button onClick={() => setEditingImage(false)} className="flex-1 text-sm py-1.5 rounded-lg border font-medium">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Invite link */}
                    <div className="mx-4 mb-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border space-y-2">
                        <div className="flex items-center gap-2">
                            <Link2 className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold">Invite Link</span>
                        </div>
                        {inviteLinkAvailable ? (
                            <div className="flex items-center gap-2">
                                <code className="text-xs bg-white dark:bg-zinc-900 border rounded px-2 py-1 flex-1 truncate">
                                    {`${typeof window !== 'undefined' ? window.location.origin : ''}/join/${inviteCode ?? group.inviteCode}`}
                                </code>
                                <button
                                    onClick={handleCopyLink}
                                    className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                                    aria-label="Copy invite link"
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleGenerateInvite}
                                className="w-full text-sm text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 py-2 rounded-lg font-medium transition"
                            >
                                Generate Invite Link
                            </button>
                        )}
                    </div>

                    {/* Members */}
                    <div className="mx-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                                Members ({group.members?.length ?? 0})
                            </h3>
                            <button
                                onClick={() => setShowAddMember(true)}
                                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition"
                                aria-label="Add member"
                            >
                                <UserPlus className="h-4 w-4 text-zinc-500" />
                            </button>
                        </div>
                        <div className="space-y-1">
                            {group.members?.map((member: any) => (
                                <div key={member._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">
                                    <div className="relative shrink-0">
                                        <img
                                            src={member.imageUrl || '/placeholder-user.png'}
                                            alt={member.name}
                                            className="h-9 w-9 rounded-full object-cover"
                                        />
                                        {member.isOnline && (
                                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-medium text-sm truncate">
                                                {member.name}{member.isMe ? ' (You)' : ''}
                                            </span>
                                            {member.role === 'admin' && (
                                                <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                            )}
                                        </div>
                                        <span className="text-xs text-zinc-500">
                                            {member.isOnline ? (
                                                <span className="text-green-600">Online</span>
                                            ) : 'Offline'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Danger zone */}
                    <div className="mx-4 mb-8">
                        <button
                            onClick={() => setShowLeaveDialog(true)}
                            className="w-full flex items-center justify-center gap-2 text-red-600 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 py-2.5 rounded-xl text-sm font-medium transition"
                        >
                            <LogOut className="h-4 w-4" />
                            Leave Group
                        </button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Leave Confirmation */}
            <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Leave &ldquo;{group.name}&rdquo;?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You will no longer receive messages from this group. Others will be notified that you left.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLeave} className="bg-red-600 hover:bg-red-700 text-white">
                            Leave Group
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {showAddMember && (
                <AddMemberModal
                    conversationId={conversationId}
                    onClose={() => setShowAddMember(false)}
                    existingMemberIds={group.members?.map((m: any) => m._id) ?? []}
                />
            )}
        </>
    );
}
