'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronDown, Database, FileText, Search, Loader2, GripVertical } from 'lucide-react';
import { fetchNotionDatabases, fetchNotionPages } from '@/hooks/useNotion';

interface NotionDatabase {
    id: string;
    title: string;
}

interface NotionPage {
    id: string;
    title: string;
    url: string;
    properties?: Record<string, any>;
}

interface NotionDatabaseBrowserProps {
    onPageSelect?: (page: NotionPage, databaseId: string) => void;
    onPageDragStart?: (page: NotionPage, databaseId: string) => void;
}

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

// Small wrapper component for draggable functionality
function DraggableNotionPage({ page, databaseId, onClick }: { page: NotionPage, databaseId: string, onClick?: () => void }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `notion-${page.id}`,
        data: {
            type: 'NotionPage',
            page,
            databaseId
        }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 100 : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-2 hover:bg-white dark:hover:bg-neutral-800 cursor-grab active:cursor-grabbing transition-colors group ${isDragging ? 'opacity-50' : ''}`}
        >
            <GripVertical size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            <FileText size={12} className="text-gray-400 flex-shrink-0" />
            <span className="text-xs truncate flex-1">{page.title}</span>
        </div>
    );
}

export function NotionDatabaseBrowser({ onPageSelect }: NotionDatabaseBrowserProps) {
    const [databases, setDatabases] = useState<NotionDatabase[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedDb, setExpandedDb] = useState<string | null>(null);
    const [pages, setPages] = useState<Record<string, NotionPage[]>>({});
    const [loadingPages, setLoadingPages] = useState<string | null>(null);

    const loadDatabases = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchNotionDatabases();
            setDatabases(result.databases || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load databases');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDatabases();
    }, [loadDatabases]);

    const toggleDatabase = async (dbId: string) => {
        if (expandedDb === dbId) {
            setExpandedDb(null);
            return;
        }

        setExpandedDb(dbId);

        // Load pages if not already loaded
        if (!pages[dbId]) {
            setLoadingPages(dbId);
            try {
                const result = await fetchNotionPages(dbId);
                setPages(prev => ({ ...prev, [dbId]: result.pages || [] }));
            } catch (err) {
                console.error('Failed to load pages:', err);
            } finally {
                setLoadingPages(null);
            }
        }
    };

    const filteredDatabases = databases.filter(db =>
        db.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-8 text-center">
                <p className="text-sm text-red-500 mb-4">{error}</p>
                <button
                    onClick={loadDatabases}
                    className="px-4 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (databases.length === 0) {
        return (
            <div className="py-12 text-center opacity-50">
                <Database size={32} className="mx-auto mb-3" />
                <p className="text-sm font-bold uppercase tracking-widest">No databases found</p>
                <p className="text-xs text-gray-500 mt-2">Share a Notion database with this integration</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Search */}
            <div className="relative mb-4">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search databases..."
                    className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
            </div>

            {/* Database List */}
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                {filteredDatabases.map(db => (
                    <div key={db.id} className="rounded-xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
                        {/* Database Header */}
                        <button
                            onClick={() => toggleDatabase(db.id)}
                            className="w-full flex items-center gap-2 p-3 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors text-left"
                        >
                            {expandedDb === db.id ? (
                                <ChevronDown size={14} className="text-gray-400" />
                            ) : (
                                <ChevronRight size={14} className="text-gray-400" />
                            )}
                            <Database size={14} className="text-gray-500" />
                            <span className="flex-1 text-sm font-medium truncate">{db.title}</span>
                            {loadingPages === db.id && (
                                <Loader2 size={12} className="animate-spin text-gray-400" />
                            )}
                        </button>

                        {/* Pages */}
                        {expandedDb === db.id && pages[db.id] && (
                            <div className="border-t border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/50">
                                {pages[db.id].length === 0 ? (
                                    <p className="p-3 text-xs text-gray-400 text-center">No pages found</p>
                                ) : (
                                    <div className="max-h-60 overflow-y-auto">
                                        {pages[db.id].map(page => (
                                            <DraggableNotionPage
                                                key={page.id}
                                                page={page}
                                                databaseId={db.id}
                                                onClick={() => onPageSelect?.(page, db.id)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Help text */}
            <p className="text-[10px] text-gray-400 text-center mt-4 uppercase tracking-widest">
                Drag pages to import as tasks
            </p>
        </div>
    );
}
