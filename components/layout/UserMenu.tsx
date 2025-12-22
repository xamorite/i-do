"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, Plus, User as UserIcon } from 'lucide-react';
import Image from 'next/image';

export const UserMenu: React.FC = () => {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push('/login');
        } catch (error) {
            console.error('Failed to sign out', error);
        }
    };

    const nameFallback = user?.displayName || user?.providerData.find(p => p.displayName)?.displayName || user?.email?.split('@')[0] || 'User';

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center h-8 w-8 rounded-full overflow-hidden hover:ring-2 ring-purple-500 transition-all focus:outline-none bg-gradient-to-br from-purple-500 to-indigo-500 shadow-sm border border-white/20"
            >
                {(user?.photoURL || user?.providerData.find(p => p.photoURL)?.photoURL) ? (
                    <img
                        src={user?.photoURL || user?.providerData.find(p => p.photoURL)?.photoURL || ""}
                        alt={nameFallback}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className="text-white text-[10px] font-black uppercase">
                        {nameFallback[0]}
                    </div>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-xl bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <div className="p-3 border-b border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-800/30">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Account</p>
                        <p className="text-sm font-black truncate text-gray-900 dark:text-gray-100">
                            {nameFallback}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                    </div>

                    <div className="p-1">
                        <button
                            onClick={() => {
                                router.push('/settings');
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/10 hover:text-purple-600 rounded-lg transition-colors group"
                        >
                            <Settings size={16} className="text-gray-400 group-hover:text-purple-500" />
                            <span className="font-semibold">Settings</span>
                        </button>

                        <button
                            onClick={() => {
                                router.push('/settings');
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/10 hover:text-purple-600 rounded-lg transition-colors group"
                        >
                            <Plus size={16} className="text-gray-400 group-hover:text-purple-500" />
                            <span className="font-semibold">Add integration</span>
                        </button>
                    </div>

                    <div className="p-1 border-t border-gray-100 dark:border-neutral-800">
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors group"
                        >
                            <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
                            <span className="font-semibold">Log out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
