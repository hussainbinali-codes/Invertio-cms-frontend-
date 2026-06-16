import React, { useEffect, useState } from "react";
import axios from "../../../api/axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/Card";
import Table, {
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "../../../components/ui/Table";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import {
  CalendarClock,
  Clock,
  Calendar,
  MapPin,
  CheckCircle2,
  XCircle,
  TrendingUp,
  User as UserIcon,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import StatCard from "../../../components/ui/StatCard";
import Skeleton from "../../../components/ui/Skeleton";
import toast from "react-hot-toast";
import { hasPermission } from "../../../utils/permissionUtils";

const AttendancePage = () => {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchingLogs, setFetchingLogs] = useState(false);

  // Monthly Filtering States
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [stats, setStats] = useState({
    presentDays: 0,
    avgCheckIn: "--:--",
    onTimeRate: "0%",
  });

  const canViewAll = hasPermission("attendance", "view_all");

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i,
  );

  useEffect(() => {
    const init = async () => {
      if (canViewAll) {
        await fetchEmployees();
      }
      await fetchAttendance();
      setLoading(false);
    };
    init();
  }, []);

  // Refetch when month/year changes
  useEffect(() => {
    if (!loading) {
      fetchAttendance(selectedEmployee?.user_id);
    }
  }, [selectedMonth, selectedYear]);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get("/hr/attendance/users");
      setEmployees(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch employees", err);
    }
  };

  const fetchAttendance = async (userId = null) => {
    setFetchingLogs(true);
    try {
      // Include month and year in query
      const url = userId
        ? `/hr/attendance/my?userId=${userId}&month=${selectedMonth + 1}&year=${selectedYear}`
        : `/hr/attendance/my?month=${selectedMonth + 1}&year=${selectedYear}`;

      const res = await axios.get(url);
      const data = res.data.data || [];
      setAttendance(data);
      calculateStats(data);
    } catch (err) {
      console.error("Failed to fetch attendance", err);
      toast.error("Failed to load attendance history");
    } finally {
      setFetchingLogs(false);
    }
  };

  const handleEmployeeChange = (userId) => {
    const emp = employees.find((e) => e.user_id === userId);
    setSelectedEmployee(emp || null);
    fetchAttendance(userId);
  };

  const calculateStats = (data) => {
    if (!data.length) {
      setStats({ presentDays: 0, avgCheckIn: "--:--", onTimeRate: "0%" });
      return;
    }

    const present = data.filter((a) => a.status === "Present").length;

    // Calculate Avg Check-in
    const checkInTimes = data
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
      ? Math.round(
          checkInTimes.reduce((a, b) => a + b, 0) / checkInTimes.length,
        )
      : 0;

    const hours = Math.floor(avgMinutes / 60);
    const mins = avgMinutes % 60;
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const avgStr = `${displayHours}:${mins < 10 ? "0" : ""}${mins} ${period}`;

    // Calculate On-Time Rate (9:00 AM threshold)
    const totalPresent = data.filter((a) => a.status === "Present").length;
    const onTimeCount = data
      .filter((a) => a.check_in)
      .filter((a) => {
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
        const totalMinutes = hours * 60 + minutes;
        return totalMinutes <= 9 * 60 + 15; // 9:15 AM
      }).length;

    const onTimeRateValue =
      totalPresent > 0 ? Math.round((onTimeCount / totalPresent) * 100) : 0;

    setStats({
      presentDays: present,
      avgCheckIn: avgStr,
      onTimeRate: `${onTimeRateValue}%`,
    });
  };

  const handleExport = () => {
    if (attendance.length === 0) {
      toast.error("No data available to export for this period");
      return;
    }

    const headers = [
      "Date",
      "Day",
      "Status",
      "Check In",
      "Check Out",
      "Location",
    ];
    const csvRows = [headers.join(",")];

    attendance.forEach((entry) => {
      const dateObj = new Date(entry.date);
      const date = dateObj.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
      });
      const day = dateObj.toLocaleDateString("en-IN", {
        weekday: "long",
        timeZone: "Asia/Kolkata",
      });
      const checkIn = entry.check_in
        ? new Date(entry.check_in).toLocaleTimeString("en-IN", {
            hour12: false,
            timeZone: "Asia/Kolkata",
          })
        : "N/A";
      const checkOut = entry.check_out
        ? new Date(entry.check_out).toLocaleTimeString("en-IN", {
            hour12: false,
            timeZone: "Asia/Kolkata",
          })
        : "N/A";

      const row = [
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

    const fileName = `Attendance_${selectedEmployee ? selectedEmployee.name.replace(/\s+/g, "_") : "My"}_${months[selectedMonth]}_${selectedYear}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Excel sheet generated successfully");
  };

  if (loading) {
    return (
      <div className="space-y-8 pb-10">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-[500px] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 text-slate-900">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {selectedEmployee
              ? `${selectedEmployee.name}'s Attendance`
              : "Attendance Logs"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {selectedEmployee
              ? `Reviewing records for ${selectedEmployee.email}`
              : "Review your historical punch-in records and site presence."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <select
              className="bg-transparent border-none text-xs font-bold text-slate-600 px-3 py-2 outline-none cursor-pointer"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
              {months.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
            <select
              className="bg-transparent border-none text-xs font-bold text-slate-600 px-3 py-2 outline-none cursor-pointer border-l border-slate-200"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {canViewAll && (
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10" />
              <select
                className="pl-9 pr-8 h-10 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 transition-all appearance-none cursor-pointer"
                onChange={(e) => handleEmployeeChange(e.target.value)}
                value={selectedEmployee?.user_id || ""}
              >
                <option value="">My Own Logs</option>
                {employees.map((emp) => (
                  <option key={emp.user_id} value={emp.user_id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="primary"
            size="sm"
            className="h-10 rounded-xl px-4 shadow-sm"
            onClick={handleExport}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StatCard
          title="Days Present"
          value={stats.presentDays}
          icon={CheckCircle2}
          subtext={`${months[selectedMonth]} ${selectedYear}`}
        />
        <StatCard
          title="Avg. Check-in"
          value={stats.avgCheckIn}
          icon={Clock}
          subtext="Monthly punctuality"
        />
        {/* <StatCard
                    title="On-Time Rate"
                    value={stats.onTimeRate}
                    icon={TrendingUp}
                    subtext="Policy compliance"
                /> */}
      </div>

      <Card
        className={
          fetchingLogs
            ? "opacity-60 grayscale-[0.5] transition-all duration-300"
            : "transition-all duration-300"
        }
      >
        <CardHeader className="py-6 border-b border-slate-50 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary-500" />
            Presence History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="py-4">Date</TableHead>
                <TableHead className="py-4">Check In</TableHead>
                <TableHead className="py-4">Check Out</TableHead>
                <TableHead className="py-4">Location</TableHead>
                <TableHead className="py-4">Status</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {attendance.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="py-5">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-700">
                        {new Date(entry.date).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          timeZone: "Asia/Kolkata",
                        })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs font-black text-slate-900">
                        {entry.check_in
                          ? new Date(entry.check_in).toLocaleTimeString(
                              "en-IN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                                timeZone: "Asia/Kolkata",
                              },
                            )
                          : "--:--"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">
                        {entry.check_out
                          ? new Date(entry.check_out).toLocaleTimeString(
                              "en-IN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                                timeZone: "Asia/Kolkata",
                              },
                            )
                          : "Not logged"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-tight">
                        {entry.location || "Unknown Site"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <Badge
                      variant={
                        entry.status === "Present" ? "success" : "danger"
                      }
                      className="text-[10px] font-bold uppercase tracking-wider"
                    >
                      {entry.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {attendance.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <XCircle className="w-10 h-10 text-slate-100 mx-auto mb-4" />
                    <p className="text-sm font-medium text-slate-400 italic">
                      No attendance records found for this period.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendancePage;
