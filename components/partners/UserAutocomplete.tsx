import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, User } from 'lucide-react';
import { getIdTokenHeader } from '@/lib/getIdToken';

interface UserProfile {
    userId: string;
    username: string;
    displayName: string;
    photoURL?: string;
}

interface UserAutocompleteProps {
    onSelect: (user: UserProfile) => void;
    placeholder?: string;
}

export const UserAutocomplete: React.FC<UserAutocompleteProps> = ({ onSelect, placeholder = "Search partner by username..." }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const search = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const headers = await getIdTokenHeader() as HeadersInit;
                const res = await fetch(`/api/partners/autocomplete?query=${encodeURIComponent(query)}`, { headers });
                const data = await res.json();
                if (data.results) setResults(data.results);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(search, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="flex items-center border-b border-gray-200 dark:border-neutral-800 transition-colors">
                <Search size={14} className="text-gray-400 mr-2" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    className="w-full bg-transparent border-none focus:ring-0 outline-none focus:outline-none p-1 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                    placeholder={placeholder}
                />
                {loading && <Loader2 size={14} className="animate-spin text-purple-500" />}
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-gray-100 dark:border-neutral-800 max-h-48 overflow-y-auto">
                    {results.map(user => (
                        <button
                            key={user.userId}
                            onClick={() => {
                                onSelect(user);
                                setQuery('');
                                setIsOpen(false);
                            }}
                            className="w-full text-left flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                            {user.photoURL ? (
                                <img src={user.photoURL} alt={user.username} className="w-6 h-6 rounded-full" />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-[10px] font-bold text-purple-600">
                                    {user.username[0].toUpperCase()}
                                </div>
                            )}
                            <div>
                                <div className="text-xs font-bold text-gray-900 dark:text-gray-100">@{user.username}</div>
                                <div className="text-[10px] text-gray-500 truncate">{user.displayName}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {isOpen && query.length >= 2 && results.length === 0 && !loading && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-gray-100 dark:border-neutral-800 p-2 text-center text-xs text-gray-400">
                    No active partners found.
                </div>
            )}
        </div>
    );
};
