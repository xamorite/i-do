"use client";

import React, { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DragDropContainer } from '@/components/dnd/DragDropContainer';
import { TaskDetailPanel } from '@/components/task/TaskDetailPanel';
import { fetchTasks, createTask, updateTask, deleteTask, fetchTaskById } from '@/hooks/useTasks';
import { upsertDayPlan } from '@/hooks/useDayPlan';
import { Task } from '@/lib/types';
import { TaskInput } from '@/components/task/TaskInput';
import { DailyPlanningRitual } from '@/components/rituals/DailyPlanningRitual';
import {
  Plus,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  Settings,
  MoreHorizontal,
  Layout,
  Home,
  Zap,
  ChevronDown,
  ChevronUp,
  PanelRightClose,
  PanelRightOpen,
  Filter
} from 'lucide-react';
import { WeeklyCalendar } from '@/components/calendar/WeeklyCalendar';
import { MonthlyCalendar } from '@/components/calendar/MonthlyCalendar';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { fetchCalendarEvents } from '@/hooks/useCalendarSync';
import { fetchNotionTasks, importNotionPage } from '@/hooks/useNotion';
import { fetchSlackMessages } from '@/hooks/useSlack';
import { SlackLogo, NotionLogo } from '@/components/ui/Logos';
import { useAuth } from '@/contexts/AuthContext';
import { IntegrationRail } from '@/components/layout/IntegrationRail';
import { DayColumn } from '@/components/task/DayColumn';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { UserMenu } from '@/components/layout/UserMenu';
import { NotionDatabaseBrowser } from '@/components/integrations/NotionDatabaseBrowser';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { PartnerManager } from '@/components/partners/PartnerManager';

