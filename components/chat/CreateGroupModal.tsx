'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { X, Users, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CreateGroupModal({ onClose }: { onClose: () => void }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [name, setName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const users = useQuery(api.users.searchUsers, { searchTerm });
    const createGroup = useMutation(api.conversations.createGroup);
    const router = useRouter();

    const handleToggleUser = (user: any) => {
        if (selectedUsers.find(u => u._id === user._id)) {
            setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    const handleCreateGroup = async () => {
        if (!name.trim() || selectedUsers.length === 0) return;
        setLoading(true);
        try {
            const id = await createGroup({
                name: name.trim(),
                participantIds: selectedUsers.map(u => u._id),
            });
            router.push(`/conversations/${id}`);
            onClose();
        } catch (e) {
            console.error('Failed to create group:', e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl shadow-xl overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-bold">Create Group Chat</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <label className="text-xs font-semibold uppercase text-zinc-500 mb-1 block">Group Name</label>
                        <input
                            type="text"
                            placeholder="E.g. Team Coffee"
                            className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    {/* Selected users chips */}
                    {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {selectedUsers.map(u => (
                                <span key={u._id} className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                                    {u.name}
                                    <button onClick={() => handleToggleUser(u)} className="hover:text-primary/60">×</button>
                                </span>
                            ))}
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-semibold uppercase text-zinc-500 mb-1 block">
                            Add Members
                            <span className="ml-1 text-zinc-400 normal-case font-normal">(select at least 1)</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg px-4 py-2 mb-2 focus:ring-2 focus:ring-primary outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="max-h-48 overflow-y-auto space-y-1">
                            {users === undefined && (
                                <div className="text-center py-4 text-xs text-zinc-400">Searching...</div>
                            )}
                            {users?.length === 0 && searchTerm && (
                                <div className="text-center py-4 text-sm text-zinc-400">No users found</div>
                            )}
                            {!searchTerm && (
                                <div className="text-center py-4 text-sm text-zinc-400">
                                    <UserPlus className="h-6 w-6 mx-auto mb-1 text-zinc-300" />
                                    Search users to add to the group
                                </div>
                            )}
                            {users?.map(user => (
                                <button
                                    key={user._id}
                                    onClick={() => handleToggleUser(user)}
                                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition ${selectedUsers.find(u => u._id === user._id)
                                            ? 'bg-primary/10 border-primary border'
                                            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 border-transparent border'
                                        }`}
                                >
                                    <img src={user.imageUrl} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
                                    <span className="text-sm font-medium flex-1 text-left">{user.name}</span>
                                    {selectedUsers.find(u => u._id === user._id) && (
                                        <span className="text-xs text-primary font-semibold">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition">Cancel</button>
                    <button
                        disabled={!name.trim() || selectedUsers.length === 0 || loading}
                        onClick={handleCreateGroup}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition"
                    >
                        {loading ? 'Creating...' : `Create Group${selectedUsers.length > 0 ? ` (${selectedUsers.length})` : ''}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
