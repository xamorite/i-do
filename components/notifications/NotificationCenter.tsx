import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { Notification } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationCenterProps {
    onSelectTask?: (taskId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onSelectTask }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const res = await fetch(`/api/notifications?userId=${user.uid}`);
            const data = await res.json();
            if (data.notifications) {
                setNotifications(data.notifications);
                setUnreadCount(data.notifications.filter((n: Notification) => !n.read).length);
            }
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();

        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            await fetch(`/api/notifications?id=${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ read: true }),
            });
        } catch (err) {
            console.error('Failed to mark notification as read', err);
        }
    };

    const getMessage = (n: Notification) => {
        switch (n.type) {
            case 'task_assigned': return 'Assigned you a task';
            case 'task_accepted': return 'Accepted your task';
            case 'task_rejected': return 'Rejected your task';
            case 'task_submitted': return 'Submitted task for review';
            case 'task_approved': return 'Approved your work';
            case 'task_changes_requested': return 'Requested changes';
            case 'task_reminder': return 'Sent you a reminder';
            case 'task_updated': return 'Updated a shared task';
            case 'task_ap_assigned': return 'Proposed you as accountability partner';
            case 'task_ap_accepted': return 'Accepted accountability partnership';
            case 'partner_request': return 'Sent you a partnership request';
            case 'partner_accepted': return 'Accepted your partnership';
            case 'partner_declined': return 'Declined your partnership';
            default: return 'New notification';
        }
    };

    const handleClick = (n: Notification) => {
        if (!n.read) markAsRead(n.id);
        if (onSelectTask) onSelectTask(n.taskId);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 relative"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-neutral-900" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-gray-100 dark:border-neutral-800 z-50 overflow-hidden max-h-[80vh] flex flex-col">
                    <div className="p-3 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center bg-gray-50/50 dark:bg-neutral-800/50">
                        <h3 className="font-semibold text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs text-purple-600 font-medium bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full">{unreadCount} new</span>
                        )}
                    </div>

                    <div className="overflow-y-auto custom-scrollbar flex-1">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-xs">
                                No notifications
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => handleClick(n)}
                                    className={`p-4 border-b border-gray-50 dark:border-neutral-800/50 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800 ${!n.read ? 'bg-purple-50/30 dark:bg-purple-900/10' : ''}`}
                                >
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-0.5">{getMessage(n)}</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200 line-clamp-2">{n.taskTitle}</p>
                                            {n.message && (
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic border-l-2 border-orange-300 pl-2">
                                                    "{n.message}"
                                                </p>
                                            )}
                                            <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString()} • {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        {!n.read && (
                                            <button
                                                onClick={(e) => markAsRead(n.id, e)}
                                                className="p-1 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-full"
                                                title="Mark as read"
                                            >
                                                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
