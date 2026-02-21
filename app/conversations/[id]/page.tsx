'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams, useRouter } from 'next/navigation';
import { ChatLayout } from '@/components/chat/ChatLayout';
import { Message } from '@/components/chat/Message';
import { MessageInput } from '@/components/chat/MessageInput';
import { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronLeft, Users, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Id } from '@/convex/_generated/dataModel';
import { GroupManagementDrawer } from '@/components/chat/GroupManagementDrawer';

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const conversationId = params.id as Id<"conversations">;

    const messages = useQuery(api.messages.list, { conversationId });
    const conversations = useQuery(api.conversations.getConversations);
    const presence = useQuery(api.presence.getPresence, { conversationId });
    const reactions = useQuery(api.reactions.getReactions, {
        messageIds: messages?.map(m => m._id) ?? [],
    });
    const markAsRead = useMutation(api.conversations.markAsRead);
    const me = useQuery(api.users.getMe);
    const [showGroupManagement, setShowGroupManagement] = useState(false);

    const conversation = conversations?.find(c => c._id === conversationId);

    const typingParticipants = presence?.filter(p => p.isTyping) || [];
    const typingDisplay = typingParticipants.length === 0 ? null :
        typingParticipants.length === 1 ? `${typingParticipants[0].user?.name} is typing...` :
            typingParticipants.length === 2 ? `${typingParticipants[0].user?.name} and ${typingParticipants[1].user?.name} are typing...` :
                `${typingParticipants[0].user?.name} and ${typingParticipants.length - 1} others are typing...`;

    const scrollRef = useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);

    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, []);

    useEffect(() => {
        if (conversationId) {
            markAsRead({ conversationId });
        }
    }, [conversationId, messages, markAsRead]);

    useEffect(() => {
        if (!scrollRef.current) return;
        const isAtBottom =
            scrollRef.current.scrollHeight - scrollRef.current.scrollTop <= scrollRef.current.clientHeight + 100;
        if (isAtBottom) {
            scrollToBottom();
        } else {
            setShowScrollButton(true);
        }
    }, [messages, typingParticipants, scrollToBottom]);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const isAtBottom =
            scrollRef.current.scrollHeight - scrollRef.current.scrollTop <= scrollRef.current.clientHeight + 100;
        setShowScrollButton(!isAtBottom);
        if (isAtBottom) setShowScrollButton(false);
    };

    // ── Loading state ──────────────────────────────────────────────────────────
    if (conversations === undefined) {
        return (
            <ChatLayout>
                <div className="flex-1 flex flex-col animate-pulse">
                    {/* Header skeleton */}
                    <div className="p-4 border-b flex items-center gap-3 bg-white dark:bg-zinc-900">
                        <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                        <div className="space-y-1.5 flex-1">
                            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/4" />
                            <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/6" />
                        </div>
                    </div>
                    {/* Messages skeleton */}
                    <div className="flex-1 p-4 space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                                <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0" />
                                <div className={`h-10 rounded-2xl bg-zinc-200 dark:bg-zinc-700 ${i % 2 === 0 ? 'w-1/3' : 'w-2/5'}`} />
                            </div>
                        ))}
                    </div>
                </div>
            </ChatLayout>
        );
    }

    // ── Not found state ────────────────────────────────────────────────────────
    if (!conversation) {
        return (
            <ChatLayout>
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-full">
                        <MessageSquare className="h-12 w-12 text-zinc-400" />
                    </div>
                    <h2 className="text-xl font-bold">Conversation not found</h2>
                    <p className="text-zinc-500 text-sm">This conversation doesn&apos;t exist or you&apos;re not a member.</p>
                    <Link href="/" className="text-sm text-primary underline underline-offset-4">Go back home</Link>
                </div>
            </ChatLayout>
        );
    }

    const otherUser = conversation.otherUser;

    return (
        <ChatLayout>
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-white dark:bg-zinc-900 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    {/* Mobile back button */}
                    <button
                        onClick={() => router.push('/')}
                        className="md:hidden p-1 -ml-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition"
                        aria-label="Back"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        onClick={() => conversation.isGroup && setShowGroupManagement(true)}
                        className={`flex items-center gap-3 transition-opacity ${conversation.isGroup ? 'hover:opacity-80 active:opacity-60 cursor-pointer' : ''}`}
                    >
                        {conversation.isGroup ? (
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                                {conversation.imageUrl ? (
                                    <img src={conversation.imageUrl} alt={conversation.name || 'Group'} className="h-full w-full object-cover" />
                                ) : (
                                    <Users className="h-6 w-6 text-primary" />
                                )}
                            </div>
                        ) : (
                            <div className="relative shrink-0">
                                <img
                                    src={otherUser?.imageUrl || '/placeholder-user.png'}
                                    alt={otherUser?.name || 'User'}
                                    className="h-10 w-10 rounded-full object-cover"
                                />
                                {otherUser?.isOnline && (
                                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                                )}
                            </div>
                        )}
                        <div className="text-left">
                            <div className="font-bold leading-tight">
                                {conversation.isGroup ? (conversation.name || 'Group Chat') : (otherUser?.name || 'User')}
                            </div>
                            <div className="text-[10px] text-zinc-500 flex items-center gap-1 uppercase font-semibold tracking-wider">
                                {!conversation.isGroup && (
                                    otherUser?.isOnline
                                        ? <><span className="h-1.5 w-1.5 bg-green-500 rounded-full inline-block" /> Online</>
                                        : 'Offline'
                                )}
                                {conversation.isGroup && `${(conversation.otherUsers?.length || 0) + 1} members`}
                            </div>
                        </div>
                    </button>
                </div>
                {/* Profile Link (Desktop Shortcut) */}
                <Link
                    href="/profile"
                    className="hidden md:flex text-xs text-zinc-400 hover:text-primary transition"
                >
                    My Profile
                </Link>
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 bg-zinc-50 dark:bg-zinc-950 relative"
            >
                {/* Messages loading */}
                {messages === undefined && (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                                <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0" />
                                <div className={`h-12 rounded-2xl bg-zinc-200 dark:bg-zinc-700 ${i % 2 === 0 ? 'w-1/3' : 'w-2/5'}`} />
                            </div>
                        ))}
                    </div>
                )}

                {messages?.map((msg: any) => (
                    <Message
                        key={msg._id}
                        id={msg._id}
                        content={msg.content}
                        senderId={msg.senderId}
                        senderName={msg.senderName}
                        senderImage={msg.senderImage}
                        isMe={msg.isMe}
                        type={msg.type || 'text'}
                        deleted={msg.deleted}
                        createdAt={msg._creationTime}
                        reactions={reactions?.[msg._id] || []}
                        currentUserId={me?._id as Id<"users">}
                        isGroup={conversation.isGroup}
                    />
                ))}

                {/* Typing indicator */}
                {typingDisplay && (
                    <div className="flex gap-2 items-center text-xs text-zinc-500 italic mb-4">
                        <div className="flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span>{typingDisplay}</span>
                    </div>
                )}

                {/* Empty state */}
                {messages?.length === 0 && !typingDisplay && (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-400 gap-2">
                        <MessageSquare className="h-10 w-10 text-zinc-300" />
                        <p className="font-medium">No messages yet</p>
                        <p className="text-sm">Send a message to start the conversation!</p>
                    </div>
                )}

                {/* Scroll-to-bottom button */}
                {showScrollButton && (
                    <button
                        onClick={() => { scrollToBottom(); setShowScrollButton(false); }}
                        className="sticky bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-800 shadow-lg border rounded-full px-4 py-2 flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-2 z-10"
                    >
                        <span>↓ New messages</span>
                    </button>
                )}
            </div>

            {/* Input */}
            <MessageInput conversationId={conversationId} />

            {/* Group Management Drawer */}
            {conversation.isGroup && (
                <GroupManagementDrawer
                    conversationId={conversationId}
                    open={showGroupManagement}
                    onClose={() => setShowGroupManagement(false)}
                />
            )}
        </ChatLayout>
    );
}

