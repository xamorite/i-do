import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { getApps } from 'firebase-admin/app';

export async function GET() {
    try {
        const apps = getApps();
        const app = apps.length > 0 ? apps[0] : null;

        // Check environment variables (securely - don't reveal full keys)
        const hasServiceAccount = !!(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        const serviceAccountLen = (process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON)?.length || 0;

        let adminStatus = 'Not Initialized';
        let projectId = 'Unknown';
        let serviceAccountId = 'Unknown';

        if (app) {
            adminStatus = 'Initialized';
            try {
                projectId = app.options.credential?.getProjectId() || 'Unknown (Available)'; // getProjectId might throw if not cert credential
            } catch (e) {
                projectId = 'Error getting project ID';
            }
            try {
                // Attempting to see if credential has client email
                // admin.credential.cert returns a credential object but inspecting it is tricky.
                // options.credential created via cert() usually works.
            } catch (e) { }
        }

        return NextResponse.json({
            status: 'ok',
            adminStatus,
            appCount: apps.length,
            projectId, // Should match 'mopcare-2a00f'
            env: {
                hasServiceAccount,
                serviceAccountLength: serviceAccountLen,
                nodeEnv: process.env.NODE_ENV,
            }
        });

    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
