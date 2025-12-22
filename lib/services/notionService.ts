import { adminDb } from '@/lib/firebaseAdmin';
import { decryptText, encryptText } from '@/lib/kms';
import { recordNotionRetry, recordNotionRefresh } from '@/lib/metrics';

export async function getNotionIntegration(userId: string) {
    const q = await adminDb.collection('integrations')
        .where('userId', '==', userId)
        .where('service', '==', 'notion')
        .limit(1)
        .get();

    if (q.empty) return null;
    const doc = q.docs[0];
    return { id: doc.id, ref: doc.ref, data: doc.data() as any };
}

export async function ensureNotionToken(userId: string) {
    const integration = await getNotionIntegration(userId);
    if (!integration) throw new Error('Notion integration not found');

    let tokens = integration.data?.config?.tokens;
    if (!tokens) throw new Error('No Notion tokens found');

    // Tokens may be stored encrypted as a base64 string
    if (typeof tokens === 'string') {
        try {
            const dec = await decryptText(tokens);
            tokens = JSON.parse(dec);
        } catch (err) {
            throw new Error('Failed to decrypt Notion tokens');
        }
    }

    if (!tokens?.access_token) throw new Error('No Notion access token found');

    // If tokens include expires_at, check and refresh proactively
    const now = Date.now();
    if (tokens.expires_at && Number(tokens.expires_at) < now && tokens.refresh_token) {
        // try refresh
        try {
            await refreshNotionToken(userId);
            const updatedIntegration = await getNotionIntegration(userId);
            let updatedTokens: any = updatedIntegration?.data?.config?.tokens;
            if (typeof updatedTokens === 'string') {
                const dec = await decryptText(updatedTokens);
                updatedTokens = JSON.parse(dec);
            }
            return updatedTokens.access_token;
        } catch (err) {
            console.warn('Failed to refresh Notion token proactively', err);
        }
    }

    return tokens.access_token;
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function refreshNotionToken(userId: string) {
    await recordNotionRefresh({ userId, status: 'started' });
    try {
        const integration = await getNotionIntegration(userId);
        if (!integration) throw new Error('Notion integration not found');
        let tokens = integration.data?.config?.tokens;
        if (!tokens) throw new Error('No tokens to refresh');
        if (typeof tokens === 'string') {
            const dec = await decryptText(tokens);
            tokens = JSON.parse(dec);
        }

        const refreshToken = tokens.refresh_token;
        if (!refreshToken) throw new Error('No refresh_token available for Notion');

        const clientId = process.env.NOTION_CLIENT_ID || '';
        const clientSecret = process.env.NOTION_CLIENT_SECRET || '';
        const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        const res = await fetch('https://api.notion.com/v1/oauth/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authHeader}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: refreshToken }),
        });

        if (!res.ok) {
            const txt = await res.text().catch(() => '');
            throw new Error(`Notion token refresh failed: ${txt}`);
        }

        const tokenResponse = await res.json();

        // merge new tokens with previous, set expires_at if provided
        const now = Date.now();
        const newTokens = {
            ...tokens,
            ...tokenResponse,
        };
        if (tokenResponse.expires_in) {
            newTokens.expires_at = now + Number(tokenResponse.expires_in) * 1000;
        }

        // encrypt and persist
        const encrypted = await encryptText(JSON.stringify(newTokens));
        await integration.ref.update({ 'config.tokens': encrypted, updatedAt: new Date().toISOString() });
        await recordNotionRefresh({ userId, status: 'success', detail: { expires_at: newTokens.expires_at } });
        return newTokens;
    } catch (err: any) {
        await recordNotionRefresh({ userId, status: 'failed', detail: String(err) });
        throw err;
    }
}

async function requestWithRetry(userId: string, input: string, init: RequestInit = {}, maxRetries = 5) {
    let attempt = 0;
    const baseDelay = 500;

    while (attempt < maxRetries) {
        attempt++;
        try {
            // record attempt
            void recordNotionRetry({ userId, endpoint: input, attempt, status: 'started' });

            const accessToken = await ensureNotionToken(userId);
            const headers = Object.assign({}, init.headers || {}, {
                Authorization: `Bearer ${accessToken}`,
                'Notion-Version': '2022-06-28',
            });

            const res = await fetch(input, { ...init, headers });

            if (res.status === 401 && attempt === 1) {
                // try refresh and retry once
                try {
                    void recordNotionRetry({ userId, endpoint: input, attempt, status: 'retrying', detail: { reason: '401' } });
                    await refreshNotionToken(userId);
                } catch (err) {
                    // proceed to throw below
                }
                continue; // retry immediately after refresh
            }

            if (res.status === 429) {
                const retryAfter = res.headers.get('Retry-After');
                void recordNotionRetry({ userId, endpoint: input, attempt, status: 'retrying', detail: { reason: '429', retryAfter } });
                const wait = retryAfter ? Number(retryAfter) * 1000 : baseDelay * Math.pow(2, attempt);
                await sleep(wait);
                continue;
            }

            void recordNotionRetry({ userId, endpoint: input, attempt, status: 'success', detail: { status: res.status } });
            return res;
        } catch (err) {
            // network error
            const wait = baseDelay * Math.pow(2, attempt);
            if (attempt >= maxRetries) {
                void recordNotionRetry({ userId, endpoint: input, attempt, status: 'failed', detail: String(err) });
                await sleep(wait);
                throw err;
            }
            void recordNotionRetry({ userId, endpoint: input, attempt, status: 'retrying', detail: String(err) });
            await sleep(wait);
        }
    }
    throw new Error('Max retries reached for Notion request');
}

