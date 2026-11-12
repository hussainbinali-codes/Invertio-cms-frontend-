import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
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
  Plus,
  User,
  UserCheck,
  Users,
  AlertCircle,
  X
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { deduplicateTasks } from '../utils/taskDeduplication';

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

const parseDateOnly = (val) => {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const d = new Date(val);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (typeof val === 'string') {
    const match = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10), 0, 0, 0, 0);
    }
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

const isBeforeYesterday = (val) => {
  if (!val) return false;
  const target = parseDateOnly(val);
  if (!target) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  return target.getTime() < yesterday.getTime();
};

const matchesTaskDate = (task, targetDate) => {
  if (!task || !targetDate) return false;

  const target = parseDateOnly(targetDate);
  if (!target) return false;

  const isCompleted = isTaskCompleted(task);

  if (isCompleted) {
    // A completed task reflects on the day it was completed!
    const completedDate =
      parseDateOnly(task.completion_date) ||
      parseDateOnly(task.completed_at) ||
      parseDateOnly(task.completion_time) ||
      (String(task.status || '').toLowerCase() === 'completed' ? parseDateOnly(task.updated_at) : null) ||
      parseDateOnly(task.due_date);

    if (!completedDate) return false;

    // Matches the exact day it was completed
    if (target.getTime() === completedDate.getTime()) {
      return true;
    }

    // It was also an active task prior to completion (between start/created/due and completion)
    const startDate =
      parseDateOnly(task.start_date) ||
      parseDateOnly(task.estimated_start_date) ||
      parseDateOnly(task.created_at) ||
      parseDateOnly(task.due_date) ||
      completedDate;

    const effectiveStart = startDate <= completedDate ? startDate : completedDate;

    // Active between start date and completion date (never shown on dates after completionDate)
    return target >= effectiveStart && target <= completedDate;
  }

  // Active / Ongoing / Pending task
  const dueDate =
    parseDateOnly(task.due_date) ||
    parseDateOnly(task.estimated_end_date);

  const startDate =
    parseDateOnly(task.start_date) ||
    parseDateOnly(task.estimated_start_date) ||
    parseDateOnly(task.created_at) ||
    dueDate;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (dueDate && startDate) {
    const effectiveStart = startDate <= dueDate ? startDate : dueDate;

    // Task is active from start date through due date!
    // E.g. start date Nov 10, due date Nov 13 -> visible on Nov 10, 11, 12, 13
    if (target >= effectiveStart && target <= dueDate) {
      return true;
    }

    // If viewing Today and the task is overdue (past due date but still not completed):
    if (target.getTime() === now.getTime() && dueDate < now) {
      return true;
    }

    return false;
  }

  if (dueDate) {
    if (target.getTime() === dueDate.getTime()) return true;
    if (target.getTime() === now.getTime() && dueDate < now) return true;
    return false;
  }

  if (startDate) {
    if (target.getTime() === startDate.getTime()) return true;
    if (target.getTime() === now.getTime() && startDate < now) return true;
    return false;
  }

  return false;
};

const isTaskCompleted = (task) => {
  if (!task) return false;
  const s = String(task.status || '').trim().toLowerCase();
  return s === 'completed' || s === 'done';
};

const isTaskCancelled = (task) => {
  if (!task) return false;
  const s = String(task.status || '').trim().toLowerCase();
  return s === 'cancelled' || s === 'canceled';
};

