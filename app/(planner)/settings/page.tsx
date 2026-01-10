"use client";

import React, { useEffect, useState } from 'react';
import { listIntegrations, startGoogleAuth, startNotionAuth, startSlackAuth, deleteIntegration } from '@/hooks/useIntegrations';
import { useAuth } from '@/contexts/AuthContext';
import { linkWithGoogleAccount } from '@/lib/auth';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useDialog } from '@/contexts/DialogContext';
import {
    Settings,
    Palette,
    ChevronLeft,
    CheckCircle2,
    Calendar,
    Zap,
    Shield,
    Plus,
    Loader2,
    ChevronRight,
    Trash2,
    Mail
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GoogleCalendarIcon, NotionLogo, SlackLogo, GithubLogo } from '@/components/ui/Logos';

const SUPPORTED_APPS = [
    {
        id: 'google-calendar',
        name: 'Google Calendar',
        service: 'google',
        description: 'Sync your events and timebox tasks directly on your calendar.',
        icon: GoogleCalendarIcon,
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/10'
    },
    {
        id: 'notion',
        name: 'Notion Calendar',
        service: 'notion',
        description: 'Connect your Notion databases to manage deadlines in one place.',
        icon: NotionLogo,
        color: 'text-gray-600 dark:text-gray-300',
        bgColor: 'bg-gray-50 dark:bg-neutral-800'
    },
    {
        id: 'slack',
        name: 'Slack',
        service: 'slack',
        description: 'Turn your Slack messages into actionable tasks with a click.',
        icon: SlackLogo,
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-900/10'
    },
    {
        id: 'github',
        name: 'GitHub',
        service: 'github',
        description: 'Sync issues and pull requests to your daily planner.',
        icon: GithubLogo,
        color: 'text-gray-900 dark:text-gray-100',
        bgColor: 'bg-gray-100 dark:bg-neutral-800'
    },
];