export async function listNotionDatabases(userId: string, start_cursor?: string, page_size = 20, query?: string) {
    const body: any = { filter: { property: 'object', value: 'database' }, page_size };
    if (start_cursor) body.start_cursor = start_cursor;
    if (query) body.query = query; // Add text search support

    const res = await requestWithRetry(userId, 'https://api.notion.com/v1/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Notion search failed: ${await res.text()}`);
    const data = await res.json();
    return {
        results: (data.results || []).map((d: any) => ({ id: d.id, title: (d.title && d.title[0]?.plain_text) || d.properties?.title?.title?.[0]?.plain_text || d.id })),
        next_cursor: data.next_cursor || null,
        has_more: data.has_more || false,
    };
}

export async function listPagesInDatabase(userId: string, databaseId: string, pageSize = 50, start_cursor?: string) {
    const body: any = { page_size: pageSize };
    if (start_cursor) body.start_cursor = start_cursor;

    const res = await requestWithRetry(userId, `https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Notion database query failed: ${await res.text()}`);
    const data = await res.json();
    return {
        results: (data.results || []).map((page: any) => {
            const titleProp = Object.values(page.properties).find((p: any) => p.type === 'title') as any;
            const title = titleProp?.title?.[0]?.plain_text || 'Untitled';
            return { id: page.id, title, url: page.url, properties: page.properties };
        }),
        next_cursor: data.next_cursor || null,
        has_more: data.has_more || false,
    };
}

export async function getNotionPage(userId: string, pageId: string) {
    const res = await requestWithRetry(userId, `https://api.notion.com/v1/pages/${pageId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!res.ok) throw new Error(`Notion page fetch failed: ${await res.text()}`);
    return res.json();
}

export async function updateNotionPageStatus(userId: string, pageId: string, statusValue: string) {
    // Retrieve page to understand properties
    const page = await getNotionPage(userId, pageId);
    const props = page.properties || {};

    // Try to read saved mapping from integrations config to determine which property to update
    const q = await adminDb.collection('integrations').where('userId', '==', userId).where('service', '==', 'notion').limit(1).get();
    const mapping = q.empty ? null : (q.docs[0].data() as any).config?.mappings || null;

    const statusPropName = mapping?.status || Object.keys(props).find(k => (props[k] as any)?.type === 'select') || Object.keys(props).find(k => (props[k] as any)?.type === 'checkbox');

    if (!statusPropName) {
        throw new Error('No updatable status property found on Notion page');
    }

    let updatePayload: any = { properties: {} };
    const targetProp = props[statusPropName] as any;
    if (targetProp.type === 'select') {
        updatePayload.properties[statusPropName] = { select: { name: statusValue } };
    } else if (targetProp.type === 'checkbox') {
        updatePayload.properties[statusPropName] = { checkbox: statusValue.toLowerCase() === 'done' };
    } else {
        throw new Error('Status property type not supported for updates');
    }

    const res = await requestWithRetry(userId, `https://api.notion.com/v1/pages/${pageId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
    });

    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Failed to update Notion page: ${txt}`);
    }
    return res.json();
}

export async function fetchNotionTasks(userId: string, rangeStart: string, rangeEnd: string) {
    try {
        // Get user's integration config for property mappings
        const integration = await getNotionIntegration(userId);
        const mappings = integration?.data?.config?.mappings || {};
        const selectedDbId = integration?.data?.config?.selectedDatabaseId;

        // 1. Search for databases (or use selected database)
        let databases: any[] = [];
        if (selectedDbId) {
            databases = [{ id: selectedDbId }];
        } else {
            const searchRes = await requestWithRetry(userId, 'https://api.notion.com/v1/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filter: { property: 'object', value: 'database' } }),
            });

            if (!searchRes.ok) {
                console.error('Failed to search Notion databases', await searchRes.text());
                return [];
            }

            const searchData = await searchRes.json();
            databases = searchData.results || [];
        }

        let allTasks: any[] = [];

        // 2. Query each database for items (pages)
        for (const db of databases) {
            const queryRes = await requestWithRetry(userId, `https://api.notion.com/v1/databases/${db.id}/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ page_size: 50 }),
            });

            if (!queryRes.ok) continue;

            const queryData = await queryRes.json();
            const items = queryData.results || [];

            const mappedItems = items.map((page: any) => {
                const props = page.properties || {};

                // Extract properties using mappings or auto-detect
                const extracted = extractTaskProperties(props, mappings);

                if (!extracted.plannedDate) return null; // Only sync items with dates

                return {
                    id: page.id,
                    title: extracted.title,
                    notes: page.url,
                    plannedDate: extracted.plannedDate,
                    startTime: extracted.startTime,
                    duration: extracted.duration,
                    priority: extracted.priority,
                    tags: extracted.tags,
                    isTimeboxed: false,
                    originalIntegration: 'notion',
                    status: extracted.status || 'planned',
                    externalUrl: page.url,
                    external: { service: 'notion', pageId: page.id, databaseId: db.id },
                };
            }).filter(Boolean);

            allTasks = [...allTasks, ...mappedItems];
        }

        return allTasks;
    } catch (err) {
        console.error('Error fetching Notion tasks:', err);
        return [];
    }
}

