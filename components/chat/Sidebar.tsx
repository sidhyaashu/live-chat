'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Search, Plus, Users, MessageSquare } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export function Sidebar({ onOpenCreateGroup }: { onOpenCreateGroup: () => void }) {
    const [searchTerm, setSearchTerm] = useState('');
    const conversations = useQuery(api.conversations.getConversations);
    const users = useQuery(api.users.searchUsers, { searchTerm });
    const createConversation = useMutation(api.conversations.createOrGetConversation);
    const router = useRouter();

    const handleCreateChat = async (userId: any) => {
        const id = await createConversation({ participantId: userId });
        router.push(`/conversations/${id}`);
        setSearchTerm('');
    };

    const formatLastMessage = (conv: any) => {
        if (!conv.lastMessage) return 'No messages yet';
        if (conv.lastMessage.deleted) return '🗑 This message was deleted';
        return conv.lastMessage.content;
    };

    return (
        <div className="hidden md:flex flex-col h-full w-80 border-r bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b bg-white dark:bg-zinc-900 flex items-center justify-between">
                <h1 className="text-xl font-bold">Chats</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onOpenCreateGroup}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition"
                        title="Create Group"
                    >
                        <Plus className="h-5 w-5" />
                    </button>
                    <UserButton />
                </div>
            </div>

            {/* Search Bar */}
            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Results / Conversations */}
            <div className="flex-1 overflow-y-auto">
                {searchTerm ? (
                    <div className="px-4">
                        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Users</h2>
                        {/* Search loading state */}
                        {users === undefined && (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                                        <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0" />
                                        <div className="flex-1 space-y-1.5">
                                            <div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
                                            <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {users?.map((user) => (
                            <button
                                key={user._id}
                                onClick={() => handleCreateChat(user._id)}
                                className="w-full flex items-center gap-3 p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition"
                            >
                                <div className="relative shrink-0">
                                    <img src={user.imageUrl} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
                                    {user.isOnline && (
                                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                                    )}
                                </div>
                                <div className="text-left">
                                    <div className="font-medium">{user.name}</div>
                                    <div className="text-xs text-zinc-500">{user.email}</div>
                                </div>
                            </button>
                        ))}
                        {users?.length === 0 && (
                            <div className="text-center py-8 text-zinc-500 text-sm">
                                <Search className="h-8 w-8 mx-auto text-zinc-300 mb-2" />
                                No users found for &quot;{searchTerm}&quot;
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="px-2">
                        {/* Conversations loading state */}
                        {conversations === undefined && (
                            <div className="space-y-1 px-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                                        <div className="h-12 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
                                            <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {conversations?.map((conv) => (
                            <button
                                key={conv._id}
                                onClick={() => router.push(`/conversations/${conv._id}`)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition"
                            >
                                <div className="relative h-12 w-12 shrink-0">
                                    {conv.isGroup ? (
                                        <div className="h-full w-full rounded-full bg-primary/10 flex items-center justify-center">
                                            <Users className="h-6 w-6 text-primary" />
                                        </div>
                                    ) : (
                                        <img
                                            src={conv.otherUser?.imageUrl || '/placeholder-user.png'}
                                            alt={conv.otherUser?.name || 'User'}
                                            className="h-full w-full rounded-full object-cover"
                                        />
                                    )}
                                    {!conv.isGroup && conv.otherUser?.isOnline && (
                                        <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                                    )}
                                </div>
                                <div className="flex-1 text-left overflow-hidden">
                                    <div className="flex justify-between items-center gap-2">
                                        {/* FIX: Use conv.name for groups, otherUser.name for DMs */}
                                        <div className="font-medium truncate">
                                            {conv.isGroup ? (conv.name || 'Group Chat') : (conv.otherUser?.name || 'User')}
                                        </div>
                                        {/* FIX: Badge handles large numbers with min-w and 99+ cap */}
                                        {conv.unreadCount > 0 && (
                                            <div className="bg-primary text-primary-foreground text-[10px] font-bold min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full shrink-0">
                                                {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                            </div>
                                        )}
                                    </div>
                                    {/* FIX: Show deleted message preview with italic style */}
                                    <div className={`text-sm truncate ${conv.lastMessage?.deleted ? 'text-zinc-400 italic' : 'text-zinc-500'}`}>
                                        {formatLastMessage(conv)}
                                    </div>
                                </div>
                            </button>
                        ))}
                        {conversations?.length === 0 && (
                            <div className="text-center py-10">
                                <MessageSquare className="h-12 w-12 mx-auto text-zinc-300 mb-2" />
                                <p className="text-zinc-500">No conversations yet</p>
                                <p className="text-xs text-zinc-400 mt-1">Search for users to start chatting</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
