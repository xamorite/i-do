"use client";

import React from 'react';
import { DaySchedule, Activity } from '@/lib/types';
import { findDaySchedule, formatScheduleDate, isImportantActivity, getActivityCount, isToday } from '@/lib/utils/scheduleHelpers';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthViewProps {
  schedule: DaySchedule[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onDayClick: (date: Date) => void;
  onTaskClick: (activity: Activity) => void;
}

const getActivityIcon = (type: string) => {
  switch (type.split('-')[0]) {
    case 'work': return '💼';
    case 'music': return '🎵';
    case 'hobby': return '🎨';
    case 'spiritual': return '🛡️';
    case 'personal': return '🍽️';
    case 'call': return '📞';
    default: return '⏰';
  }
};

export const MonthView: React.FC<MonthViewProps> = ({ schedule, selectedDate, onDateChange, onDayClick, onTaskClick }) => {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(month + (direction === 'next' ? 1 : -1));
    onDateChange(newDate);
  };

  const getDaysArray = () => {
    const days: (number | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(year, month, day);
    onDayClick(clickedDate);
  };

  const monthName = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{monthName}</h2>
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800 p-4">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {getDaysArray().map((day, index) => {
            if (day === null) {
              return <div key={index} className="aspect-square" />;
            }

            const date = new Date(year, month, day);
            const dateStr = formatScheduleDate(date);
            const daySchedule = findDaySchedule(schedule, dateStr);
            const dayIsToday = isToday(date);
            const activityCount = daySchedule ? getActivityCount(daySchedule) : 0;
            const importantEvents = daySchedule
              ? daySchedule.activities.filter(isImportantActivity)
              : [];

            return (
              <button
                key={index}
                onClick={() => handleDayClick(day)}
                className={`
                  aspect-square p-2 rounded-lg border-2 transition-all hover:shadow-md
                  ${dayIsToday ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-gray-300 dark:hover:border-neutral-700'}
                  ${daySchedule ? 'cursor-pointer' : 'cursor-default opacity-50'}
                `}
              >
                <div className="flex flex-col h-full">
                  <span className={`text-sm font-semibold mb-1 ${dayIsToday ? 'text-purple-700 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {day}
                  </span>

                  <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                    {importantEvents.slice(0, 2).map((event: Activity, eventIndex: number) => (
                      <div
                        key={eventIndex}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick(event);
                        }}
                        className="text-xs px-1 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded truncate cursor-pointer hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors"
                        title={event.desc}
                      >
                        {getActivityIcon(event.type)} {event.desc.substring(0, 15)}
                      </div>
                    ))}

                    {importantEvents.length > 2 && (
                      <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                        +{importantEvents.length - 2} more
                      </div>
                    )}
                  </div>

                  {activityCount > 0 && (
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {activityCount} {activityCount === 1 ? 'task' : 'tasks'}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};