/**
 * Extract task properties from Notion page properties.
 * Uses provided mappings or auto-detects property types.
 */
function extractTaskProperties(props: Record<string, any>, mappings: Record<string, string>) {
    const result: {
        title: string;
        plannedDate: string | null;
        startTime: string | null;
        duration: number | null;
        priority: string | null;
        tags: string[];
        status: string | null;
    } = {
        title: 'Untitled',
        plannedDate: null,
        startTime: null,
        duration: null,
        priority: null,
        tags: [],
        status: null,
    };

    // Helper to find property by name or type
    const findProp = (mappedName: string | undefined, type: string) => {
        if (mappedName && props[mappedName]) return props[mappedName];
        return Object.values(props).find((p: any) => p.type === type);
    };

    // Title
    const titleProp = findProp(mappings.title, 'title') as any;
    result.title = titleProp?.title?.[0]?.plain_text || 'Untitled Notion Page';

    // Date
    const dateProp = findProp(mappings.date, 'date') as any;
    if (dateProp?.date?.start) {
        const dateValue = dateProp.date.start;
        result.plannedDate = dateValue.split('T')[0];
        result.startTime = dateValue.includes('T') ? dateValue : null;
    }

    // Duration/Estimate (number property)
    const durationProp = mappings.duration ? props[mappings.duration] : Object.values(props).find((p: any) =>
        p.type === 'number' && (
            p.name?.toLowerCase().includes('duration') ||
            p.name?.toLowerCase().includes('estimate') ||
            p.name?.toLowerCase().includes('time')
        )
    ) as any;
    if (durationProp?.number) {
        result.duration = durationProp.number;
    }

    // Priority (select property)
    const priorityProp = mappings.priority ? props[mappings.priority] : Object.values(props).find((p: any) =>
        p.type === 'select' && (
            p.name?.toLowerCase().includes('priority') ||
            p.name?.toLowerCase().includes('importance')
        )
    ) as any;
    if (priorityProp?.select?.name) {
        const pName = priorityProp.select.name.toLowerCase();
        if (pName.includes('high') || pName.includes('urgent') || pName === 'p1') {
            result.priority = 'high';
        } else if (pName.includes('medium') || pName === 'p2') {
            result.priority = 'medium';
        } else if (pName.includes('low') || pName === 'p3') {
            result.priority = 'low';
        } else {
            result.priority = priorityProp.select.name;
        }
    }

    // Tags (multi-select property)
    const tagsProp = mappings.tags ? props[mappings.tags] : Object.values(props).find((p: any) =>
        p.type === 'multi_select' && (
            p.name?.toLowerCase().includes('tag') ||
            p.name?.toLowerCase().includes('label') ||
            p.name?.toLowerCase().includes('category')
        )
    ) as any;
    if (tagsProp?.multi_select) {
        result.tags = tagsProp.multi_select.map((t: any) => t.name);
    }

    // Status (select or status property)
    const statusProp = mappings.status ? props[mappings.status] : Object.values(props).find((p: any) =>
        (p.type === 'select' || p.type === 'status') && (
            p.name?.toLowerCase().includes('status') ||
            p.name?.toLowerCase().includes('state')
        )
    ) as any;
    if (statusProp?.select?.name) {
        const sName = statusProp.select.name.toLowerCase();
        if (sName.includes('done') || sName.includes('complete') || sName.includes('finished')) {
            result.status = 'done';
        } else if (sName.includes('progress') || sName.includes('doing')) {
            result.status = 'in-progress';
        } else {
            result.status = 'planned';
        }
    } else if (statusProp?.status?.name) {
        const sName = statusProp.status.name.toLowerCase();
        if (sName.includes('done') || sName.includes('complete')) {
            result.status = 'done';
        } else if (sName.includes('progress')) {
            result.status = 'in-progress';
        } else {
            result.status = 'planned';
        }
    }

    return result;
}
