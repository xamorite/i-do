
"use client";

import React from 'react';
import { DaySchedule, Activity } from '@/lib/types';
import { DatePicker } from './DatePicker';
import { groupActivitiesByPeriod, findDaySchedule, formatScheduleDate, isToday } from '@/lib/utils/scheduleHelpers';
import { Briefcase, Music, Brush, Utensils, Users, Shield, Clock } from 'lucide-react';

interface DayViewProps {
  schedule: DaySchedule[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onTaskClick: (activity: Activity) => void;
}

const getActivityIcon = (type: string) => {
  switch (type.split('-')[0]) {
    case 'work': return <Briefcase size={16} className="text-blue-500" />;
    case 'music': return <Music size={16} className="text-red-500" />;
    case 'hobby': return <Brush size={16} className="text-green-500" />;
    case 'spiritual': return <Shield size={16} className="text-purple-500" />;
    case 'personal': return <Utensils size={16} className="text-yellow-500" />;
    case 'call': return <Users size={16} className="text-indigo-500" />;
    default: return <Clock size={16} className="text-gray-400" />;
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

export const DayView: React.FC<DayViewProps> = ({ schedule, selectedDate, onDateChange, onTaskClick }) => {
  const dateStr = formatScheduleDate(selectedDate);
  const daySchedule = findDaySchedule(schedule, dateStr);

  // Track current time
  const [now, setNow] = React.useState(new Date());
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    // Update every minute
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const isTodayDate = isToday(selectedDate);

  // Helper to check if activity is current
  const isTimeActive = (timeRange: string): boolean => {
    if (!mounted) return false;
    if (!isTodayDate) return false;
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

  // Helper to parse time string to hours for sorting
  const getStartHour = (timeStr: string): number => {
    if (timeStr === 'All Day') return -1;
    // "3:00 AM - ..."
    const part = timeStr.split(' - ')[0];
    const [time, period] = part.split(' ');
    const [hStr] = time.split(':');
    let h = parseInt(hStr);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h;
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Format hour to 12h format (e.g., 9 AM)
  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  if (!daySchedule) {
    return (
      <div className="space-y-4">
        <DatePicker selectedDate={selectedDate} onDateChange={onDateChange} mode="day" />
        <div className="text-center py-12 bg-gray-50 dark:bg-neutral-900 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">No schedule data for {dateStr}</p>
        </div>
      </div>
    );
  }

  const allDayActivities = daySchedule.activities.filter(a => a.time === 'All Day');
  // Filter activities for each hour. Note: This simple check looks at start time.
  // Activities spanning multiple hours will mainly show up in their start hour.
  const getActivitiesForHour = (hour: number) => {
    return daySchedule.activities.filter(a => {
      if (a.time === 'All Day') return false;
      return getStartHour(a.time) === hour;
    });
  };

  return (
    <div className="space-y-6">
      <DatePicker selectedDate={selectedDate} onDateChange={onDateChange} mode="day" />

      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800 p-6">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{daySchedule.date}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{daySchedule.day}</p>
          </div>
          {isTodayDate && mounted && (
            <div className="text-right">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Current Time</p>
              <p className="text-xl font-mono font-semibold text-purple-600">
                {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
        </div>

        {/* All Day Section */}
        {allDayActivities.length > 0 && (
          <div className="mb-8 pb-4 border-b border-gray-100 dark:border-neutral-800">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">All Day</h3>
            <div className="space-y-3">
              {allDayActivities.map((activity, index) => (
                <div
                  key={`allday-${index}`}
                  onClick={() => onTaskClick(activity)}
                  className={`
                          relative p-4 rounded-lg border transition-all duration-300 cursor-pointer
                          border-transparent ring-1 ${getTypeClass(activity.type)} hover:shadow-md
                        `}
                >
                  <div className="flex items-start gap-3">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 dark:text-gray-200">{activity.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hourly Timeline */}
        <div className="space-y-0 relative">
          {hours.map(hour => {
            const activities = getActivitiesForHour(hour);
            // Only show hours 5 AM to 11 PM unless there are tasks in the early hours
            if (hour < 5 && activities.length === 0) return null;

            return (
              <div key={hour} className="flex gap-4 min-h-[4rem] group">
                {/* Time Label */}
                <div className="w-16 text-right pt-2 flex-shrink-0">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                    {formatHour(hour)}
                  </span>
                </div>

                {/* Content Area */}
                <div className="flex-1 pb-6 border-l border-gray-100 dark:border-neutral-800 pl-4 relative">
                  {/* Horizontal line for hour marker */}
                  <div className="absolute left-0 top-4 w-full h-px bg-gray-50 dark:bg-neutral-800/50 -z-10" />

                  {activities.length > 0 ? (
                    <div className="space-y-3 pt-0">
                      {activities.map((activity, index) => {
                        const active = isTimeActive(activity.time);
                        return (
                          <div
                            key={`${hour}-${index}`}
                            onClick={() => onTaskClick(activity)}
                            className={`
                                            relative p-3 rounded-lg border transition-all duration-300 cursor-pointer text-sm
                                            ${active
                                ? 'border-purple-500 shadow-md ring-1 ring-purple-500 bg-purple-50 dark:bg-purple-900/30 scale-[1.02] z-10'
                                : `border-transparent ring-1 ${getTypeClass(activity.type)} hover:shadow-md`
                              }
                                          `}
                          >
                            {active && (
                              <div className="absolute -left-[17px] top-1/2 -translate-y-1/2 w-4 h-[2px] bg-purple-500" />
                            )}

                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <p className={`font-medium leading-tight truncate ${active ? 'text-purple-900 dark:text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                                    {activity.desc}
                                  </p>
                                  {/* Deadline Badge */}
                                  {activity.deadline && (
                                    <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">
                                      Due {new Date(activity.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                </div>

                                <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  <span>{activity.time}</span>
                                  {activity.duration && <span className="opacity-75">• {activity.duration}</span>}
                                  {activity.reminder && <span className="text-blue-500">🔔 {activity.reminder}</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Empty active hour indicator if it's the current hour
                    isTodayDate && mounted && new Date().getHours() === hour && (
                      <div className="absolute left-0 top-4 w-full border-t border-purple-300 dark:border-purple-700 border-dashed opacity-50 flex items-center">
                        <div className="w-2 h-2 rounded-full bg-purple-500 -ml-[5px]" />
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {daySchedule.activities.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No activities scheduled for this day</p>
          </div>
        )}
      </div>
    </div>
  );
};