export default function SettingsPage() {
    const [integrations, setIntegrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [connectingId, setConnectingId] = useState<string | null>(null);
    const [linkingProfile, setLinkingProfile] = useState(false);
    const { user, username, loading: authLoading } = useAuth();
    const { showConfirm, showAlert } = useDialog();
    const router = useRouter();

    async function load() {
        setLoading(true);
        try {
            const res = await listIntegrations();
            setIntegrations(res.integrations || []);
        } catch (err) {
            console.error(err);
            setIntegrations([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!authLoading && user) {
            load();
        }
    }, [authLoading, user]);

    async function handleConnect(app: any) {
        if (app.service === 'google') {
            setConnectingId(app.id);
            try {
                const data = await startGoogleAuth();
                const popup = window.open(data.url, 'connect_google', 'width=600,height=700');
                if (!popup) {
                    await showAlert('Popup Blocked', 'Please allow popups to connect Google Calendar.');
                    setConnectingId(null);
                    return;
                }
                const timer = setInterval(() => {
                    if (popup.closed) {
                        clearInterval(timer);
                        setConnectingId(null);
                        load();
                        router.push('/dashboard');
                    }
                }, 500);
            } catch (err) {
                console.error(err);
                setConnectingId(null);
            }
        } else if (app.service === 'notion') {
            setConnectingId(app.id);
            try {
                const data = await startNotionAuth();
                const popup = window.open(data.url, 'connect_notion', 'width=600,height=700');
                if (!popup) {
                    alert('Popup blocked. Please allow popups.');
                    setConnectingId(null);
                    return;
                }
                const timer = setInterval(() => {
                    if (popup.closed) {
                        clearInterval(timer);
                        setConnectingId(null);
                        load();
                        router.push('/dashboard');
                    }
                }, 500);
            } catch (err) {
                console.error(err);
                setConnectingId(null);
            }
        } else if (app.service === 'slack') {
            setConnectingId(app.id);
            try {
                const data = await startSlackAuth();
                const popup = window.open(data.url, 'connect_slack', 'width=600,height=700');
                if (!popup) {
                    alert('Popup blocked. Please allow popups.');
                    setConnectingId(null);
                    return;
                }
                const timer = setInterval(() => {
                    if (popup.closed) {
                        clearInterval(timer);
                        setConnectingId(null);
                        load();
                        router.push('/dashboard');
                    }
                }, 500);
            } catch (err) {
                console.error(err);
                setConnectingId(null);
            }
        } else {
            await showAlert('Coming Soon', `${app.name} integration is coming soon!`);
        }
    }

    async function handleDisconnect(app: any) {
        const integration = integrations.find(i => i.service === app.service);
        if (!integration) return;

        const confirmed = await showConfirm(
            'Disconnect Integration',
            `Are you sure you want to disconnect ${app.name}? This will stop syncing logic.`,
            { variant: 'destructive', confirmText: 'Disconnect' }
        );
        if (!confirmed) return;

        setConnectingId(app.id);
        try {
            await deleteIntegration(integration.id);
            await load();
        } catch (err) {
            console.error(err);
            await showAlert('Error', 'Failed to disconnect integration');
        } finally {
            setConnectingId(null);
        }
    }

    async function handleLinkGoogle() {
        setLinkingProfile(true);
        try {
            await linkWithGoogleAccount();
        } catch (err: any) {
            console.error(err);
            await showAlert('Link Failed', err.message || 'Failed to link Google account');
        } finally {
            setLinkingProfile(false);
        }
    }

    const isConnected = (service: string) => integrations.some(i => i.service === service);

    // Fallback logic for name: user.displayName or Google name or email prefix
    const nameFallback = user?.displayName || user?.providerData.find(p => p.displayName)?.displayName || user?.email?.split('@')[0] || 'User';

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-neutral-950 p-6 animate-in fade-in duration-500">
            <div className="max-w-4xl mx-auto pb-24">
                <header className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="p-2 hover:bg-white dark:hover:bg-neutral-900 rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-neutral-800"
                        >
                            <ChevronLeft size={20} className="text-gray-500" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">Settings</h1>
                            <p className="text-sm text-gray-500 font-medium">Manage your workspace and connections</p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <nav className="md:col-span-1 space-y-1">
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-neutral-900 text-purple-600 dark:text-purple-400 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-800 text-sm font-bold">
                            <Settings size={18} />
                            General
                        </button>
                    </nav>

                    <div className="md:col-span-3 space-y-8">
                        {/* Profile Section */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Profile & Appearance</h3>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm overflow-hidden min-h-[160px] flex flex-col justify-between p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-2xl overflow-hidden border-2 border-purple-100 dark:border-purple-900/30 shadow-inner">
                                            {(user?.photoURL || user?.providerData.find(p => p.photoURL)?.photoURL) ? (
                                                <img
                                                    src={user?.photoURL || user?.providerData.find(p => p.photoURL)?.photoURL || ""}
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <div className="h-full w-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xl">
                                                    {nameFallback[0].toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 truncate">
                                                {nameFallback}
                                            </h2>
                                            <div className="flex items-center gap-1.5 text-gray-400">
                                                <Mail size={12} />
                                                <p className="text-[11px] font-bold uppercase tracking-wider truncate">{user?.email}</p>
                                            </div>
                                            {username && (
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="text-[11px] font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded uppercase tracking-widest">
                                                        @{username}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {!(user?.photoURL || user?.providerData.find(p => p.photoURL)?.photoURL) && (
                                        <button
                                            onClick={handleLinkGoogle}
                                            disabled={linkingProfile}
                                            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-gray-200 dark:border-neutral-700"
                                        >
                                            {linkingProfile ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <>
                                                    <span className="w-4 h-4 rounded-full bg-red-400 flex items-center justify-center text-[8px] text-white">G</span>
                                                    Sync Google Profile
                                                </>
                                            )}
                                        </button>
                                    )}
                                </section>

                                <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col justify-between p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-pink-50 dark:bg-pink-900/10 rounded-lg text-pink-600 dark:text-pink-400">
                                            <Palette size={20} />
                                        </div>
                                        <div>
                                            <span className="font-black text-gray-900 dark:text-gray-100 uppercase text-xs tracking-widest">Theme Preference</span>
                                            <p className="text-[10px] text-gray-400 font-bold mt-0.5 uppercase tracking-widest">Toggle visual mode</p>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <ThemeToggle />
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* Security Section (Placeholder) */}
                        <section className="space-y-6">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Privacy & Safety</h3>
                            <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-neutral-400">
                                        <Shield size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">Security Settings</h3>
                                        <p className="text-[11px] text-gray-500 dark:text-neutral-400 uppercase tracking-widest font-bold">Additional features coming soon</p>
                                    </div>
                                </div>
                                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-40 pointer-events-none">
                                    <div className="p-4 border border-dashed border-gray-200 dark:border-neutral-800 rounded-xl">
                                        <div className="h-2 w-20 bg-gray-200 dark:bg-neutral-800 rounded mb-2"></div>
                                        <div className="h-1 w-32 bg-gray-100 dark:bg-neutral-900 rounded"></div>
                                    </div>
                                    <div className="p-4 border border-dashed border-gray-200 dark:border-neutral-800 rounded-xl">
                                        <div className="h-2 w-20 bg-gray-200 dark:bg-neutral-800 rounded mb-2"></div>
                                        <div className="h-1 w-32 bg-gray-100 dark:bg-neutral-900 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Consolidated Integrations Section */}
                        <section className="space-y-6">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Connected Apps</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {SUPPORTED_APPS.map((app) => {
                                    const active = isConnected(app.service);
                                    const Icon = app.icon;
                                    const isConnecting = connectingId === app.id;

                                    return (
                                        <div
                                            key={app.id}
                                            className="group bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className={`p-3 rounded-xl ${app.bgColor} ${app.color}`}>
                                                    <Icon size={24} />
                                                </div>
                                                {active ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 rounded-full text-[9px] font-black uppercase tracking-wider border border-green-100 dark:border-green-900/20">
                                                            <CheckCircle2 size={10} />
                                                            Active
                                                        </div>
                                                        <button
                                                            onClick={() => handleDisconnect(app)}
                                                            disabled={isConnecting}
                                                            className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                                                        >
                                                            {isConnecting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    (app.service === 'slack' || app.service === 'github') ? (
                                                        <div className="px-3 py-1 bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-gray-500 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-not-allowed">
                                                            Coming Soon
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleConnect(app)}
                                                            disabled={isConnecting}
                                                            className="flex items-center gap-1.5 px-3 py-1 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-black dark:hover:bg-gray-100 transition-all"
                                                        >
                                                            {isConnecting ? <Loader2 size={10} className="animate-spin" /> : <><Plus size={10} /> Connect</>}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">{app.name}</h3>
                                            <p className="text-[11px] text-gray-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                                                {app.description}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            {integrations.length > 0 && (
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/20 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Zap size={14} className="text-purple-600" />
                                        <p className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-widest">Auto-sync enabled</p>
                                    </div>
                                    <button onClick={load} className="text-[10px] font-bold text-purple-600 hover:text-purple-800 uppercase tracking-widest">Refresh</button>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
