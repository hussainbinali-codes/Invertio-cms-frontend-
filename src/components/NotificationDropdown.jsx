import React, { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle2, Clock, Info, X } from "lucide-react";
import axios from "../api/axios";
import { cn } from "../utils/cn";
import Badge from "./ui/Badge";
import Button from "./ui/Button";

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/notifications");
      setNotifications(res.data.data.list || []);
      setUnreadCount(res.data.data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Polling every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await axios.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "leave_request":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "warning":
        return <X className="w-4 h-4 text-rose-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-full transition-all"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white transform translate-x-1/4 -translate-y-1/4 shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] font-bold text-primary-600 hover:text-primary-700 uppercase tracking-wider"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markAsRead(n.id)}
                    className={cn(
                      "p-4 flex gap-3 cursor-pointer transition-colors hover:bg-slate-50",
                      !n.is_read ? "bg-primary-50/30" : "bg-white",
                    )}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p
                          className={cn(
                            "text-xs font-bold leading-tight truncate",
                            !n.is_read ? "text-slate-900" : "text-slate-600",
                          )}
                        >
                          {n.title}
                        </p>
                        <span className="text-[9px] text-slate-400 whitespace-nowrap font-medium uppercase">
                          {new Date(n.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed font-medium">
                        {n.message}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="mt-1 flex-shrink-0">
                        <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium italic">
                  No notifications yet.
                </p>
              </div>
            )}
          </div>

          {/* <div className="p-3 border-t border-slate-100 bg-slate-50/30 text-center">
            <button className="text-[10px] font-bold text-slate-500 hover:text-slate-700 uppercase tracking-wider">
              View All Activity
            </button>
          </div> */}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
