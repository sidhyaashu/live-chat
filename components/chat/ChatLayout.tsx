'use client';

import { Sidebar } from './Sidebar';
import { CreateGroupModal } from './CreateGroupModal';
import { ReactNode, useState } from 'react';

export function ChatLayout({ children }: { children: ReactNode }) {
    const [showCreateGroup, setShowCreateGroup] = useState(false);

    return (
        <div className="flex h-full overflow-hidden">
            {/* Sidebar: hidden on mobile, always visible on md+ */}
            <Sidebar onOpenCreateGroup={() => setShowCreateGroup(true)} />
            {/* Chat area: takes full width on mobile, rest on md+ */}
            <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 min-w-0">
                {children}
            </div>
            {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}
        </div>
    );
}
