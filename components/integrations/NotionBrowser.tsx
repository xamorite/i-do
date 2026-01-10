"use client";
/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { fetchNotionDatabases, fetchNotionPages, importNotionPage, saveNotionConfig } from '@/hooks/useNotion';
import { useDraggable } from '@dnd-kit/core';
import { useDialog } from '@/contexts/DialogContext';

const DraggablePage: React.FC<{ page: any, databaseId?: string }> = ({ page, databaseId }) => {
    const { showAlert } = useDialog();
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `notion-page-${page.id}`,
        data: { type: 'NotionPage', page, databaseId },
    });

    const elRef = React.useRef<HTMLLIElement | null>(null);
    const combinedRef = React.useCallback((node: HTMLLIElement | null) => {
        setNodeRef(node);
        elRef.current = node;
    }, [setNodeRef]);

    React.useEffect(() => {
        const el = elRef.current;
        if (!el) return;
        if (transform) {
            el.style.transform = `translate3d(${transform.x}px, ${transform.y}px, 0)`;
        } else {
            el.style.transform = '';
        }
        el.style.opacity = isDragging ? '0.4' : '1';
        el.style.cursor = 'grab';
    }, [transform, isDragging]);

    return (
        <li ref={combinedRef} {...attributes} {...listeners} className="p-2 border rounded flex justify-between items-center bg-white dark:bg-neutral-900">
            <div>
                <div className="font-semibold">{page.title}</div>
                <div className="text-xs text-gray-500">{page.url}</div>
            </div>
            <div className="flex gap-2">
                <button onClick={async () => {
                    const task = await importNotionPage(page.id, databaseId);
                    if (task) await showAlert('Import Successful', 'Imported: ' + task.title, { variant: 'success' });
                }} className="px-3 py-1 bg-purple-600 text-white rounded">Import</button>
            </div>
        </li>
    );
};

export const NotionBrowser: React.FC = () => {
    const [dbs, setDbs] = useState<any[]>([]);
    const [selectedDb, setSelectedDb] = useState<string | null>(null);
    const [pages, setPages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [mappings, setMappings] = useState<any>({ title: null, date: null, status: null, priority: null });
    const [saveLoading, setSaveLoading] = useState(false);
    const { showAlert } = useDialog();

    useEffect(() => {
        (async () => {
            const res = await fetchNotionDatabases();
            const list = res.databases || [];
            setDbs(list);
            if (list.length) setSelectedDb(list[0].id);
        })();
    }, []);

    useEffect(() => {
        if (!selectedDb) return;
        setLoading(true);
        (async () => {
            const res = await fetchNotionPages(selectedDb);
            setPages(res.pages || []);
            setNextCursor(res.nextCursor || null);
            setHasMore(res.hasMore || false);
            // initialize mapping options from first page
            if (res.pages && res.pages.length) {
                const props = Object.keys(res.pages[0].properties || {});
                setMappings({ title: props[0] || null, date: props.find(k => k.toLowerCase().includes('date')) || null, status: props.find(k => /status|state|select/i.test(k)) || null, priority: props.find(k => /priority/i.test(k)) || null });
            }
            setLoading(false);
        })();
    }, [selectedDb]);

    async function loadMorePages() {
        if (!selectedDb || !nextCursor) return;
        setLoading(true);
        try {
            const headers = await (await import('@/lib/getIdToken')).getIdTokenHeader();
            const res = await fetch(`/api/integrations/notion/databases/${selectedDb}/pages?start=${encodeURIComponent(nextCursor)}`, { headers: headers as HeadersInit });
            if (!res.ok) throw new Error('Failed to load more');
            const data = await res.json();
            setPages(prev => [...prev, ...(data.pages || [])]);
            setNextCursor(data.next_cursor || null);
            setHasMore(!!data.has_more);
        } catch (err) {
            console.error('Failed to load more pages', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveConfig() {
        if (!selectedDb) {
            await showAlert('Missing Selection', 'Select a database first');
            return;
        }
        setSaveLoading(true);
        try {
            await saveNotionConfig(selectedDb, mappings);
            await showAlert('Success', 'Notion config saved', { variant: 'success' });
        } catch (err) {
            console.error(err);
            await showAlert('Error', 'Failed to save config');
        } finally {
            setSaveLoading(false);
        }
    }

    return (
        <div className="p-4">
            <h2 className="text-lg font-bold">Notion Browser</h2>
            <div className="mt-3 flex gap-3">
                <select aria-label="Select Notion database" title="Select Notion database" value={selectedDb || ''} onChange={(e) => setSelectedDb(e.target.value)} className="border px-2 py-1 rounded bg-white dark:bg-neutral-900">
                    {dbs.map(d => <option key={d.id} value={d.id}>{d.title || d.id}</option>)}
                </select>
            </div>

            <div className="mt-4">
                <div className="mt-2 flex items-center gap-2">
                    <div className="text-sm font-bold">Property Mapping</div>
                    <button onClick={handleSaveConfig} className="ml-auto px-3 py-1 bg-green-600 text-white rounded" disabled={saveLoading}>{saveLoading ? 'Saving...' : 'Save'}</button>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2">
                    <label className="text-xs">Title Prop</label>
                    <select aria-label="Map title property" title="Map title property" value={mappings.title || ''} onChange={(e) => setMappings((prev: any) => ({ ...prev, title: e.target.value }))} className="border px-2 py-1 rounded bg-white dark:bg-neutral-900">
                        {(pages[0] && Object.keys(pages[0].properties || {}))?.map((k: any) => <option key={k} value={k}>{k}</option>)}
                    </select>
                    <label className="text-xs">Date Prop</label>
                    <select aria-label="Map date property" title="Map date property" value={mappings.date || ''} onChange={(e) => setMappings((prev: any) => ({ ...prev, date: e.target.value }))} className="border px-2 py-1 rounded bg-white dark:bg-neutral-900">
                        {(pages[0] && Object.keys(pages[0].properties || {}))?.map((k: any) => <option key={k} value={k}>{k}</option>)}
                    </select>
                    <label className="text-xs">Status Prop</label>
                    <select aria-label="Map status property" title="Map status property" value={mappings.status || ''} onChange={(e) => setMappings((prev: any) => ({ ...prev, status: e.target.value }))} className="border px-2 py-1 rounded bg-white dark:bg-neutral-900">
                        {(pages[0] && Object.keys(pages[0].properties || {}))?.map((k: any) => <option key={k} value={k}>{k}</option>)}
                    </select>
                    <label className="text-xs">Priority Prop</label>
                    <select aria-label="Map priority property" title="Map priority property" value={mappings.priority || ''} onChange={(e) => setMappings((prev: any) => ({ ...prev, priority: e.target.value }))} className="border px-2 py-1 rounded bg-white dark:bg-neutral-900">
                        {(pages[0] && Object.keys(pages[0].properties || {}))?.map((k: any) => <option key={k} value={k}>{k}</option>)}
                    </select>
                </div>

                <div className="mt-4">
                    {loading ? <div>Loading...</div> : (
                        <ul className="space-y-2">
                            {pages.map(p => (
                                <DraggablePage key={p.id} page={p} databaseId={selectedDb || undefined} />
                            ))}
                            {hasMore && (
                                <li className="p-2 text-center">
                                    <button onClick={loadMorePages} className="px-3 py-1 bg-white border rounded">Load more</button>
                                </li>
                            )}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotionBrowser;