function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Record<string, Task[]>>({});
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [slackMessages, setSlackMessages] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<'home' | 'today' | 'week' | 'month'>('home');
  const [activeIntegration, setActiveIntegration] = useState<string | null>('google-calendar');
  const [isRightPaneOpen, setIsRightPaneOpen] = useState(true);
  const [visibleSources, setVisibleSources] = useState<Set<string>>(new Set(['google', 'notion', 'slack', 'task']));

  const toggleSource = (source: string) => {
    setVisibleSources(prev => {
      const next = new Set(prev);
      if (next.has(source)) next.delete(source);
      else next.add(source);
      return next;
    });
  };

  // Ritual State
  const [isPlanningOpen, setIsPlanningOpen] = useState(false);
  const [isPartnerManagerOpen, setIsPartnerManagerOpen] = useState(false);

  // DnD State (can be existing Task or external NotionPage)
  const [activeDragItem, setActiveDragItem] = useState<any | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // We show Today and Tomorrow for now
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const afterTomorrow = new Date(today);
  afterTomorrow.setDate(today.getDate() + 2);

  const datesToShow = currentView === 'home'
    ? [today, tomorrow, afterTomorrow]
    : [today];

  const datesToLoad = [today, tomorrow, afterTomorrow];

  useEffect(() => {
    loadAllTasks();
    loadCalendarEvents();
    loadSlackMessages();
  }, [selectedDate, currentView]);

  // Method Definitions
  const loadAllTasks = async () => {
    setIsLoading(true);
    try {
      const results: Record<string, Task[]> = {};
      let datesToLoad = [today, tomorrow, afterTomorrow];

      if (currentView === 'week') {
        const monday = new Date(selectedDate);
        const day = monday.getDay();
        const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
        monday.setDate(diff);
        datesToLoad = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          return d;
        });
      } else if (currentView === 'month') {
        const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const startDay = monthStart.getDay();
        const gridStart = new Date(monthStart);
        gridStart.setDate(gridStart.getDate() - (startDay === 0 ? 6 : startDay - 1));
        datesToLoad = Array.from({ length: 42 }, (_, i) => {
          const d = new Date(gridStart);
          d.setDate(gridStart.getDate() + i);
          return d;
        });
      }

      await Promise.all(datesToLoad.map(async (d) => {
        const dStr = d.toISOString().split('T')[0];
        const data = await fetchTasks(`plannedDate=${dStr}`);
        results[dStr] = data.tasks || [];
      }));

      // Fetch Notion tasks if enabled
      if (visibleSources.has('notion')) {
        const notionTasks = await fetchNotionTasks();
        notionTasks.forEach((nt: any) => {
          const date = nt.plannedDate;
          if (!results[date]) results[date] = [];
          results[date].push(nt);
        });
      }

      setTasks(results);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleSmartAddTask = async (val: { title: string, channel?: string, estimate?: number, date?: Date }) => {
    try {
      const taskDate = val.date ? val.date.toISOString().split('T')[0] : selectedDate.toISOString().split('T')[0];
      const res = await createTask({
        title: val.title,
        plannedDate: taskDate,
        status: 'planned',
        channel: val.channel,
        estimateMinutes: val.estimate,
      });

      // Update state for the specific date if it's currently showing
      if (tasks[taskDate]) {
        setTasks(prev => ({
          ...prev,
          [taskDate]: [...(prev[taskDate] || []), res.task]
        }));
      } else {
        // If not showing, but we just added it, maybe reload or just alert
        alert(`Task added to ${val.date?.toLocaleDateString() || 'selected date'}`);
      }
    } catch (err) {
      alert('Failed to create task');
    }
  };


  const handleTaskUpdate = async (id: string, updates: Partial<Task>, dateStr?: string) => {
    if (!dateStr) return;

    // Optimistic update
    setTasks(prev => {
      const newDayTasks = (prev[dateStr] || []).map(t => t.id === id ? { ...t, ...updates } : t);
      return { ...prev, [dateStr]: newDayTasks };
    });

    try {
      await updateTask(id, updates);
    } catch (err) {
      console.error('Failed to update task:', err);
      // Revert in real app (omitted for brevity)
    }
  };

  const handleTaskDelete = async (id: string, dateStr?: string) => {
    if (!dateStr) return;

    setTasks(prev => {
      const newDayTasks = (prev[dateStr] || []).filter(t => t.id !== id);
      return { ...prev, [dateStr]: newDayTasks };
    });

    try {
      await deleteTask(id);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleReorder = async (newTasks: Task[], dateStr: string) => {
    try {
      await upsertDayPlan(dateStr, { taskIds: newTasks.map(t => t.id) });
    } catch (err) {
      console.error('Failed to persist order:', err);
    }
  };

  const handleIntegrationToggle = (id: string) => {
    setActiveIntegration(prev => prev === id ? null : id);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;
    setActiveDragItem(data || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // TODO: Handle cross-column dragging logic if needed here for sorting
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // If dragging an existing internal task
    if (activeData?.type === 'Task') {
      const activeTask = activeData.task as Task;

      // Drop on Calendar Slot -> timebox
      if (overData?.type === 'CalendarSlot') {
        const { hour, date } = overData;
        const plannedDate = date.toISOString().split('T')[0];
        const startTime = new Date(date);
        startTime.setHours(hour, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setHours(hour + 1);

        await handleTaskUpdate(activeTask.id, {
          plannedDate,
          isTimeboxed: true,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        }, activeTask.plannedDate || '');
        return;
      }

      // Drop on Day column -> change date
      if (overData?.type === 'DayColumn') {
        const newDate = overData.date.toISOString().split('T')[0];
        if (activeTask.plannedDate !== newDate) {
          await handleTaskUpdate(activeTask.id, { plannedDate: newDate }, activeTask.plannedDate || '');
          setTasks(prev => {
            const oldPrev = prev[activeTask.plannedDate || ''] || [];
            const newPrev = prev[newDate] || [];
            return {
              ...prev,
              [activeTask.plannedDate || '']: oldPrev.filter(t => t.id !== activeTask.id),
              [newDate]: [...newPrev, { ...activeTask, plannedDate: newDate }]
            };
          });
        }
        return;
      }

      return;
    }

    // If dragging a Notion page
    if (activeData?.type === 'NotionPage') {
      const { page, databaseId } = activeData;

      // Drop on Calendar Slot -> import and timebox
      if (overData?.type === 'CalendarSlot') {
        const { hour, date } = overData;
        const plannedDate = date.toISOString().split('T')[0];
        // Use ISO with time when importing
        const startTime = new Date(date);
        startTime.setHours(hour, 0, 0, 0);
        const plannedDateTime = startTime.toISOString();

        try {
          const created = await importNotionPage(page.id, databaseId, plannedDateTime);
          if (created) {
            setTasks(prev => {
              const next = { ...prev };
              const arr = next[plannedDate] || [];
              return { ...next, [plannedDate]: [...arr, created] };
            });
          }
        } catch (err) {
          console.error('Failed to import Notion page:', err);
        }
        return;
      }

      // Drop on Day column -> import without time
      if (overData?.type === 'DayColumn') {
        const newDate = overData.date.toISOString().split('T')[0];
        try {
          const created = await importNotionPage(page.id, databaseId, newDate);
          if (created) {
            setTasks(prev => ({ ...prev, [newDate]: [...(prev[newDate] || []), created] }));
          }
        } catch (err) {
          console.error('Failed to import Notion page:', err);
        }
        return;
      }
    }
  };

  const changeDate = (direction: number) => {
    const newDate = new Date(selectedDate);
    if (currentView === 'week') {
      newDate.setDate(selectedDate.getDate() + (direction * 7));
    } else if (currentView === 'month') {
      newDate.setMonth(selectedDate.getMonth() + direction);
    } else {
      newDate.setDate(selectedDate.getDate() + direction);
    }
    setSelectedDate(newDate);
  };


  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const googleProfile = user?.providerData.find(p => p.providerId === 'google.com');
  const greetingName = googleProfile
    ? (googleProfile.displayName?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'User')
    : 'user';

  const handleAccountabilityAction = async (task: Task, action: string) => {
    const dStr = task.plannedDate || selectedDate.toISOString().split('T')[0];

    if (action === 'accept') {
      await handleTaskUpdate(task.id, { status: 'planned', userId: user?.uid, ownerId: user?.uid }, dStr);
    } else if (action === 'reject') {
      await handleTaskUpdate(task.id, { status: 'rejected' }, dStr);
    } else if (action === 'submit') {
      await handleTaskUpdate(task.id, { status: 'awaiting_approval' }, dStr);
    } else if (action === 'approve') {
      await handleTaskUpdate(task.id, { status: 'done' }, dStr);
    }
  };

  const handleNotificationSelect = async (taskId: string) => {
    try {
      // 1. Try to find in current loaded tasks
      let foundTask: Task | undefined;
      for (const dateKey in tasks) {
        foundTask = tasks[dateKey].find(t => t.id === taskId);
        if (foundTask) break;
      }

      // 2. If not found, fetch it
      if (!foundTask) {
        const res = await fetchTaskById(taskId);
        if (res.ok && res.task) {
          foundTask = res.task;
        }
      }

      if (foundTask) {
        setSelectedTask(foundTask);
        setIsDetailOpen(true);
      }
    } catch (err) {
      console.error('Failed to load task from notification', err);
    }
  };


  return (
    <div className="flex flex-col h-screen bg-white dark:bg-neutral-950 text-gray-900 dark:text-gray-100 overflow-hidden">
      <PartnerManager isOpen={isPartnerManagerOpen} onClose={() => setIsPartnerManagerOpen(false)} />
      {/* Daily Planning Ritual Modal */}
      <DailyPlanningRitual
        isOpen={isPlanningOpen}
        onClose={() => setIsPlanningOpen(false)}
        date={selectedDate}
        tasks={tasks}
        onUpdateTask={handleTaskUpdate}
      />

      {/* Header */}
      <header className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-30 transition-all">
        <div className="flex items-center space-x-4">
          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <Layout size={20} />
          </button>

          <div className="flex items-center gap-3">
            <h1 className="text-lg lg:text-xl font-black flex items-center gap-2">
              <span className="bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent truncate max-w-[150px] lg:max-w-none">
                Hey {greetingName}
              </span>
              <span>👋</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2 lg:space-x-4">
          <div className="hidden sm:block cursor-pointer relative xl:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-gray-50 dark:bg-neutral-900 border-none rounded-full text-xs font-bold focus:ring-2 focus:ring-purple-500 transition-all w-32 sm:w-48"
            />
          </div>


          <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block" />

          <NotificationCenter onSelectTask={handleNotificationSelect} />

          <button
            onClick={() => setIsRightPaneOpen(!isRightPaneOpen)}
            className={`p-2 rounded-lg transition-all ${isRightPaneOpen ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800'}`}
            title={isRightPaneOpen ? 'Close right pane' : 'Open right pane'}
          >
            {isRightPaneOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
          </button>

          <UserMenu onOpenPartners={() => setIsPartnerManagerOpen(true)} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden bg-[#FAF9F6] dark:bg-neutral-950 relative">
        {/* Left Sidebar - Navigation (Responsive) */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          selectedDate={selectedDate}
          changeDate={changeDate}
          setSelectedDate={setSelectedDate}
          currentView={currentView}
          setCurrentView={setCurrentView}
          setIsPlanningOpen={setIsPlanningOpen}
          visibleSources={visibleSources}
          toggleSource={toggleSource}
        />

        {/* Multi-column center area */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <section className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-neutral-900 border-l border-gray-100 dark:border-neutral-900">
            {/* View Header with Date */}
            <div className="px-4 lg:px-8 py-4 lg:py-6 border-b border-gray-50 dark:border-neutral-800/50 flex items-center justify-between">
              <h2 className="text-lg lg:text-xl font-black text-gray-900 dark:text-gray-100">
                {currentView === 'month'
                  ? selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                  : selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </h2>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
              {currentView === 'home' || currentView === 'today' ? (
                <div className="flex-1 flex overflow-x-auto custom-scrollbar snap-x snap-mandatory lg:snap-none">
                  {datesToShow.map((d) => {
                    // Mobile: only show selected date if in "home" view? 
                    // Or allow scrolling. "Day view" usually implies one day.
                    // For now, let's allow scrolling but snap to days.
                    // If narrow screen, maybe we only want to render 1 day to save memory/perf?
                    // But scrolling horizontally is nice.
                    const dStr = d.toISOString().split('T')[0];
                    return (
                      <div key={dStr} className="snap-center h-full flex-shrink-0 w-full lg:w-auto">
                        <DayColumn
                          date={d}
                          tasks={(tasks[dStr] || []).filter(t => {
                            const source = t.originalIntegration?.split('-')[0] || 'task';
                            return visibleSources.has(source);
                          })}
                          searchQuery={searchQuery}
                          onAddTask={handleSmartAddTask}
                          onReorder={(newTasks) => {
                            setTasks(prev => ({ ...prev, [dStr]: newTasks }));
                            handleReorder(newTasks, dStr);
                          }}
                          onTaskClick={(t) => {
                            setSelectedTask(t);
                            setIsDetailOpen(true);
                          }}
                          onStatusToggle={(t) => handleTaskUpdate(t.id, { status: t.status === 'done' ? 'planned' : 'done' }, dStr)}
                          currentUserId={user?.uid}
                          onAction={handleAccountabilityAction}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : currentView === 'week' ? (
                <div className="flex-1 overflow-auto">
                  <WeeklyCalendar
                    date={selectedDate}
                    events={calendarEvents.filter(e => visibleSources.has(e.type || e.originalIntegration?.split('-')[0] || 'google'))}
                    tasks={Object.values(tasks).flat().filter(t => {
                      const source = t.originalIntegration?.split('-')[0] || 'task';
                      return visibleSources.has(source);
                    })}
                  />
                </div>
              ) : (
                <div className="flex-1 overflow-auto">
                  <MonthlyCalendar
                    date={selectedDate}
                    events={calendarEvents.filter(e => visibleSources.has(e.type || e.originalIntegration?.split('-')[0] || 'google'))}
                    tasks={Object.values(tasks).flat().filter(t => {
                      const source = t.originalIntegration?.split('-')[0] || 'task';
                      return visibleSources.has(source);
                    })}
                  />
                </div>
              )}
            </div>
          </section>

          {/* Right Sidebar - Dynamic Integration Content (Mobile Overlay) */}
          <div className={`
             fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white dark:bg-neutral-900 shadow-2xl transform transition-transform duration-300 ease-in-out
             lg:relative lg:translate-x-0 lg:shadow-none lg:border-l lg:border-gray-100 lg:dark:border-neutral-900 lg:z-0
             ${isRightPaneOpen ? 'translate-x-0' : 'translate-x-full lg:hidden'}
          `}>
            {/* Mobile Close Button for Right Pane */}
            <div className="lg:hidden absolute top-4 right-4 z-50">
              <button onClick={() => setIsRightPaneOpen(false)} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
                <PanelRightClose size={20} />
              </button>
            </div>

            {activeIntegration === 'google-calendar' ? (
              <div className="flex-1 flex flex-col overflow-hidden h-full">
                <CalendarGrid
                  date={selectedDate}
                  events={calendarEvents.filter(e => (e.type || e.originalIntegration?.split('-')[0]) === 'google')}
                  tasks={[]}
                  searchQuery={searchQuery}
                />
              </div>
            ) : activeIntegration === 'slack' ? (
              <div className="flex-1 flex flex-col overflow-hidden p-6 bg-gray-50/30 dark:bg-neutral-900/30 h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <SlackLogo size={20} />
                    Slack
                  </h2>
                </div>
                <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 flex-1">
                  {slackMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                      <SlackLogo size={40} className="mb-4 grayscale" />
                      <p className="text-sm font-bold uppercase tracking-widest">No starred messages</p>
                    </div>
                  ) : (
                    slackMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className="group p-4 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer relative"
                        onClick={() => handleSmartAddTask({ title: msg.title, channel: 'slack' })}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">{msg.notes}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                            {new Date(msg.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed">
                          {msg.title}
                        </p>
                        <div className="absolute inset-0 border-2 border-purple-500 opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : activeIntegration === 'notion' ? (
              <div className="flex-1 flex flex-col overflow-hidden h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-neutral-800">
                  <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <NotionLogo size={20} />
                    Notion
                  </h2>
                  <button onClick={() => router.push('/settings')} className="px-3 py-1 bg-gray-100 dark:bg-neutral-800 rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors">Settings</button>
                </div>

                {/* Database Browser */}
                <div className="flex-1 overflow-hidden p-4">
                  <NotionDatabaseBrowser
                    onPageSelect={async (page, dbId) => {
                      const task = await importNotionPage(page.id, dbId, selectedDate.toISOString().split('T')[0]);
                      if (task) {
                        setTasks(prev => {
                          const dateKey = task.plannedDate || selectedDate.toISOString().split('T')[0];
                          return { ...prev, [dateKey]: [...(prev[dateKey] || []), task] };
                        });
                      }
                    }}
                    onPageDragStart={(page, dbId) => {
                      setActiveDragItem({ type: 'notion-page', page, databaseId: dbId } as any);
                    }}
                  />
                </div>

                {/* Synced Tasks Summary */}
                <div className="border-t border-gray-100 dark:border-neutral-800 p-4 bg-gray-50/50 dark:bg-neutral-900/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Synced Tasks</span>
                    <span className="text-[10px] font-bold text-purple-600">{Object.values(tasks).flat().filter(t => t.originalIntegration === 'notion').length}</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
                    {Object.values(tasks).flat().filter(t => t.originalIntegration === 'notion').slice(0, 5).map((t: Task) => (
                      <div key={t.id} className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        • {t.title}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : activeIntegration ? (
              <div className="flex-1 flex flex-col overflow-hidden h-full">
                <div className="p-4 border-b border-gray-100 dark:border-neutral-800">
                  <h2 className="text-sm font-black capitalize flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    {activeIntegration.replace('-', ' ')}
                  </h2>
                </div>
                <CalendarGrid
                  date={selectedDate}
                  events={calendarEvents.filter(e => (e.type || e.originalIntegration?.split('-')[0]) === activeIntegration?.split('-')[0])}
                  tasks={(tasks[selectedDate.toISOString().split('T')[0]] || []).filter(t => t.originalIntegration === activeIntegration)}
                  searchQuery={searchQuery}
                />
              </div>
            ) : null}
          </div>

          <DragOverlay>
            {activeDragItem ? (
              activeDragItem.type === 'Task' ? (
                <div className="w-64 bg-white dark:bg-neutral-800 p-3 rounded-xl shadow-2xl border-2 border-purple-500 rotate-2 cursor-grabbing">
                  <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{activeDragItem.task.title}</span>
                </div>
              ) : activeDragItem.type === 'NotionPage' ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-800 rounded-lg shadow-2xl border border-gray-100 dark:border-neutral-700 w-64 rotate-2 cursor-grabbing">
                  <NotionLogo size={16} />
                  <span className="text-xs font-medium truncate flex-1">{activeDragItem.page.title}</span>
                </div>
              ) : null
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Far-right Integration Rail */}
        <div className="hidden lg:block">
          <IntegrationRail
            activeId={activeIntegration}
            onToggle={handleIntegrationToggle}
          />
        </div>
      </main>

      {/* Task Detail Panel Overlay */}
      <TaskDetailPanel
        task={selectedTask}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedTask(null);
        }}
        onUpdate={handleTaskUpdate}
        onDelete={handleTaskDelete}
      />
    </div >
  );
}

export default function ProtectedDashboard() {
  return (
    <AuthGuard>
      <DashboardPage />
    </AuthGuard>
  );
}
