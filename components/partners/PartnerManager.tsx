import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check, Ban, Clock, Loader2, ShieldCheck, User } from 'lucide-react';
import { PartnerRelationship } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { getIdTokenHeader } from '@/lib/getIdToken';

interface PartnerManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PartnerManager: React.FC<PartnerManagerProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [partners, setPartners] = useState<PartnerRelationship[]>([]);
    const [loading, setLoading] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchPartners = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const headers = await getIdTokenHeader() as HeadersInit;
            const res = await fetch('/api/partners', { headers });
            const data = await res.json();
            if (data.partners) setPartners(data.partners);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) fetchPartners();
    }, [isOpen, user]);

    const sendInvite = async () => {
        if (!inviteEmail) return;
        setInviteLoading(true);
        setError('');
        try {
            const headers = await getIdTokenHeader() as HeadersInit;
            const res = await fetch('/api/partners', {
                method: 'POST',
                headers: { ...headers as any, 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipientEmail: inviteEmail })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send invite');
            setInviteEmail('');
            fetchPartners();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setInviteLoading(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            const headers = await getIdTokenHeader() as HeadersInit;
            await fetch('/api/partners', {
                method: 'PATCH',
                headers: { ...headers as any, 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            fetchPartners();
        } catch (err) {
            console.error(err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <ShieldCheck className="text-purple-600" />
                        Partner Management
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    {/* Invite Section */}
                    <div className="mb-8">
                        <h3 className="text-sm font-semibold mb-3 text-gray-500 uppercase tracking-wider">Add Partner</h3>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="Enter partner's email"
                                className="flex-1 bg-gray-50 dark:bg-neutral-800 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500"
                            />
                            <button
                                onClick={sendInvite}
                                disabled={inviteLoading || !inviteEmail}
                                className="bg-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {inviteLoading ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
                                Invite
                            </button>
                        </div>
                        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                    </div>

                    {/* List */}
                    <div className="space-y-6">
                        {/* Incoming Requests */}
                        {partners.filter(p => p.status === 'pending' && p.recipientId === user?.uid).length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-3 text-gray-500 uppercase tracking-wider">Requests</h3>
                                <div className="space-y-2">
                                    {partners.filter(p => p.status === 'pending' && p.recipientId === user?.uid).map(p => (
                                        <div key={p.id} className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/20">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold">?</div>
                                                <div className="text-sm">
                                                    <span className="font-bold">Requester ID: </span>
                                                    <span className="font-mono text-xs">{p.requesterId.slice(0, 8)}...</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => updateStatus(p.id, 'active')} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><Check size={16} /></button>
                                                <button onClick={() => updateStatus(p.id, 'declined')} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><X size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Active Partners */}
                        <div>
                            <h3 className="text-sm font-semibold mb-3 text-gray-500 uppercase tracking-wider">Active Partners</h3>
                            {partners.filter(p => p.status === 'active').length === 0 ? (
                                <p className="text-sm text-gray-400 italic">No active partners yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {partners.filter(p => p.status === 'active').map(p => {
                                        const otherId = p.requesterId === user?.uid ? p.recipientId : p.requesterId;
                                        return (
                                            <div key={p.id} className="flex justify-between items-center p-3 bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 font-bold">
                                                        <User size={16} />
                                                    </div>
                                                    <div className="text-sm">
                                                        <span className="font-bold">Partner</span>
                                                        <div className="font-mono text-xs text-gray-500">{otherId}</div>
                                                    </div>
                                                </div>
                                                <button onClick={() => updateStatus(p.id, 'blocked')} className="text-xs text-red-400 hover:text-red-500">Block</button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Sent Pending */}
                        {partners.filter(p => p.status === 'pending' && p.requesterId === user?.uid).length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-sm font-semibold mb-3 text-gray-500 uppercase tracking-wider">Sent Requests</h3>
                                <div className="space-y-2">
                                    {partners.filter(p => p.status === 'pending' && p.requesterId === user?.uid).map(p => (
                                        <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700 opacity-70">
                                            <span className="text-sm">To: <span className="font-mono text-xs">{p.recipientId.slice(0, 8)}...</span></span>
                                            <span className="text-xs flex items-center gap-1 text-gray-400"><Clock size={12} /> Pending</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
