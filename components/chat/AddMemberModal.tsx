'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { X, UserPlus, Search } from 'lucide-react';

interface AddMemberModalProps {
    conversationId: Id<"conversations">;
    onClose: () => void;
    existingMemberIds: Id<"users">[];
}

export function AddMemberModal({ conversationId, onClose, existingMemberIds }: AddMemberModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    // Search for users
    const users = useQuery(api.users.searchUsers, { searchTerm });
    const addMember = useMutation(api.conversations.addMember);

    const handleAddUser = async (userId: Id<"users">) => {
        setLoading(true);
        try {
            await addMember({ conversationId, userId });
            // For now we close on first add, or you could keep it open to add more.
            // Closing feels safer for avoiding double-adds before query refresh.
            onClose();
        } catch (e) {
            console.error('Failed to add member:', e);
        } finally {
            setLoading(false);
        }
    };

    // Filter out users who are already in the group
    const filteredUsers = users?.filter(user => !existingMemberIds.includes(user._id));

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-bold">Add Member</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search users..."
                            className="w-full pl-9 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1">
                        {users === undefined && (
                            <div className="text-center py-8 text-sm text-zinc-400">Searching...</div>
                        )}

                        {filteredUsers?.length === 0 && (
                            <div className="text-center py-8 text-sm text-zinc-400">
                                {searchTerm ? 'No new users found' : 'Type to search for users'}
                            </div>
                        )}

                        {filteredUsers?.map(user => (
                            <button
                                key={user._id}
                                onClick={() => handleAddUser(user._id)}
                                disabled={loading}
                                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-left"
                            >
                                <img src={user.imageUrl || '/placeholder-user.png'} alt={user.name} className="h-9 w-9 rounded-full object-cover" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{user.name}</div>
                                    <div className="text-xs text-zinc-500 truncate">{user.email}</div>
                                </div>
                                <div className="p-1 px-2.5 bg-primary/10 text-primary text-[10px] font-bold rounded-lg uppercase">
                                    Add
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
