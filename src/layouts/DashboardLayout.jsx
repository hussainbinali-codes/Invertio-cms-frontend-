import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  LogOut,
  Menu,
  X,
  CircleDollarSign,
  UserPlus,
  Calendar,
  Contact,
  CalendarClock,
  Monitor,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "../utils/cn";
import axios from "../api/axios";
import NotificationDropdown from "../components/NotificationDropdown";
import UserDropdown from "../components/UserDropdown";
import AttendancePunch from "../components/AttendancePunch";
import { hasPermission } from "../utils/permissionUtils";

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "{}"),
  );

  useEffect(() => {
    const syncPermissions = async () => {
      try {
        const response = await axios.get("/v1/users/me/permissions");
        const { pages, modules, role_name } = response.data.data;

        const updatedUser = { ...user, pages, modules, role_name };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      } catch (err) {
        console.error("Failed to sync permissions:", err);
      }
    };
    syncPermissions();
  }, []);

  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      permission: "dashboard",
    },
    { label: "Users", path: "/users", icon: Users, permission: "users" },
    {
      label: "Clients",
      path: "/clients",
      icon: Contact,
      permission: "clients",
    },
    {
      label: "Projects",
      path: "/projects",
      icon: FolderKanban,
      permission: "projects",
    },
    { label: "Tasks", path: "/tasks", icon: CheckSquare, permission: "tasks" },
    {
      label: "Finance",
      path: "/finance",
      icon: CircleDollarSign,
      permission: "finance",
    },
    { label: "HR", path: "/hr", icon: UserPlus, permission: "hr" },
    {
      label: "Attendance",
      path: "/attendance",
      icon: CalendarClock,
      permission: "attendance",
    },
    { label: "My Time Off", path: "/leaves", icon: Calendar },
    {
      label: "Assets",
      path: "/resources",
      icon: Monitor,
      permission: "resources",
    },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans selection:bg-primary-100 selection:text-primary-900">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200/60 shadow-xl shadow-slate-200/50 sidebar-transition flex flex-col h-screen h-[100dvh] lg:shadow-none lg:sticky lg:top-0 lg:h-screen",
          isSidebarOpen
            ? "translate-x-0 w-[280px]"
            : "-translate-x-full lg:translate-x-0",
          isSidebarCollapsed ? "lg:w-20" : "lg:w-64",
        )}
      >
        {/* Sidebar Header - Removed overflow-y-auto from aside and moved it here */}
        <div
          className={cn(
            "flex items-center justify-between h-20 border-b border-slate-100 bg-white/50 backdrop-blur-md sticky top-0 z-50 transition-all duration-300",
            isSidebarCollapsed ? "lg:px-3 px-6" : "px-6",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-3 overflow-hidden transition-all duration-300",
              isSidebarCollapsed
                ? "lg:w-full lg:justify-center"
                : "w-full justify-center px-4",
            )}
          >
            <img
              src={
                isSidebarCollapsed
                  ? "/invertio logo short.png"
                  : "/invertio logo.png"
              }
              alt="Logo"
              className={cn(
                "object-contain transition-all duration-300",
                isSidebarCollapsed ? "lg:h-12 lg:w-12 h-16 w-48" : "h-16 w-48",
              )}
            />
          </div>
          <button
            className="lg:hidden p-4 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable content container */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Sidebar Navigation */}
          <nav className="px-3 py-4 space-y-1 custom-scrollbar">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                title={isSidebarCollapsed ? item.label : ""}
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group relative",
                    isActive
                      ? "bg-primary-50 text-primary-700 shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                    isSidebarCollapsed
                      ? "lg:justify-center lg:px-2 px-3"
                      : "px-3",
                  )
                }
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                    isSidebarCollapsed ? "lg:mr-0 mr-3" : "mr-3",
                  )}
                />
                <span
                  className={cn(
                    "truncate transition-all duration-300",
                    isSidebarCollapsed ? "lg:hidden block" : "block",
                  )}
                >
                  {item.label}
                </span>
                {({ isActive }) =>
                  isActive && (
                    <div
                      className={cn(
                        "absolute left-0 w-1 bg-primary-600 rounded-r-full transition-all",
                        isSidebarCollapsed ? "lg:h-4 lg:left-0 h-6" : "h-6",
                      )}
                    />
                  )
                }
              </NavLink>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div
            className={cn(
              "p-4 border-t border-slate-50 mt-auto bg-slate-50/50 transition-all",
              isSidebarCollapsed ? "lg:items-center lg:px-2 px-4" : "px-4",
            )}
          >
            {!isSidebarCollapsed && <AttendancePunch />}
          </div>
        </div>
      </aside>

      {/* Collapse toggle for desktop - MOVED OUTSIDE SIDEBAR */}
      <button
        className="hidden lg:flex fixed w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-400 hover:text-primary-600 hover:border-primary-200 shadow-sm transition-all z-[100] group hover:scale-105"
        style={{
          left: isSidebarCollapsed ? "calc(5rem - 12px)" : "calc(16rem - 12px)",
          top: "5rem",
          transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      >
        {isSidebarCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5 group-hover:scale-110" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 group-hover:scale-110" />
        )}
      </button>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header / Topbar */}
        <header className="h-16 glass-effect sticky top-0 flex items-center justify-between px-4 sm:px-8 z-30 shadow-sm shadow-slate-200/20">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl shadow-sm border border-slate-100 transition-all active:scale-95"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden xs:flex items-center px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
              Online
            </div>

            <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />

            <div className="flex items-center gap-1.5 sm:gap-3">
              <NotificationDropdown />
              <UserDropdown user={user} onLogout={handleLogout} />
            </div>
          </div>
        </header>

        {/* Page Content with scroll container */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50">
          <div className="p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
