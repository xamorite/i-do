"use client";

import React, { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DragDropContainer } from '@/components/dnd/DragDropContainer';
import { TaskDetailPanel } from '@/components/task/TaskDetailPanel';
import { CreateTaskModal } from '@/components/task/CreateTaskModal';
import { fetchTaskById } from '@/hooks/useTasks';
import { useTasksRealtime } from '@/hooks/useTasksRealtime';
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
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { IntegrationSidebar } from '@/components/dashboard/IntegrationSidebar';
import { TaskColumnsView } from '@/components/dashboard/TaskColumnsView';
import { useTaskDragDrop } from '@/hooks/useTaskDragDrop';
import { useIntegrationManager } from '@/hooks/useIntegrationManager';
import { PartnerManager } from '@/components/partners/PartnerManager';
import { usePartnersRealtime } from '@/hooks/usePartnersRealtime';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { PartnerRelationship } from '@/lib/types';

function DashboardPage() {
  const { user, username } = useAuth();
  const router = useRouter();

  // Real-time task syncing
  const {
    tasks: allTasks,
    loading: tasksLoading,
    createTask: apiCreateTask,
    updateTask: apiUpdateTask,
    deleteTask: apiDeleteTask
  } = useTasksRealtime();

  // Real-time partners for accountability features
  const { partners } = usePartnersRealtime();

  // State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<'home' | 'today' | 'week' | 'month'>('home');
  const [activeIntegration, setActiveIntegration] = useState<string | null>('google-calendar');
  const [isRightPaneOpen, setIsRightPaneOpen] = useState(true);
  const [visibleSources, setVisibleSources] = useState<Set<string>>(new Set(['google', 'notion', 'slack', 'task']));

  // Integration Hook
  const {
    calendarEvents,
    slackMessages,
    notionTasks,
    isCalendarLoading,
    loadCalendarEvents,
    loadSlackMessages,
    loadNotionTasks
  } = useIntegrationManager(selectedDate, currentView, visibleSources);

  // Compute grouped tasks from the real-time flat array
  const handleTaskUpdate = async (id: string, updates: Partial<Task>, dateStr?: string) => {
    try {
      // Direct Firestore update - will be reflected via onSnapshot
      await apiUpdateTask(id, updates);
    } catch (err) {
      console.error('Failed to update task:', err);
      alert('Failed to update task');
    }
  };

  const handleDragCreate = async (task: { title: string, date?: Date, startTime?: string, endTime?: string, isTimeboxed?: boolean }) => {
    try {
      const taskData: any = {
        title: task.title,
        status: 'planned',
      };

      if (task.date) {
        taskData.plannedDate = task.date.toISOString().split('T')[0];
      } else {
        taskData.status = 'inbox';
      }

      if (task.isTimeboxed) {
        taskData.isTimeboxed = true;
        taskData.startTime = task.startTime;
        taskData.endTime = task.endTime;
      }

      await apiCreateTask(taskData);
    } catch (err) {
      console.error('Failed to create task from drag:', err);
      alert('Failed to create task');
    }
  };

  const handleReorder = async (newTasks: Task[], dateStr: string) => {
    // Reordering still uses the API to persist the order field in the specific day plan
    try {
      await upsertDayPlan(dateStr, { taskIds: newTasks.map(t => t.id) });
    } catch (err) {
      console.error('Failed to persist order:', err);
    }
  };

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

  // DnD Hook
  const {
    activeDragItem,
    setActiveDragItem,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd
  } = useTaskDragDrop(handleTaskUpdate, loadNotionTasks, handleDragCreate);

  // We show Today and Tomorrow for now
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const afterTomorrow = new Date(today);
  afterTomorrow.setDate(today.getDate() + 2);

  const datesToShow = currentView === 'home'
    ? [today, tomorrow, afterTomorrow]
    : [today];

  useEffect(() => {
    // Other effects if any
  }, [selectedDate, currentView, visibleSources]);

  // Compute grouped tasks from the real-time flat array
  const tasks = React.useMemo(() => {
    const grouped: Record<string, Task[]> = {
      inbox: [], // Initialize inbox array
    };

    // Mix in Notion tasks if they exist
    const combined = [...allTasks, ...notionTasks];

    combined.forEach(task => {
      // Tasks with inbox/backlog status or no planned date go to inbox
      if (task.status === 'inbox' || task.status === 'backlog' || !task.plannedDate) {
        grouped.inbox.push(task);
      } else {
        // Regular tasks grouped by planned date
        const dateKey = task.plannedDate;
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(task);
      }
    });
    return grouped;
  }, [allTasks, notionTasks]);

  // Collect unique UIDs for profile fetching
  const userUids = React.useMemo(() => {
    const uids = new Set<string>();
    if (user?.uid) uids.add(user.uid);

    // UIDs from tasks
    allTasks.forEach(task => {
      if (task.ownerId) uids.add(task.ownerId);
      if (task.accountabilityPartnerId) uids.add(task.accountabilityPartnerId);
      if (task.createdBy) uids.add(task.createdBy);
      if (task.userId) uids.add(task.userId);
    });

    // UIDs from partners
    partners.forEach(p => {
      uids.add(p.requesterId);
      uids.add(p.recipientId);
    });

    return Array.from(uids);
  }, [user?.uid, allTasks, partners]);

  const { profiles } = useUserProfiles(userUids);

  // Method Definitions
  const loadNotionTasksLocal = async () => {
    await loadNotionTasks();
  }

  const handleSmartAddTask = async (val: { title: string, channel?: string, estimate?: number, date?: Date }) => {
    try {
      // If no date provided, create as inbox task (unplanned)
      // Otherwise, create as planned task for the specified date
      const taskData: any = {
        title: val.title,
      };

      // Only add optional fields if they have values (Firebase doesn't allow undefined)
      if (val.channel) taskData.channel = val.channel;
      if (val.estimate) taskData.estimateMinutes = val.estimate;

      if (val.date) {
        // Planned task with specific date
        taskData.plannedDate = val.date.toISOString().split('T')[0];
        taskData.status = 'planned';
      } else {
        // Inbox task - no planned date
        taskData.status = 'inbox';
      }

      await apiCreateTask(taskData);
      // No need to manually update state, the real-time listener will catch it!
    } catch (err) {
      console.error('Failed to create task:', err);
      alert('Failed to create task');
    }
  };

  const handleTaskDelete = async (id: string, dateStr?: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await apiDeleteTask(id);
    } catch (err) {
      console.error('Failed to delete task:', err);
      alert('Failed to delete task');
    }
  };

  const handleIntegrationToggle = (id: string) => {
    setActiveIntegration(prev => prev === id ? null : id);
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
  const greetingName = user?.displayName?.split(' ')[0]
    || googleProfile?.displayName?.split(' ')[0]
    || user?.email?.split('@')[0]
    || 'User';

  /* Notification Helper */
  const createNotification = async (notification: {
    recipientId: string | undefined;
    type: 'task_assigned' | 'task_accepted' | 'task_rejected' | 'task_submitted' | 'task_approved' | 'task_changes_requested';
    taskId: string;
    taskTitle: string;
    message?: string;
  }) => {
    if (!notification.recipientId || notification.recipientId === user?.uid) return;

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...notification,
          senderId: user?.uid,
        }),
      });
    } catch (err) {
      console.error('Failed to create notification', err);
    }
  };

  const handleAccountabilityAction = async (task: Task, action: string) => {
    const dStr = task.plannedDate || selectedDate.toISOString().split('T')[0];

    if (action === 'accept') {
      await handleTaskUpdate(task.id, { status: 'planned', userId: user?.uid, ownerId: user?.uid }, dStr);
      await createNotification({
        recipientId: task.createdBy, // Notify the delegator
        type: 'task_accepted',
        taskId: task.id,
        taskTitle: task.title,
        message: `${greetingName} accepted your task`
      });
    } else if (action === 'reject') {
      await handleTaskUpdate(task.id, { status: 'rejected' }, dStr);
      await createNotification({
        recipientId: task.createdBy, // Notify the delegator
        type: 'task_rejected',
        taskId: task.id,
        taskTitle: task.title,
        message: `${greetingName} rejected your task`
      });
    } else if (action === 'submit') {
      await handleTaskUpdate(task.id, { status: 'awaiting_approval' }, dStr);
      await createNotification({
        recipientId: task.accountabilityPartnerId!, // Notify the partner
        type: 'task_submitted',
        taskId: task.id,
        taskTitle: task.title,
        message: `${greetingName} submitted a task for approval`
      });
    } else if (action === 'approve') {
      await handleTaskUpdate(task.id, { status: 'done' }, dStr);
      await createNotification({
        recipientId: task.ownerId!, // Notify the owner
        type: 'task_approved',
        taskId: task.id,
        taskTitle: task.title,
        message: `Task approved by ${greetingName}`
      });
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
      <DashboardHeader
        greetingName={greetingName}
        username={username}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewTaskClick={() => setIsCreateModalOpen(true)}
        onMobileMenuClick={() => setIsSidebarOpen(true)}
        isRightPaneOpen={isRightPaneOpen}
        onToggleRightPane={() => setIsRightPaneOpen(!isRightPaneOpen)}
        onOpenPartners={() => setIsPartnerManagerOpen(true)}
        onNotificationSelect={handleNotificationSelect}
      />

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
          inboxCount={tasks.inbox?.length || 0}
        />

        {/* Multi-column center area */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <TaskColumnsView
            currentView={currentView}
            selectedDate={selectedDate}
            datesToShow={datesToShow}
            tasks={tasks}
            visibleSources={visibleSources}
            searchQuery={searchQuery}
            calendarEvents={calendarEvents}
            user={user}
            onAddTask={handleSmartAddTask}
            onReorder={handleReorder}
            onTaskClick={(t) => {
              setSelectedTask(t);
              setIsDetailOpen(true);
            }}
            onTaskUpdate={handleTaskUpdate}
            onAction={handleAccountabilityAction}
            userProfiles={profiles}
          />

          <IntegrationSidebar
            isOpen={isRightPaneOpen}
            onToggle={() => setIsRightPaneOpen(!isRightPaneOpen)}
            activeIntegration={activeIntegration}
            onReferenceClick={(type) => handleIntegrationToggle(type)}
            selectedDate={selectedDate}
            calendarEvents={calendarEvents}
            slackMessages={slackMessages}
            tasks={tasks}
            onLoadNotionTasks={loadNotionTasks}
            onDragStart={setActiveDragItem}
          />

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
        partners={partners}
        userProfiles={profiles}
      />

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={async (task) => {
          await apiCreateTask(task);
        }}
        initialDate={selectedDate.toISOString().split('T')[0]}
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
