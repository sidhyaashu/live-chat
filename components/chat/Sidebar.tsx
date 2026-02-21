'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Search, Plus, Users, MessageSquare, UserRound } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

type Tab = 'chats' | 'people';

export function Sidebar({ onOpenCreateGroup }: { onOpenCreateGroup: () => void }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('chats');

    const conversations = useQuery(api.conversations.getConversations);
    // Always query users (empty searchTerm = all users)
    const users = useQuery(api.users.searchUsers, { searchTerm });
    const createConversation = useMutation(api.conversations.createOrGetConversation);
    const router = useRouter();

    const handleCreateChat = async (userId: any) => {
        const id = await createConversation({ participantId: userId });
        router.push(`/conversations/${id}`);
        setSearchTerm('');
        setActiveTab('chats');
    };

    const formatLastMessage = (conv: any) => {
        if (!conv.lastMessage) return 'No messages yet';
        if (conv.lastMessage.deleted) return '🗑 This message was deleted';
        return conv.lastMessage.content;
    };

    // If user is searching, always switch to people tab automatically
    const effectiveTab = searchTerm ? 'people' : activeTab;

    return (
        <div className="hidden md:flex flex-col h-full w-80 border-r bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b bg-white dark:bg-zinc-900 flex items-center justify-between">
                <h1 className="text-xl font-bold">Live Chat</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onOpenCreateGroup}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition"
                        title="Create Group"
                        aria-label="Create group chat"
                    >
                        <Plus className="h-5 w-5" />
                    </button>
                    <UserButton />
                </div>
            </div>

            {/* Search Bar */}
            <div className="p-3">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        aria-label="Search users"
                    />
                </div>
            </div>

            {/* Tabs — hidden when actively searching */}
            {!searchTerm && (
                <div className="flex border-b px-3">
                    <button
                        onClick={() => setActiveTab('chats')}
                        className={`flex-1 py-2 text-sm font-medium transition border-b-2 ${activeTab === 'chats'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                            }`}
                    >
                        <MessageSquare className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                        Chats
                    </button>
                    <button
                        onClick={() => setActiveTab('people')}
                        className={`flex-1 py-2 text-sm font-medium transition border-b-2 ${activeTab === 'people'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                            }`}
                    >
                        <UserRound className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                        People
                    </button>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {effectiveTab === 'people' ? (
                    /* ── People / search results tab ─────────────────────── */
                    <div className="px-2 py-2">
                        {searchTerm && (
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-2 mb-2">
                                Results for &ldquo;{searchTerm}&rdquo;
                            </p>
                        )}

                        {/* Loading skeleton */}
                        {users === undefined && (
                            <div className="space-y-1">
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

                        {/* User list */}
                        {users?.map((user) => (
                            <button
                                key={user._id}
                                onClick={() => handleCreateChat(user._id)}
                                className="w-full flex items-center gap-3 p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition"
                            >
                                <div className="relative shrink-0">
                                    <img
                                        src={user.imageUrl || '/placeholder-user.png'}
                                        alt={user.name}
                                        className="h-10 w-10 rounded-full object-cover"
                                    />
                                    {user.isOnline && (
                                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                                    )}
                                </div>
                                <div className="text-left min-w-0">
                                    <div className="font-medium truncate">{user.name}</div>
                                    <div className="text-xs text-zinc-500 truncate">
                                        {user.isOnline ? (
                                            <span className="text-green-600 dark:text-green-400">● Online</span>
                                        ) : (
                                            user.email
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}

                        {/* Empty states */}
                        {users?.length === 0 && searchTerm && (
                            <div className="text-center py-10 text-zinc-500">
                                <Search className="h-8 w-8 mx-auto text-zinc-300 mb-2" />
                                <p className="text-sm">No users found for &ldquo;{searchTerm}&rdquo;</p>
                            </div>
                        )}
                        {users?.length === 0 && !searchTerm && (
                            <div className="text-center py-10 text-zinc-500">
                                <UserRound className="h-8 w-8 mx-auto text-zinc-300 mb-2" />
                                <p className="text-sm font-medium">No other users yet</p>
                                <p className="text-xs text-zinc-400 mt-1">
                                    Share the app link so others can sign up!
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    /* ── Chats tab ───────────────────────────────────────── */
                    <div className="px-2 py-2">
                        {/* Loading skeleton */}
                        {conversations === undefined && (
                            <div className="space-y-1">
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
                                        <div className="font-medium truncate">
                                            {conv.isGroup
                                                ? (conv.name || 'Group Chat')
                                                : (conv.otherUser?.name || 'User')}
                                        </div>
                                        {conv.unreadCount > 0 && (
                                            <div className="bg-primary text-primary-foreground text-[10px] font-bold min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full shrink-0">
                                                {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`text-sm truncate ${conv.lastMessage?.deleted ? 'text-zinc-400 italic' : 'text-zinc-500'}`}>
                                        {formatLastMessage(conv)}
                                    </div>
                                </div>
                            </button>
                        ))}

                        {conversations?.length === 0 && (
                            <div className="text-center py-10">
                                <MessageSquare className="h-10 w-10 mx-auto text-zinc-300 mb-2" />
                                <p className="text-zinc-500 text-sm font-medium">No conversations yet</p>
                                <p className="text-xs text-zinc-400 mt-1">
                                    Go to <span className="font-semibold">People</span> to start chatting
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
