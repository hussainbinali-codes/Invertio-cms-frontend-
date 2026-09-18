import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  Menu,
  X,
  CircleDollarSign,
  UserPlus,
  Calendar,
  Contact,
  CalendarClock,
  Monitor,
  Megaphone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "../utils/cn";
import axios from "../api/axios";
import SidebarNotification from "../components/SidebarNotification";
import SidebarProfile from "../components/SidebarProfile";
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

        setUser((currentUser) => {
          const updatedUser = { ...currentUser, pages, modules, role_name };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          return updatedUser;
        });
      } catch (error) {
        console.error("Failed to sync permissions:", error);
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
      label: "Campaigns",
      path: "/campaigns",
      icon: Megaphone,
      permission: "campaigns",
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
    <div className="flex bg-slate-50 h-screen h-[100dvh] overflow-hidden font-sans selection:bg-primary-100 selection:text-primary-900">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200/80 shadow-[1px_0_10px_-3px_rgba(0,0,0,0.03)] sidebar-transition flex flex-col h-screen h-[100dvh] lg:sticky lg:top-0 lg:h-screen shrink-0",
          isSidebarOpen
            ? "translate-x-0 w-[280px]"
            : "-translate-x-full lg:translate-x-0",
          isSidebarCollapsed ? "lg:w-20" : "lg:w-64",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between h-16 border-b border-slate-100 bg-white/50 backdrop-blur-md sticky top-0 z-50 transition-all duration-300",
            isSidebarCollapsed ? "lg:px-3 px-5" : "px-5",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-3 overflow-hidden transition-all duration-300",
              isSidebarCollapsed
                ? "lg:w-full lg:justify-center"
                : "w-full justify-center px-2",
            )}
          >
            <img
              src={
                isSidebarCollapsed
                  ? "/invertio_logo_short.png"
                  : "/invertio_logo.png"
              }
              alt="Logo"
              className={cn(
                "object-contain transition-all duration-300",
                isSidebarCollapsed ? "lg:h-10 lg:w-10 h-12 w-44" : "h-12 w-44",
              )}
            />
          </div>
          <button
            className="lg:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Area with Sleek Scrollbar Effect */}
        <div
          className={cn(
            "flex-1 min-h-0 py-2.5 overflow-y-auto sidebar-scrollbar scroll-smooth",
            isSidebarCollapsed ? "lg:overflow-visible" : "overscroll-contain"
          )}
        >
          <nav className="px-3 space-y-1">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group relative",
                    isActive
                      ? "bg-slate-900 text-white shadow-xs font-semibold"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-950",
                    isSidebarCollapsed
                      ? "lg:justify-center lg:px-2 px-3"
                      : "px-3",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        "w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105",
                        isActive ? "text-white" : "text-slate-500 group-hover:text-slate-800",
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

                    {/* Styled Floating Tooltip on Hover when Collapsed */}
                    {isSidebarCollapsed && (
                      <div className="hidden lg:block absolute left-full top-1/2 -translate-y-1/2 ml-3.5 pointer-events-none z-50 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-150 ease-out">
                        <div className="relative flex items-center">
                          <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mr-1 shadow-xs" />
                          <div className="bg-slate-900/95 text-white text-xs font-semibold px-2.5 py-1 rounded-lg shadow-xl border border-slate-800 whitespace-nowrap tracking-wide">
                            {item.label}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            ))}

            {/* Notification in Navigation Space */}
            <SidebarNotification isCollapsed={isSidebarCollapsed} />
          </nav>
        </div>

        {/* Fixed Pinned Bottom: Punchout & Profile */}
        <div
          className={cn(
            "shrink-0 border-t border-slate-100 bg-white/95 backdrop-blur-sm z-30 transition-all duration-300",
            isSidebarCollapsed ? "lg:items-center lg:px-2 px-3 pb-3 pt-2 space-y-1.5" : "px-3 pb-3 pt-2 space-y-2",
          )}
        >
          {!isSidebarCollapsed && (
            <AttendancePunch />
          )}

          {/* Profile below Attendance Punch */}
          <SidebarProfile
            user={user}
            onLogout={handleLogout}
            isCollapsed={isSidebarCollapsed}
            onMobileClose={() => setIsSidebarOpen(false)}
          />
        </div>
      </aside>

      <button
        className="hidden lg:flex fixed w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-400 hover:text-primary-600 hover:border-primary-200 shadow-sm transition-all z-50 group hover:scale-105"
        style={{
          left: isSidebarCollapsed ? "calc(5rem - 12px)" : "calc(16rem - 12px)",
          top: "4rem",
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

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Hamburger (Only visible on mobile screens where sidebar is hidden) */}
        <button
          className="lg:hidden fixed top-3 left-3 z-40 p-2 text-slate-600 bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-slate-200 transition-all active:scale-95"
          onClick={() => setIsSidebarOpen(true)}
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <main className="w-full flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 flex flex-col min-h-0 min-w-0">
          <div className="pt-12 sm:pt-14 lg:pt-4 px-2 sm:px-3 lg:px-4 pb-2 sm:pb-3 lg:pb-4 w-full min-w-0 flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
