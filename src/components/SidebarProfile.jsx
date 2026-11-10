import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../utils/cn';

const SidebarProfile = ({ user, isCollapsed, onMobileClose }) => {
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <NavLink
      to="/profile"
      onClick={() => onMobileClose && onMobileClose()}
      className={({ isActive }) =>
        cn(
          "w-full flex items-center gap-2.5 p-2 rounded-xl transition-all duration-200 group text-left relative",
          isActive
            ? "bg-slate-900 text-white shadow-xs font-semibold"
            : "hover:bg-slate-100/80 text-slate-700",
          isCollapsed ? "justify-center px-1.5" : "justify-start"
        )
      }
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
                {initial}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" title="Online" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className={cn(
                  "text-xs font-bold truncate leading-tight transition-colors",
                  isActive ? "text-white" : "text-slate-900 group-hover:text-blue-600"
                )}>
                  {user?.name || 'User'}
                </span>
                <span className={cn(
                  "text-[10px] font-semibold uppercase tracking-widest font-mono mt-0.5 truncate",
                  isActive ? "text-slate-400" : "text-slate-400"
                )}>
                  {user?.role_name || 'Developer'}
                </span>
              </div>
            )}
          </div>

          {/* Styled Floating Tooltip on Hover when Collapsed */}
          {isCollapsed && (
            <div className="hidden lg:block absolute left-full top-1/2 -translate-y-1/2 ml-3.5 pointer-events-none z-50 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-150 ease-out">
              <div className="relative flex items-center">
                <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mr-1 shadow-xs" />
                <div className="bg-slate-900/95 text-white text-xs font-semibold px-2.5 py-1 rounded-lg shadow-xl border border-slate-800 whitespace-nowrap tracking-wide flex flex-col gap-0.5">
                  <span>{user?.name || 'User'}</span>
                  <span className="text-[10px] text-slate-400 font-normal">{user?.role_name || 'Staff'} • Online</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </NavLink>
  );
};

export default SidebarProfile;
