import { Activity, DaySchedule } from '@/lib/types';

// Parse time string to minutes since midnight for sorting
export const parseTime = (timeStr: string): number => {
  if (timeStr === 'All Day') return 0;

  // Handle formats like "3:00 AM - 6:00 AM" or "12:00 PM - 1:00 PM"
  const startTime = timeStr.split(' - ')[0].trim();
  const parts = startTime.split(' ');

  if (parts.length < 2) return 0; // Fallback for invalid format

  const [time, period] = parts;
  const [hours, minutes = '0'] = time.split(':');

  let hour24 = parseInt(hours);
  const min = parseInt(minutes);

  if (isNaN(hour24)) return 0;

  if (period === 'PM' && hour24 !== 12) {
    hour24 += 12;
  } else if (period === 'AM' && hour24 === 12) {
    hour24 = 0;
  }

  return hour24 * 60 + min;
};

// Sort activities chronologically by start time
export const sortActivitiesByTime = (activities: Activity[]): Activity[] => {
  return [...activities].sort((a, b) => {
    return parseTime(a.time) - parseTime(b.time);
  });
};

// Get time period for grouping (Morning, Afternoon, Evening, Night)
export const getTimePeriod = (timeStr: string): string => {
  if (timeStr === 'All Day') return 'Morning'; // Group All Day tasks with Morning or create a new section if UI supported it

  const minutes = parseTime(timeStr);
  const hour = Math.floor(minutes / 60);

  if (hour >= 6 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Night';
};

// Group activities by time period
export const groupActivitiesByPeriod = (activities: Activity[]): Record<string, Activity[]> => {
  const sorted = sortActivitiesByTime(activities);
  const grouped: Record<string, Activity[]> = {
    Morning: [],
    Afternoon: [],
    Evening: [],
    Night: [],
  };

  sorted.forEach(activity => {
    const period = getTimePeriod(activity.time);
    grouped[period].push(activity);
  });

  return grouped;
};

// Check if activity is important (contains 'special' or 'goal')
export const isImportantActivity = (activity: Activity): boolean => {
  return activity.type.includes('special') || activity.type.includes('goal');
};

// Get activity count for a day
export const getActivityCount = (day: DaySchedule): number => {
  return day.activities.length;
};

// Get all dates in a week (Monday to Sunday)
export const getWeekDates = (date: Date): Date[] => {
  const dates: Date[] = [];
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday

  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }

  return dates;
};

// Get all dates in a month
export const getMonthDates = (year: number, month: number): Date[] => {
  const dates: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }

  return dates;
};

// Format date to match schedule format (e.g., "Dec 1")
export const formatScheduleDate = (date: Date): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
};

// Find day schedule by date string
export const findDaySchedule = (schedule: DaySchedule[], dateStr: string): DaySchedule | undefined => {
  return schedule.find(day => day.date === dateStr);
};

// Get week range string (e.g., "Dec 1 - Dec 7, 2025")
export const getWeekRangeString = (startDate: Date, endDate: Date): string => {
  const start = formatScheduleDate(startDate);
  const end = formatScheduleDate(endDate);
  const year = startDate.getFullYear();
  return `${start} - ${end}, ${year}`;
};

// Check if date is today
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

// Get day name abbreviation (Mon, Tue, etc.)
export const getDayName = (date: Date): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
};





