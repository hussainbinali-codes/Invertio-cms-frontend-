import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  Circle,
  ChevronDown,
  Search,
  ChevronLeft,
  ChevronRight,
  Layers,
  Eye,
  Loader2,
  Plus
} from 'lucide-react';
import { cn } from '../../../utils/cn';

// Helper to extract time string from task title (e.g., "@ 7 pm", "at 12:30 PM", "7:00 PM - 7:45 PM")
const extractTimeFromTitle = (title = '') => {
  const rangeMatch = title.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*[-–]\s*\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
  if (rangeMatch) return rangeMatch[1].toUpperCase();

  const atMatch = title.match(/(?:@|at)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
  if (atMatch) return atMatch[1].toUpperCase();

  return null;
};

// Helper to extract meeting URL from description, task_references, or title
const extractMeetingLink = (task) => {
  const textSources = [
    task.description || '',
    task.title || '',
    Array.isArray(task.task_references) ? task.task_references.join(' ') : (task.task_references || '')
  ].join(' ');

  const urlRegex = /(https?:\/\/[^\s"'<>]+)/g;
  const matches = textSources.match(urlRegex);
  if (!matches) return null;

  const meetingUrl = matches.find((url) =>
    /zoom\.us|meet\.google\.com|teams\.microsoft\.com|webex\.com/i.test(url)
  );
  return meetingUrl || matches[0];
};

const formatShortDate = (dateString) => {
  if (!dateString) return 'Flexible';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return dateString;
  }
};

// Date navigation helpers matching Google Calendar / Apps Script style
const formatYMD = (d) => {
  if (!d) return '';
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isDateToday = (d) => {
  if (!d) return false;
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
};

const isDateTomorrow = (d) => {
  if (!d) return false;
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return (
    d.getDate() === t.getDate() &&
    d.getMonth() === t.getMonth() &&
    d.getFullYear() === t.getFullYear()
  );
};

const isDateYesterday = (d) => {
  if (!d) return false;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return (
    d.getDate() === y.getDate() &&
    d.getMonth() === y.getMonth() &&
    d.getFullYear() === y.getFullYear()
  );
};

const getDateLabel = (d, mode) => {
  if (mode === 'all') return 'All';
  if (!d) return 'Today';
  if (isDateToday(d)) return 'Today';
  if (isDateTomorrow(d)) return 'Tomorrow';
  if (isDateYesterday(d)) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const matchesTaskDate = (task, targetDate) => {
  if (!task) return false;
  const dateVal = task.due_date || task.created_at;
  if (!dateVal) return false;

  const ymd = formatYMD(targetDate);
  if (typeof dateVal === 'string' && dateVal.startsWith(ymd)) {
    return true;
  }

  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return false;
    return (
      d.getFullYear() === targetDate.getFullYear() &&
      d.getMonth() === targetDate.getMonth() &&
      d.getDate() === targetDate.getDate()
    );
  } catch {
    return false;
  }
};

const priorityWeight = {
  Urgent: 4,
  High: 3,
  Medium: 2,
  Low: 1
};

const MyPipelineTab = ({
  tasks = [],
  allTasks = [],
  projects = [],
  handleCreateTask,
  handleUpdateTask,
  updatingTaskId,
  setSelectedTaskDetail,
  searchTerm = '',
  setSearchTerm
}) => {
  const [internalSearch, setInternalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('my_order');
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [dateFilterMode, setDateFilterMode] = useState('date'); // 'date' (default: today) | 'all'
  const [currentPage, setCurrentPage] = useState(1);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const pageSize = 8;

  // Use allTasks if provided, fallback to tasks
  const rawDataset = allTasks.length > 0 ? allTasks : tasks;

  // Search query (from parent or internal)
  const query = (searchTerm || internalSearch).trim().toLowerCase();

  // 1. Schedule items (Today's tasks & meetings)
  const scheduleItems = useMemo(() => {
    const today = new Date();
    const todayYMD = today.toISOString().split('T')[0];

    return rawDataset
      .filter((task) => {
        if (task.status === 'Cancelled') return false;

        const isDueToday = task.due_date && task.due_date.startsWith(todayYMD);
        const isMeeting =
          /meeting|zoom|call|sync|standup|demo|client call/i.test(task.title || '') ||
          extractTimeFromTitle(task.title || '') !== null;

        return isDueToday || isMeeting;
      })
      .slice(0, 6);
  }, [rawDataset]);

  // 2. At a Glance (Overdue & Coming up)
  const { overdueTasks, upcomingTasks } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    sevenDaysLater.setHours(23, 59, 59, 999);

    const overdue = [];
    const upcoming = [];

    rawDataset.forEach((task) => {
      if (!task.due_date) return;
      if (task.status === 'Completed' || task.status === 'Cancelled') return false;

      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate < now) {
        overdue.push(task);
      } else if (dueDate >= now && dueDate <= sevenDaysLater) {
        upcoming.push(task);
      }
    });

    overdue.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    upcoming.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    return {
      overdueTasks: overdue.slice(0, 5),
      upcomingTasks: upcoming.slice(0, 5)
    };
  }, [rawDataset]);

  // 3. Tasks Feed (filtered and sorted)
  const filteredTasks = useMemo(() => {
    return rawDataset.filter((task) => {
      // 1. Date Filter (Default: Today's tasks)
      if (dateFilterMode === 'date') {
        if (!matchesTaskDate(task, selectedDate)) {
          return false;
        }
      }

      // 2. Search Query
      if (query) {
        const titleMatch = (task.title || '').toLowerCase().includes(query);
        const descMatch = (task.description || '').toLowerCase().includes(query);
        const projectMatch = (task.project_name || '').toLowerCase().includes(query);
        const clientMatch = (task.client_name || '').toLowerCase().includes(query);
        if (!titleMatch && !descMatch && !projectMatch && !clientMatch) {
          return false;
        }
      }

      // 3. Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'Pending') {
          const isPending =
            task.status === 'Pending' ||
            task.status === 'Yet to Start' ||
            task.status === 'To Do';
          if (!isPending) return false;
        } else if (task.status !== statusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [rawDataset, query, statusFilter, dateFilterMode, selectedDate]);

  // Sorting
  const sortedTasks = useMemo(() => {
    const list = [...filteredTasks];

    if (sortOrder === 'priority') {
      return list.sort((a, b) => {
        const wA = priorityWeight[a.priority] || 2;
        const wB = priorityWeight[b.priority] || 2;
        return wB - wA;
      });
    }

    if (sortOrder === 'due_date') {
      return list.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      });
    }

    if (sortOrder === 'title') {
      return list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    // Default 'my_order': In Progress first, then Pending, then Completed
    return list.sort((a, b) => {
      const isACompleted = a.status === 'Completed';
      const isBCompleted = b.status === 'Completed';
      if (isACompleted && !isBCompleted) return 1;
      if (!isACompleted && isBCompleted) return -1;
      return 0;
    });
  }, [filteredTasks, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedTasks.length / pageSize) || 1;
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTasks.slice(start, start + pageSize);
  }, [sortedTasks, currentPage, pageSize]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-6 bg-[#f8fafc]/60 font-sans">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ========================================================================= */}
        {/* LEFT SECTION: TASKS FEED (Col-span 8) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-4">

          {/* Header Controls: Date Navigator on Left, Search + Filters + New Task on Right */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Left: Date Navigation Segmented Control [ < | Today | > ] + Standalone Calendar Icon [ 📅 ] */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Segmented Pill [ < | Today | > ] */}
              <div className="inline-flex items-center bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden h-10">
                <button
                  type="button"
                  onClick={() => {
                    const prev = new Date(selectedDate);
                    prev.setDate(prev.getDate() - 1);
                    setSelectedDate(prev);
                    setDateFilterMode('date');
                    setCurrentPage(1);
                  }}
                  className="px-2.5 sm:px-3 h-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-50 active:bg-slate-100 transition-colors border-r border-slate-200/80 cursor-pointer"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(new Date());
                    setDateFilterMode('date');
                    setCurrentPage(1);
                  }}
                  className={cn(
                    "px-3.5 sm:px-4 h-full flex items-center justify-center text-[13px] font-semibold transition-colors cursor-pointer min-w-[72px] select-none",
                    dateFilterMode === 'date' && isDateToday(selectedDate)
                      ? "text-blue-600 bg-blue-50/40"
                      : "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
                  )}
                  title="Click to jump to Today"
                >
                  {getDateLabel(selectedDate, dateFilterMode)}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(selectedDate);
                    next.setDate(next.getDate() + 1);
                    setSelectedDate(next);
                    setDateFilterMode('date');
                    setCurrentPage(1);
                  }}
                  className="px-2.5 sm:px-3 h-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-50 active:bg-slate-100 transition-colors border-l border-slate-200/80 cursor-pointer"
                  title="Next Day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Standalone Calendar Picker Button [ 📅 ] */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  className="w-10 h-10 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-slate-50 active:bg-slate-100 shadow-2xs transition-colors cursor-pointer"
                  title="Pick a specific date"
                >
                  <Calendar className="w-4 h-4" />
                </button>
                <input
                  type="date"
                  value={formatYMD(selectedDate)}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [y, m, d] = e.target.value.split('-').map(Number);
                      setSelectedDate(new Date(y, m - 1, d));
                      setDateFilterMode('date');
                      setCurrentPage(1);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  title="Pick a date"
                />
              </div>
            </div>

            {/* Right: Search, Status, Sort, + New Task (Strict Single-Row on Desktop) */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink min-w-0 overflow-x-auto no-scrollbar py-0.5 justify-end">
              {/* Search Input */}
              <div className="relative w-36 sm:w-44 md:w-48 lg:w-44 xl:w-56 group shrink min-w-[120px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-600 pointer-events-none transition-colors" />
                <input
                  type="text"
                  value={searchTerm || internalSearch}
                  onChange={(e) => {
                    if (setSearchTerm) setSearchTerm(e.target.value);
                    else setInternalSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search tasks..."
                  className="w-full h-10 pl-10 pr-3.5 text-[13px] font-normal bg-white border border-slate-200/90 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 transition-all shadow-2xs"
                />
              </div>

              {/* Status Filter */}
              <div className="relative shrink-0">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-10 pl-3.5 pr-8 text-[12px] font-medium bg-white border border-slate-200/90 rounded-2xl text-slate-700 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 cursor-pointer shadow-2xs hover:bg-slate-50/70 transition-all appearance-none"
                >
                  <option value="all">All tasks</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>

              {/* Sort Order */}
              <div className="relative shrink-0">
                <select
                  value={sortOrder}
                  onChange={(e) => {
                    setSortOrder(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-10 pl-3.5 pr-8 text-[12px] font-medium bg-white border border-slate-200/90 rounded-2xl text-slate-700 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 cursor-pointer shadow-2xs hover:bg-slate-50/70 transition-all appearance-none"
                >
                  <option value="my_order">My order</option>
                  <option value="priority">Priority</option>
                  <option value="due_date">Due date</option>
                  <option value="title">Alphabetical</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>

              {/* New Task Button */}
              {handleCreateTask && (
                <button
                  type="button"
                  onClick={() => handleCreateTask(projects[0] || null, formatYMD(selectedDate))}
                  className="h-10 px-4 text-[12px] font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-2xl flex items-center gap-1.5 shadow-2xs transition-all shrink-0 cursor-pointer whitespace-nowrap"
                  title="Create new task"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>New task</span>
                </button>
              )}
            </div>
          </div>

          {/* Current Date Filter Indicator Banner */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-medium text-slate-600">
              {dateFilterMode === 'all'
                ? `Showing all tasks (${sortedTasks.length})`
                : `Showing tasks for ${getDateLabel(selectedDate, dateFilterMode)} (${sortedTasks.length})`}
            </span>
            {dateFilterMode === 'date' ? (
              <button
                type="button"
                onClick={() => {
                  setDateFilterMode('all');
                  setCurrentPage(1);
                }}
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline cursor-pointer"
              >
                Show all tasks
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(new Date());
                  setDateFilterMode('date');
                  setCurrentPage(1);
                }}
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline cursor-pointer"
              >
                Back to Today
              </button>
            )}
          </div>

          {/* Tasks List Feed */}
          <div className="space-y-3">
            {paginatedTasks.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 border border-slate-200/80 shadow-2xs text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-[13px] font-semibold text-slate-700">
                  {dateFilterMode === 'date'
                    ? `No tasks scheduled for ${getDateLabel(selectedDate, dateFilterMode)}`
                    : 'No tasks found'}
                </p>
                <p className="text-[12px] text-slate-400 font-normal">
                  {query
                    ? 'No tasks match your current search query.'
                    : dateFilterMode === 'date'
                      ? 'You have no tasks due on this date.'
                      : 'Your personal pipeline is clear.'}
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  {dateFilterMode === 'date' && (
                    <button
                      type="button"
                      onClick={() => {
                        setDateFilterMode('all');
                        setCurrentPage(1);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                    >
                      <span>View all tasks</span>
                    </button>
                  )}
                  {handleCreateTask && (
                    <button
                      type="button"
                      onClick={() => handleCreateTask(projects[0] || null, formatYMD(selectedDate))}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create task for {getDateLabel(selectedDate, dateFilterMode)}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              paginatedTasks.map((task) => {
                const isCompleted = task.status === 'Completed';
                const isUpdating = updatingTaskId === task.id;
                const priority = task.priority || 'Medium';

                return (
                  <div
                    key={task.id}
                    className={cn(
                      "bg-white rounded-2xl p-4 border transition-all flex items-start gap-4 group shadow-2xs hover:shadow-xs relative overflow-hidden",
                      isCompleted
                        ? "border-slate-200/60 bg-slate-50/40 opacity-75"
                        : "border-slate-200/90 hover:border-slate-300"
                    )}
                  >
                    {/* Left subtle vertical green accent bar */}
                    <div
                      className={cn(
                        "absolute left-0 top-0 bottom-0 w-1 rounded-l transition-colors",
                        isCompleted
                          ? "bg-emerald-400"
                          : task.status === 'In Progress'
                            ? "bg-teal-500"
                            : "bg-slate-200 group-hover:bg-teal-400"
                      )}
                    />

                    {/* Circular Quick Completion Button */}
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => {
                        if (handleUpdateTask) {
                          handleUpdateTask(task.id, {
                            status: isCompleted ? 'In Progress' : 'Completed'
                          });
                        }
                      }}
                      className={cn(
                        "mt-0.5 ml-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all",
                        isUpdating && "opacity-50 cursor-not-allowed",
                        isCompleted
                          ? "bg-emerald-500 text-white border border-emerald-500"
                          : "border-2 border-slate-300 hover:border-teal-600 hover:bg-teal-50/50"
                      )}
                      title={isCompleted ? "Mark as In Progress" : "Complete Task"}
                    >
                      {isUpdating ? (
                        <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                      ) : isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                      ) : null}
                    </button>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-start justify-between gap-3">
                        {/* Title & Description: Static display without modal trigger */}
                        <div className="min-w-0">
                          <h4
                            className={cn(
                              "text-[13px] font-semibold tracking-tight truncate select-text",
                              isCompleted
                                ? "text-slate-400 line-through font-normal"
                                : "text-slate-900"
                            )}
                            title={task.title}
                          >
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="text-[12px] text-slate-400 font-normal line-clamp-1 mt-1 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Badges & Eye Details Button Container */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Priority Pill */}
                          <span
                            className={cn(
                              "text-[11px] font-medium px-3 py-0.5 rounded-full border transition-all",
                              priority === 'Urgent' && "bg-rose-50 text-rose-700 border-rose-200/80",
                              priority === 'High' && "bg-amber-50 text-amber-800 border-amber-200/80",
                              priority === 'Medium' && "bg-teal-50 text-teal-700 border-teal-200/80",
                              priority === 'Low' && "bg-slate-100 text-slate-600 border-slate-200/80"
                            )}
                          >
                            {priority}
                          </span>

                          {/* Status Pill */}
                          <span
                            className={cn(
                              "text-[11px] font-medium px-3 py-0.5 rounded-full border transition-all",
                              isCompleted
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                                : task.status === 'In Progress'
                                  ? "bg-blue-50 text-blue-700 border-blue-200/80"
                                  : "bg-slate-100 text-slate-600 border-slate-200/80"
                            )}
                          >
                            {task.status || 'Created'}
                          </span>

                          {/* Eye Icon Button: Clicking opens the full task modal */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (setSelectedTaskDetail) setSelectedTaskDetail(task);
                            }}
                            className="p-1 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 transition-all shadow-2xs group/eye"
                            title="View Task Details"
                          >
                            <Eye className="w-3.5 h-3.5 group-hover/eye:scale-110 transition-transform" />
                          </button>
                        </div>
                      </div>

                      {/* Footer Info: Project & Due Date */}
                      <div className="mt-2.5 flex items-center gap-4 text-[11px] text-slate-400 font-normal">
                        {task.project_name && (
                          <span className="flex items-center gap-1.5 truncate max-w-[240px]">
                            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{task.project_name}</span>
                          </span>
                        )}
                        {task.due_date && (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Due {formatShortDate(task.due_date)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 px-1">
              <span className="text-[12px] text-slate-400 font-normal">
                Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, sortedTasks.length)} of {sortedTasks.length} tasks
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[12px] font-semibold text-slate-700 px-2.5">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors shadow-2xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT SECTION: SCHEDULE, OVERDUE, COMING UP (Col-span 4) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-4">

          {/* 1. SCHEDULE WIDGET WITH EXPANDABLE DIV */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
            {/* Clickable Header Button */}
            <button
              type="button"
              onClick={() => setIsScheduleOpen((prev) => !prev)}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors group cursor-pointer text-left select-none"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                  <Calendar className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Schedule</span>
                    <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100/60">
                      Today
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                    {isScheduleOpen ? 'Click to hide agenda' : 'Click to view agenda & calls'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  {scheduleItems.length}
                </span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200",
                    isScheduleOpen && "rotate-180 text-blue-600"
                  )}
                />
              </div>
            </button>

            {/* Hidden Div: Shown Below Schedule When Clicked */}
            {isScheduleOpen && (
              <div className="p-4 pt-1 border-t border-slate-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 bg-slate-50/30">
                {scheduleItems.length === 0 ? (
                  <div className="py-4 text-center space-y-1">
                    <p className="text-[12px] font-semibold text-slate-700">No scheduled meetings</p>
                    <p className="text-[11px] text-slate-400 font-normal">You have open focus time today.</p>
                  </div>
                ) : (
                  scheduleItems.map((item, index) => {
                    const meetingUrl = extractMeetingLink(item);
                    const timeLabel = extractTimeFromTitle(item.title) || 'TODAY';
                    const isFirst = index === 0;

                    return (
                      <div
                        key={item.id || index}
                        className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all group/item relative overflow-hidden flex flex-col justify-between gap-2.5"
                      >
                        {/* Accent Bar */}
                        <div
                          className={cn(
                            "absolute left-0 top-0 bottom-0 w-1",
                            isFirst ? "bg-amber-500" : "bg-emerald-500"
                          )}
                        />

                        <div>
                          {/* Time Slot & Status Pill */}
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-[11px] font-semibold tracking-tight text-slate-600 flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {timeLabel}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={cn(
                                  "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                                  isFirst
                                    ? "bg-amber-100/80 text-amber-800"
                                    : "bg-emerald-100/80 text-emerald-800"
                                )}
                              >
                                {isFirst ? 'Live' : 'Next'}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (setSelectedTaskDetail) setSelectedTaskDetail(item);
                                }}
                                className="p-0.5 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Title */}
                          <h4
                            className="text-[13px] font-semibold text-slate-900 line-clamp-2 leading-snug"
                            title={item.title}
                          >
                            {item.title}
                          </h4>

                          {/* Project Subtitle */}
                          <p className="text-[11px] text-slate-400 font-normal mt-1 truncate">
                            {item.project_name || 'General Project'}
                          </p>
                        </div>

                        {/* Join Meeting Action Button */}
                        {meetingUrl && (
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                            <a
                              href={meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 rounded-xl transition-all shadow-2xs"
                            >
                              <Video className="w-3.5 h-3.5 text-teal-600" />
                              <span>Join Zoom</span>
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* 2. OVERDUE SECTION */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                <h4 className="text-[13px] font-bold text-slate-900 tracking-tight">Overdue</h4>
              </div>
              <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/60">
                {overdueTasks.length}
              </span>
            </div>

            <div className="space-y-2">
              {overdueTasks.length === 0 ? (
                <p className="text-[12px] text-slate-400 font-normal italic py-2 text-center">
                  No overdue tasks. Great work!
                </p>
              ) : (
                overdueTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl bg-[#f8fafc] hover:bg-slate-100/80 border border-slate-200/60 hover:border-slate-300 transition-all flex items-center justify-between group"
                  >
                    <div className="min-w-0 pr-2">
                      <h5
                        className="text-[12px] font-semibold text-slate-800 truncate"
                        title={task.title}
                      >
                        {task.title}
                      </h5>
                      <p className="text-[11px] text-slate-400 font-normal mt-1 flex items-center gap-1">
                        Was due {formatShortDate(task.due_date)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (setSelectedTaskDetail) setSelectedTaskDetail(task);
                      }}
                      className="p-1 rounded-full text-slate-400 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all shrink-0"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 3. COMING UP SECTION */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <h4 className="text-[13px] font-bold text-slate-900 tracking-tight">Coming up</h4>
              </div>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                {upcomingTasks.length}
              </span>
            </div>

            <div className="space-y-2">
              {upcomingTasks.length === 0 ? (
                <div className="py-2.5 px-3 bg-[#f8fafc] rounded-xl border border-slate-200/50">
                  <p className="text-[12px] text-slate-400 font-normal">
                    Nothing scheduled ahead.
                  </p>
                </div>
              ) : (
                upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl bg-[#f8fafc] hover:bg-slate-100/80 border border-slate-200/60 hover:border-slate-300 transition-all flex items-center justify-between group"
                  >
                    <div className="min-w-0 pr-2">
                      <h5
                        className="text-[12px] font-semibold text-slate-800 truncate"
                        title={task.title}
                      >
                        {task.title}
                      </h5>
                      <p className="text-[11px] text-slate-400 font-normal mt-1 flex items-center gap-1">
                        Due {formatShortDate(task.due_date)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (setSelectedTaskDetail) setSelectedTaskDetail(task);
                      }}
                      className="p-1 rounded-full text-slate-400 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all shrink-0"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default MyPipelineTab;
