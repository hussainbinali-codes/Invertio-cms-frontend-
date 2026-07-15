import React, { useEffect, useState } from "react";
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
      <div className="bg-white p-5 rounded-[calc(1.75rem-0.375rem)] border border-slate-200/25 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_8px_-4px_rgba(0,0,0,0.03)] h-full flex flex-col justify-between">
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
            <span className="text-3xl font-bold text-slate-800 tracking-tight font-mono">
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
    <div className={cn("bg-slate-200/30 p-1.5 rounded-[2rem] border border-slate-200/10", className)}>
      <div className="bg-white rounded-[calc(2rem-0.375rem)] border border-slate-200/20 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_4px_16px_-8px_rgba(0,0,0,0.02)] overflow-hidden h-full flex flex-col">
        {(title || subtitle) && (
          <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <Icon className="w-4 h-4 text-slate-500" />
                </div>
              )}
              <div>
                {title && <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>}
                {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
              </div>
            </div>
            {headerRight}
          </div>
        )}
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </div>
    </div>
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

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );

  const formatDateKey = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const parseDbDateKey = (dbDateStr) => {
    if (!dbDateStr) return "";
    return dbDateStr.split('T')[0];
  };

  const getKolkataToday = () => {
    const d = new Date();
    const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
    const formatter = new Intl.DateTimeFormat('en-CA', options);
    return formatter.format(d);
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

  const getWorkingDaysCount = () => {
    let count = 0;
    const totalDays = getDaysInMonth(selectedMonth, selectedYear);
    for (let day = 1; day <= totalDays; day++) {
      const dateKey = formatDateKey(new Date(selectedYear, selectedMonth, day));
      const dayOfWeek = new Date(selectedYear, selectedMonth, day).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidays.some(h => parseDbDateKey(h.date) === dateKey);
      if (!isWeekend && !isHoliday) {
        count++;
      }
    }
    return count;
  };

  const calculateCalendarStats = () => {
    const totalDays = getDaysInMonth(selectedMonth, selectedYear);
    const todayStr = getKolkataToday();

    if (selectedEmployeeId === "all") {
      let totalPossibleDays = 0;
      let totalPresentDays = 0;
      let totalLeaveDays = 0;

      employees.forEach(emp => {
        for (let day = 1; day <= totalDays; day++) {
          const dateKey = formatDateKey(new Date(selectedYear, selectedMonth, day));
          if (dateKey > todayStr) continue;

          const dayOfWeek = new Date(selectedYear, selectedMonth, day).getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const isHoliday = holidays.some(h => parseDbDateKey(h.date) === dateKey);

          if (!isWeekend && !isHoliday) {
            totalPossibleDays++;
            
            const isPresent = attendance.some(a => a.user_id === emp.user_id && parseDbDateKey(a.date) === dateKey);
            if (isPresent) {
              totalPresentDays++;
            } else {
              const isOnLeave = allLeaves.some(l => {
                if (l.status !== 'Approved') return false;
                if (l.user_id !== emp.user_id) return false;
                const start = parseDbDateKey(l.start_date);
                const end = parseDbDateKey(l.end_date);
                return dateKey >= start && dateKey <= end;
              });
              if (isOnLeave) {
                totalLeaveDays++;
              }
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
        card1Title: "Total Employees",
        card1Value: employees.length,
        card1Subtext: "Active roster",
        card2Title: "Avg. Attendance Rate",
        card2Value: `${attendanceRate}%`,
        card2Subtext: "Past working days",
        card3Title: "Total Team Leaves",
        card3Value: totalLeaveDays,
        card3Subtext: "Approved leaves taken",
        card4Title: "Company Holidays",
        card4Value: holidaysCount,
        card4Subtext: "This month"
      };
    } else {
      let presentCount = 0;
      let leaveCount = 0;
      let absentCount = 0;
      const targetUserId = selectedEmployeeId === "my" ? null : selectedEmployeeId;

      const userAttendance = attendance;
      const userLeaves = selectedEmployeeId === "my" 
        ? allLeaves 
        : allLeaves.filter(l => l.user_id === targetUserId);

      for (let day = 1; day <= totalDays; day++) {
        const dateKey = formatDateKey(new Date(selectedYear, selectedMonth, day));
        const dayOfWeek = new Date(selectedYear, selectedMonth, day).getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHoliday = holidays.some(h => parseDbDateKey(h.date) === dateKey);

        const isPresent = userAttendance.some(a => parseDbDateKey(a.date) === dateKey);
        const isOnLeave = userLeaves.some(l => {
          if (l.status !== 'Approved') return false;
          const start = parseDbDateKey(l.start_date);
          const end = parseDbDateKey(l.end_date);
          return dateKey >= start && dateKey <= end;
        });

        if (isPresent) {
          presentCount++;
        } else if (isOnLeave) {
          if (!isWeekend && !isHoliday) {
            leaveCount++;
          }
        } else if (dateKey <= todayStr && !isWeekend && !isHoliday) {
          absentCount++;
        }
      }

      const checkInTimes = userAttendance
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

      return {
        card1Title: "Days Present",
        card1Value: presentCount,
        card1Subtext: "This month",
        card2Title: "Avg. Check-in",
        card2Value: avgStr,
        card2Subtext: "Based on logs",
        card3Title: "Approved Leaves",
        card3Value: leaveCount,
        card3Subtext: "Working days",
        card4Title: "Days Absent",
        card4Value: absentCount,
        card4Subtext: "Missed working days"
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

  const getTooltipPositionClasses = (index) => {
    const row = Math.floor(index / 7);
    const col = index % 7;

    let vClass = "bottom-[105%] mb-2";
    let hClass = "left-1/2 -translate-x-1/2";

    if (row === 0) {
      vClass = "top-[105%] mt-2";
    }

    if (col <= 1) {
      hClass = "left-0 translate-x-0";
    } else if (col >= 5) {
      hClass = "right-0 left-auto translate-x-0";
    }

    return `${vClass} ${hClass}`;
  };

  const getCardClasses = (d, index, isToday, customClass = "") => {
    const baseClasses = "relative group flex flex-col justify-between h-28 p-2.5 border rounded-2xl transition-all duration-300 hover:shadow-md hover:scale-[1.02] cursor-pointer hover:z-50";
    const activeClass = isToday ? "ring-2 ring-primary-500/80 bg-primary-50/10 border-transparent shadow-md hover:shadow-lg" : "";

    if (customClass) {
      return `${baseClasses} ${customClass} ${activeClass}`;
    }

    const defaultMonthClass = d.isCurrentMonth
      ? "bg-white border-slate-100 hover:border-slate-200/80 shadow-sm"
      : "border-slate-50/40 opacity-40 bg-slate-50/50 text-slate-400";

    return `${baseClasses} ${defaultMonthClass} ${activeClass}`;
  };

  const getCalendarDays = () => {
    const firstDayIndex = getFirstDayOfMonth(selectedMonth, selectedYear);
    const totalDays = getDaysInMonth(selectedMonth, selectedYear);

    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    const prevMonthDays = getDaysInMonth(prevMonth, prevYear);

    const days = [];

    // Muted days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        month: prevMonth,
        year: prevYear,
        isCurrentMonth: false,
      });
    }

    // Days of current month
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        day: i,
        month: selectedMonth,
        year: selectedYear,
        isCurrentMonth: true,
      });
    }

    // Muted days from next month
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

  if (loading) {
    return (
      <div className="space-y-8 pb-10">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-8 w-[400px] rounded-lg" />
        </div>
        <Skeleton className="h-[500px] rounded-2xl" />
      </div>
    );
  }
  const activeStats = calculateCalendarStats();

  return (
    <div className="space-y-4 pb-6 max-w-[1400px] mx-auto py-2">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-2">
            {getPageTitle()}
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-normal">
            {getPageSubtext()}
          </p>
        </div>

        {/* Toolbar controls in header */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex bg-white border border-slate-200/60 p-1 rounded-xl shadow-sm">
            <select
              className="bg-transparent border-none text-xs font-bold text-slate-700 px-3 py-2 outline-none cursor-pointer focus:ring-0"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
              {months.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <select
              className="bg-transparent border-none text-xs font-bold text-slate-700 px-3 py-2 outline-none cursor-pointer border-l border-slate-200 focus:ring-0"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {canViewAll && (
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10" />
              <select
                className="pl-9 pr-8 h-10 bg-white border border-slate-200/60 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer shadow-sm"
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
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 px-4 text-sm font-semibold shadow-sm flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Full-width Calendar with inline KPI strip */}
      <PremiumCard
        icon={CalendarClock}
        headerRight={
          <div className="flex flex-wrap items-center gap-0 divide-x divide-slate-100">
            {/* KPI Stat 1 */}
            <div className="flex flex-col items-center px-4 first:pl-0">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none whitespace-nowrap">
                {selectedEmployeeId === "all" ? "Employees" : "Present"}
              </span>
              <span className="text-lg font-bold text-slate-800 font-mono leading-tight mt-0.5">
                {activeStats.card1Value}
              </span>
            </div>
            {/* KPI Stat 2 */}
            <div className="flex flex-col items-center px-4">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none whitespace-nowrap">
                {selectedEmployeeId === "all" ? "Avg Rate" : "Avg In"}
              </span>
              <span className="text-lg font-bold text-slate-800 font-mono leading-tight mt-0.5">
                {activeStats.card2Value}
              </span>
            </div>
            {/* KPI Stat 3 */}
            <div className="flex flex-col items-center px-4">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none whitespace-nowrap">
                {selectedEmployeeId === "all" ? "Leaves" : "On Leave"}
              </span>
              <span className="text-lg font-bold text-slate-800 font-mono leading-tight mt-0.5">
                {activeStats.card3Value}
              </span>
            </div>
            {/* KPI Stat 4 */}
            <div className="flex flex-col items-center px-4">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none whitespace-nowrap">
                {selectedEmployeeId === "all" ? "Holidays" : "Absent"}
              </span>
              <span className="text-lg font-bold text-slate-800 font-mono leading-tight mt-0.5">
                {activeStats.card4Value}
              </span>
            </div>
            {/* Divider */}
            <div className="w-px h-8 bg-slate-100 mx-2" />
            {/* Legend pills */}
            <div className="flex items-center gap-3 pl-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> In</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-amber-500 rounded-full"></div> Leave</div>
              {selectedEmployeeId !== "all" && <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-400 rounded-full"></div> Holiday</div>}
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-rose-500 rounded-full"></div> Out</div>
            </div>
          </div>
        }
        title={`${months[selectedMonth]} ${selectedYear}`}
        subtitle={`${getPageSubtext()}`}
      >
        <div className="flex-1 p-4 md:p-6">
              {/* Weekday header row */}
              <div className="grid grid-cols-7 gap-2 mb-3 bg-slate-50/70 p-1.5 rounded-2xl border border-slate-100/50">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-slate-500 text-slate-400 tracking-widest py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-2">
                {getCalendarDays().map((d, index) => {
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

                    if (d.isCurrentMonth) {
                      employees.forEach(emp => {
                        const empAtt = attendance.find(a => a.user_id === emp.user_id && parseDbDateKey(a.date) === dateKey);
                        const empLeave = allLeaves.find(l => {
                          if (l.status !== 'Approved') return false;
                          if (l.user_id !== emp.user_id) return false;
                          const start = parseDbDateKey(l.start_date);
                          const end = parseDbDateKey(l.end_date);
                          return dateKey >= start && dateKey <= end;
                        });

                        if (empAtt) {
                          presentList.push(emp);
                        } else if (empLeave) {
                          leaveList.push({ ...emp, leave: empLeave });
                        } else if (isPast && !isWeekend && !holiday) {
                          absentList.push(emp);
                        }
                      });
                    }

                    const totalPresent = presentList.length;
                    const totalLeave = leaveList.length;
                    const totalAbsent = absentList.length;

                    return (
                      <div
                        key={index}
                        className={getCardClasses(d, index, isToday)}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`text-sm font-semibold ${isToday ? "text-primary-600 font-bold" : "text-slate-700"}`}>
                            {d.day}
                          </span>
                          {holiday && (
                            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-blue-200 py-0 px-1 scale-90">
                              Holiday
                            </Badge>
                          )}
                        </div>

                        {d.isCurrentMonth && (
                          <div className="space-y-0.5 mt-auto">
                            {totalPresent > 0 && (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 tracking-tight">
                                <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                                {totalPresent} Present
                              </div>
                            )}
                            {totalLeave > 0 && (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 tracking-tight">
                                <span className="w-1 h-1 bg-amber-500 rounded-full"></span>
                                {totalLeave} On Leave
                              </div>
                            )}
                            {totalAbsent > 0 && (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 tracking-tight">
                                <span className="w-1 h-1 bg-rose-500 rounded-full"></span>
                                {totalAbsent} Absent
                              </div>
                            )}
                          </div>
                        )}

                        {d.isCurrentMonth && (
                          <div className={`absolute ${getTooltipPositionClasses(index)} w-72 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-xs border border-slate-800 pointer-events-none`}>
                            <div className="font-bold border-b border-slate-800 pb-2 mb-2 flex justify-between items-center text-slate-300">
                              <span>{new Date(d.year, d.month, d.day).toLocaleDateString("en-IN", { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                              {holiday && <span className="text-blue-400 font-bold">{holiday.name}</span>}
                            </div>
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                              <div>
                                <div className="text-xs font-semibold text-slate-500 text-emerald-400 mb-1">
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

                              <div>
                                <div className="text-xs font-semibold text-slate-500 text-amber-400 mb-1">
                                  On Leave ({totalLeave})
                                </div>
                                {leaveList.length > 0 ? (
                                  <div className="space-y-1">
                                    {leaveList.map(e => (
                                      <div key={e.user_id} className="flex justify-between items-center bg-amber-950/30 text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-amber-900/30 font-bold">
                                        <span>{e.name}</span>
                                        <span className="text-slate-400 italic font-normal text-[8px]">({e.leave.leave_type || "Leave"})</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-slate-500 text-[10px] italic">None</div>
                                )}
                              </div>

                              <div>
                                <div className="text-xs font-semibold text-slate-500 text-rose-400 mb-1">
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
                    const attRecord = attendance.find(a => parseDbDateKey(a.date) === dateKey);
                    const targetUserId = selectedEmployeeId === "my" ? null : selectedEmployeeId;
                    const leaveRecord = allLeaves.find(l => {
                      if (l.status !== 'Approved') return false;
                      if (targetUserId && l.user_id !== targetUserId) return false;
                      const start = parseDbDateKey(l.start_date);
                      const end = parseDbDateKey(l.end_date);
                      return dateKey >= start && dateKey <= end;
                    });

                    let status = "None";
                    let bgClass = "bg-white border-slate-100 hover:border-slate-300";
                    let textClass = "text-slate-800";

                    if (d.isCurrentMonth) {
                      if (attRecord) {
                        status = "Present";
                        bgClass = "bg-white border-l-4 border-l-emerald-500 border-y-slate-100 border-r-slate-100 hover:border-slate-200/80 shadow-sm";
                      } else if (leaveRecord) {
                        status = "Leave";
                        bgClass = "bg-white border-l-4 border-l-amber-500 border-y-slate-100 border-r-slate-100 hover:border-slate-200/80 shadow-sm";
                      } else if (holiday) {
                        status = "Holiday";
                        bgClass = "bg-white border-l-4 border-l-blue-500 border-y-slate-100 border-r-slate-100 hover:border-slate-200/80 shadow-sm";
                      } else if (isWeekend) {
                        status = "Weekend";
                        bgClass = "bg-slate-50/30 border-slate-200/60 text-slate-500";
                      } else if (isPast) {
                        status = "Absent";
                        bgClass = "bg-white border-l-4 border-l-rose-500 border-y-slate-100 border-r-slate-100 hover:border-slate-200/80 shadow-sm";
                      }
                    } else {
                      bgClass = "border-slate-50 opacity-40 bg-slate-50/50";
                      textClass = "text-slate-400";
                    }

                    return (
                      <div
                        key={index}
                        className={getCardClasses(d, index, isToday, bgClass)}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`text-sm font-semibold ${isToday ? "text-primary-600 font-bold" : textClass}`}>
                            {d.day}
                          </span>
                          {status !== "None" && status !== "Weekend" && d.isCurrentMonth && (
                            <span className={`text-xs font-semibold text-slate-500 ${
                              status === "Present" ? "text-emerald-600" :
                              status === "Leave" ? "text-amber-600" :
                              status === "Holiday" ? "text-blue-600" : "text-rose-600"
                            }`}>
                              {status}
                            </span>
                          )}
                          {status === "Weekend" && d.isCurrentMonth && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WE</span>
                          )}
                        </div>

                        {d.isCurrentMonth && attRecord && (
                          <div className="mt-auto">
                            <div className="text-[10px] font-bold text-emerald-600 tracking-tight flex items-center gap-1">
                              <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                              {new Date(attRecord.check_in).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                                timeZone: "Asia/Kolkata",
                              })}
                              {attRecord.check_out && ` - ${new Date(attRecord.check_out).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                                timeZone: "Asia/Kolkata",
                              })}`}
                            </div>
                          </div>
                        )}

                        {d.isCurrentMonth && leaveRecord && (
                          <div className="mt-auto text-[10px] font-bold text-amber-600 tracking-tight flex items-center gap-1 truncate">
                            <span className="w-1 h-1 bg-amber-500 rounded-full"></span>
                            {leaveRecord.leave_type || "On Leave"}
                          </div>
                        )}

                        {d.isCurrentMonth && holiday && (
                          <div className="mt-auto text-[10px] font-bold text-blue-600 tracking-tight flex items-center gap-1 truncate">
                            <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                            {holiday.name}
                          </div>
                        )}

                        {d.isCurrentMonth && (
                          <div className={`absolute ${getTooltipPositionClasses(index)} w-64 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-xs border border-slate-800 pointer-events-none space-y-2`}>
                            <div className="font-bold border-b border-slate-800 pb-2 flex justify-between items-center text-slate-300">
                              <span>{new Date(d.year, d.month, d.day).toLocaleDateString("en-IN", { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Status:</span>
                                <span className={`font-bold ${
                                  status === "Present" ? "text-emerald-400" :
                                  status === "Leave" ? "text-amber-400" :
                                  status === "Holiday" ? "text-blue-400" :
                                  status === "Absent" ? "text-rose-400" : "text-slate-400"
                                }`}>{status}</span>
                              </div>

                              {attRecord && (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Punch In:</span>
                                    <span className="font-bold text-slate-200">
                                      {attRecord.check_in ? new Date(attRecord.check_in).toLocaleTimeString("en-IN", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                        timeZone: "Asia/Kolkata",
                                      }) : "--:--"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Punch Out:</span>
                                    <span className="font-bold text-slate-200">
                                      {attRecord.check_out ? new Date(attRecord.check_out).toLocaleTimeString("en-IN", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                        timeZone: "Asia/Kolkata",
                                      }) : "Not logged"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-start gap-2">
                                    <span className="text-slate-400 whitespace-nowrap">Location:</span>
                                    <span className="font-semibold text-slate-300 text-right truncate max-w-[140px] uppercase text-[10px]">
                                      {attRecord.location || "Unknown"}
                                    </span>
                                  </div>
                                </>
                              )}

                              {leaveRecord && (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Leave Type:</span>
                                    <span className="font-bold text-amber-300">{leaveRecord.leave_type || "Available"}</span>
                                  </div>
                                  <div className="flex justify-between items-start gap-2">
                                    <span className="text-slate-400 whitespace-nowrap">Reason:</span>
                                    <span className="font-semibold text-slate-300 text-right italic break-words max-w-[140px]">
                                      {leaveRecord.reason || "No reason given"}
                                    </span>
                                  </div>
                                </>
                              )}

                              {holiday && (
                                <div className="flex justify-between items-start gap-2">
                                  <span className="text-slate-400 whitespace-nowrap">Holiday:</span>
                                  <span className="font-bold text-blue-300 text-right max-w-[140px]">{holiday.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          </PremiumCard>
    </div>
  );
};

export default AttendancePage;

