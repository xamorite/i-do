"use client";

import React from 'react';
import { DaySchedule, Activity } from '@/lib/types';
import { DatePicker } from './DatePicker';
import { getWeekDates, findDaySchedule, formatScheduleDate, getWeekRangeString, getDayName } from '@/lib/utils/scheduleHelpers';
import { Briefcase, Music, Brush, Utensils, Users, Shield, Clock } from 'lucide-react';

interface WeekViewProps {
  schedule: DaySchedule[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onTaskClick: (activity: Activity) => void;
}

const getActivityIcon = (type: string) => {
  switch (type.split('-')[0]) {
    case 'work': return <Briefcase size={14} className="text-blue-500" />;
    case 'music': return <Music size={14} className="text-red-500" />;
    case 'hobby': return <Brush size={14} className="text-green-500" />;
    case 'spiritual': return <Shield size={14} className="text-purple-500" />;
    case 'personal': return <Utensils size={14} className="text-yellow-500" />;
    case 'call': return <Users size={14} className="text-indigo-500" />;
    default: return <Clock size={14} className="text-gray-400" />;
  }
};

const getTypeClass = (type: string) => {
  switch (type.split('-')[0]) {
    case 'work': return 'bg-blue-50 ring-blue-200 dark:bg-blue-900/20 dark:ring-blue-800';
    case 'music': return 'bg-red-50 ring-red-200 dark:bg-red-900/20 dark:ring-red-800';
    case 'hobby': return 'bg-green-50 ring-green-200 dark:bg-green-900/20 dark:ring-green-800';
    case 'spiritual': return 'bg-purple-50 ring-purple-200 dark:bg-purple-900/20 dark:ring-purple-800';
    case 'personal': return 'bg-yellow-50 ring-yellow-200 dark:bg-yellow-900/20 dark:ring-yellow-800';
    case 'call': return 'bg-indigo-50 ring-indigo-200 dark:bg-indigo-900/20 dark:ring-indigo-800';
    default: return 'bg-gray-50 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700';
  }
};

export const WeekView: React.FC<WeekViewProps> = ({ schedule, selectedDate, onDateChange, onTaskClick }) => {
  const weekDates = getWeekDates(selectedDate);
  const weekRange = getWeekRangeString(weekDates[0], weekDates[6]);

  // Track current time
  const [now, setNow] = React.useState(new Date());
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    // Update every minute
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Check if a specific date is today
  const checkIsToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Helper to check if activity is current
  const isTimeActive = (timeRange: string, date: Date): boolean => {
    if (!mounted) return false;
    if (!checkIsToday(date)) return false;
    if (timeRange === 'All Day') return true;

    try {
      const parts = timeRange.split(' - ');
      if (parts.length < 2) return false;

      const [startStr, endStr] = parts;

      const parseTime = (t: string) => {
        const [time, period] = t.trim().split(' ');
        const [hours, minutes] = time.split(':');
        let h = parseInt(hours);
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        const d = new Date(now);
        d.setHours(h, parseInt(minutes), 0, 0);
        return d;
      };

      const start = parseTime(startStr);
      const end = parseTime(endStr);

      // Handle overnight tasks
      if (end < start) {
        end.setDate(end.getDate() + 1);
      }

      return now >= start && now <= end;
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <DatePicker selectedDate={selectedDate} onDateChange={onDateChange} mode="week" />
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{weekRange}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDates.map((date, index) => {
          const dateStr = formatScheduleDate(date);
          const daySchedule = findDaySchedule(schedule, dateStr);
          const dayName = getDayName(date);
          const isToday = checkIsToday(date);

          return (
            <div
              key={index}
              className={`bg-white dark:bg-neutral-900 rounded-lg shadow-sm border-2 ${isToday ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-neutral-800'
                } p-4 flex flex-col h-[calc(100vh-250px)] min-h-[500px]`}
            >
              <div className="mb-3 pb-2 border-b border-gray-200 dark:border-neutral-800 flex-none">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${isToday ? 'text-purple-700 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {dayName}
                  </span>
                  {isToday && (
                    <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">Today</span>
                  )}
                </div>
                <span className={`text-lg font-bold ${isToday ? 'text-purple-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>
                  {date.getDate()}
                </span>
              </div>

              <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                {daySchedule ? (
                  daySchedule.activities.length > 0 ? (
                    daySchedule.activities.map((activity: Activity, actIndex: number) => {
                      const active = isTimeActive(activity.time, date);
                      return (
                        <div
                          key={actIndex}
                          onClick={() => onTaskClick(activity)}
                          className={`
                            p-2 rounded-lg border text-xs cursor-pointer transition-all duration-200
                            ${active
                              ? 'border-purple-500 shadow-md ring-1 ring-purple-500 bg-purple-50 dark:bg-purple-900/40 relative z-10 scale-[1.02]'
                              : `border-transparent ring-1 ${getTypeClass(activity.type)} hover:shadow-sm hover:scale-[1.01]`
                            }
                          `}
                        >
                          {active && (
                            <div className="absolute -left-1 top-2 bottom-2 w-1 bg-purple-500 rounded-r-sm" />
                          )}
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium leading-tight truncate ${active ? 'text-purple-900 dark:text-purple-100 font-bold' : 'text-gray-800 dark:text-gray-200'}`} title={activity.desc}>
                                {activity.desc}
                              </p>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{activity.time}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-gray-600 text-center py-4">No activities</p>
                  )
                ) : (
                  <p className="text-xs text-gray-400 dark:text-gray-600 text-center py-4">No schedule data</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};





