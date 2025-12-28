"use client";

import React from 'react';

export type ViewMode = 'day' | 'week' | 'month';

interface ViewTabsProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export const ViewTabs: React.FC<ViewTabsProps> = ({ currentView, onViewChange }) => {
  const tabs: { id: ViewMode; label: string }[] = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
  ];

  return (
    <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onViewChange(tab.id)}
          className={`px-6 py-3 font-medium text-sm transition-colors ${currentView === tab.id
              ? 'text-purple-600 border-b-2 border-purple-600 dark:text-purple-400 dark:border-purple-400'
              : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-700'
            }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};





