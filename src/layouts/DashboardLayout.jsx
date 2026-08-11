import React, { useCallback, useEffect, useState } from "react";
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
import NotificationDropdown from "../components/NotificationDropdown";
import UserDropdown from "../components/UserDropdown";
import AttendancePunch from "../components/AttendancePunch";
import {
  LocationAccessDialog,
  WorkModeDialog,
} from "../components/AttendancePunchDialogs";
import { hasPermission } from "../utils/permissionUtils";
import ConfirmationModal from "../components/ui/ConfirmationModal";
import toast from "react-hot-toast";

const LOCATION_REQUIRED_MESSAGE =
  "Location access is required to punch in. Please enable your device location and try again.";
const OFFICE_RADIUS_METERS = 1;

const formatAttendanceTimestamp = (date) => {
  const pad = (value) => String(value).padStart(2, "0");
  const istDate = new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );

  return `${istDate.getFullYear()}-${pad(istDate.getMonth() + 1)}-${pad(istDate.getDate())}T${pad(istDate.getHours())}:${pad(istDate.getMinutes())}:${pad(istDate.getSeconds())}+05:30`;
};

const formatAttendanceDate = (date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(date);

const toLocationString = (latitude, longitude) => `${latitude},${longitude}`;

const getGeolocationPermissionState = async () => {
  if (!navigator.permissions?.query) {
    return "unknown";
  }

  try {
    const result = await navigator.permissions.query({ name: "geolocation" });
    return result.state;
  } catch (error) {
    console.debug("Unable to read geolocation permission state", error);
    return "unknown";
  }
};

const getLocationErrorCopy = (error, permissionState) => {
  if (permissionState === "denied" || error?.code === 1) {
    return {
      detailMessage:
        "Location permission was denied. Allow location access in your browser or device settings to continue.",
      toastMessage: "Location permission denied. Please enable it to punch in.",
    };
  }

  if (error?.code === 2) {
    return {
      detailMessage:
        "Your device location is turned off or GPS is currently unavailable. Turn on location services and try again.",
      toastMessage: "GPS is unavailable. Please enable location and try again.",
    };
  }

  if (error?.code === 3) {
    return {
      detailMessage:
        "We could not detect your location in time. Move to an open area, keep GPS enabled, and try again.",
      toastMessage: "Location detection timed out. Please try again.",
    };
  }

  return {
    detailMessage:
      "We could not access your current location. Please verify that location services are enabled and try again.",
    toastMessage: "Unable to fetch your current location.",
  };
};

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "{}"),
  );
  const [showPunchOutModal, setShowPunchOutModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [status, setStatus] = useState(null);
  const [attendanceLocation, setAttendanceLocation] = useState("");
  const [isWorkModeDialogOpen, setIsWorkModeDialogOpen] = useState(false);
  const [selectedWorkMode, setSelectedWorkMode] = useState("");
  const [workModeError, setWorkModeError] = useState("");
  const [locationDialog, setLocationDialog] = useState({
    isOpen: false,
    detailMessage: "",
  });

  const closeWorkModeDialog = useCallback(() => {
    setIsWorkModeDialogOpen(false);
    setSelectedWorkMode("");
    setWorkModeError("");
  }, []);

  const requestCurrentLocation = useCallback(async () => {
    if (!("geolocation" in navigator)) {
      setLocationDialog({
        isOpen: true,
        detailMessage:
          "This device or browser does not support location access for attendance.",
      });
      toast.error("Location access is not supported on this device.");
      return null;
    }

    const permissionState = await getGeolocationPermissionState();
    if (permissionState === "denied") {
      setLocationDialog({
        isOpen: true,
        detailMessage:
          "Location permission was denied. Allow location access in your browser or device settings to continue.",
      });
      toast.error("Location permission denied. Please enable it to punch in.");
      return null;
    }

    setIsDetectingLocation(true);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const locationString = toLocationString(
        position.coords.latitude,
        position.coords.longitude,
      );

      setAttendanceLocation(locationString);
      setLocationDialog({ isOpen: false, detailMessage: "" });
      return locationString;
    } catch (error) {
      const locationError = getLocationErrorCopy(error, permissionState);
      console.warn("Geolocation failed during punch flow", error);
      setLocationDialog({
        isOpen: true,
        detailMessage: locationError.detailMessage,
      });
      toast.error(locationError.toastMessage);
      return null;
    } finally {
      setIsDetectingLocation(false);
    }
  }, []);

  const handlePunchInRequest = useCallback(async () => {
    setSelectedWorkMode("");
    setWorkModeError("");

    const locationString = await requestCurrentLocation();
    if (!locationString) {
      return;
    }

    setIsWorkModeDialogOpen(true);
  }, [requestCurrentLocation]);

  const handleRetryLocationAccess = useCallback(async () => {
    const locationString = await requestCurrentLocation();
    if (!locationString) {
      return;
    }

    setSelectedWorkMode("");
    setWorkModeError("");
    setIsWorkModeDialogOpen(true);
  }, [requestCurrentLocation]);

  const handleWorkModeConfirm = useCallback(async () => {
    if (!selectedWorkMode) {
      setWorkModeError(
        "Please select where you are working today to continue.",
      );
      return;
    }

    if (!attendanceLocation) {
      closeWorkModeDialog();
      await handlePunchInRequest();
      return;
    }

    setActionLoading(true);
    setWorkModeError("");

    try {
      const response = await axios.post("/hr/attendance/check-in", {
        date: formatAttendanceDate(new Date()),
        check_in: formatAttendanceTimestamp(new Date()),
        status: "Present",
        location: attendanceLocation,
        mode: selectedWorkMode,
      });

      const responseMessage = response.data?.message;
      const isFailureResponse = response.data?.success === false;

      if (isFailureResponse) {
        const message = responseMessage || "Failed to process punch";
        setWorkModeError(message);
        toast.error(message);
        return;
      }

      setStatus("in");
      closeWorkModeDialog();
      toast.success("Punched in successfully");
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      const message = serverMessage || "Failed to process punch";
      setWorkModeError(message);
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  }, [
    attendanceLocation,
    closeWorkModeDialog,
    handlePunchInRequest,
    selectedWorkMode,
  ]);

  const handlePunch = async (mode = "auto") => {
    if (status !== "in" || mode !== "checkout") {
      return;
    }

    setActionLoading(true);

    try {
      await axios.post("/hr/attendance/check-out", {
        date: formatAttendanceDate(new Date()),
        check_out: formatAttendanceTimestamp(new Date()),
      });
      setStatus("out");
      setShowPunchOutModal(false);
      toast.success("Punched out successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to process punch");
    } finally {
      setActionLoading(false);
    }
  };

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
    <div className="flex bg-slate-50 min-h-screen font-sans selection:bg-primary-100 selection:text-primary-900">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200/60 shadow-xl shadow-slate-200/50 sidebar-transition flex flex-col h-screen h-[100dvh] lg:shadow-none lg:sticky lg:top-0 lg:h-screen",
          isSidebarOpen
            ? "translate-x-0 w-[280px]"
            : "-translate-x-full lg:translate-x-0",
          isSidebarCollapsed ? "lg:w-20" : "lg:w-64",
        )}
      >
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
                  ? "/invertio_logo_short.png"
                  : "/invertio_logo.png"
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

        <div className="flex-1 overflow-y-auto overscroll-contain flex flex-col justify-between no-scrollbar">
          <nav className="px-3 py-4 space-y-1 no-scrollbar">
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
                {({ isActive }) => (
                  <>
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
                    {isActive && (
                      <div
                        className={cn(
                          "absolute left-0 w-1 bg-primary-600 rounded-r-full transition-all",
                          isSidebarCollapsed ? "lg:h-4 lg:left-0 h-6" : "h-6",
                        )}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div
            className={cn(
              isSidebarCollapsed ? "lg:items-center lg:px-2 px-4" : "px-4",
            )}
          >
            {!isSidebarCollapsed && (
              <AttendancePunch
                setShowPunchOutModal={setShowPunchOutModal}
                actionLoading={actionLoading}
                isDetectingLocation={isDetectingLocation}
                status={status}
                setStatus={setStatus}
                handlePunchInRequest={handlePunchInRequest}
                location={attendanceLocation}
              />
            )}
          </div>
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

      <ConfirmationModal
        isOpen={showPunchOutModal}
        onClose={() => !actionLoading && setShowPunchOutModal(false)}
        title="Confirm punch out"
        message="You're about to end your workday attendance. Do you want to punch out now?"
        confirmText="Punch Out"
        cancelText="Stay Checked In"
        variant="danger"
        isLoading={actionLoading}
        closeOnConfirm={false}
        onConfirm={() => handlePunch("checkout")}
      />

      <LocationAccessDialog
        isOpen={locationDialog.isOpen}
        onClose={() =>
          !isDetectingLocation &&
          setLocationDialog({ isOpen: false, detailMessage: "" })
        }
        onRetry={handleRetryLocationAccess}
        isLoading={isDetectingLocation}
        detailMessage={
          locationDialog.detailMessage || LOCATION_REQUIRED_MESSAGE
        }
      />

      <WorkModeDialog
        isOpen={isWorkModeDialogOpen}
        onClose={() => !actionLoading && closeWorkModeDialog()}
        selectedMode={selectedWorkMode}
        onSelect={(mode) => {
          setSelectedWorkMode(mode);
          setWorkModeError("");
        }}
        onConfirm={handleWorkModeConfirm}
        isLoading={actionLoading}
        errorMessage={workModeError}
      />

      <div className="flex-1 flex flex-col min-w-0">
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
            <div className="hidden xs:flex items-center px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold text-slate-500 rounded-full border border-emerald-100">
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

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50">
          <div className="p-4 sm:p-6 lg:p-6 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
