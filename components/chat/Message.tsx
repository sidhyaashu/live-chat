'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Trash2, SmilePlus } from 'lucide-react';
import { format } from 'date-fns';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type ReactionData = {
    _id: Id<"reactions">;
    emoji: string;
    userId: Id<"users">;
};

type MessageProps = {
    id: Id<"messages">;
    content: string;
    senderId: Id<"users">;
    senderName: string;
    senderImage: string;
    isMe: boolean;
    type: 'text' | 'system';
    deleted: boolean;
    createdAt: number;
    reactions: ReactionData[];
    currentUserId: Id<"users">;
    isGroup: boolean;
};

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

export function Message({
    id, content, senderName, senderImage, isMe, type, deleted,
    createdAt, reactions, currentUserId, isGroup,
}: MessageProps) {
    const [showPicker, setShowPicker] = useState(false);
    const removeMessage = useMutation(api.messages.remove);
    const toggleReaction = useMutation(api.reactions.toggleReaction);

    // ── System message (join/leave/rename) ────────────────────────────────────
    if (type === 'system') {
        return (
            <div className="flex items-center justify-center my-2 px-4">
                <div className="flex items-center gap-2 max-w-[80%]">
                    <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 text-center px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full whitespace-nowrap">
                        {content}
                        <span className="ml-2 opacity-60">{format(new Date(createdAt), 'MMM d')}</span>
                    </span>
                    <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
                </div>
            </div>
        );
    }

    // ── Count reactions ───────────────────────────────────────────────────────
    const reactionCounts = reactions.reduce<Record<string, { count: number; isMine: boolean }>>(
        (acc, r) => {
            if (!acc[r.emoji]) acc[r.emoji] = { count: 0, isMine: false };
            acc[r.emoji].count++;
            if (r.userId === currentUserId) acc[r.emoji].isMine = true;
            return acc;
        },
        {}
    );

    return (
        <div className={`flex gap-2 group ${isMe ? 'flex-row-reverse' : ''} items-end mb-1`}>
            {/* Avatar */}
            {!isMe && (
                <img
                    src={senderImage || '/placeholder-user.png'}
                    alt={senderName}
                    className="h-7 w-7 rounded-full object-cover shrink-0 mb-1"
                />
            )}

            {/* Bubble + reactions */}
            <div className={`flex flex-col gap-1 max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                {/* Sender name in groups */}
                {!isMe && isGroup && (
                    <span className="text-xs font-semibold text-zinc-500 px-1">{senderName}</span>
                )}

                <div className="relative">
                    {/* Action toolbar (hover) */}
                    {!deleted && (
                        <div className={`absolute top-0 -translate-y-1/2 ${isMe ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'} hidden group-hover:flex items-center gap-1 z-10`}>
                            <button
                                onClick={() => setShowPicker(!showPicker)}
                                className="p-1.5 bg-white dark:bg-zinc-800 border rounded-lg shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
                                aria-label="Add reaction"
                            >
                                <SmilePlus className="h-3.5 w-3.5 text-zinc-500" />
                            </button>
                            {isMe && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <button
                                            className="p-1.5 bg-white dark:bg-zinc-800 border rounded-lg shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                            aria-label="Delete message"
                                        >
                                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                        </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete this message?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This message will be marked as deleted for everyone in the conversation. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => removeMessage({ messageId: id })}
                                                className="bg-red-600 hover:bg-red-700 text-white"
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    )}

                    {/* Emoji picker */}
                    {showPicker && (
                        <div className={`absolute bottom-full mb-1 ${isMe ? 'right-0' : 'left-0'} bg-white dark:bg-zinc-800 border rounded-xl shadow-lg p-1.5 flex gap-1 z-20`}>
                            {EMOJIS.map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={() => {
                                        toggleReaction({ messageId: id, emoji });
                                        setShowPicker(false);
                                    }}
                                    className="text-lg hover:scale-125 transition-transform p-0.5 rounded"
                                    aria-label={`React with ${emoji}`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Message bubble */}
                    <div className={`px-3 py-2 rounded-2xl text-sm break-words ${isMe
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-white dark:bg-zinc-800 border rounded-bl-sm'
                        } ${deleted ? 'opacity-60' : ''}`}>
                        {deleted ? (
                            <span className="italic text-xs">🗑 This message was deleted</span>
                        ) : (
                            content
                        )}
                    </div>
                </div>

                {/* Reactions */}
                {Object.entries(reactionCounts).length > 0 && (
                    <div className="flex flex-wrap gap-1 px-1">
                        {Object.entries(reactionCounts).map(([emoji, data]) => (
                            <button
                                key={emoji}
                                onClick={() => toggleReaction({ messageId: id, emoji })}
                                className={`flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full border transition ${data.isMine
                                        ? 'bg-primary/10 border-primary/30 text-primary'
                                        : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                                    }`}
                                aria-label={`${emoji} reaction by ${data.count} people`}
                            >
                                <span>{emoji}</span>
                                <span className="font-medium">{data.count}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Timestamp */}
                <span className="text-[10px] text-zinc-400 px-1">
                    {format(new Date(createdAt), 'h:mm a')}
                </span>
            </div>
        </div>
    );
}