const isOverdue = (dueDate, status) => {
  if (!dueDate) return false;
  const s = String(status || '').trim().toLowerCase();
  if (s === 'completed' || s === 'done' || s === 'cancelled' || s === 'canceled') return false;
  try {
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return due < now;
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
  setSearchTerm,
  isAdmin = false,
  usersList = [],
  selectedUserId: propSelectedUserId,
  onSelectUser,
}) => {
  const [internalSelectedUser, setInternalSelectedUser] = useState('');
  const selectedUserId = propSelectedUserId !== undefined ? propSelectedUserId : internalSelectedUser;
  const setSelectedUserId = (val) => {
    if (onSelectUser) onSelectUser(val);
    setInternalSelectedUser(val);
  };

  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);
  const storedRole = (storedUser.role_name || storedUser.role || '').toLowerCase();
  const storedEmail = (storedUser.email || '').toLowerCase();
  const effectiveIsAdmin = isAdmin || storedRole === 'admin' || storedRole === 'super admin' || storedRole === 'administrator' || storedEmail === 'cloud4invertio@gmail.com';

  const [internalSearch, setInternalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('my_order');
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [dateFilterMode, setDateFilterMode] = useState('date'); // 'date' (default: today) | 'all'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const [openStatusDropdownTaskId, setOpenStatusDropdownTaskId] = useState(null);
  const [taskToCancel, setTaskToCancel] = useState(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('[data-status-dropdown]')) {
        setOpenStatusDropdownTaskId(null);
      }
    };
    if (openStatusDropdownTaskId) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [openStatusDropdownTaskId]);

  // Build deduplicated list of available users from selection and task assignees
  const availableUsers = useMemo(() => {
    const map = new Map();
    (usersList || []).forEach((u) => {
      if (u && (u.id || u.name)) {
        map.set(String(u.id), {
          id: u.id,
          name: u.name,
          role: u.role_name || u.role || u.designation || ''
        });
      }
    });

    (allTasks || []).forEach((t) => {
      if (t.assigned_to && !map.has(String(t.assigned_to))) {
        map.set(String(t.assigned_to), {
          id: t.assigned_to,
          name: t.assigned_to_name || `User #${t.assigned_to}`,
          role: t.assigned_to_role || ''
        });
      } else if (t.assigned_to_name && !t.assigned_to) {
        if (!map.has(t.assigned_to_name)) {
          map.set(t.assigned_to_name, {
            id: t.assigned_to_name,
            name: t.assigned_to_name,
            role: ''
          });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [usersList, allTasks]);

  const selectedUserObj = useMemo(() => {
    if (!selectedUserId) return null;
    return availableUsers.find((u) => String(u.id) === String(selectedUserId));
  }, [availableUsers, selectedUserId]);

  // Deduplicate dataset: if admin selected a user, filter allTasks by that user; otherwise show tasks
  const rawDataset = useMemo(() => {
    let source = [];
    if (selectedUserId) {
      const targetName = selectedUserObj?.name?.trim().toLowerCase();
      source = (allTasks || []).filter((task) => {
        const matchesId = String(task.assigned_to) === String(selectedUserId);
        const matchesName = targetName && String(task.assigned_to_name || '').trim().toLowerCase() === targetName;
        return matchesId || matchesName;
      });
    } else {
      source = (tasks && tasks.length > 0) ? tasks : (allTasks || []);
    }
    return deduplicateTasks(source);
  }, [allTasks, tasks, selectedUserId, selectedUserObj]);

  // Search query (from parent or internal)
  const query = (searchTerm || internalSearch).trim().toLowerCase();

  // 1. At a Glance (Overdue & Coming up)
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
      if (isTaskCompleted(task) || isTaskCancelled(task)) return;

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
        const s = String(task.status || '').trim().toLowerCase();
        if (statusFilter === 'Pending') {
          const isPending =
            s === 'pending' ||
            s === 'yet to start' ||
            s === 'to do' ||
            s === 'created' ||
            !s;
          if (!isPending) return false;
        } else if (statusFilter === 'Completed') {
          if (!isTaskCompleted(task)) return false;
        } else if (statusFilter === 'In Progress') {
          if (s !== 'in progress' && s !== 'in_progress') return false;
        } else if (s !== statusFilter.trim().toLowerCase()) {
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

    if (sortOrder === 'title') {
      return list.sort((a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' }));
    }

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const selectedMidnight = (dateFilterMode === 'date' && selectedDate) ? parseDateOnly(selectedDate) : todayMidnight;

    const getTaskDueRank = (task) => {
      if (isTaskCompleted(task)) return 99;
      if (isTaskCancelled(task)) return 98;

      const dueDate = parseDateOnly(task.due_date);
      if (!dueDate) return 4;

      // 1. DUE TODAY or due on currently selected date (Top Priority for Admin Visibility!)
      if (dueDate.getTime() === todayMidnight.getTime()) return 1;
      if (selectedMidnight && dueDate.getTime() === selectedMidnight.getTime()) return 1;

      // 2. OVERDUE (past due date, active task)
      if (dueDate.getTime() < todayMidnight.getTime()) return 2;

      // 3. Due in the future
      return 3;
    };

    return list.sort((a, b) => {
      // 1. Due urgency rank: Due Today (1) -> Overdue (2) -> Future (3) -> No Due (4) -> Cancelled (98) -> Done (99)
      const rankA = getTaskDueRank(a);
      const rankB = getTaskDueRank(b);
      if (rankA !== rankB) {
        return rankA - rankB;
      }

      // 2. For tasks due today / selected date (Rank 1):
      // Put In Progress first, then Pending; then latest created first for easy checking
      if (rankA === 1) {
        const sA = String(a.status || '').toLowerCase();
        const sB = String(b.status || '').toLowerCase();
        if (sA === 'in progress' && sB !== 'in progress') return -1;
        if (sA !== 'in progress' && sB === 'in progress') return 1;

        const timeA = a.created_at ? new Date(a.created_at).getTime() : (Number(a.id) || 0);
        const timeB = b.created_at ? new Date(b.created_at).getTime() : (Number(b.id) || 0);
        if (timeA !== timeB) return timeB - timeA;
      }

      // 3. For Overdue tasks (Rank 2):
      // Most recent overdue first
      if (rankA === 2 && a.due_date && b.due_date) {
        const diff = new Date(b.due_date) - new Date(a.due_date);
        if (diff !== 0) return diff;
      }

      // 4. For Future due dates (Rank 3):
      // Earliest due date first
      if (rankA === 3 && a.due_date && b.due_date) {
        const diff = new Date(a.due_date) - new Date(b.due_date);
        if (diff !== 0) return diff;
      }

      // 5. In Progress before Pending
      const sA = String(a.status || '').toLowerCase();
      const sB = String(b.status || '').toLowerCase();
      if (sA === 'in progress' && sB !== 'in progress') return -1;
      if (sA !== 'in progress' && sB === 'in progress') return 1;

      // 6. Newest created first
      const timeA = a.created_at ? new Date(a.created_at).getTime() : (Number(a.id) || 0);
      const timeB = b.created_at ? new Date(b.created_at).getTime() : (Number(b.id) || 0);
      return timeB - timeA;
    });
  }, [filteredTasks, sortOrder, selectedDate, dateFilterMode]);

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
                  className="px-2.5 sm:px-3 h-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-50 active:bg-slate-100 transition-colors border-r border-slate-200/80 cursor-pointer shrink-0"
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
                    "px-2 h-full flex items-center justify-center text-[13px] font-semibold transition-colors cursor-pointer w-28 text-center select-none shrink-0",
                    dateFilterMode === 'date' && isDateToday(selectedDate)
                      ? "text-blue-600 bg-blue-50/40"
                      : "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
                  )}
                  title="Click to jump to Today"
                >
                  <span className="truncate">{getDateLabel(selectedDate, dateFilterMode)}</span>
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
                  className="px-2.5 sm:px-3 h-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-50 active:bg-slate-100 transition-colors border-l border-slate-200/80 cursor-pointer shrink-0"
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

              {/* ADMIN ONLY: Team Member Pipeline Selector Dropdown */}
              {isAdmin && (
                <div className="relative shrink-0">
                  <div className="h-10 pl-3 pr-8 flex items-center gap-2 bg-white border border-blue-200/90 rounded-2xl shadow-2xs hover:border-blue-300 transition-all cursor-pointer relative group">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <select
                      value={selectedUserId || ''}
                      onChange={(e) => {
                        setSelectedUserId(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="text-[12px] font-semibold text-slate-800 bg-transparent border-none outline-none focus:ring-0 cursor-pointer appearance-none pr-1 max-w-[160px] truncate"
                      title="Select a team member to view what they are working on"
                    >
                      <option value="">My Pipeline (You)</option>
                      {availableUsers.map((u) => (
                        <option key={u.id} value={String(u.id)}>
                          {u.name} {u.role ? `(${u.role})` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors" />
                  </div>
                </div>
              )}
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
                  <option value="my_order">{effectiveIsAdmin ? "Due date first (Admin)" : "My order"}</option>
                  <option value="due_date">Due date</option>
                  <option value="priority">Priority</option>
                  <option value="title">Alphabetical</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>

              {/* New Task Button */}
              {handleCreateTask && (
                <button
                  type="button"
                  onClick={() => {
                    const targetDate = isBeforeYesterday(selectedDate) ? formatYMD(new Date()) : formatYMD(selectedDate);
                    handleCreateTask(projects[0] || null, targetDate);
                  }}
                  className="h-10 px-4 text-[12px] font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-2xl flex items-center gap-1.5 shadow-2xs transition-all shrink-0 cursor-pointer whitespace-nowrap"
                  title="Create new task"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>New task</span>
                </button>
              )}
            </div>
          </div>

          {/* ADMIN ACTIVE USER INSPECTION BANNER */}
          {isAdmin && selectedUserObj && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50/80 border border-blue-200/90 rounded-2xl shadow-2xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
                <span className="text-xs font-semibold text-blue-900 truncate">
                  Admin View: Currently inspecting <strong>{selectedUserObj.name}</strong>'s pipeline ({rawDataset.length} total tasks assigned)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedUserId('');
                  setCurrentPage(1);
                }}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-white/90 hover:bg-white px-3 py-1 rounded-xl border border-blue-200 shadow-2xs transition-all shrink-0 cursor-pointer"
              >
                Reset to My Tasks
              </button>
            </div>
          )}

          {/* Current Date Filter Indicator Banner */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-medium text-slate-600">
              {selectedUserObj ? `${selectedUserObj.name}'s Tasks — ` : ''}
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
                  {handleCreateTask && !isBeforeYesterday(selectedDate) && (
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
                const isCompleted = isTaskCompleted(task);
                const isUpdating = updatingTaskId === task.id;
                const priority = task.priority || 'Medium';
                const isSelf = String(task.assigned_to) === String(storedUser?.id) ||
                  (storedUser?.name && (task.assigned_to_name === storedUser.name || task.user_name === storedUser.name));
                const rawAssignee =
                  task.assigned_to_name ||
                  task.user_name ||
                  task.author_name ||
                  task.assignee_name ||
                  availableUsers.find((u) => String(u.id) === String(task.assigned_to))?.name ||
                  (task.assigned_to ? `User #${task.assigned_to}` : (isSelf ? (storedUser?.name || 'You') : 'Unassigned'));
                const assigneeName = isSelf ? (rawAssignee.includes('(You)') ? rawAssignee : `${rawAssignee} (You)`) : rawAssignee;

                const taskDueDateObj = parseDateOnly(task.due_date);
                const selectedDateObj = dateFilterMode === 'date' ? parseDateOnly(selectedDate) : null;
                const todayObj = parseDateOnly(new Date());

                const isDueOnSelectedDate = !isCompleted && Boolean(
                  taskDueDateObj &&
                  selectedDateObj &&
                  taskDueDateObj.getTime() === selectedDateObj.getTime()
                );

                const isDueToday = !isCompleted && Boolean(
                  taskDueDateObj &&
                  todayObj &&
                  taskDueDateObj.getTime() === todayObj.getTime()
                );

                const isTaskOverdue = !isCompleted && isOverdue(task.due_date, task.status);
                const isDeadline = isDueOnSelectedDate || isDueToday || isTaskOverdue;

                return (
                  <div
                    key={task.id}
                    className={cn(
                      "bg-white rounded-2xl p-4 border transition-all flex items-start gap-3.5 group shadow-2xs hover:shadow-xs relative",
                      openStatusDropdownTaskId === task.id ? "z-30 overflow-visible ring-1 ring-blue-100" : "z-0",
                      isCompleted
                        ? "border-slate-200/60 bg-slate-50/40 opacity-75"
                        : "border-slate-200/90 hover:border-slate-300"
                    )}
                  >
                    {/* Circular Quick Completion Button */}
                    <button
                      type="button"
                      disabled={isUpdating || isCompleted}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCompleted || isUpdating) return;
                        if (task.status !== 'In Progress') {
                          if (handleUpdateTask) {
                            handleUpdateTask(task.id, { status: 'In Progress' });
                          }
                          return;
                        }
                        if (handleUpdateTask) {
                          handleUpdateTask(task.id, {
                            status: 'Completed'
                          });
                        }
                      }}
                      className={cn(
                        "mt-0.5 ml-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all",
                        isCompleted
                          ? "bg-emerald-500 text-white border border-emerald-500 cursor-default"
                          : isUpdating
                            ? "opacity-50 cursor-not-allowed"
                            : task.status === 'In Progress'
                              ? "border-2 border-slate-300 hover:border-emerald-600 hover:bg-emerald-50/50 cursor-pointer"
                              : "border-2 border-slate-200 bg-slate-50 hover:border-blue-500 hover:bg-blue-50/40 cursor-pointer"
                      )}
                      title={
                        isCompleted
                          ? "Task is completed (status locked)"
                          : task.status === 'In Progress'
                            ? "Complete Task"
                            : "Click to start task (move to In Progress)"
                      }
                    >
                      {isUpdating ? (
                        <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                      ) : isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                      ) : null}
                    </button>

                    {/* Task Content: Entire container (pink box) is clickable to open details */}
                    <div
                      onClick={() => {
                        if (setSelectedTaskDetail) setSelectedTaskDetail(task);
                      }}
                      className="flex-1 min-w-0 pr-1 cursor-pointer group/card"
                      title="Click anywhere to view task details"
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Title & Description */}
                        <div className="min-w-0 flex-1">
                          <h4
                            className={cn(
                              "text-[13px] font-semibold tracking-tight truncate transition-colors",
                              isCompleted
                                ? "text-slate-400 line-through font-normal group-hover/card:text-slate-600"
                                : "text-slate-900 group-hover/card:text-blue-600"
                            )}
                            title={task.title}
                          >
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="text-[12px] text-slate-400 font-normal line-clamp-1 mt-1 leading-relaxed group-hover/card:text-slate-600 transition-colors">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Badges & Status Dropdown Container */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Interactive Status Dropdown (Eye icon removed) */}
                          {isCompleted ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-emerald-200/80 bg-emerald-50 text-emerald-700 flex items-center gap-1.5 shadow-2xs select-none cursor-default"
                              title="Task is completed (status locked)"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span>Done</span>
                            </div>
                          ) : (
                            <div className="relative" data-status-dropdown="true" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenStatusDropdownTaskId(openStatusDropdownTaskId === task.id ? null : task.id);
                                }}
                                className={cn(
                                  "text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs select-none",
                                  task.status === 'In Progress'
                                    ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/80"
                                    : task.status === 'Cancelled'
                                      ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/80"
                                      : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/80"
                                )}
                                title="Click to change status"
                              >
                                <span
                                  className={cn(
                                    "w-1.5 h-1.5 rounded-full shrink-0",
                                    task.status === 'In Progress'
                                      ? "bg-blue-600"
                                      : task.status === 'Cancelled'
                                        ? "bg-rose-500"
                                        : "bg-amber-500"
                                  )}
                                />
                                <span>
                                  {task.status === 'In Progress'
                                    ? 'In Progress'
                                    : task.status === 'Cancelled'
                                      ? 'Cancelled'
                                      : 'Pending'}
                                </span>
                                <ChevronDown
                                  className={cn(
                                    "w-3 h-3 transition-transform duration-200 opacity-60",
                                    openStatusDropdownTaskId === task.id && "rotate-180"
                                  )}
                                />
                              </button>

                              {openStatusDropdownTaskId === task.id && (
                                <div
                                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl border border-slate-200/95 shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                                    <span>Change Status</span>
                                    {isUpdating && <Loader2 className="w-3 h-3 animate-spin text-blue-600" />}
                                  </div>
                                  {(task.status === 'In Progress'
                                    ? [
                                      { label: 'In Progress', value: 'In Progress', dot: 'bg-blue-500' },
                                      { label: 'Completed', value: 'Completed', dot: 'bg-emerald-500' },
                                      { label: 'Cancelled', value: 'Cancelled', dot: 'bg-rose-500' },
                                    ]
                                    : task.status === 'Cancelled'
                                      ? [
                                        { label: 'Cancelled', value: 'Cancelled', dot: 'bg-rose-500' },
                                        { label: 'In Progress', value: 'In Progress', dot: 'bg-blue-500' },
                                      ]
                                      : [
                                        { label: 'Pending', value: 'Pending', dot: 'bg-amber-500' },
                                        { label: 'In Progress', value: 'In Progress', dot: 'bg-blue-500' },
                                      ]
                                  ).map((item) => (
                                    <button
                                      key={item.value}
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenStatusDropdownTaskId(null);
                                        if (item.value === 'Cancelled') {
                                          setTaskToCancel(task);
                                          return;
                                        }
                                        if (item.value !== task.status && handleUpdateTask) {
                                          handleUpdateTask(task.id, { status: item.value });
                                        }
                                      }}
                                      className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all text-left cursor-pointer",
                                        (task.status === item.value || (!task.status && item.value === 'Pending'))
                                          ? "bg-slate-100 text-slate-900 font-bold"
                                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                      )}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className={cn("w-2 h-2 rounded-full shrink-0", item.dot)} />
                                        <span>{item.label}</span>
                                      </div>
                                      {(task.status === item.value || (!task.status && item.value === 'Pending')) && (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Info: Project & Due Date & Author (Left) and Priority Pill (Right in place of Complete Task) */}
                      <div className="mt-3 flex items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-100/80">
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] text-slate-400 font-normal">
                            {task.project_name && (
                              <div
                                className="flex items-center gap-1.5 font-medium text-slate-600 group-hover/card:text-blue-600 transition-colors"
                              >
                                <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[180px] sm:max-w-[240px]">{task.project_name}</span>
                              </div>
                            )}
                            {task.due_date && (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1.5 transition-all",
                                  isDeadline
                                    ? "bg-rose-500 text-white font-bold px-2 py-0.5 rounded-lg shadow-2xs"
                                    : "text-slate-500"
                                )}
                              >
                                <Calendar className={cn("w-3.5 h-3.5 shrink-0", isDeadline ? "text-white" : "text-slate-400")} />
                                <span>Due {formatShortDate(task.due_date)}</span>
                              </span>
                            )}
                            {isCompleted && (task.completion_date || task.completed_at) && (
                              <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Completed on {formatShortDate(task.completion_date || task.completed_at)}</span>
                              </span>
                            )}
                          </div>

                          {/* Author working on task (for Admin only, below the due date / project info) */}
                          {effectiveIsAdmin && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="text-slate-400 font-normal">Author:</span>
                              <span className="font-semibold text-slate-700 truncate max-w-[200px]" title={assigneeName}>
                                {assigneeName}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Priority Pill placed at Bottom Right in place of Complete Task */}
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 self-end sm:self-center"
                        >
                          <span
                            className={cn(
                              "text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-all inline-flex items-center",
                              priority === 'Urgent' && "bg-rose-50 text-rose-700 border-rose-200/80",
                              priority === 'High' && "bg-amber-50 text-amber-800 border-amber-200/80",
                              priority === 'Medium' && "bg-teal-50 text-teal-700 border-teal-200/80",
                              priority === 'Low' && "bg-slate-100 text-slate-600 border-slate-200/80"
                            )}
                          >
                            {priority}
                          </span>
                        </div>
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
        {/* RIGHT SECTION: OVERDUE, COMING UP (Col-span 4) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-4">

          {/* 1. OVERDUE SECTION */}
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
                    <div
                      onClick={() => {
                        if (setSelectedTaskDetail) setSelectedTaskDetail(task);
                      }}
                      className="min-w-0 pr-2 cursor-pointer group/item flex-1"
                      title="Click to view task details"
                    >
                      <h5
                        className="text-[12px] font-semibold text-slate-800 truncate group-hover/item:text-blue-600 transition-colors"
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

          {/* 2. COMING UP SECTION */}
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
                    <div
                      onClick={() => {
                        if (setSelectedTaskDetail) setSelectedTaskDetail(task);
                      }}
                      className="min-w-0 pr-2 cursor-pointer group/item flex-1"
                      title="Click to view task details"
                    >
                      <h5
                        className="text-[12px] font-semibold text-slate-800 truncate group-hover/item:text-blue-600 transition-colors"
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

      {/* Cancel or Reassign Alert Modal */}
      {
        taskToCancel && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200 font-sans"
            onClick={() => setTaskToCancel(null)}
          >
            <div
              className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100/90 space-y-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setTaskToCancel(null)}
                className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-4 pr-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                  <AlertCircle className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Cancel or Reassign Task?
                  </h3>
                  <p className="text-xs sm:text-[13px] text-slate-500 mt-1.5 leading-relaxed font-normal">
                    Before cancelling <strong>&quot;{taskToCancel.title}&quot;</strong>, you can reassign it to another team member to take over, or proceed with cancelling it.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTaskToCancel(null)}
                  className="w-full sm:w-auto h-10 px-4 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                >
                  Keep In Progress
                </button>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const target = taskToCancel;
                      setTaskToCancel(null);
                      if (setSelectedTaskDetail) {
                        setSelectedTaskDetail(target);
                      }
                    }}
                    className="flex-1 sm:flex-none h-10 px-4.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <UserCheck className="w-4 h-4 stroke-[2.2]" />
                    <span>Reassign to Other</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const targetId = taskToCancel.id;
                      setTaskToCancel(null);
                      if (handleUpdateTask) {
                        handleUpdateTask(targetId, { status: 'Cancelled' });
                      }
                    }}
                    className="flex-1 sm:flex-none h-10 px-4 text-xs font-bold bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <X className="w-4 h-4 stroke-[2.2]" />
                    <span>Cancel Task</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default MyPipelineTab;
