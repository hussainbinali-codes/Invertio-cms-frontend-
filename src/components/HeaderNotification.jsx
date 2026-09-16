import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Clock,
  Info,
  AlertCircle,
  X,
  CheckCheck,
  Check,
  Sparkles,
} from 'lucide-react';
import axios from '../api/axios';
import { cn } from '../utils/cn';
import Button from './ui/Button';

const HeaderNotification = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const location = useLocation();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/notifications');
      setNotifications(res.data?.data?.list || []);
      setUnreadCount(res.data?.data?.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const markAsRead = async (id) => {
    try {
      await axios.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
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
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch {
      return '';
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

  const getIcon = (type) => {
    switch (type) {
      case 'leave_request':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'task_assigned':
      case 'task_updated':
        return <Sparkles className="w-4 h-4 text-blue-600" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      default:
        return <Info className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getIconStyles = (type) => {
    switch (type) {
      case 'leave_request':
        return 'bg-amber-50 border border-amber-200/70 text-amber-600';
      case 'task_assigned':
      case 'task_updated':
        return 'bg-blue-50 border border-blue-200/70 text-blue-600';
      case 'success':
        return 'bg-emerald-50 border border-emerald-200/70 text-emerald-600';
      case 'warning':
        return 'bg-rose-50 border border-rose-200/70 text-rose-600';
      default:
        return 'bg-indigo-50 border border-indigo-200/70 text-indigo-600';
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    return true;
  });

  return (
    <>
      {/* Top Header Trigger Button (Right Side of Screen) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "relative p-2 sm:p-2.5 rounded-xl border transition-all duration-200 focus:outline-hidden",
          isOpen
            ? "bg-blue-50 text-blue-600 border-blue-200 shadow-xs"
            : "bg-white text-slate-500 border-slate-200/80 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
        )}
        title={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
      >
        <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Right-Side Notification Slide-Over Sidebar Drawer */}
      {isOpen && (
        <>
          {/* Backdrop over workspace */}
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-40 transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Right-Side Sidebar Drawer */}
          <aside className="fixed inset-y-0 right-0 z-50 bg-white border-l border-slate-200/90 shadow-2xl flex flex-col w-full max-w-[380px] sm:max-w-[420px] h-screen h-[100dvh] animate-in slide-in-from-right duration-300 ease-out">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white/95 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/80 shadow-2xs">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-50 text-rose-600 border border-rose-200/80 leading-none">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">Activity & updates</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-1"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Segmented Filter Bar */}
            <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-lg transition-all",
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
                    "px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5",
                    filter === 'unread'
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  <span>Unread</span>
                  {unreadCount > 0 && (
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded-full text-[10px] font-bold leading-none",
                        filter === 'unread'
                          ? "bg-rose-500 text-white"
                          : "bg-rose-100 text-rose-700"
                      )}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              <span className="text-[11px] font-medium text-slate-400">
                {filter === 'unread' ? `${unreadCount} unread` : `${notifications.length} updates`}
              </span>
            </div>

            {/* Scrollable Notifications List */}
            <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar py-2 space-y-1.5">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markAsRead(n.id)}
                    className={cn(
                      "group relative p-3.5 mx-3 rounded-2xl transition-all duration-200 border cursor-pointer",
                      n.is_read
                        ? "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/70"
                        : "bg-gradient-to-r from-blue-50/80 via-white to-blue-50/30 border-blue-100/90 shadow-2xs hover:shadow-xs hover:border-blue-200"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon Pill */}
                      <div
                        className={cn(
                          "p-2 rounded-xl shrink-0 transition-transform group-hover:scale-105 shadow-2xs",
                          getIconStyles(n.type)
                        )}
                      >
                        {getIcon(n.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4
                            className={cn(
                              "text-xs leading-snug font-bold",
                              n.is_read ? "text-slate-700" : "text-slate-900"
                            )}
                          >
                            {n.title || "Update"}
                          </h4>
                          <span className="text-[10px] font-medium text-slate-400 shrink-0">
                            {formatTimeAgo(n.created_at)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed break-words">
                          {cleanMessage(n.message)}
                        </p>

                        {/* Meta and Action Footer */}
                        <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-slate-100/80">
                          <span
                            className="text-[10px] text-slate-400 font-mono"
                            title={n.created_at ? new Date(n.created_at).toLocaleString('en-IN') : ''}
                          >
                            {n.created_at
                              ? new Date(n.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </span>

                          {!n.is_read && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(n.id);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-100/60 px-2 py-0.5 rounded-md transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-3 h-3" />
                              <span>Mark read</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-100 to-blue-50 border border-slate-200/60 flex items-center justify-center mb-3 shadow-2xs">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">All caught up!</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                    {filter === 'unread'
                      ? "You have zero unread notifications."
                      : "No activity or notifications available."}
                  </p>
                  {filter === 'unread' && notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilter('all')}
                      className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      View all ({notifications.length})
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3.5 px-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span className="text-[11px] font-medium text-slate-400">
                {notifications.length} total notifications
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5"
                onClick={() => setIsOpen(false)}
              >
                Close
              </Button>
            </div>
          </aside>
        </>
      )}
    </>
  );
};

export default HeaderNotification;
