"use client";

import React, { useEffect, useState } from 'react';
import {
    Plus,
    Search,
    Settings,
    Zap,
    Moon,
    Sun,
    LayoutGrid,
    CalendarDays,
    Target
} from 'lucide-react';
import { GoogleCalendarIcon, NotionLogo, SlackLogo, GithubLogo } from '@/components/ui/Logos';
import { useAuth } from '@/contexts/AuthContext';
import { getIdTokenHeader } from '@/lib/getIdToken';
import { useRouter } from 'next/navigation';

interface IntegrationRailProps {
    activeId: string | null;
    onToggle: (id: string) => void;
}

export const IntegrationRail: React.FC<IntegrationRailProps> = ({ activeId, onToggle }) => {
    const { user } = useAuth();
    const router = useRouter();

    const integrations = [
        { id: 'google-calendar', service: 'google', color: '#4285F4', icon: <GoogleCalendarIcon size={18} /> },
        { id: 'notion', service: 'notion', color: '#000000', icon: <NotionLogo size={18} /> },
        { id: 'slack', service: 'slack', color: '#4A154B', icon: <SlackLogo size={18} /> },
        { id: 'github', service: 'github', color: '#181717', icon: <GithubLogo size={18} /> },
    ];

    const [connected, setConnected] = useState<Set<string>>(new Set());
    const [connecting, setConnecting] = useState<Record<string, boolean>>({});

    useEffect(() => {
        let mounted = true;
        async function load() {
            try {
                const headers = await getIdTokenHeader();
                const res = await fetch('/api/integrations', { headers: headers as HeadersInit });
                const data = await res.json();
                if (!mounted) return;
                if (data?.ok && Array.isArray(data.integrations)) {
                    const set = new Set<string>();
                    data.integrations.forEach((it: any) => {
                        if (it?.service) set.add(it.service);
                    });
                    setConnected(set);
                }
            } catch (err) {
                console.warn('Failed to load integrations', err);
            }
        }
        load();
        return () => { mounted = false; };
    }, [user]);

    const startOAuth = async (serviceEndpoint: string, id: string) => {
        try {
            setConnecting(prev => ({ ...prev, [id]: true }));
            const headers = await getIdTokenHeader();
            const res = await fetch(`/api/integrations/${serviceEndpoint}`, { headers: headers as HeadersInit });
            const body = await res.json().catch(() => ({}));
            if (body?.ok && body.url) {
                window.open(body.url, 'oauth', 'width=600,height=700');
                // keep connecting true until external callback updates integrations
                // but clear after a timeout to avoid permanent state
                setTimeout(() => setConnecting(prev => ({ ...prev, [id]: false })), 15000);
            } else {
                setConnecting(prev => ({ ...prev, [id]: false }));
                console.warn('Failed to start oauth flow', body);
            }
        } catch (err) {
            setConnecting(prev => ({ ...prev, [id]: false }));
            console.warn('Error starting oauth', err);
        }
    };

    const handleClick = (id: string, service: string) => {
        if (service === 'slack' || service === 'github') return;

        if (connected.has(service)) {
            onToggle(id);
            return;
        }
        // not connected -> start oauth
        // map some internal ids to endpoint names
        const endpoint = service;
        startOAuth(endpoint, id);
    };

    return (
        <aside className="w-12 border-l border-gray-100 dark:border-neutral-900 flex flex-col items-center py-4 gap-4 bg-white dark:bg-neutral-950">
            <div className="flex flex-col gap-3">
                {integrations.map((i) => (
                    <div key={i.id} className="relative">
                        <button
                            onClick={() => handleClick(i.id, i.service)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 shadow-sm border ${activeId === i.id
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md ring-2 ring-purple-500/20'
                                : 'border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900'
                                } ${(i.service === 'slack' || i.service === 'github') ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                            title={(i.service === 'slack' || i.service === 'github') ? 'Coming Soon' : i.id}
                            aria-label={i.id}
                        >
                            <div className={activeId === i.id ? 'text-purple-600 dark:text-purple-400' : ''}>
                                {i.icon}
                            </div>
                        </button>

                        {/* connected indicator */}
                        {connected.has(i.service) && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 ring-1 ring-white dark:ring-neutral-900" />
                        )}

                        {/* connecting indicator */}
                        {connecting[i.id] && !connected.has(i.service) && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-yellow-400 ring-1 ring-white dark:ring-neutral-900 animate-pulse" />
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-auto flex flex-col gap-3">
                <button className="p-2 text-gray-400 hover:text-purple-600 transition-colors" title="Search integrations" aria-label="Search integrations">
                    <Search size={20} />
                </button>
                <button className="p-2 text-gray-400 hover:text-purple-600 transition-colors" title="Quick actions" aria-label="Quick actions">
                    <Zap size={20} />
                </button>
            </div>
        </aside>
    );
};
