import React from 'react';
import NotionBrowser from '@/components/integrations/NotionBrowser';

export default function NotionIntegrationPage() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Notion Integration</h1>
            <NotionBrowser />
        </div>
    );
}
