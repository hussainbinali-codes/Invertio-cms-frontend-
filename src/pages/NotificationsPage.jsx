import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import {
  Bell,
  CheckCircle2,
  Clock,
  Info,
  AlertCircle,
  CheckCheck,
  Check,
  Search,
  RotateCw,
  Sparkles,
  Filter,
  Calendar,
  Layers,
} from 'lucide-react';
import { cn } from '../utils/cn';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'leaves' | 'tasks'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNotifications = async (showToast = false) => {
    setLoading(true);
    try {
      const res = await axios.get('/notifications');
      setNotifications(res.data?.data?.list || []);
      setUnreadCount(res.data?.data?.unreadCount || 0);
      if (showToast) {
        toast.success('Notifications refreshed');
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
      toast.error('Could not load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await axios.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      toast.success('Marked as read');
    } catch (err) {
      console.error('Failed to mark notification as read', err);
      toast.error('Failed to mark notification');
    }
  };

  const markAllRead = async () => {
    try {
      await axios.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all as read', err);
      toast.error('Failed to mark all as read');
    }
  };

  const cleanMessage = (msg) => {
    if (!msg) return '';
    return msg.replace(
      /\w{3} \w{3} \d{1,2} \d{4} \d{2}:\d{2}:\d{2} [^.]+/,
      (match) => {
        try {
          const d = new Date(match);
          return isNaN(d.getTime())
            ? match
            : d.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });
        } catch {
          return match;
        }
      }
    );
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSecs = Math.floor((now - date) / 1000);

      if (diffInSecs < 60) return 'Just now';
      if (diffInSecs < 3600) return `${Math.floor(diffInSecs / 60)}m ago`;
      if (diffInSecs < 86400) return `${Math.floor(diffInSecs / 3600)}h ago`;
      if (diffInSecs < 604800) return `${Math.floor(diffInSecs / 86400)}d ago`;
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'leave_request':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'task_assigned':
      case 'task_updated':
        return <Sparkles className="w-5 h-5 text-blue-600" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-rose-600" />;
      default:
        return <Info className="w-5 h-5 text-indigo-600" />;
    }
  };

  const getIconStyles = (type) => {
    switch (type) {
      case 'leave_request':
        return 'bg-amber-50 border border-amber-200/80 text-amber-600';
      case 'task_assigned':
      case 'task_updated':
        return 'bg-blue-50 border border-blue-200/80 text-blue-600';
      case 'success':
        return 'bg-emerald-50 border border-emerald-200/80 text-emerald-600';
      case 'warning':
        return 'bg-rose-50 border border-rose-200/80 text-rose-600';
      default:
        return 'bg-indigo-50 border border-indigo-200/80 text-indigo-600';
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread' && n.is_read) return false;
    if (filter === 'leaves' && n.type !== 'leave_request') return false;
    if (filter === 'tasks' && !n.type?.includes('task')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = n.title?.toLowerCase().includes(q);
      const msgMatch = n.message?.toLowerCase().includes(q);
      return titleMatch || msgMatch;
    }

    return true;
  });

  const leavesCount = notifications.filter((n) => n.type === 'leave_request').length;
  const tasksCount = notifications.filter((n) => n.type?.includes('task')).length;

  return (
    <div className="w-full min-w-0 space-y-6 animate-in fade-in duration-300 pb-10">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full min-w-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              WORKSPACE / NOTIFICATIONS
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white shadow-xs animate-pulse">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Stay up to date with leave approvals, task assignments, and workspace activities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => fetchNotifications(true)}
            className="flex items-center gap-1.5 text-xs h-9 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold shadow-xs border border-emerald-600 rounded-xl focus:ring-emerald-500 transition-all"
          >
            <RotateCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            <span>Refresh</span>
          </Button>

          {unreadCount > 0 && (
            <Button
              size="sm"
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs h-9 bg-primary-600 hover:bg-primary-700 text-white"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all as read</span>
            </Button>
          )}
        </div>
      </div>


      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Segmented Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
              filter === 'all'
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5",
              filter === 'unread'
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setFilter('leaves')}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
              filter === 'leaves'
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            Leaves ({leavesCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('tasks')}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
              filter === 'tasks'
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            Tasks ({tasksCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-primary-500 transition-all"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center">
            <RotateCw className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-500">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markAsRead(n.id)}
              className={cn(
                "p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group",
                n.is_read
                  ? "bg-white border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs"
                  : "bg-gradient-to-r from-blue-50/80 via-white to-blue-50/30 border-blue-200 shadow-xs hover:border-blue-300"
              )}
            >
              <div className="flex items-start gap-4 flex-1 min-w-0">
                {/* Icon */}
                <div
                  className={cn(
                    "p-3 rounded-2xl shrink-0 shadow-2xs transition-transform group-hover:scale-105",
                    getIconStyles(n.type)
                  )}
                >
                  {getIcon(n.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3
                      className={cn(
                        "text-sm font-bold leading-snug",
                        n.is_read ? "text-slate-800" : "text-slate-900"
                      )}
                    >
                      {n.title || "Portal Notification"}
                    </h3>

                    {!n.is_read && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700 leading-none">
                        New
                      </span>
                    )}

                    <span className="text-[11px] font-medium text-slate-400 ml-auto sm:ml-0 font-mono">
                      {formatTimeAgo(n.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed break-words max-w-4xl">
                    {cleanMessage(n.message)}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-mono">
                    <span>
                      {n.created_at
                        ? new Date(n.created_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {!n.is_read && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(n.id);
                    }}
                    className="h-8 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Mark Read
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-slate-200/80 shadow-2xs text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-slate-100 to-blue-50 border border-slate-200 flex items-center justify-center mb-4 shadow-xs">
              <Sparkles className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800">All caught up!</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {filter === 'unread'
                ? "You have zero unread notifications. Check back later for updates."
                : "There are no notifications matching your current filter."}
            </p>
            {filter !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  setFilter('all');
                  setSearchQuery('');
                }}
                className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
