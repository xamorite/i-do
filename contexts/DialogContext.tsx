"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { X, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface DialogOptions {
    title: string;
    message: string;
    type?: 'confirm' | 'alert';
    variant?: 'default' | 'destructive' | 'info' | 'success';
    confirmText?: string;
    cancelText?: string;
}

interface DialogContextType {
    showConfirm: (title: string, message: string, options?: Partial<DialogOptions>) => Promise<boolean>;
    showAlert: (title: string, message: string, options?: Partial<DialogOptions>) => Promise<void>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialog = () => {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('useDialog must be used within a DialogProvider');
    }
    return context;
};

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<DialogOptions>({
        title: '',
        message: '',
        type: 'confirm',
        variant: 'default',
        confirmText: 'Confirm',
        cancelText: 'Cancel'
    });

    const resolveRef = useRef<((value: any) => void) | null>(null);

    const showConfirm = useCallback((title: string, message: string, opts?: Partial<DialogOptions>): Promise<boolean> => {
        setOptions({
            title,
            message,
            type: 'confirm',
            variant: 'default',
            confirmText: 'Confirm',
            cancelText: 'Cancel',
            ...opts
        });
        setIsOpen(true);
        return new Promise((resolve) => {
            resolveRef.current = resolve;
        });
    }, []);

    const showAlert = useCallback((title: string, message: string, opts?: Partial<DialogOptions>): Promise<void> => {
        setOptions({
            title,
            message,
            type: 'alert',
            variant: 'info',
            confirmText: 'OK',
            cancelText: '', // Alert doesn't usually have cancel
            ...opts
        });
        setIsOpen(true);
        return new Promise((resolve) => {
            resolveRef.current = resolve;
        });
    }, []);

    const handleConfirm = () => {
        setIsOpen(false);
        if (resolveRef.current) {
            resolveRef.current(true);
            resolveRef.current = null;
        }
    };

    const handleCancel = () => {
        setIsOpen(false);
        if (resolveRef.current) {
            // If it's an alert, 'cancel' (closing via X or background) usually just means done/acknowledged
            if (options.type === 'alert') {
                resolveRef.current(true);
            } else {
                resolveRef.current(false);
            }
            resolveRef.current = null;
        }
    };

    return (
        <DialogContext.Provider value={{ showConfirm, showAlert }}>
            {children}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                        onClick={handleCancel}
                    />
                    <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200 border border-gray-100 dark:border-neutral-800">
                        <div className="mb-4">
                            <div className="flex items-center gap-3 mb-2">
                                {options.variant === 'destructive' && <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400"><AlertTriangle size={24} /></div>}
                                {options.variant === 'success' && <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400"><CheckCircle2 size={24} /></div>}
                                {options.variant === 'info' && <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400"><Info size={24} /></div>}
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex-1">{options.title}</h3>
                                <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                    <X size={20} />
                                </button>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                {options.message}
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6">
                            {options.type === 'confirm' && (
                                <button
                                    onClick={handleCancel}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                                >
                                    {options.cancelText}
                                </button>
                            )}
                            <button
                                onClick={handleConfirm}
                                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm ${options.variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' :
                                        options.type === 'alert' ? 'bg-gray-900 dark:bg-white dark:text-gray-900 hover:opacity-90' :
                                            'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {options.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DialogContext.Provider>
    );
};
