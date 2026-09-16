import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Bell } from 'lucide-react';
import axios from '../api/axios';
import { cn } from '../utils/cn';

const SidebarNotification = ({ isCollapsed }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get('/notifications');
      setUnreadCount(res.data?.data?.unreadCount || 0);
    } catch (err) {
      // quiet fail on network/poll
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <NavLink
      to="/notifications"
      className={({ isActive }) =>
        cn(
          "flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 group relative",
          isActive
            ? "bg-primary-50 text-primary-700 shadow-sm font-semibold"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
          isCollapsed ? "lg:justify-center lg:px-2 px-3" : "justify-between px-3"
        )
      }
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center min-w-0">
            <div className="relative">
              <Bell
                className={cn(
                  "w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-primary-600" : "",
                  isCollapsed ? "lg:mr-0 mr-3" : "mr-3"
                )}
              />
              {unreadCount > 0 && isCollapsed && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </div>
            <span
              className={cn(
                "truncate transition-all duration-300",
                isCollapsed ? "lg:hidden block" : "block"
              )}
            >
              Notifications
            </span>
          </div>

          {!isCollapsed && unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white leading-none shadow-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}

          {isActive && (
            <div
              className={cn(
                "absolute left-0 w-1 bg-primary-600 rounded-r-full transition-all",
                isCollapsed ? "lg:h-4 lg:left-0 h-6" : "h-6"
              )}
            />
          )}

          {/* Styled Floating Tooltip on Hover when Collapsed */}
          {isCollapsed && (
            <div className="hidden lg:block absolute left-full top-1/2 -translate-y-1/2 ml-3.5 pointer-events-none z-50 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-150 ease-out">
              <div className="relative flex items-center">
                <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mr-1 shadow-xs" />
                <div className="bg-slate-900/95 text-white text-xs font-semibold px-2.5 py-1 rounded-lg shadow-xl border border-slate-800 whitespace-nowrap tracking-wide flex items-center gap-1.5">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] font-bold bg-rose-500 text-white rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </NavLink>
  );
};

export default SidebarNotification;
