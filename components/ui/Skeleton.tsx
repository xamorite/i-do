"use client";

import React from 'react';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
    <div className={`animate-pulse bg-gray-200 dark:bg-neutral-800 rounded ${className}`} />
);

export const TaskCardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-3 flex flex-col gap-2">
        <div className="flex items-start gap-3">
            <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-4 w-8" />
        </div>
        <div className="flex items-center gap-2 pl-8">
            <Skeleton className="h-4 w-16 rounded-full" />
        </div>
    </div>
);

export const TaskListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
    <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
            <TaskCardSkeleton key={i} />
        ))}
    </div>
);
