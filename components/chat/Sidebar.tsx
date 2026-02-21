'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Search, Plus, Users, MessageSquare, UserRound, Settings, Bell, Check, X, Clock } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { formatConversationTime } from '@/lib/utils';
import { Id } from '@/convex/_generated/dataModel';

type Tab = 'chats' | 'people' | 'inbox';

export function Sidebar({ onOpenCreateGroup }: { onOpenCreateGroup: () => void }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('chats');

    const conversations = useQuery(api.conversations.getConversations);
    const users = useQuery(api.users.searchUsers, { searchTerm });
    const pendingRequests = useQuery(api.messageRequests.getPendingIncoming);
    const pendingCount = useQuery(api.messageRequests.getPendingCount);
    const sendRequest = useMutation(api.messageRequests.sendRequest);
    const acceptRequest = useMutation(api.messageRequests.acceptRequest);
    const declineRequest = useMutation(api.messageRequests.declineRequest);
    const router = useRouter();
    const pathname = usePathname();

    const formatLastMessage = (conv: any) => {
        if (!conv.lastMessage) return 'No messages yet';
        if (conv.lastMessage.deleted) return '🗑 This message was deleted';
        return conv.lastMessage.content;
    };

    const effectiveTab = searchTerm ? 'people' : activeTab;

    return (
        <div className="hidden md:flex flex-col h-full w-80 border-r bg-sidebar overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border/60 flex items-center justify-between bg-sidebar">
                <h1 className="text-lg font-bold gradient-text">LiveChat</h1>
                <button
                    onClick={onOpenCreateGroup}
                    className="p-2 hover:bg-primary/10 rounded-xl transition-all hover:scale-105"
                    title="Create Group"
                    aria-label="Create group chat"
                >
                    <Plus className="h-4 w-4 text-primary" />
                </button>
            </div>

            {/* Search Bar */}
            <div className="p-3">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 text-sm placeholder:text-muted-foreground/60 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        aria-label="Search users"
                    />
                </div>
            </div>

            {/* Tabs */}
            {!searchTerm && (
                <div className="flex border-b border-border/60 px-3 gap-1">
                    {([
                        { id: 'chats' as Tab, icon: MessageSquare, label: 'Chats', badge: undefined as number | undefined },
                        { id: 'people' as Tab, icon: UserRound, label: 'People', badge: undefined as number | undefined },
                        { id: 'inbox' as Tab, icon: Bell, label: 'Inbox', badge: pendingCount as number | undefined },
                    ]).map(({ id, icon: Icon, label, badge }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`flex-1 py-2.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border-b-2 relative ${activeTab === id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                            {badge !== undefined && badge > 0 && (
                                <span className="absolute -top-0.5 right-1 h-4 min-w-4 px-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                    {badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {effectiveTab === 'inbox' && (
                    <div className="px-2 py-2">
                        {pendingRequests === undefined && (
                            <div className="space-y-2 px-2 py-4">
                                {[1, 2].map(i => (
                                    <div key={i} className="flex items-center gap-3 animate-pulse">
                                        <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
                                        <div className="flex-1 space-y-1.5">
                                            <div className="h-3 bg-muted rounded w-3/4" />
                                            <div className="h-2.5 bg-muted rounded w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {pendingRequests?.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
                                <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
                                    <Bell className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-medium text-muted-foreground">No pending requests</p>
                                <p className="text-xs text-muted-foreground/60">Message requests will appear here</p>
                            </div>
                        )}
                        {pendingRequests?.map((req) => (
                            <div key={req._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-all">
                                <div className="relative shrink-0">
                                    <img
                                        src={req.sender?.imageUrl || '/placeholder-user.png'}
                                        alt={req.sender?.name || 'User'}
                                        className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20"
                                    />
                                    {req.sender?.isOnline && (
                                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 border-2 border-sidebar rounded-full" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate">{req.sender?.name ?? 'Unknown'}</p>
                                    <p className="text-xs text-muted-foreground">wants to message you</p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <button
                                        onClick={async () => {
                                            const convId = await acceptRequest({ requestId: req._id });
                                            if (convId) router.push(`/conversations/${convId}`);
                                        }}
                                        className="h-7 w-7 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-all hover:scale-110"
                                        title="Accept"
                                    >
                                        <Check className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={() => declineRequest({ requestId: req._id })}
                                        className="h-7 w-7 rounded-full bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 flex items-center justify-center text-rose-500 transition-all hover:scale-110"
                                        title="Decline"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {effectiveTab === 'people' && (
                    <PeopleTab users={users} onSendRequest={sendRequest} onStartChat={(userId: Id<"users">) => {
                        // If a conversation already exists, navigate to it
                        const existing = conversations?.find((c: any) => !c.isGroup && c.otherUser?._id === userId);
                        if (existing) router.push(`/conversations/${existing._id}`);
                    }} conversations={conversations} />
                )}

                {effectiveTab === 'chats' && (
                    <div className="px-2 py-2">
                        {conversations === undefined && (
                            <div className="space-y-1">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                                        <div className="h-12 w-12 rounded-full bg-muted shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3.5 bg-muted rounded w-3/4" />
                                            <div className="h-3 bg-muted rounded w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {conversations?.map((conv) => {
                            const isActive = pathname === `/conversations/${conv._id}`;
                            return (
                                <button
                                    key={conv._id}
                                    onClick={() => router.push(`/conversations/${conv._id}`)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group ${isActive
                                        ? 'bg-primary/10 border border-primary/20 shadow-sm'
                                        : 'hover:bg-muted/60 border border-transparent'
                                        }`}
                                >
                                    <div className="relative h-12 w-12 shrink-0">
                                        {conv.isGroup ? (
                                            <div className="h-full w-full rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center overflow-hidden shadow-md">
                                                {conv.imageUrl ? (
                                                    <img src={conv.imageUrl} alt={conv.name || 'Group'} className="h-full w-full object-cover" />
                                                ) : (
                                                    <Users className="h-6 w-6 text-white" />
                                                )}
                                            </div>
                                        ) : (
                                            <img
                                                src={conv.otherUser?.imageUrl || '/placeholder-user.png'}
                                                alt={conv.otherUser?.name || 'User'}
                                                className="h-full w-full rounded-2xl object-cover shadow-sm"
                                            />
                                        )}
                                        {!conv.isGroup && conv.otherUser?.isOnline && (
                                            <span className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-sidebar rounded-full shadow-sm" />
                                        )}
                                    </div>
                                    <div className="flex-1 text-left overflow-hidden">
                                        <div className="flex justify-between items-center gap-2 mb-0.5">
                                            <div className="font-semibold text-sm truncate">
                                                {conv.isGroup ? (conv.name || 'Group Chat') : (conv.otherUser?.name || 'User')}
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {conv.lastMessage && (
                                                    <span className="text-[10px] text-muted-foreground/70">
                                                        {formatConversationTime(conv.lastMessage._creationTime)}
                                                    </span>
                                                )}
                                                {conv.unreadCount > 0 && (
                                                    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-bold min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full shadow-sm">
                                                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`text-xs truncate ${conv.lastMessage?.deleted ? 'text-muted-foreground italic' : 'text-muted-foreground/80'}`}>
                                            {formatLastMessage(conv)}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-border/60 bg-sidebar">
                <Link
                    href="/profile"
                    className="flex items-center gap-3 p-2.5 hover:bg-muted/60 rounded-xl transition-all text-sm font-medium"
                >
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
                        <UserRound className="h-4 w-4 text-primary" />
                    </div>
                    <span className="flex-1 truncate text-left">My Profile</span>
                    <Settings className="h-4 w-4 text-muted-foreground/60" />
                </Link>
            </div>
        </div>
    );
}

// ── People tab sub-component with per-user request status ─────────────────────
function PeopleTab({
    users,
    onSendRequest,
    onStartChat,
    conversations,
}: {
    users: any;
    onSendRequest: (args: { toUserId: Id<"users"> }) => Promise<any>;
    onStartChat: (userId: Id<"users">) => void;
    conversations: any;
}) {
    const [sendingTo, setSendingTo] = useState<string | null>(null);

    if (users === undefined) {
        return (
            <div className="px-2 py-2 space-y-1">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                        <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
                        <div className="flex-1 space-y-1.5">
                            <div className="h-3.5 bg-muted rounded w-3/4" />
                            <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="px-2 py-2">
            {users.map((user: any) => {
                const existingConv = conversations?.find((c: any) => !c.isGroup && c.otherUser?._id === user._id);
                const isSending = sendingTo === user._id;

                return (
                    <div key={user._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-all">
                        <div className="relative shrink-0">
                            <img
                                src={user.imageUrl || '/placeholder-user.png'}
                                alt={user.name}
                                className="h-10 w-10 rounded-2xl object-cover shadow-sm"
                            />
                            {user.isOnline && (
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 border-2 border-sidebar rounded-full" />
                            )}
                        </div>
                        <div className="text-left min-w-0 flex-1">
                            <div className="font-semibold text-sm truncate">{user.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                                {user.isOnline
                                    ? <span className="text-emerald-500 font-medium">● Online</span>
                                    : user.email}
                            </div>
                        </div>
                        {existingConv ? (
                            <button
                                onClick={() => onStartChat(user._id)}
                                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-full transition-all border border-primary/20"
                            >
                                Chat →
                            </button>
                        ) : (
                            <UserRequestButton
                                userId={user._id}
                                isSending={isSending}
                                onSend={async () => {
                                    setSendingTo(user._id);
                                    await onSendRequest({ toUserId: user._id });
                                    setSendingTo(null);
                                }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function UserRequestButton({ userId, isSending, onSend }: { userId: string; isSending: boolean; onSend: () => void }) {
    const status = useQuery(api.messageRequests.getRequestStatus, { otherUserId: userId as Id<"users"> });

    if (status === undefined) return <div className="h-7 w-20 bg-muted rounded-full animate-pulse" />;

    if (status?.status === 'pending' && status.direction === 'sent') {
        return (
            <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium px-3 py-1.5 rounded-full bg-muted border border-border">
                <Clock className="h-3 w-3" />
                Pending
            </span>
        );
    }

    if (status?.status === 'accepted') {
        return (
            <span className="text-xs text-emerald-600 font-semibold px-3 py-1.5">
                Connected ✓
            </span>
        );
    }

    return (
        <button
            onClick={onSend}
            disabled={isSending}
            className="text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded-full transition-all disabled:opacity-50 shadow-sm hover:shadow hover:scale-105"
        >
            {isSending ? '...' : '+ Request'}
        </button>
    );
}
