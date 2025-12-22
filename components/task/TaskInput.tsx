"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Clock, Hash, Calendar as CalendarIcon, ArrowRight, X } from 'lucide-react';

interface TaskInputValue {
    title: string;
    channel?: string;
    estimate?: number; // in minutes
    date?: Date;
}

interface TaskInputProps {
    onSubmit: (value: TaskInputValue) => void;
    onCancel?: () => void;
    initialDate?: Date;
    placeholder?: string;
    autoFocus?: boolean;
}

export const TaskInput: React.FC<TaskInputProps> = ({
    onSubmit,
    onCancel,
    initialDate,
    placeholder = "Add a task... (use #channel, ~30m, @tomorrow)",
    autoFocus = false,
}) => {
    const [text, setText] = useState('');
    const [parsed, setParsed] = useState<TaskInputValue>({ title: '', date: initialDate });
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    useEffect(() => {
        parseText(text);
    }, [text]);

    const parseText = (input: string) => {
        let title = input;
        let channel: string | undefined;
        let estimate: number | undefined;
        let date: Date | undefined = initialDate;

        // Parse Channel (#channel)
        const channelMatch = input.match(/#(\w+)/);
        if (channelMatch) {
            channel = channelMatch[1];
            title = title.replace(channelMatch[0], '').trim();
        }

        // Parse Time Estimate (~30m, ~1h)
        const timeMatch = input.match(/~(\d+)(m|h|min|hour)?/);
        if (timeMatch) {
            const val = parseInt(timeMatch[1]);
            const unit = timeMatch[2];
            if (unit === 'h' || unit === 'hour') {
                estimate = val * 60;
            } else {
                estimate = val;
            }
            title = title.replace(timeMatch[0], '').trim();
        }

        // Parse Date (@tomorrow)
        // Simple implementation for now
        const dateMatch = input.match(/@(tomorrow|today)/);
        if (dateMatch) {
            const keyword = dateMatch[1];
            const d = new Date();
            if (keyword === 'tomorrow') {
                d.setDate(d.getDate() + 1);
            }
            date = d;
            title = title.replace(dateMatch[0], '').trim();
        }

        setParsed({ title, channel, estimate, date });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (parsed.title) {
                onSubmit(parsed);
                setText('');
            }
        } else if (e.key === 'Escape') {
            if (onCancel) onCancel();
        }
    };

    return (
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <div className="h-4 w-4 rounded-full border-2 border-gray-300 dark:border-gray-600 group-focus-within:border-purple-500 transition-colors" />
            </div>

            <input
                ref={inputRef}
                type="text"
                className="block w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-900 border border-transparent focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl shadow-sm placeholder-gray-400 dark:text-white transition-all outline-none"
                placeholder={placeholder}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
            />

            {/* Visual Feedback for Shortcuts */}
            {(parsed.channel || parsed.estimate || (parsed.date && parsed.date !== initialDate)) && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                    {parsed.channel && (
                        <span className="flex items-center space-x-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                            <Hash size={10} />
                            <span>{parsed.channel}</span>
                        </span>
                    )}
                    {parsed.estimate && (
                        <span className="flex items-center space-x-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded-full font-medium">
                            <Clock size={10} />
                            <span>{parsed.estimate}m</span>
                        </span>
                    )}
                    {parsed.date && parsed.date !== initialDate && (
                        <span className="flex items-center space-x-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full font-medium">
                            <CalendarIcon size={10} />
                            <span>{parsed.date.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};
