import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Clock, Info, X } from 'lucide-react';
import axios from '../api/axios';
import { cn } from '../utils/cn';
import Badge from './ui/Badge';
import Button from './ui/Button';

const NotificationDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/notifications');
            setNotifications(res.data.data.list || []);
            setUnreadCount(res.data.data.unreadCount || 0);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
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
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        try {
            await axios.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark notification as read', err);
        }
    };

    const markAllRead = async () => {
        try {
            await axios.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'leave_request': return <Clock className="w-4 h-4 text-amber-500" />;
            case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case 'warning': return <X className="w-4 h-4 text-rose-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
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
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-slate-200/50 p-1.5 rounded-[1.75rem] border border-slate-200/20 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="bg-white rounded-[calc(1.75rem-0.375rem)] border border-slate-200/20 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest leading-none">
                                Notifications
                            </span>
                            {unreadCount > 0 && (
                                <button 
                                    onClick={markAllRead}
                                    className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 uppercase tracking-widest font-mono"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[350px] overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                            {notifications.length > 0 ? (
                                notifications.map((n) => (
                                    <div 
                                        key={n.id} 
                                        onClick={() => !n.is_read && markAsRead(n.id)}
                                        className={cn(
                                            "p-4 flex gap-3 cursor-pointer transition-all duration-200 hover:bg-slate-50",
                                            !n.is_read ? "bg-blue-50/15" : "bg-white"
                                        )}
                                    >
                                        <div className="mt-0.5 flex-shrink-0">
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <p className={cn("text-xs font-bold leading-tight truncate", !n.is_read ? "text-slate-900" : "text-slate-500")}>
                                                    {n.title}
                                                </p>
                                                <span className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-wider">
                                                    {new Date(n.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed font-semibold">
                                                {n.message}
                                            </p>
                                        </div>
                                        {!n.is_read && (
                                            <div className="mt-1.5 flex-shrink-0">
                                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 text-center">
                                    <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-xs text-slate-500 font-medium italic">No notifications yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;