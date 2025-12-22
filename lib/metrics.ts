import { adminDb } from '@/lib/firebaseAdmin';

type IntegrationMetric = {
  userId?: string;
  service: string;
  kind: string; // 'retry' | 'refresh' | etc
  endpoint?: string;
  attempt?: number;
  status?: string; // 'started'|'success'|'failed'|'retrying'
  detail?: any;
  createdAt?: string;
};

export async function recordIntegrationMetric(metric: IntegrationMetric) {
  try {
    const doc: Record<string, any> = {
      createdAt: new Date().toISOString(),
    };
    // Only include defined values to avoid Firestore errors
    Object.entries(metric).forEach(([key, value]) => {
      if (value !== undefined) {
        doc[key] = value;
      }
    });
    await adminDb.collection('integrationMetrics').add(doc);
  } catch (err) {
    // best-effort: don't throw from metrics
    // eslint-disable-next-line no-console
    console.warn('Failed to record integration metric', err);
  }
}

export async function recordNotionRetry(opts: {
  userId: string;
  endpoint: string;
  attempt: number;
  status: 'started' | 'retrying' | 'failed' | 'success';
  detail?: any;
}) {
  return recordIntegrationMetric({
    userId: opts.userId,
    service: 'notion',
    kind: 'retry',
    endpoint: opts.endpoint,
    attempt: opts.attempt,
    status: opts.status,
    detail: opts.detail,
  });
}

export async function recordNotionRefresh(opts: {
  userId: string;
  status: 'started' | 'success' | 'failed';
  detail?: any;
}) {
  return recordIntegrationMetric({
    userId: opts.userId,
    service: 'notion',
    kind: 'refresh',
    status: opts.status,
    detail: opts.detail,
  });
}

export default { recordIntegrationMetric, recordNotionRetry, recordNotionRefresh };
