import { useState, useEffect } from 'react';
import { fetchCalendarEvents } from '@/hooks/useCalendarSync';
import { fetchSlackMessages } from '@/hooks/useSlack';
import { fetchNotionTasks } from '@/hooks/useNotion';
import { Task } from '@/lib/types';

export function useIntegrationManager(selectedDate: Date, currentView: string, visibleSources: Set<string>) {
    const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
    const [slackMessages, setSlackMessages] = useState<any[]>([]);
    const [notionTasks, setNotionTasks] = useState<Task[]>([]);
    const [isCalendarLoading, setIsCalendarLoading] = useState(false);

    const loadCalendarEvents = async () => {
        setIsCalendarLoading(true);
        try {
            let start: Date;
            let end: Date;

            if (currentView === 'week') {
                const monday = new Date(selectedDate);
                const day = monday.getDay();
                const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
                monday.setDate(diff);
                monday.setHours(0, 0, 0, 0);
                start = monday;
                end = new Date(monday);
                end.setDate(monday.getDate() + 6);
                end.setHours(23, 59, 59, 999);
            } else if (currentView === 'month') {
                const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
                const startDay = monthStart.getDay();
                const gridStart = new Date(monthStart);
                gridStart.setDate(gridStart.getDate() - (startDay === 0 ? 6 : startDay - 1));
                gridStart.setHours(0, 0, 0, 0);
                start = gridStart;
                end = new Date(gridStart);
                end.setDate(gridStart.getDate() + 41);
                end.setHours(23, 59, 59, 999);
            } else {
                start = new Date(selectedDate);
                start.setHours(0, 0, 0, 0);
                end = new Date(selectedDate);
                end.setHours(23, 59, 59, 999);
            }

            const events = await fetchCalendarEvents(start.toISOString(), end.toISOString());
            setCalendarEvents(events);
        } catch (err) {
            console.error('Failed to load calendar events:', err);
        } finally {
            setIsCalendarLoading(false);
        }
    };

    const loadSlackMessages = async () => {
        try {
            const msgs = await fetchSlackMessages();
            setSlackMessages(msgs);
        } catch (err) {
            console.error('Failed to load Slack messages:', err);
        }
    };

    const loadNotionTasks = async () => {
        try {
            const msgs = await fetchNotionTasks();
            setNotionTasks(msgs || []);
        } catch (err) {
            console.error('Failed to load Notion tasks:', err);
        }
    };

    useEffect(() => {
        loadCalendarEvents();
        loadSlackMessages();
        if (visibleSources.has('notion')) {
            loadNotionTasks();
        }
    }, [selectedDate, currentView, visibleSources]);

    return {
        calendarEvents,
        slackMessages,
        notionTasks,
        isCalendarLoading,
        loadCalendarEvents,
        loadSlackMessages,
        loadNotionTasks,
    };
}
