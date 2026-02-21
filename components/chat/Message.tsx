'use client';

import { format, isToday, isThisYear } from 'date-fns';
import { cn } from '@/lib/utils';
import { Trash2, Smile } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useState } from 'react';

interface ReactionData {
    _id: Id<"reactions">;
    messageId: Id<"messages">;
    userId: Id<"users">;
    emoji: string;
}

interface MessageProps {
    id: Id<"messages">;
    content: string;
    senderName: string;
    senderImage: string;
    isMe: boolean;
    timestamp: number;
    isDeleted?: boolean;
    reactions: ReactionData[];
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢'];

export function Message({ id, content, senderName, senderImage, isMe, timestamp, isDeleted, reactions }: MessageProps) {
    const [showReactions, setShowReactions] = useState(false);
    const deleteMessage = useMutation(api.messages.remove);
    const toggleReaction = useMutation(api.reactions.toggleReaction);

    const formatTimestamp = (ts: number) => {
        const date = new Date(ts);
        if (isToday(date)) return format(date, 'h:mm a');
        if (isThisYear(date)) return format(date, 'MMM d, h:mm a');
        return format(date, 'MMM d yyyy, h:mm a');
    };

    // Aggregate reaction counts — properly typed
    const reactionCounts = reactions.reduce<Record<string, number>>((acc, r) => {
        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className={cn("group flex gap-3 mb-4 relative", isMe ? "flex-row-reverse" : "flex-row")}>
            <img
                src={senderImage || '/placeholder-user.png'}
                alt={senderName}
                className="h-8 w-8 rounded-full self-end mb-1 shrink-0 object-cover"
            />
            <div className={cn("max-w-[70%] flex flex-col", isMe ? "items-end" : "items-start")}>
                <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-xs font-medium text-zinc-500">{senderName}</span>
                    <span className="text-[10px] text-zinc-400">{formatTimestamp(timestamp)}</span>
                </div>
                <div className="relative">
                    <div className={cn(
                        "px-4 py-2 rounded-2xl text-sm shadow-sm break-words max-w-full",
                        isMe ? "bg-primary text-primary-foreground rounded-br-none" : "bg-zinc-100 dark:bg-zinc-800 rounded-bl-none",
                        isDeleted && "italic opacity-60"
                    )}>
                        {content}
                    </div>

                    {/* Hover Actions */}
                    {!isDeleted && (
                        <div className={cn(
                            "absolute top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                            isMe ? "right-full mr-2" : "left-full ml-2"
                        )}>
                            <button
                                onClick={() => setShowReactions(!showReactions)}
                                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
                                aria-label="React to message"
                            >
                                <Smile className="h-4 w-4" />
                            </button>
                            {isMe && (
                                <button
                                    onClick={() => deleteMessage({ messageId: id })}
                                    className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full text-zinc-400 hover:text-red-500 transition"
                                    aria-label="Delete message"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Reaction Picker */}
                    {showReactions && (
                        <div className={cn(
                            "absolute bottom-full mb-2 bg-white dark:bg-zinc-800 border rounded-full p-1 shadow-lg flex gap-1 z-20",
                            isMe ? "right-0" : "left-0"
                        )}>
                            {EMOJIS.map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={() => {
                                        toggleReaction({ messageId: id, emoji });
                                        setShowReactions(false);
                                    }}
                                    className="hover:scale-125 transition p-1 text-base"
                                    aria-label={`React with ${emoji}`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Reaction Bar */}
                {Object.keys(reactionCounts).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(reactionCounts).map(([emoji, count]) => (
                            <button
                                key={emoji}
                                onClick={() => toggleReaction({ messageId: id, emoji })}
                                className="bg-white dark:bg-zinc-800 border hover:border-primary rounded-full px-1.5 py-0.5 text-[11px] shadow-sm flex items-center gap-0.5 transition"
                                aria-label={`${count} ${emoji} reaction${count > 1 ? 's' : ''}`}
                            >
                                {emoji}{count > 1 && <span className="ml-0.5 font-medium">{count}</span>}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
