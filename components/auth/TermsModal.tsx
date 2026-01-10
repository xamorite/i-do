"use client";

import React from 'react';
import { X } from 'lucide-react';

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div
                className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-neutral-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Terms and Conditions</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="prose dark:prose-invert max-w-none text-sm text-gray-600 dark:text-gray-300 space-y-4">
                        <p className="font-semibold">Last Updated: January 10, 2026</p>
                        <p>Welcome to DailyExpress! By accessing or using our task management services, you agree to be bound by these Terms and Conditions.</p>

                        <h3 className="font-bold text-gray-900 dark:text-gray-100">1. Acceptance of Terms</h3>
                        <p>By creating an account or using our services, you agree to comply with these terms. If you do not agree, you may not use our services.</p>

                        <h3 className="font-bold text-gray-900 dark:text-gray-100">2. Description of Service</h3>
                        <p>DailyExpress provides a task management and daily planning platform designed to help users organize their schedules, manage tasks, and collaborate with accountability partners.</p>

                        <h3 className="font-bold text-gray-900 dark:text-gray-100">3. User Accounts</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                            <li>You agree to provide accurate and complete information during registration.</li>
                            <li>You are strictly responsible for all activities that occur under your account.</li>
                        </ul>

                        <h3 className="font-bold text-gray-900 dark:text-gray-100">4. User Conduct</h3>
                        <p>You agree not to use the service to:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Violate any laws or regulations.</li>
                            <li>Infringe upon the rights of others.</li>
                            <li>Upload malicious code or interfere with the service&apos;s operation.</li>
                            <li>Harass or harm other users.</li>
                        </ul>

                        <h3 className="font-bold text-gray-900 dark:text-gray-100">5. Intellectual Property</h3>
                        <p>All content, design, and code related to DailyExpress are the property of DailyExpress and are protected by intellectual property laws. You retain ownership of the data you input into the system.</p>

                        <h3 className="font-bold text-gray-900 dark:text-gray-100">6. Termination</h3>
                        <p>We reserve the right to suspend or terminate your account at our discretion if you violate these terms.</p>

                        <h3 className="font-bold text-gray-900 dark:text-gray-100">7. Disclaimer of Warranties</h3>
                        <p>The service is provided "as is" without warranties of any kind, whether express or implied. We do not guarantee that the service will be uninterrupted or error-free.</p>

                        <h3 className="font-bold text-gray-900 dark:text-gray-100">8. Limitation of Liability</h3>
                        <p>DailyExpress shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>

                        <h3 className="font-bold text-gray-900 dark:text-gray-100">9. Changes to Terms</h3>
                        <p>We may modify these terms at any time. Continued use of the service constitutes acceptance of the modified terms.</p>

                        <h3 className="font-bold text-gray-900 dark:text-gray-100">10. Contact Us</h3>
                        <p>If you have any questions about these terms, please contact us at <a href="mailto:idointegrations@gmail.com" className="text-purple-600 hover:underline">idointegrations@gmail.com</a>.</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50 rounded-b-2xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
