import React from 'react';

// Google Calendar Icon - matches the colorful workspace style from reference image
export const GoogleCalendarIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
        {/* Background */}
        <rect x="20" y="20" width="160" height="160" rx="20" fill="#4285F4" />
        {/* White calendar body */}
        <rect x="30" y="50" width="140" height="120" rx="10" fill="white" />
        {/* Calendar header holes */}
        <rect x="55" y="15" width="12" height="45" rx="6" fill="#1A73E8" />
        <rect x="133" y="15" width="12" height="45" rx="6" fill="#1A73E8" />
        {/* Date number */}
        <text x="100" y="140" textAnchor="middle" fill="#4285F4" fontSize="70" fontWeight="bold" fontFamily="Google Sans, Arial, sans-serif">31</text>
    </svg>
);

// Notion Logo - boxed N style from reference image
export const NotionLogo: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Rounded rectangle border */}
        <rect x="5" y="5" width="90" height="90" rx="10" fill="white" stroke="black" strokeWidth="4" />
        {/* Notion N letterform */}
        <path d="M28 25h10l24 35V25h10v50H62L38 40v35H28V25z" fill="black" />
    </svg>
);

// Slack Logo - 4-color hash style
export const SlackLogo: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 122.8 122.8" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.4 0c0-7.1 5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H45.1c-7.1 0-12.9-5.8-12.9-12.9z" fill="#36C5F0" />
        <path d="M45.1 25.8c-7.1 0-12.9-5.8-12.9-12.9S38 0 45.1 0s12.9 5.8 12.9 12.9v12.9H45.1zm0 6.4c7.1 0 12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V45.1c0-7.1 5.8-12.9 12.9-12.9z" fill="#2EB67D" />
        <path d="M97 45.1c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.1zm-6.4 0c0 7.1-5.8 12.9-12.9 12.9H45.4c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9z" fill="#ECB22E" />
        <path d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.4c-7.1 0-12.9-5.8-12.9-12.9V45.4c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9z" fill="#E01E5A" />
    </svg>
);

// GitHub Logo - Octocat silhouette
export const GithubLogo: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.372 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.113.793-.261.793-.577v-2.234c-3.338.726-4.043-1.416-4.043-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.652.242 2.873.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" fill="currentColor" />
    </svg>
);
