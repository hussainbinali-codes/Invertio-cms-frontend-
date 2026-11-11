import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "../../../api/axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import {
  CalendarClock,
  Clock,
  Calendar,
  MapPin,
  CheckCircle2,
  XCircle,
  User as UserIcon,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  ExternalLink,
  LogIn,
  LogOut,
  Building2,
} from "lucide-react";
import StatCard from "../../../components/ui/StatCard";
import Skeleton from "../../../components/ui/Skeleton";
import toast from "react-hot-toast";
import { hasPermission } from "../../../utils/permissionUtils";
import { cn } from "../../../utils/cn";

// Premium Double-Bezel KPI Card component
const KpiCard = ({ title, value, icon: Icon, subtext, trend }) => {
  return (
    <div className="bg-slate-200/40 p-1.5 rounded-[1.75rem] border border-slate-200/20 hover:bg-slate-200/60 active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group hover:-translate-y-0.5 flex-1">
      <div className="bg-white p-4 sm:p-5 rounded-[calc(1.75rem-0.375rem)] border border-slate-200/25 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_8px_-4px_rgba(0,0,0,0.03)] h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none">
              {title}
            </span>
            {Icon && (
              <div className="p-2 bg-slate-50 border border-slate-100/60 rounded-xl group-hover:scale-105 transition-transform duration-300">
                <Icon className="w-3.5 h-3.5 text-slate-500" />
              </div>
            )}
          </div>

          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight font-mono">
              {value}
            </span>
          </div>
        </div>

        {(trend || subtext) && (
          <div className="mt-4 flex items-center gap-2">
            {trend && (
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full font-mono",
                trend.startsWith('+') ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
              )}>
                {trend}
              </span>
            )}
            {subtext && (
              <span className="text-xs text-slate-500 font-medium font-mono">
                {subtext}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Premium Double-Bezel Card Container component
const PremiumCard = ({ title, subtitle, icon: Icon, children, className, headerRight }) => {
  return (
    <div className={cn("bg-slate-200/30 p-1 rounded-[1.5rem] border border-slate-200/10 flex-1 flex flex-col min-h-0", className)}>
      <div className="bg-white rounded-[calc(1.5rem-0.25rem)] border border-slate-200/20 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_4px_16px_-8px_rgba(0,0,0,0.02)] overflow-visible flex-1 flex flex-col min-h-0">
        {(title || subtitle) && (
          <div className="px-3 sm:px-4 py-2 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 shrink-0">
            <div className="flex items-center gap-2.5">
              {Icon && (
                <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100 shrink-0">
                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                </div>
              )}
              <div className="min-w-0">
                {title && <h3 className="text-sm font-semibold text-slate-900 tracking-tight truncate">{title}</h3>}
                {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">{subtitle}</p>}
              </div>
            </div>
            {headerRight && (
              <div className="w-full md:w-auto overflow-x-auto no-scrollbar">
                {headerRight}
              </div>
            )}
          </div>
        )}
        <div className="flex-1 flex flex-col min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
};

// Floating popover anchored to the clicked (i) button and rendered into document.body.
// Displays the exact previous dropdown UI clearly without clipping from table/card overflow-hidden,
// and automatically flips upward when clicked on lower calendar rows.
const InfoDropdownPopover = ({ anchorRect, onClose, children }) => {
  useEffect(() => {
    const handleClose = () => onClose();
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    const timer = setTimeout(() => {
      window.addEventListener("click", handleClose);
    }, 10);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleClose, true);
    window.addEventListener("resize", handleClose);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", handleClose);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
    };
  }, [onClose]);

  if (!anchorRect) return null;

  const popoverWidth = 224;
  const estimatedHeight = 220;

  const spaceBelow = window.innerHeight - anchorRect.bottom;
  const openUpward = spaceBelow < estimatedHeight && anchorRect.top > estimatedHeight;

  const top = openUpward
    ? Math.max(10, anchorRect.top - 6)
    : anchorRect.bottom + 6;

  let left = anchorRect.right - popoverWidth;
  if (left < 10) left = 10;
  if (left + popoverWidth > window.innerWidth - 10) {
    left = window.innerWidth - popoverWidth - 10;
  }

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: openUpward ? "auto" : `${top}px`,
        bottom: openUpward ? `${window.innerHeight - top}px` : "auto",
        left: `${left}px`,
        zIndex: 9999,
      }}
      className="animate-in fade-in zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
};

const AttendancePage = () => {
  const canViewAll = hasPermission("attendance", "view_all");

  const [attendance, setAttendance] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(canViewAll ? "all" : "my");
  const [loading, setLoading] = useState(true);
  const [fetchingLogs, setFetchingLogs] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null); // for mobile tap-to-expand detail
  const [openInfo, setOpenInfo] = useState(null); // { dateKey, rect, type, ... }
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'present' | 'absent' | 'leave' | 'holiday'
  const [currentUserProfile, setCurrentUserProfile] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const res = await axios.get("/auth/me");
        if (res.data?.data) {
          setCurrentUserProfile(res.data.data);
        }
      } catch (err) {
        console.warn("Could not load user profile for joining date:", err);
      }
    };
    fetchProfileData();
  }, []);

  const parseCoordinates = (loc) => {
    if (!loc || loc === "Location unavailable") {
      return { lat: "Not captured", lng: "Not captured" };
    }
    const parts = loc.split(",").map((p) => p.trim());
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { lat: parts[0], lng: parts[1] };
    }
    return { lat: loc, lng: "N/A" };
  };

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentYear = new Date().getFullYear();

  const getActiveJoiningDate = () => {
    if (selectedEmployeeId === "my") {
      let localUser = {};
      try {
        localUser = JSON.parse(localStorage.getItem("user") || "{}");
      } catch { }
      return currentUserProfile?.joining_date || localUser?.joining_date || null;
    }
    if (selectedEmployeeId === "all") {
      return null;
    }
    const emp = employees.find((e) => e.user_id === selectedEmployeeId);
    return emp?.joining_date || null;
  };

  const activeJoiningDate = getActiveJoiningDate();
  const activeJoiningDateKey = activeJoiningDate ? (
    activeJoiningDate.includes("T")
      ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(activeJoiningDate))
      : activeJoiningDate.split("T")[0]
  ) : null;

  const joiningYear = activeJoiningDateKey ? parseInt(activeJoiningDateKey.split("-")[0]) : null;
  const joiningMonth = activeJoiningDateKey ? parseInt(activeJoiningDateKey.split("-")[1]) - 1 : null;

  const isPrevMonthDisabled = Boolean(
    joiningYear !== null &&
    (selectedYear < joiningYear || (selectedYear === joiningYear && selectedMonth <= joiningMonth))
  );

  // If user is currently looking at a month prior to their joining date, automatically snap forward to joining month
  useEffect(() => {
    if (joiningYear !== null && joiningMonth !== null) {
      if (selectedYear < joiningYear || (selectedYear === joiningYear && selectedMonth < joiningMonth)) {
        setSelectedYear(joiningYear);
        setSelectedMonth(joiningMonth);
      }
    }
  }, [joiningYear, joiningMonth, selectedYear, selectedMonth]);

  const minSelectableYear = joiningYear || (currentYear - 4);
  const years = Array.from(
    { length: Math.max(1, (currentYear + 2) - minSelectableYear + 1) },
    (_, i) => minSelectableYear + i
  );

  const handlePrevMonth = () => {
    if (isPrevMonthDisabled) return;
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const formatDateKey = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const parseDbDateKey = (dbDateStr) => {
    if (!dbDateStr) return "";
    if (typeof dbDateStr === "string" && dbDateStr.includes("T")) {
      const d = new Date(dbDateStr);
      if (!isNaN(d.getTime())) {
        return new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(d);
      }
    }
    return typeof dbDateStr === "string" ? dbDateStr.split("T")[0] : "";
  };

  const getLeaveForDay = (dateKey, userId = null) => {
    if (!allLeaves || allLeaves.length === 0) return null;
    return allLeaves.find((leave) => {
      if (leave.status === "Rejected") return false;
      if (userId && leave.user_id && leave.user_id !== userId) return false;
      const start = parseDbDateKey(leave.start_date);
      const end = parseDbDateKey(leave.end_date);
      return dateKey >= start && dateKey <= end;
    });
  };

  const getKolkataToday = () => {
    const d = new Date();
    const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
    const formatter = new Intl.DateTimeFormat('en-CA', options);
    return formatter.format(d);
  };

  /**
   * Classify monthly leaves based on 1-day paid leave policy:
   * - The 1st day of eligible leave in the month is marked as Paid Leave.
   * - Any remaining / subsequent leaves within the same month are marked as Unpaid (Absent).
   * - Policy update: If the user forgot to apply for leave and has allowance remaining:
   *   - If they have only 1 missing day, make that day Paid Leave.
   *   - If they have > 1 missing days, make the first one Paid Leave and remaining Absent.
   */
  const getMonthLeaveClassification = (empId = null) => {
    const totalDays = getDaysInMonth(selectedMonth, selectedYear);
    const todayStr = getKolkataToday();
    let paidDaysUsed = 0;
    const classification = {};

    // 1. First, check explicitly applied leaves in the month
    for (let day = 1; day <= totalDays; day++) {
      const dateKey = formatDateKey(new Date(selectedYear, selectedMonth, day));
      const dayOfWeek = new Date(selectedYear, selectedMonth, day).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidays.some(h => parseDbDateKey(h.date) === dateKey);

      if (isWeekend || isHoliday) continue;

      const leave = getLeaveForDay(dateKey, empId);
      if (!leave) continue;

      // Note: Rejected leaves are already ignored in getLeaveForDay (treated as normal day)
      const isExplicitlyUnpaid = leave.leave_type === "Unpaid";
      const isApproved = leave.status === "Approved";
      const isPending = leave.status === "Pending";

      if (isApproved) {
        if (!isExplicitlyUnpaid && paidDaysUsed < 1) {
          paidDaysUsed += leave.is_half_day ? 0.5 : 1;
          classification[dateKey] = {
            dayLeave: leave,
            isPaid: true,
            isPending: false,
            isAutoPaidLeave: false,
          };
        } else {
          classification[dateKey] = {
            dayLeave: leave,
            isPaid: false,
            isPending: false,
            isAutoPaidLeave: false,
          };
        }
      } else if (isPending) {
        // User applied for leave: show "Leave Requested" so the user knows they added a leave on this day.
        // It becomes Paid Leave once approved by HR.
        if (!isExplicitlyUnpaid && paidDaysUsed < 1) {
          paidDaysUsed += leave.is_half_day ? 0.5 : 1;
        }
        classification[dateKey] = {
          dayLeave: leave,
          isPaid: false,
          isPending: true,
          isAutoPaidLeave: false,
        };
      }
    }

    // 2. If employee forgot to apply and has paid allowance remaining (< 1 day used):
    // Allocate the 1-day allowance to their first unpunched / absent working day.
    if (paidDaysUsed < 1) {
      let empJoiningKey = null;
      if (empId) {
        const empObj = employees.find(e => e.user_id === empId);
        empJoiningKey = empObj?.joining_date ? parseDbDateKey(empObj.joining_date) : null;
      } else {
        empJoiningKey = activeJoiningDateKey;
      }

      for (let day = 1; day <= totalDays; day++) {
        const dateKey = formatDateKey(new Date(selectedYear, selectedMonth, day));

        // Skip future dates (absences have not occurred yet)
        if (dateKey > todayStr) continue;

        // Skip days before joining date (not employed yet)
        if (empJoiningKey && dateKey < empJoiningKey) continue;

        const dayOfWeek = new Date(selectedYear, selectedMonth, day).getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHoliday = holidays.some(h => parseDbDateKey(h.date) === dateKey);
        if (isWeekend || isHoliday) continue;

        // If this day already had an applied leave, skip
        if (classification[dateKey]) continue;

        // Check if employee punched in / was present
        const isPresent = attendance.some(a => {
          if (empId && a.user_id) {
            return a.user_id === empId && parseDbDateKey(a.date) === dateKey;
          }
          return parseDbDateKey(a.date) === dateKey;
        });

        // First missed working day gets the 1-day monthly paid leave allowance!
        if (!isPresent) {
          classification[dateKey] = {
            dayLeave: null,
            isPaid: true,
            isAutoPaidLeave: true,
          };
          paidDaysUsed += 1;
          break; // Stop: Only 1 paid leave allowance per month. Subsequent missed days stay absent.
        }
      }
    }

    return classification;
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const fetchAttendanceData = async () => {
    setFetchingLogs(true);
    try {
      if (selectedEmployeeId === "all" && canViewAll) {
        let employeesList = employees;
        if (employees.length === 0) {
          const empRes = await axios.get("/hr/attendance/users");
          employeesList = empRes.data.data || [];
          setEmployees(employeesList);
        }

        const leavesRes = await axios.get("/hr/leaves");
        setAllLeaves(leavesRes.data.data || []);

        const attRes = await axios.get(`/hr/attendance/all?month=${selectedMonth + 1}&year=${selectedYear}`);
        setAttendance(attRes.data.data || []);

      } else {
        const targetUserId = selectedEmployeeId === "my" ? null : selectedEmployeeId;
        const baseUrl = targetUserId
          ? `/hr/attendance/my?userId=${targetUserId}&month=${selectedMonth + 1}&year=${selectedYear}&limit=100`
          : `/hr/attendance/my?month=${selectedMonth + 1}&year=${selectedYear}&limit=100`;

        const attRes = await axios.get(baseUrl);
        setAttendance(attRes.data.data?.items || []);

        if (selectedEmployeeId === "my") {
          const leavesRes = await axios.get("/hr/leaves/my");
          setAllLeaves(leavesRes.data.data || []);
        } else {
          const leavesRes = await axios.get("/hr/leaves");
          setAllLeaves(leavesRes.data.data || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch attendance data", err);
      toast.error("Failed to load attendance records");
      setAttendance([]);
      setAllLeaves([]);
    } finally {
      setFetchingLogs(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchAttendanceData();
      setLoading(false);
    };
    init();
  }, [selectedMonth, selectedYear, selectedEmployeeId]);

  useEffect(() => {
    setSelectedDay(null);
    setStatusFilter("all");
  }, [selectedMonth, selectedYear, selectedEmployeeId]);

  const calculateCalendarStats = () => {
    const totalDays = getDaysInMonth(selectedMonth, selectedYear);
    const todayStr = getKolkataToday();

    if (selectedEmployeeId === "all") {
      let totalPossibleDays = 0;
      let totalPresentDays = 0;
      let totalAbsentDays = 0;
      let totalLeaveDays = 0;

      // Today's team attendance counts
      let todayPresent = 0;
      let todayLeave = 0;
      let todayAbsent = 0;

      const now = new Date();
      const isViewingCurrentMonth = (selectedMonth === now.getMonth() && selectedYear === now.getFullYear());
      const dayOfWeekToday = now.getDay();
      const isWeekendToday = dayOfWeekToday === 0 || dayOfWeekToday === 6;
      const isHolidayToday = holidays.some(h => parseDbDateKey(h.date) === todayStr);

      employees.forEach(emp => {
        const empLeaveMap = getMonthLeaveClassification(emp.user_id);
        const empJoiningKey = emp.joining_date ? parseDbDateKey(emp.joining_date) : null;

        // Calculate Today's counts for active employees
        if (isViewingCurrentMonth && (!empJoiningKey || todayStr >= empJoiningKey)) {
          const isPresentToday = attendance.some(a => a.user_id === emp.user_id && parseDbDateKey(a.date) === todayStr);
          const leaveToday = empLeaveMap[todayStr];

          if (isPresentToday) {
            todayPresent++;
          } else if ((leaveToday?.isPaid || leaveToday?.isPending) && !isWeekendToday && !isHolidayToday) {
            todayLeave++;
          } else if (!isWeekendToday && !isHolidayToday) {
            todayAbsent++;
          }
        }

        // Monthly totals calculation for attendance rate
        for (let day = 1; day <= totalDays; day++) {
          const dateKey = formatDateKey(new Date(selectedYear, selectedMonth, day));
          if (dateKey > todayStr) continue;
          if (empJoiningKey && dateKey < empJoiningKey) continue;

          const dayOfWeek = new Date(selectedYear, selectedMonth, day).getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const isHoliday = holidays.some(h => parseDbDateKey(h.date) === dateKey);

          if (!isWeekend && !isHoliday) {
            totalPossibleDays++;

            const isPresent = attendance.some(a => a.user_id === emp.user_id && parseDbDateKey(a.date) === dateKey);
            const leaveInfo = empLeaveMap[dateKey];

            if (isPresent) {
              totalPresentDays++;
            } else if (leaveInfo?.isPaid) {
              totalLeaveDays++;
            } else if (leaveInfo?.isPending) {
              // Requested leave pending HR approval - not counted as absence
            } else {
              totalAbsentDays++;
            }
          }
        }
      });

      const attendanceRate = totalPossibleDays > 0
        ? Math.round((totalPresentDays / totalPossibleDays) * 100)
        : 0;

      const holidaysCount = holidays.filter(h => {
        const d = new Date(h.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      }).length;

      return {
        card1Title: isViewingCurrentMonth ? "Present Today" : "Total Present",
        card1Value: isViewingCurrentMonth ? todayPresent : totalPresentDays,
        card1Subtext: isViewingCurrentMonth ? `${todayPresent} of ${employees.length} active` : "This month",
        card2Title: isViewingCurrentMonth ? "Absent Today" : "Total Absent",
        card2Value: isViewingCurrentMonth ? todayAbsent : totalAbsentDays,
        card2Subtext: isViewingCurrentMonth ? "Not checked in" : "Missed working days",
        cardLeaveTitle: isViewingCurrentMonth ? "Leave Today" : "Paid Leave",
        cardLeaveValue: isViewingCurrentMonth ? todayLeave : totalLeaveDays,
        cardLeaveSubtext: isViewingCurrentMonth ? "Approved / pending" : "1 day/mo allowance",
        card3Title: "Avg Rate",
        card3Value: `${attendanceRate}%`,
        card3Subtext: "Past working days",
        card4Title: "Holidays",
        card4Value: holidaysCount,
        card4Subtext: "This month"
      };
    } else {
      let presentCount = 0;
      let absentCount = 0;
      let leaveCount = 0;
      const targetUserId = selectedEmployeeId === "my" ? null : selectedEmployeeId;
      const leaveMap = getMonthLeaveClassification(targetUserId);

      for (let day = 1; day <= totalDays; day++) {
        const dateKey = formatDateKey(new Date(selectedYear, selectedMonth, day));
        // Days before joining date cannot be counted as absence
        if (activeJoiningDateKey && dateKey < activeJoiningDateKey) {
          continue;
        }

        const dayOfWeek = new Date(selectedYear, selectedMonth, day).getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHoliday = holidays.some(h => parseDbDateKey(h.date) === dateKey);

        const isPresent = attendance.some(a => parseDbDateKey(a.date) === dateKey);
        const leaveInfo = leaveMap[dateKey];

        if (isPresent) {
          presentCount++;
        } else if (leaveInfo?.isPaid && !isWeekend && !isHoliday) {
          leaveCount++;
        } else if (leaveInfo?.isPending && !isWeekend && !isHoliday) {
          // Requested leave pending HR approval - not counted as absence
        } else if (dateKey <= todayStr && !isWeekend && !isHoliday) {
          absentCount++;
        }
      }

      const checkInTimes = attendance
        .filter((a) => a.check_in)
        .map((a) => {
          const d = new Date(a.check_in);
          const hours = parseInt(
            new Intl.DateTimeFormat("en-GB", {
              timeZone: "Asia/Kolkata",
              hour: "2-digit",
              hour12: false,
            }).format(d),
          );
          const minutes = parseInt(
            new Intl.DateTimeFormat("en-GB", {
              timeZone: "Asia/Kolkata",
              minute: "2-digit",
            }).format(d),
          );
          return hours * 60 + minutes;
        });

      const avgMinutes = checkInTimes.length
        ? Math.round(checkInTimes.reduce((a, b) => a + b, 0) / checkInTimes.length)
        : 0;

      const hours = Math.floor(avgMinutes / 60);
      const mins = avgMinutes % 60;
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      const avgStr = checkInTimes.length ? `${displayHours}:${mins < 10 ? "0" : ""}${mins} ${period}` : "--:--";

      const holidaysCount = holidays.filter(h => {
        const d = new Date(h.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      }).length;

      return {
        card1Title: "Days Present",
        card1Value: presentCount,
        card1Subtext: "This month",
        card2Title: "Days Absent",
        card2Value: absentCount,
        card2Subtext: "Missed working days",
        cardLeaveTitle: "On Leave",
        cardLeaveValue: leaveCount,
        cardLeaveSubtext: "Approved / Pending",
        card3Title: "Avg. Check-in",
        card3Value: avgStr,
        card3Subtext: "Based on logs",
        card4Title: "Company Holidays",
        card4Value: holidaysCount,
        card4Subtext: "This month"
      };
    }
  };

  const handleExport = () => {
    if (attendance.length === 0) {
      toast.error("No data available to export for this period");
      return;
    }

    const isAll = selectedEmployeeId === "all";
    const headers = isAll
      ? ["Employee Name", "Employee Email", "Date", "Day", "Status", "Check In", "Check Out", "Location"]
      : ["Date", "Day", "Status", "Check In", "Check Out", "Location"];

    const csvRows = [headers.join(",")];

    attendance.forEach((entry) => {
      const dateObj = new Date(entry.date);
      const date = dateObj.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
      const day = dateObj.toLocaleDateString("en-IN", { weekday: "long", timeZone: "Asia/Kolkata" });
      const checkIn = entry.check_in
        ? new Date(entry.check_in).toLocaleTimeString("en-IN", { hour12: false, timeZone: "Asia/Kolkata" })
        : "N/A";
      const checkOut = entry.check_out
        ? new Date(entry.check_out).toLocaleTimeString("en-IN", { hour12: false, timeZone: "Asia/Kolkata" })
        : "N/A";

      const row = isAll
        ? [
          `"${entry.employee_name || "N/A"}"`,
          `"${entry.employee_email || "N/A"}"`,
          `"${date}"`,
          `"${day}"`,
          `"${entry.status}"`,
          `"${checkIn}"`,
          `"${checkOut}"`,
          `"${entry.location || "N/A"}"`,
        ]
        : [
          `"${date}"`,
          `"${day}"`,
          `"${entry.status}"`,
          `"${checkIn}"`,
          `"${checkOut}"`,
          `"${entry.location || "N/A"}"`,
        ];
      csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    const empName = selectedEmployeeId === "all"
      ? "All_Employees"
      : selectedEmployeeId === "my"
        ? "My"
        : employees.find(e => e.user_id === selectedEmployeeId)?.name?.replace(/\s+/g, "_") || "Employee";

    const fileName = `Attendance_${empName}_${months[selectedMonth]}_${selectedYear}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Excel sheet generated successfully");
  };

  // Tooltip positioning is only used on desktop hover; disabled on touch via CSS (md:group-hover)
  const getTooltipPositionClasses = (index) => {
    const row = Math.floor(index / 7);
    const col = index % 7;

    let vClass = "";
    let hClass = "";

    if (row === 0) {
      vClass = "top-[105%] mt-2";
      if (col <= 1) {
        hClass = "left-0";
      } else if (col >= 5) {
        hClass = "right-0";
      } else {
        hClass = "left-1/2 -translate-x-1/2";
      }
    } else if (row === 1 || row === 2) {
      vClass = "top-1/2 -translate-y-1/2";
      if (col <= 3) {
        hClass = "left-[105%] ml-2";
      } else {
        hClass = "right-[105%] mr-2";
      }
    } else {
      vClass = "bottom-[105%] mb-2";
      if (col <= 1) {
        hClass = "left-0";
      } else if (col >= 5) {
        hClass = "right-0";
      } else {
        hClass = "left-1/2 -translate-x-1/2";
      }
    }

    return `${vClass} ${hClass}`;
  };

  const getAttHours = (attRecord) => {
    if (!attRecord || !attRecord.check_in) return "8 h";
    if (!attRecord.check_out) {
      const todayStr = getKolkataToday();
      const dateKey = parseDbDateKey(attRecord.date || attRecord.check_in);
      if (dateKey === todayStr) {
        const checkInTime = new Date(attRecord.check_in).getTime();
        const nowTime = new Date().getTime();
        const diffHours = (nowTime - checkInTime) / (1000 * 60 * 60);
        if (diffHours > 0 && diffHours < 24) {
          const rounded = Math.round(diffHours * 10) / 10;
          return `${rounded} h`;
        }
      }
      return "8 h";
    }
    const diffMs = new Date(attRecord.check_out).getTime() - new Date(attRecord.check_in).getTime();
    if (diffMs > 0) {
      const hours = diffMs / (1000 * 60 * 60);
      const rounded = Math.round(hours * 10) / 10;
      return `${rounded} h`;
    }
    return "8 h";
  };

  const getCardClasses = (d, index, isToday, customClass = "") => {
    const baseClasses = "relative group flex flex-col justify-between h-full min-h-0 p-1.5 sm:p-2 transition-all duration-150 cursor-pointer overflow-hidden";
    const activeClass = isToday ? "bg-blue-50/20" : "";

    if (customClass) {
      return `${baseClasses} ${customClass} ${activeClass}`;
    }

    const defaultMonthClass = d.isCurrentMonth
      ? "bg-white hover:bg-slate-50/70"
      : "bg-slate-50/40 opacity-40 text-slate-400";

    return `${baseClasses} ${defaultMonthClass} ${activeClass}`;
  };

  const getCalendarDays = () => {
    const firstDayIndex = getFirstDayOfMonth(selectedMonth, selectedYear);
    const totalDays = getDaysInMonth(selectedMonth, selectedYear);

    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    const prevMonthDays = getDaysInMonth(prevMonth, prevYear);

    const days = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        month: prevMonth,
        year: prevYear,
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= totalDays; i++) {
      days.push({
        day: i,
        month: selectedMonth,
        year: selectedYear,
        isCurrentMonth: true,
      });
    }

    const nextMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
    const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        day: i,
        month: nextMonth,
        year: nextYear,
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const getPageTitle = () => {
    if (selectedEmployeeId === "all") {
      return "All Employees Attendance";
    }
    if (selectedEmployeeId === "my") {
      return "My Attendance Logs";
    }
    const emp = employees.find(e => e.user_id === selectedEmployeeId);
    return emp ? `${emp.name}'s Attendance` : "Attendance Logs";
  };

  const getPageSubtext = () => {
    if (selectedEmployeeId === "all") {
      return "Viewing team-wide attendance records, leaves, and presence.";
    }
    if (selectedEmployeeId === "my") {
      return "Review your historical punch-in records and site presence.";
    }
    const emp = employees.find(e => e.user_id === selectedEmployeeId);
    return emp ? `Reviewing records for ${emp.email}` : "";
  };

  // Build the same detail data used by the desktop tooltip, for the mobile tap panel
  const getDayDetail = (d, _index) => {
    const dateKey = formatDateKey(new Date(d.year, d.month, d.day));
    const holiday = holidays.find(h => parseDbDateKey(h.date) === dateKey);
    const dayOfWeek = new Date(d.year, d.month, d.day).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const todayStr = getKolkataToday();
    const isPast = dateKey < todayStr;
    const isToday = dateKey === todayStr;

    if (selectedEmployeeId === "all") {
      const presentList = [];
      const leaveList = [];
      const absentList = [];

      employees.forEach(emp => {
        const empJoiningKey = emp.joining_date ? parseDbDateKey(emp.joining_date) : null;
        if (empJoiningKey && dateKey < empJoiningKey) return;

        const empLeaveMap = getMonthLeaveClassification(emp.user_id);
        const empAtt = attendance.find(a => a.user_id === emp.user_id && parseDbDateKey(a.date) === dateKey);
        const leaveInfo = empLeaveMap[dateKey];

        if (empAtt) {
          presentList.push(emp);
        } else if ((leaveInfo?.isPaid || leaveInfo?.isPending) && !isWeekend && !holiday) {
          leaveList.push({
            ...emp,
            leave: leaveInfo.dayLeave,
            isAutoPaidLeave: !!leaveInfo.isAutoPaidLeave,
            isPending: !!leaveInfo.isPending,
          });
        } else if ((isPast || isToday) && !isWeekend && !holiday) {
          absentList.push({
            ...emp,
            leave: leaveInfo?.dayLeave,
            isUnpaidLeave: !!leaveInfo && !leaveInfo.isPaid && !leaveInfo.isPending,
          });
        }
      });

      return { type: "all", dateKey, holiday, presentList, leaveList, absentList };
    } else {
      const targetUserId = selectedEmployeeId === "my" ? null : selectedEmployeeId;
      const attRecord = attendance.find(a => parseDbDateKey(a.date) === dateKey);
      const leaveMap = getMonthLeaveClassification(targetUserId);
      const leaveInfo = leaveMap[dateKey];
      const dayLeave = leaveInfo?.dayLeave;
      const isPaidLeave = leaveInfo?.isPaid;
      const isPendingLeave = leaveInfo?.isPending;
      const isAutoPaidLeave = leaveInfo?.isAutoPaidLeave;
      const isBeforeJoining = activeJoiningDateKey && dateKey < activeJoiningDateKey;

      let status = "None";
      if (attRecord) status = attRecord.status || "Present";
      else if (isBeforeJoining) status = "Not Joined Yet";
      else if (holiday) status = "Holiday";
      else if (isWeekend) status = "Weekend";
      else if (isPendingLeave) status = "Leave Requested";
      else if (isPaidLeave) status = isAutoPaidLeave ? "Paid Leave" : "Paid Leave";
      else if (dayLeave && !isPaidLeave) status = "Absent (Unpaid Leave)";
      else if (isPast || isToday) status = "Absent";

      return { type: "single", dateKey, holiday, attRecord, dayLeave, isPaidLeave, isPendingLeave, isAutoPaidLeave, isBeforeJoining, status };
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8 pb-10 px-4 sm:px-6 lg:px-0">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 sm:w-64" />
          <Skeleton className="h-4 w-full max-w-xs sm:w-96" />
          <Skeleton className="h-8 w-full sm:w-[400px] rounded-lg" />
        </div>
        <Skeleton className="h-[500px] rounded-2xl" />
      </div>
    );
  }
  const activeStats = calculateCalendarStats();
  const calendarDays = getCalendarDays();
  const selectedDetail = selectedDay !== null ? getDayDetail(calendarDays[selectedDay], selectedDay) : null;

  return (
    <div className="flex-1 min-h-0 flex flex-col w-full gap-2 overflow-hidden">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 shrink-0">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            {getPageTitle()}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            {getPageSubtext()}
          </p>
        </div>

        {/* Toolbar controls in header */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0 w-full md:w-auto">
          <div className="flex items-center bg-white border border-slate-200/70 p-0.5 rounded-xl shadow-2xs flex-1 min-w-[190px] sm:flex-initial">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={isPrevMonthDisabled}
              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all active:scale-95 shrink-0 disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none"
              title={isPrevMonthDisabled ? "Cannot navigate prior to joining date" : "Previous Month"}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
            <select
              className="bg-transparent border-none text-xs font-bold text-slate-700 pl-1 sm:px-2 py-1.5 outline-none cursor-pointer focus:ring-0 flex-1 min-w-0"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
              {months.map((m, i) => {
                if (joiningYear !== null && selectedYear === joiningYear && i < joiningMonth) {
                  return null;
                }
                return (
                  <option key={m} value={i}>{m}</option>
                );
              })}
            </select>
            <select
              className="bg-transparent border-none text-xs font-bold text-slate-700 px-1.5 sm:px-2 py-1.5 outline-none cursor-pointer border-l border-slate-200 focus:ring-0"
              value={selectedYear}
              onChange={(e) => {
                const nextY = parseInt(e.target.value);
                setSelectedYear(nextY);
                if (joiningYear !== null && nextY === joiningYear && selectedMonth < joiningMonth) {
                  setSelectedMonth(joiningMonth);
                }
              }}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all active:scale-95 shrink-0"
              title="Next Month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {canViewAll && (
            <div className="relative flex-1 min-w-[160px] sm:flex-initial">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10" />
              <select
                className="pl-8.5 pr-6 h-9 w-full bg-white border border-slate-200/70 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer shadow-2xs"
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                value={selectedEmployeeId}
              >
                <option value="all">All Employees</option>
                <option value="my">My Own Logs</option>
                {employees.map((emp) => (
                  <option key={emp.user_id} value={emp.user_id}>{emp.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-slate-200/30 p-0.5 rounded-xl border border-slate-200/20 active:scale-[0.98] transition-all duration-300">
            <Button
              onClick={handleExport}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-1.5 px-3 sm:px-3.5 text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 w-full h-9"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Full-width Calendar with inline KPI strip */}
      <PremiumCard
        className="flex-1 min-h-0 flex flex-col"
        icon={CalendarClock}
        headerRight={
          <div className="flex items-center gap-1.5 sm:gap-2 w-max sm:w-auto">
            {statusFilter !== "all" && (
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className="px-2 py-1 text-[10px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-all"
                title="Reset filter to show all"
              >
                Clear filter
              </button>
            )}

            {/* KPI Stat 1: Present */}
            <button
              type="button"
              onClick={() => setStatusFilter((prev) => (prev === "present" ? "all" : "present"))}
              className={cn(
                "flex items-center gap-2 px-2.5 sm:px-3 py-1 bg-emerald-50/80 border rounded-xl shadow-2xs transition-all cursor-pointer select-none",
                statusFilter === "present"
                  ? "border-emerald-500 ring-2 ring-emerald-500/30 shadow-sm scale-[1.02]"
                  : "border-emerald-200/60 hover:border-emerald-300"
              )}
              title="Filter: Present only"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider leading-none whitespace-nowrap">
                  {activeStats.card1Title || "Present"}
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-emerald-950 font-mono leading-tight mt-0.5">
                  {activeStats.card1Value}
                </span>
              </div>
            </button>

            {/* KPI Stat 2: Absent */}
            <button
              type="button"
              onClick={() => setStatusFilter((prev) => (prev === "absent" ? "all" : "absent"))}
              className={cn(
                "flex items-center gap-2 px-2.5 sm:px-3 py-1 bg-rose-50/80 border rounded-xl shadow-2xs transition-all cursor-pointer select-none",
                statusFilter === "absent"
                  ? "border-rose-500 ring-2 ring-rose-500/30 shadow-sm scale-[1.02]"
                  : "border-rose-200/60 hover:border-rose-300"
              )}
              title="Filter: Absent only"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-bold text-rose-800 uppercase tracking-wider leading-none whitespace-nowrap">
                  {activeStats.card2Title || "Absent"}
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-rose-950 font-mono leading-tight mt-0.5">
                  {activeStats.card2Value}
                </span>
              </div>
            </button>

            {/* KPI Stat 3: Leave */}
            <button
              type="button"
              onClick={() => setStatusFilter((prev) => (prev === "leave" ? "all" : "leave"))}
              className={cn(
                "flex items-center gap-2 px-2.5 sm:px-3 py-1 bg-amber-50/80 border rounded-xl shadow-2xs transition-all cursor-pointer select-none",
                statusFilter === "leave"
                  ? "border-amber-500 ring-2 ring-amber-500/30 shadow-sm scale-[1.02]"
                  : "border-amber-200/60 hover:border-amber-300"
              )}
              title="Filter: On Leave only"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider leading-none whitespace-nowrap">
                  {activeStats.cardLeaveTitle || "Leave"}
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-amber-950 font-mono leading-tight mt-0.5">
                  {activeStats.cardLeaveValue || 0}
                </span>
              </div>
            </button>

            {/* KPI Stat 4: Rate / Avg In */}
            <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 bg-blue-50/80 border border-blue-200/60 rounded-xl shadow-2xs">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-bold text-blue-800 uppercase tracking-wider leading-none whitespace-nowrap">
                  {selectedEmployeeId === "all" ? "Avg Rate" : "Avg In"}
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-blue-950 font-mono leading-tight mt-0.5">
                  {activeStats.card3Value}
                </span>
              </div>
            </div>

            {/* KPI Stat 5: Holidays */}
            <button
              type="button"
              onClick={() => setStatusFilter((prev) => (prev === "holiday" ? "all" : "holiday"))}
              className={cn(
                "flex items-center gap-2 px-2.5 sm:px-3 py-1 bg-slate-50/80 border rounded-xl shadow-2xs transition-all cursor-pointer select-none",
                statusFilter === "holiday"
                  ? "border-blue-500 ring-2 ring-blue-500/30 shadow-sm scale-[1.02]"
                  : "border-slate-200/60 hover:border-slate-300"
              )}
              title="Filter: Holidays only"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-bold text-slate-700 uppercase tracking-wider leading-none whitespace-nowrap">
                  Holidays
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 font-mono leading-tight mt-0.5">
                  {activeStats.card4Value}
                </span>
              </div>
            </button>
          </div>
        }
        title={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={isPrevMonthDisabled}
              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed disabled:pointer-events-none"
              title={isPrevMonthDisabled ? "Cannot navigate prior to joining date" : "Previous Month"}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-base font-bold text-slate-900 tracking-tight">
              {months[selectedMonth]} {selectedYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all active:scale-95"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        }
        subtitle={`${getPageSubtext()}`}
      >
        {/* Legend row for mobile */}
        <div className="flex sm:hidden items-center gap-3 px-4 pt-3 text-[9px] font-semibold text-slate-400 uppercase tracking-widest flex-wrap">
          <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> In</div>
          <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div> Out</div>
          {selectedEmployeeId !== "all" && <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div> Holiday</div>}
          <div className="text-slate-300 normal-case font-medium tracking-normal ml-auto">Tap a day for details</div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 p-1 sm:p-2 overflow-hidden">
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs flex-1 flex flex-col min-h-0">
            {/* Weekday header row */}
            <div className="grid grid-cols-7 border-b border-slate-200/90 bg-slate-50/90 divide-x divide-slate-200/60 shrink-0">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, dIdx) => (
                <div key={day} className={cn(
                  "px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-left text-[11px] font-bold uppercase tracking-wider",
                  dIdx === 0 || dIdx === 6 ? "text-slate-400 bg-slate-100/40" : "text-slate-600"
                )}>
                  <span className="sm:hidden">{day.charAt(0)}</span>
                  <span className="hidden sm:inline">{day.toUpperCase()}</span>
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 grid-rows-6 flex-1 min-h-0 divide-x divide-y divide-slate-100">
              {calendarDays.map((d, index) => {
                const dateKey = formatDateKey(new Date(d.year, d.month, d.day));
                const holiday = holidays.find(h => parseDbDateKey(h.date) === dateKey);
                const dayOfWeek = new Date(d.year, d.month, d.day).getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const todayStr = getKolkataToday();
                const isPast = dateKey < todayStr;
                const isToday = dateKey === todayStr;
                const isSelected = selectedDay === index;

                if (selectedEmployeeId === "all") {
                  const presentList = [];
                  const leaveList = [];
                  const absentList = [];

                  if (d.isCurrentMonth) {
                    employees.forEach(emp => {
                      const empLeaveMap = getMonthLeaveClassification(emp.user_id);
                      const empAtt = attendance.find(a => a.user_id === emp.user_id && parseDbDateKey(a.date) === dateKey);
                      const leaveInfo = empLeaveMap[dateKey];

                      if (empAtt) {
                        presentList.push(emp);
                      } else if ((leaveInfo?.isPaid || leaveInfo?.isPending) && !isWeekend && !holiday) {
                        leaveList.push({
                          ...emp,
                          leave: leaveInfo.dayLeave,
                          isAutoPaidLeave: !!leaveInfo.isAutoPaidLeave,
                          isPending: !!leaveInfo.isPending,
                        });
                      } else if ((isPast || isToday) && !isWeekend && !holiday) {
                        absentList.push({
                          ...emp,
                          leave: leaveInfo?.dayLeave,
                          isUnpaidLeave: !!leaveInfo && !leaveInfo.isPaid && !leaveInfo.isPending,
                        });
                      }
                    });
                  }

                  const totalPresent = presentList.length;
                  const totalLeave = leaveList.length;
                  const totalAbsent = absentList.length;

                  const matchesFilter =
                    statusFilter === "all" ||
                    (statusFilter === "present" && totalPresent > 0) ||
                    (statusFilter === "absent" && totalAbsent > 0) ||
                    (statusFilter === "leave" && totalLeave > 0) ||
                    (statusFilter === "holiday" && holiday);
                  const isDimmed = d.isCurrentMonth && !matchesFilter;

                  return (
                    <div
                      key={index}
                      onClick={() => d.isCurrentMonth && setSelectedDay(isSelected ? null : index)}
                      className={cn(
                        getCardClasses(d, index, isToday, isWeekend && d.isCurrentMonth ? "bg-slate-50/40" : ""),
                        isSelected && "ring-2 ring-inset ring-blue-500 z-10",
                        openInfo?.dateKey === dateKey && "z-20",
                        isDimmed && "opacity-25 grayscale pointer-events-none"
                      )}
                    >
                      {/* Cell Top: Day number & status counter */}
                      <div className="flex items-center justify-between">
                        {isToday ? (
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs ring-2 ring-blue-100">
                            {d.day}
                          </div>
                        ) : (
                          <span className={cn(
                            "text-xs sm:text-sm font-semibold",
                            d.isCurrentMonth ? "text-slate-700" : "text-slate-300"
                          )}>
                            {d.day}
                          </span>
                        )}

                        {holiday ? (
                          <Badge variant="outline" className="hidden sm:inline-flex text-[9px] sm:text-[10px] bg-blue-50 text-blue-700 border-blue-200/80 py-0 px-1.5 rounded-full scale-90">
                            Holiday
                          </Badge>
                        ) : (
                          d.isCurrentMonth && totalPresent > 0 && (
                            <span className="hidden sm:inline text-[11px] font-medium text-slate-400 font-mono">
                              {totalPresent} in
                            </span>
                          )
                        )}

                        {d.isCurrentMonth && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              if (openInfo?.dateKey === dateKey) {
                                setOpenInfo(null);
                              } else {
                                setOpenInfo({
                                  dateKey,
                                  rect,
                                  type: "all",
                                  holiday,
                                  presentList,
                                  leaveList,
                                  absentList,
                                });
                              }
                            }}
                            className={cn(
                              "w-4 h-4 rounded-full flex items-center justify-center transition-all cursor-pointer",
                              openInfo?.dateKey === dateKey
                                ? "bg-primary-600 text-white shadow-xs scale-110"
                                : "bg-slate-100 hover:bg-primary-50 text-slate-400 hover:text-primary-600"
                            )}
                            title="View attendance details"
                          >
                            <Info className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>

                      {/* All-employees task bars */}
                      {d.isCurrentMonth && (
                        <div className="flex flex-col gap-0.5 sm:gap-1 mt-auto pt-0.5 sm:pt-1 w-full">
                          {totalPresent > 0 && (
                            <div className="w-full rounded-md sm:rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/70 px-1.5 sm:px-2 py-0.5 sm:py-1 flex items-center justify-between text-[10px] sm:text-[11px] font-semibold shadow-2xs">
                              <div className="flex items-center gap-1 truncate">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span className="truncate">Present</span>
                              </div>
                              <span className="font-mono text-[10px] sm:text-[11px] text-emerald-700 shrink-0 font-bold ml-1">{totalPresent}</span>
                            </div>
                          )}
                          {totalLeave > 0 && (
                            <div className="w-full rounded-md sm:rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80 px-1.5 sm:px-2 py-0.5 sm:py-1 flex items-center justify-between text-[10px] sm:text-[11px] font-semibold shadow-2xs">
                              <div className="flex items-center gap-1 truncate">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                <span className="truncate">Leave</span>
                              </div>
                              <span className="font-mono text-[10px] sm:text-[11px] text-amber-800 shrink-0 font-bold ml-1">{totalLeave}</span>
                            </div>
                          )}
                          {totalAbsent > 0 && (
                            <div className="w-full rounded-md sm:rounded-lg bg-rose-50 text-rose-800 border border-rose-200/70 px-1.5 sm:px-2 py-0.5 sm:py-1 flex items-center justify-between text-[10px] sm:text-[11px] font-semibold shadow-2xs">
                              <div className="flex items-center gap-1 truncate">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                <span className="truncate">Absent</span>
                              </div>
                              <span className="font-mono text-[10px] sm:text-[11px] text-rose-700 shrink-0 font-bold ml-1">{totalAbsent}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Hover tooltip: desktop only */}
                      {d.isCurrentMonth && (
                        <div className={`hidden md:block absolute ${getTooltipPositionClasses(index)} w-72 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-xs border border-slate-800 pointer-events-none`}>
                          <div className="font-bold border-b border-slate-800 pb-2 mb-2 flex justify-between items-center text-slate-300">
                            <span>{new Date(d.year, d.month, d.day).toLocaleDateString("en-IN", { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                            {holiday && <span className="text-blue-400 font-bold">{holiday.name}</span>}
                          </div>
                          <div className="space-y-3">
                            <div>
                              <div className="text-xs font-semibold text-emerald-400 mb-1">
                                Present ({totalPresent})
                              </div>
                              {presentList.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {presentList.map(e => (
                                    <span key={e.user_id} className="bg-emerald-950/50 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-emerald-900/30">
                                      {e.name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-slate-500 text-[10px] italic">None</div>
                              )}
                            </div>

                            {totalLeave > 0 && (
                              <div>
                                <div className="text-xs font-semibold text-amber-400 mb-1">
                                  On Leave ({totalLeave})
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {leaveList.map(e => (
                                    <span key={e.user_id} className="bg-amber-950/50 text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-amber-900/30">
                                      {e.name} {e.leave?.leave_type ? `(${e.leave.leave_type})` : ""}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div>
                              <div className="text-xs font-semibold text-rose-400 mb-1">
                                Absent ({totalAbsent})
                              </div>
                              {absentList.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {absentList.map(e => (
                                    <span key={e.user_id} className="bg-rose-950/50 text-rose-300 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-rose-900/30 font-bold">
                                      {e.name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-slate-500 text-[10px] italic">None</div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                } else {
                  const targetUserId = selectedEmployeeId === "my" ? null : selectedEmployeeId;
                  const attRecord = attendance.find(a => parseDbDateKey(a.date) === dateKey);
                  const leaveMap = getMonthLeaveClassification(targetUserId);
                  const leaveInfo = leaveMap[dateKey];
                  const dayLeave = leaveInfo?.dayLeave;
                  const isPaidLeave = leaveInfo?.isPaid;
                  const isPendingLeave = leaveInfo?.isPending;
                  const isAutoPaidLeave = leaveInfo?.isAutoPaidLeave;
                  const isBeforeJoining = activeJoiningDateKey && dateKey < activeJoiningDateKey;

                  const isPresentDay = !!attRecord;
                  const isHolidayDay = !isBeforeJoining && !!holiday;
                  const isLeaveDay = !isBeforeJoining && !attRecord && !holiday && isPaidLeave && !isWeekend;
                  const isPendingLeaveDay = !isBeforeJoining && !attRecord && !holiday && isPendingLeave && !isWeekend;
                  const isAbsentDay = !isBeforeJoining && !attRecord && !holiday && (!leaveInfo || (!isPaidLeave && !isPendingLeave)) && (isPast || isToday) && !isWeekend;

                  const matchesFilter =
                    statusFilter === "all" ||
                    (statusFilter === "present" && isPresentDay) ||
                    (statusFilter === "absent" && isAbsentDay) ||
                    (statusFilter === "leave" && (isLeaveDay || isPendingLeaveDay)) ||
                    (statusFilter === "holiday" && isHolidayDay);
                  const isDimmed = d.isCurrentMonth && (isBeforeJoining || !matchesFilter);

                  return (
                    <div
                      key={index}
                      onClick={() => d.isCurrentMonth && setSelectedDay(isSelected ? null : index)}
                      className={cn(
                        getCardClasses(d, index, isToday, isWeekend && d.isCurrentMonth ? "bg-slate-50/30" : ""),
                        isSelected && "ring-2 ring-inset ring-blue-500 z-10",
                        openInfo?.dateKey === dateKey && "z-20",
                        isDimmed && "opacity-25 grayscale pointer-events-none"
                      )}
                    >
                      {/* Cell Top: Day number & (i) info button */}
                      <div className="flex items-center justify-between">
                        {isToday ? (
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs ring-2 ring-blue-100">
                            {d.day}
                          </div>
                        ) : (
                          <span className={cn(
                            "text-xs sm:text-sm font-semibold",
                            d.isCurrentMonth ? "text-slate-700" : "text-slate-300"
                          )}>
                            {d.day}
                          </span>
                        )}

                        {d.isCurrentMonth && (attRecord || dayLeave || isAutoPaidLeave || isBeforeJoining) && (() => {
                          const coords = attRecord ? parseCoordinates(attRecord.location) : null;
                          const isDropdownOpen = openInfo?.dateKey === dateKey;

                          return (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                if (isDropdownOpen) {
                                  setOpenInfo(null);
                                } else {
                                  setOpenInfo({
                                    dateKey,
                                    rect,
                                    type: "single",
                                    attRecord,
                                    dayLeave,
                                    isPaidLeave,
                                    isPendingLeave,
                                    isAutoPaidLeave,
                                    isBeforeJoining,
                                    coords,
                                  });
                                }
                              }}
                              className={cn(
                                "w-4 h-4 rounded-full flex items-center justify-center transition-all cursor-pointer",
                                isDropdownOpen
                                  ? "bg-primary-600 text-white shadow-xs scale-110"
                                  : "bg-slate-100 hover:bg-primary-50 text-slate-400 hover:text-primary-600"
                              )}
                              title={
                                attRecord
                                  ? "View punch details"
                                  : isBeforeJoining
                                    ? "Not employed yet"
                                    : isPendingLeave
                                      ? "View requested leave details"
                                      : isAutoPaidLeave
                                        ? "View paid allowance details"
                                        : "View leave details"
                              }
                            >
                              <Info className="w-2.5 h-2.5" />
                            </button>
                          );
                        })()}
                      </div>

                      {/* Event Task Bar - Not Joined yet */}
                      {d.isCurrentMonth && isBeforeJoining && !isWeekend && (
                        <div className="mt-auto w-full rounded-lg bg-slate-100/70 text-slate-400 border border-slate-200/50 px-2 py-0.5 flex items-center justify-center text-[10px] font-medium select-none shadow-2xs">
                          <span className="truncate">Not Joined</span>
                        </div>
                      )}

                      {/* Event Task Bar - Present */}
                      {d.isCurrentMonth && attRecord && (
                        <div className={cn(
                          "mt-auto w-full rounded-lg px-2 py-1 flex items-center text-xs font-semibold transition-all hover:brightness-98 shadow-2xs",
                          attRecord.status === "Half-day"
                            ? "bg-amber-50 text-amber-900 border border-amber-200/80"
                            : "bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                        )}>
                          <div className="flex items-center gap-1.5 truncate">
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full shrink-0",
                              attRecord.status === "Half-day" ? "bg-amber-500" : "bg-emerald-500"
                            )} />
                            <span className="truncate">
                              {attRecord.status === "Half-day" ? "Half-day (Off)" : "Present"}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Event Task Bar - Holiday */}
                      {d.isCurrentMonth && holiday && !isBeforeJoining && (
                        <div className="mt-auto w-full rounded-lg bg-blue-50 text-blue-800 border border-blue-200/70 px-2 py-1 flex items-center text-xs font-semibold transition-all hover:brightness-98 shadow-2xs">
                          <div className="flex items-center gap-1.5 truncate">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            <span className="truncate">{holiday.name}</span>
                          </div>
                        </div>
                      )}

                      {/* Event Task Bar - Paid Leave (Approved or 1 Day Monthly Allowance) */}
                      {d.isCurrentMonth && isLeaveDay && (
                        <div className="mt-auto w-full rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80 px-2 py-1 flex items-center text-xs font-semibold transition-all hover:brightness-98 shadow-2xs">
                          <div className="flex items-center gap-1.5 truncate">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span className="truncate">Paid Leave</span>
                          </div>
                        </div>
                      )}

                      {/* Event Task Bar - Leave Requested (Pending HR Approval) */}
                      {d.isCurrentMonth && isPendingLeaveDay && (
                        <div className="mt-auto w-full rounded-lg bg-amber-50/90 text-amber-900 border border-amber-300/80 px-2 py-1 flex items-center text-xs font-semibold transition-all hover:brightness-98 shadow-2xs">
                          <div className="flex items-center gap-1.5 truncate">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                            <span className="truncate">Leave Requested</span>
                          </div>
                        </div>
                      )}

                      {/* Event Task Bar - Absent (Remaining unpaid leaves or general absence) */}
                      {d.isCurrentMonth && isAbsentDay && (
                        <div className="mt-auto w-full rounded-lg bg-rose-50 text-rose-800 border border-rose-200/70 px-2 py-1 flex items-center text-xs font-semibold transition-all hover:brightness-98 shadow-2xs">
                          <div className="flex items-center gap-1.5 truncate">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span className="truncate">
                              {dayLeave ? "Absent (Unpaid)" : "Absent"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
              })}
            </div>
          </div>

          {/* Mobile / touch detail panel: replaces hover tooltip below sm breakpoint effectively (md) */}
          {selectedDetail && (
            <div className="md:hidden mt-3 bg-slate-900/95 text-white p-4 rounded-2xl shadow-lg text-xs border border-slate-800 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-200">
                  {new Date(
                    calendarDays[selectedDay].year,
                    calendarDays[selectedDay].month,
                    calendarDays[selectedDay].day
                  ).toLocaleDateString("en-IN", { weekday: 'long', day: 'numeric', month: 'short' })}
                </span>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-slate-400 text-[11px] font-semibold uppercase tracking-wide"
                >
                  Close
                </button>
              </div>

              {selectedDetail.type === "all" ? (
                <div className="space-y-3">
                  {selectedDetail.holiday && (
                    <div className="text-blue-400 font-bold">{selectedDetail.holiday.name}</div>
                  )}
                  <div>
                    <div className="text-xs font-semibold text-emerald-400 mb-1">
                      Present ({selectedDetail.presentList.length})
                    </div>
                    {selectedDetail.presentList.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedDetail.presentList.map(e => (
                          <span key={e.user_id} className="bg-emerald-950/50 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-emerald-900/30">
                            {e.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-500 text-[10px] italic">None</div>
                    )}
                  </div>

                  {selectedDetail.leaveList && selectedDetail.leaveList.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-amber-400 mb-1">
                        On Leave ({selectedDetail.leaveList.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {selectedDetail.leaveList.map(e => (
                          <span key={e.user_id} className="bg-amber-950/50 text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-amber-900/30">
                            {e.name} {e.leave?.leave_type ? `(${e.leave.leave_type})` : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-semibold text-rose-400 mb-1">
                      Absent ({selectedDetail.absentList.length})
                    </div>
                    {selectedDetail.absentList.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedDetail.absentList.map(e => (
                          <span key={e.user_id} className="bg-rose-950/50 text-rose-300 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-rose-900/30">
                            {e.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-500 text-[10px] italic">None</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className={`font-bold ${selectedDetail.status === "Present"
                      ? "text-emerald-400"
                      : selectedDetail.status === "Holiday"
                        ? "text-blue-400"
                        : selectedDetail.status === "Absent"
                          ? "text-rose-400"
                          : "text-amber-400"
                      }`}>{selectedDetail.status}</span>
                  </div>

                  {selectedDetail.isAutoPaidLeave && !selectedDetail.attRecord && (
                    <div className="space-y-1 pt-1.5 border-t border-slate-800 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Policy:</span>
                        <span className="font-semibold text-amber-300">Paid Leave (1-Day Allowance)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Allocation:</span>
                        <span className="font-semibold text-emerald-300">Auto-Applied</span>
                      </div>
                      <p className="text-slate-400 text-[10px] pt-0.5">
                        1-day monthly paid leave allowance auto-allocated for your first missed day.
                      </p>
                    </div>
                  )}

                  {selectedDetail.dayLeave && (
                    <div className="space-y-1 pt-1.5 border-t border-slate-800 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Policy:</span>
                        <span className={cn(
                          "font-semibold",
                          selectedDetail.isPendingLeave
                            ? "text-amber-300"
                            : selectedDetail.isPaidLeave
                              ? "text-emerald-300"
                              : "text-rose-300"
                        )}>
                          {selectedDetail.isPendingLeave
                            ? "1-Day Allowance (Pending)"
                            : selectedDetail.isPaidLeave
                              ? "Paid Leave (1-Day Allowance)"
                              : "Unpaid (Marked as Absent)"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Leave Type:</span>
                        <span className="font-semibold text-slate-200">{selectedDetail.dayLeave.leave_type || "Available"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Request Status:</span>
                        <span className={`font-semibold ${selectedDetail.dayLeave.status === "Approved" ? "text-emerald-300" : "text-amber-300"}`}>
                          {selectedDetail.dayLeave.status === "Pending" ? "Pending Approval" : selectedDetail.dayLeave.status}
                        </span>
                      </div>
                      {selectedDetail.dayLeave.reason && (
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-slate-400 whitespace-nowrap">Reason:</span>
                          <span className="text-slate-300 text-right max-w-[150px] truncate" title={selectedDetail.dayLeave.reason}>
                            {selectedDetail.dayLeave.reason}
                          </span>
                        </div>
                      )}
                      {selectedDetail.isPendingLeave && (
                        <p className="text-slate-400 text-[10px] pt-0.5">
                          You have added a leave on this day. Once approved by HR, it will be marked as Paid Leave.
                        </p>
                      )}
                    </div>
                  )}

                  {selectedDetail.attRecord && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Punch In:</span>
                        <span className="font-bold text-slate-200">
                          {selectedDetail.attRecord.check_in ? new Date(selectedDetail.attRecord.check_in).toLocaleTimeString("en-IN", {
                            hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata",
                          }) : "--:--"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Punch Out:</span>
                        <span className="font-bold text-slate-200">
                          {selectedDetail.attRecord.check_out ? new Date(selectedDetail.attRecord.check_out).toLocaleTimeString("en-IN", {
                            hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata",
                          }) : "Not logged"}
                        </span>
                      </div>
                      {(() => {
                        const coords = parseCoordinates(selectedDetail.attRecord.location);
                        return (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Latitude:</span>
                              <span className="font-mono text-slate-200 text-[10px]">{coords.lat}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Longitude:</span>
                              <span className="font-mono text-slate-200 text-[10px]">{coords.lng}</span>
                            </div>
                          </>
                        );
                      })()}
                      {selectedDetail.attRecord.status === "Half-day" && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Day Type:</span>
                          <span className="font-bold text-amber-300">Half-Day (Off-Day)</span>
                        </div>
                      )}
                      {selectedDetail.attRecord.early_leave_reason && (
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-slate-400 whitespace-nowrap">Left Early:</span>
                          <span className="font-semibold text-rose-300 text-right max-w-[140px] truncate">
                            {selectedDetail.attRecord.early_leave_reason}
                          </span>
                        </div>
                      )}
                      {selectedDetail.attRecord.early_leave_notes && (
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-slate-400 whitespace-nowrap">Note:</span>
                          <span className="font-medium text-slate-300 text-right italic max-w-[140px] break-words text-[10px]">
                            {selectedDetail.attRecord.early_leave_notes}
                          </span>
                        </div>
                      )}
                    </>
                  )}


                  {selectedDetail.holiday && (
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-slate-400 whitespace-nowrap">Holiday:</span>
                      <span className="font-bold text-blue-300 text-right max-w-[140px]">{selectedDetail.holiday.name}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </PremiumCard>

      {/* Previous Dropdown Popup - rendered via Portal so it is never clipped and always clear */}
      {openInfo && openInfo.type === "all" && (
        <InfoDropdownPopover anchorRect={openInfo.rect} onClose={() => setOpenInfo(null)}>
          <div className="w-56 max-h-72 overflow-y-auto bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl border border-slate-800 text-[11px] space-y-2 cursor-default custom-scrollbar">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Attendance</span>
              {openInfo.holiday && <span className="text-blue-400">Holiday</span>}
            </div>
            {[
              ["Present", openInfo.presentList || [], "text-emerald-400"],
              ["On Leave", openInfo.leaveList || [], "text-amber-400"],
              ["Absent", openInfo.absentList || [], "text-rose-400"],
            ].map(([label, users, color]) => (
              <div key={label}>
                <div className={`font-semibold ${color}`}>
                  {label} ({users.length})
                </div>
                <div className="text-slate-300 text-[10px] mt-0.5 max-h-28 overflow-y-auto custom-scrollbar">
                  {users.length > 0 ? (
                    users.map((u) => u.name + (u.leave?.leave_type ? ` (${u.leave.leave_type})` : "")).join(", ")
                  ) : (
                    "None"
                  )}
                </div>
              </div>
            ))}
          </div>
        </InfoDropdownPopover>
      )}

      {openInfo && openInfo.type === "single" && (
        <InfoDropdownPopover anchorRect={openInfo.rect} onClose={() => setOpenInfo(null)}>
          <div className="w-52 bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl border border-slate-800 text-[11px] space-y-2 cursor-default">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>{openInfo.attRecord ? "Punch Info" : openInfo.isBeforeJoining ? "Pre-Joining" : "Leave Info"}</span>
              <span className={cn(
                "font-semibold",
                openInfo.attRecord
                  ? "text-emerald-400"
                  : openInfo.isBeforeJoining
                    ? "text-slate-400"
                    : openInfo.isPendingLeave
                      ? "text-amber-400"
                      : openInfo.isPaidLeave
                        ? "text-emerald-400"
                        : "text-rose-400"
              )}>
                {openInfo.attRecord
                  ? (openInfo.attRecord.status || "Present")
                  : openInfo.isBeforeJoining
                    ? "Not Employed"
                    : openInfo.isPendingLeave
                      ? "Requested"
                      : openInfo.isPaidLeave
                        ? "Paid Leave"
                        : "Absent (Unpaid)"}
              </span>
            </div>

            {openInfo.isBeforeJoining && !openInfo.attRecord && (
              <div className="text-slate-300 text-[10px] space-y-1">
                <p>This date is prior to your official joining date.</p>
                {activeJoiningDateKey && (
                  <p className="text-slate-400">Joining Date: <strong className="text-slate-200">{activeJoiningDateKey}</strong></p>
                )}
              </div>
            )}

            {openInfo.isAutoPaidLeave && !openInfo.attRecord && (
              <div className="space-y-1.5 text-[10px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Policy:</span>
                  <span className="font-semibold text-amber-300">Paid Leave (1-Day Allowance)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Allocation:</span>
                  <span className="font-semibold text-emerald-300">Auto-Applied</span>
                </div>
                <div className="pt-1 border-t border-slate-800/60">
                  <p className="text-slate-300 italic">
                    1-day monthly paid leave allowance applied automatically to your 1st missed day this month.
                  </p>
                </div>
              </div>
            )}

            {openInfo.dayLeave && !openInfo.attRecord && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Policy:</span>
                  <span className={cn(
                    "font-semibold",
                    openInfo.isPendingLeave
                      ? "text-amber-300"
                      : openInfo.isPaidLeave
                        ? "text-emerald-300"
                        : "text-rose-300"
                  )}>
                    {openInfo.isPendingLeave
                      ? "1-Day Allowance (Pending)"
                      : openInfo.isPaidLeave
                        ? "Paid (1-Day Allowance)"
                        : "Unpaid (Marked Absent)"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Leave Type:</span>
                  <span className="font-semibold text-slate-200">{openInfo.dayLeave.leave_type || "Available"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Status:</span>
                  <span className={cn(
                    "font-semibold",
                    openInfo.dayLeave.status === "Approved" ? "text-emerald-300" : "text-amber-300"
                  )}>
                    {openInfo.dayLeave.status === "Pending" ? "Pending Approval" : openInfo.dayLeave.status}
                  </span>
                </div>
                {openInfo.dayLeave.days_count && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Days:</span>
                    <span className="text-slate-200">{openInfo.dayLeave.days_count} day(s)</span>
                  </div>
                )}
                {openInfo.dayLeave.reason && (
                  <div className="pt-1 border-t border-slate-800/60">
                    <span className="text-slate-400 block mb-0.5">Your Reason:</span>
                    <p className="text-slate-300 text-[10px] italic break-words">{openInfo.dayLeave.reason}</p>
                  </div>
                )}
                {openInfo.isPendingLeave && (
                  <div className="pt-1 border-t border-slate-800/60">
                    <p className="text-slate-400 text-[10px]">
                      You have added a leave on this day. Once approved by HR, it will be marked as Paid Leave.
                    </p>
                  </div>
                )}
              </div>
            )}

            {openInfo.attRecord && (
              <div className="space-y-1.5">
                {openInfo.coords && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Latitude:</span>
                      <span className="font-mono text-slate-200 text-[10px] truncate max-w-[100px]" title={openInfo.coords.lat}>
                        {openInfo.coords.lat}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Longitude:</span>
                      <span className="font-mono text-slate-200 text-[10px] truncate max-w-[100px]" title={openInfo.coords.lng}>
                        {openInfo.coords.lng}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center pt-1 border-t border-slate-800/60">
                  <span className="text-slate-400">Punch In:</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-bold",
                    openInfo.attRecord.check_in ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"
                  )}>
                    {openInfo.attRecord.check_in ? (openInfo.attRecord.check_in.includes("T") ? new Date(openInfo.attRecord.check_in).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }) : "Yes") : "No"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Punch Out:</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-bold",
                    openInfo.attRecord.check_out ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                  )}>
                    {openInfo.attRecord.check_out ? (openInfo.attRecord.check_out.includes("T") ? new Date(openInfo.attRecord.check_out).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }) : "Yes") : (openInfo.attRecord.check_in ? "In Progress" : "No")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </InfoDropdownPopover>
      )}
    </div>
  );
};

export default AttendancePage;