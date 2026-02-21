'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
    Search, Plus, Users, MessageSquare,
    UserRound, Bell, Check, X, Clock, Circle,
} from 'lucide-react';
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
        if (conv.lastMessage.deleted) return 'Message was deleted';
        if (conv.lastMessage.imageStorageId && !conv.lastMessage.content) return 'Sent an image';
        return conv.lastMessage.content || '';
    };

    const effectiveTab = searchTerm ? 'people' : activeTab;

    return (
        <aside className="hidden md:flex flex-col h-full w-72 shrink-0 border-r border-border bg-sidebar overflow-hidden">

            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-semibold text-foreground">Messages</span>
                <button
                    onClick={onOpenCreateGroup}
                    title="New group"
                    aria-label="Create group"
                    className="h-7 w-7 rounded-md border border-border bg-muted hover:bg-secondary flex items-center justify-center transition-colors"
                >
                    <Plus className="h-3.5 w-3.5 text-foreground" />
                </button>
            </div>

            {/* ── Search ──────────────────────────────────────────────────── */}
            <div className="px-3 py-2 border-b border-border">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                        type="search"
                        placeholder="Search people..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted border border-border rounded-md placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-shadow"
                        aria-label="Search people"
                    />
                </div>
            </div>

            {/* ── Tabs ────────────────────────────────────────────────────── */}
            {!searchTerm && (
                <div className="flex border-b border-border text-xs font-medium">
                    {([
                        { id: 'chats' as Tab, icon: MessageSquare, label: 'Chats', badge: undefined as number | undefined },
                        { id: 'people' as Tab, icon: UserRound, label: 'People', badge: undefined as number | undefined },
                        { id: 'inbox' as Tab, icon: Bell, label: 'Inbox', badge: pendingCount as number | undefined },
                    ]).map(({ id, icon: Icon, label, badge }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 transition-colors border-b-2 ${activeTab === id
                                    ? 'border-primary text-primary bg-accent/40'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                            {badge !== undefined && badge > 0 && (
                                <span className="gh-badge gh-badge-primary text-[9px] leading-none py-0.5">
                                    {badge > 99 ? '99+' : badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Content area ────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto overscroll-contain">

                {/* INBOX */}
                {effectiveTab === 'inbox' && (
                    <div className="divide-y divide-border">
                        {pendingRequests === undefined && <LoadingSkeleton rows={3} />}
                        {pendingRequests?.length === 0 && (
                            <EmptyState icon={<Bell className="h-5 w-5" />} title="No requests" sub="Incoming message requests appear here" />
                        )}
                        {pendingRequests?.map(req => (
                            <div key={req._id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                                <UserAvatar
                                    src={req.sender?.imageUrl}
                                    name={req.sender?.name}
                                    isOnline={req.sender?.isOnline}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate text-foreground">{req.sender?.name ?? 'Unknown'}</p>
                                    <p className="text-xs text-muted-foreground">wants to message you</p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                        onClick={async () => {
                                            const convId = await acceptRequest({ requestId: req._id });
                                            if (convId) router.push(`/conversations/${convId}`);
                                        }}
                                        title="Accept"
                                        className="h-7 w-7 rounded-md border border-[#238636] bg-[#238636]/10 hover:bg-[#238636] text-[#3fb950] hover:text-white flex items-center justify-center transition-all"
                                    >
                                        <Check className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={() => declineRequest({ requestId: req._id })}
                                        title="Decline"
                                        className="h-7 w-7 rounded-md border border-destructive/30 bg-destructive/5 hover:bg-destructive text-destructive hover:text-white flex items-center justify-center transition-all"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* PEOPLE */}
                {effectiveTab === 'people' && (
                    <div className="divide-y divide-border">
                        {users === undefined && <LoadingSkeleton rows={4} />}
                        {users?.map((user: any) => {
                            const existing = conversations?.find((c: any) => !c.isGroup && c.otherUser?._id === user._id);
                            return (
                                <div key={user._id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                                    <UserAvatar src={user.imageUrl} name={user.name} isOnline={user.isOnline} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{user.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {user.isOnline
                                                ? <span className="text-[#3fb950] font-medium">● Online</span>
                                                : user.email}
                                        </p>
                                    </div>
                                    {existing ? (
                                        <button
                                            onClick={() => router.push(`/conversations/${existing._id}`)}
                                            className="gh-btn text-xs py-1 px-2.5"
                                        >
                                            Chat
                                        </button>
                                    ) : (
                                        <RequestButton userId={user._id} onSend={sendRequest} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* CHATS */}
                {effectiveTab === 'chats' && (
                    <div className="divide-y divide-border">
                        {conversations === undefined && <LoadingSkeleton rows={5} />}
                        {conversations?.length === 0 && (
                            <EmptyState icon={<MessageSquare className="h-5 w-5" />} title="No conversations" sub="Search for people to start a new chat" />
                        )}
                        {conversations?.map((conv: any) => {
                            const isActive = pathname === `/conversations/${conv._id}`;
                            const title = conv.isGroup
                                ? (conv.name || 'Group Chat')
                                : (conv.otherUser?.name || 'Unknown');

                            return (
                                <button
                                    key={conv._id}
                                    onClick={() => router.push(`/conversations/${conv._id}`)}
                                    className={`w-full flex items-center gap-3 text-left px-4 py-3 transition-colors ${isActive
                                            ? 'bg-accent/60 border-l-2 border-primary'
                                            : 'hover:bg-muted/50 border-l-2 border-transparent'
                                        }`}
                                >
                                    <div className="relative shrink-0">
                                        {conv.isGroup ? (
                                            <div className="h-9 w-9 rounded-md bg-muted border border-border flex items-center justify-center">
                                                {conv.imageUrl
                                                    ? <img src={conv.imageUrl} alt={title} className="h-full w-full object-cover rounded-md" />
                                                    : <Users className="h-4 w-4 text-muted-foreground" />
                                                }
                                            </div>
                                        ) : (
                                            <img
                                                src={conv.otherUser?.imageUrl || '/placeholder-user.png'}
                                                alt={title}
                                                className="h-9 w-9 rounded-full object-cover border border-border"
                                            />
                                        )}
                                        {!conv.isGroup && conv.otherUser?.isOnline && (
                                            <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-[#3fb950] text-sidebar translate-x-0.5 translate-y-0.5" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                            <span className="text-sm font-medium truncate">{title}</span>
                                            <span className="text-[11px] text-muted-foreground shrink-0">
                                                {conv.lastMessage && formatConversationTime(conv.lastMessage._creationTime)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-1">
                                            <span className={`text-xs truncate ${conv.lastMessage?.deleted ? 'italic text-muted-foreground' : 'text-muted-foreground'}`}>
                                                {formatLastMessage(conv)}
                                            </span>
                                            {conv.unreadCount > 0 && (
                                                <span className="gh-badge gh-badge-primary text-[9px] leading-none py-0.5 shrink-0">
                                                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Footer link ─────────────────────────────────────────────── */}
            <div className="border-t border-border p-2">
                <Link
                    href="/profile"
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                >
                    <UserRound className="h-3.5 w-3.5 shrink-0" />
                    My Profile
                </Link>
            </div>
        </aside>
    );
}

/* ── Shared sub-components ─────────────────────────────────────────────────── */

function UserAvatar({ src, name, isOnline }: { src?: string; name?: string; isOnline?: boolean }) {
    return (
        <div className="relative shrink-0 h-9 w-9">
            <img
                src={src || '/placeholder-user.png'}
                alt={name || 'User'}
                className="h-9 w-9 rounded-full object-cover border border-border"
            />
            {isOnline && (
                <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-[#3fb950] text-sidebar translate-x-0.5 translate-y-0.5" />
            )}
        </div>
    );
}

function LoadingSkeleton({ rows }: { rows: number }) {
    return (
        <div className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                    <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-muted rounded w-3/4" />
                        <div className="h-2.5 bg-muted rounded w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 gap-3 text-center">
            <div className="h-10 w-10 rounded-md border border-border bg-muted flex items-center justify-center text-muted-foreground">
                {icon}
            </div>
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{sub}</p>
        </div>
    );
}

function RequestButton({
    userId,
    onSend,
}: {
    userId: string;
    onSend: (args: { toUserId: Id<"users"> }) => Promise<any>;
}) {
    const [loading, setLoading] = useState(false);
    const status = useQuery(api.messageRequests.getRequestStatus, { otherUserId: userId as Id<"users"> });

    if (status === undefined) return <div className="h-6 w-16 bg-muted rounded animate-pulse" />;

    if (status?.status === 'pending' && status.direction === 'sent') {
        return (
            <span className="flex items-center gap-1 text-xs text-muted-foreground py-1 px-2 gh-badge">
                <Clock className="h-3 w-3" /> Pending
            </span>
        );
    }
    if (status?.status === 'accepted') {
        return (
            <span className="text-xs text-[#3fb950] font-medium flex items-center gap-1">
                <Check className="h-3 w-3" /> Friends
            </span>
        );
    }

    return (
        <button
            disabled={loading}
            onClick={async () => {
                setLoading(true);
                await onSend({ toUserId: userId as Id<"users"> });
                setLoading(false);
            }}
            className="gh-btn gh-btn-blue text-xs py-1 px-2.5 disabled:opacity-50"
        >
            {loading ? '…' : 'Request'}
        </button>
    );
}
