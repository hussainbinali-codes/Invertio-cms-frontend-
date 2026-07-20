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
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import Input from "../../../components/ui/Input";
import {
  Calendar,
  Clock,
  Send,
  Loader2,
  AlertCircle,
  History,
} from "lucide-react";
import toast from "react-hot-toast";
import StatCard from "../../../components/ui/StatCard";
import { cn } from "../../../utils/cn";
import Skeleton from "../../../components/ui/Skeleton";

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

const LeavesPage = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectionType, setSelectionType] = useState("range"); // 'single' or 'range'
  const [isHalfDay, setIsHalfDay] = useState(false);

  const [startDate, setStartDate] = useState("");

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  const fetchMyLeaves = async () => {
    try {
      // First try to get the current user profile from backend
      let userData = null;
      try {
        const userRes = await axios.get("/auth/me");
        userData = userRes.data.data;
      } catch (authErr) {
        console.warn(
          "Could not fetch profile from /auth/me, falling back to localStorage",
        );
        userData = JSON.parse(localStorage.getItem("user") || "{}");
      }

      if (!userData || !userData.id) {
        throw new Error("User identity not found.");
      }

      // Fetch personal leaves
      const leaveRes = await axios.get("/hr/leaves/my");
      const leavesList = leaveRes.data.data || [];
      setLeaves(leavesList);
    } catch (err) {
      console.error("Fetch error", err);
      toast.error("Failed to load leave data");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData);
    const type = payload.leave_type || "Available";

    // Calculate requested days
    let requestedDays = 0;
    if (isHalfDay) {
      requestedDays = 0.5;
    } else {
      const start = new Date(payload.start_date);
      const end = new Date(payload.end_date || payload.start_date);
      requestedDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    }

    setIsSubmitting(true);

    // Logic for single day / half day
    if (selectionType === "single") {
      payload.end_date = payload.start_date;
    }
    payload.is_half_day = isHalfDay;

    try {
      await axios.post("/hr/leaves", payload);
      toast.success("Leave request submitted");
      e.target.reset();
      setStartDate("");
      setSelectionType("range");
      setIsHalfDay(false);
      fetchMyLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 pb-10">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-[400px] rounded-2xl" />
          </div>
          <Skeleton className="lg:col-span-2 h-[550px] rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 max-w-[1400px] mx-auto py-2">
      {/* Header section with Asymmetric Layout */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight mt-1">
            Time Off & Holidays
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-normal">
            Manage your annual leave balance and request time off.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-4">
            <PremiumCard 
              title="Monthly Allowance" 
              subtitle="Reset every 1st of the month"
              icon={Calendar}
            >
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-xs font-medium text-slate-600">
                      Paid Leave / Sick Leave
                    </span>
                    <span className="text-sm font-normal text-blue-600 bg-blue-50/50 px-3 py-1 rounded-lg border border-blue-100/30 font-mono">
                      1 Day / Month
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-4 leading-relaxed font-normal italic">
                  * Allowances do not carry forward. Any additional requests within the same month will be marked as Unpaid Leave.
                </p>
              </div>
            </PremiumCard>
          </div>

          <PremiumCard title="Apply for Leave" subtitle="Submit request for authorization" icon={Calendar}>
            <div className="p-6">
              <form onSubmit={handleApply} className="space-y-4">
                {/* Selection toggle capsule */}
                <div className="bg-slate-100 border border-slate-200/50 rounded-xl p-1 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectionType("single");
                      setIsHalfDay(false);
                    }}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 active:scale-[0.98]",
                      selectionType === "single"
                        ? "bg-white text-blue-600 shadow-sm border border-slate-200/20"
                        : "text-slate-500 hover:text-slate-700",
                    )}
                  >
                    Single Day
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectionType("range");
                      setIsHalfDay(false);
                    }}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 active:scale-[0.98]",
                      selectionType === "range"
                        ? "bg-white text-blue-600 shadow-sm border border-slate-200/20"
                        : "text-slate-500 hover:text-slate-700",
                    )}
                  >
                    Date Range
                  </button>
                </div>

                <Input
                  label={selectionType === "single" ? "Select Date" : "Start Date"}
                  name="start_date"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-xl border-slate-200 text-sm font-normal"
                />

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Leave Type
                  </label>
                  <select
                    name="leave_type"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  >
                    <option value="Available">Paid Leave</option>
                    <option value="Unpaid">Unpaid Leave</option>
                  </select>
                </div>

                {selectionType === "range" ? (
                  <Input
                    label="End Date"
                    name="end_date"
                    type="date"
                    required
                    min={startDate}
                    className="rounded-xl border-slate-200 text-sm font-normal"
                  />
                ) : null}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Reason
                  </label>
                  <textarea
                    name="reason"
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                    placeholder="Briefly explain your absence..."
                    required
                  />
                </div>
                
                <div className="bg-slate-200/30 p-0.5 rounded-xl border border-slate-200/20 active:scale-[0.98] transition-all duration-300">
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold shadow-sm flex items-center justify-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Submit Request
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </PremiumCard>
        </div>

        <div className="lg:col-span-2">
          <PremiumCard 
            title="Leave History" 
            subtitle="Historical timeline of requests & approvals" 
            icon={History}
          >
            <div className="flex-1">
              {leaves.length === 0 ? (
                <div className="p-20 text-center text-slate-400">
                  <Clock className="w-10 h-10 mx-auto mb-4 opacity-20" />
                  <p className="font-medium text-sm">No leave history found.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-4">Dates</TableHead>
                      <TableHead className="py-4">Type</TableHead>
                      <TableHead className="py-4">Reason</TableHead>
                      <TableHead className="py-4">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <tbody>
                    {leaves.map((leave) => (
                      <TableRow key={leave.id}>
                        <TableCell className="py-5">
                          <div className="text-sm font-normal text-slate-700">
                            {new Date(leave.start_date).toLocaleDateString(
                              "en-IN",
                              { timeZone: "Asia/Kolkata" },
                            )}
                            {leave.start_date !== leave.end_date &&
                              ` - ${new Date(leave.end_date).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}`}
                          </div>
                          <div className="text-xs text-slate-500 font-medium mt-0.5">
                            {leave.days_count}{" "}
                            {parseFloat(leave.days_count) === 1
                              ? "day"
                              : "days"}
                          </div>
                        </TableCell>
                        <TableCell className="py-5">
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant={
                                leave.leave_type === "Available"
                                  ? "outline"
                                  : leave.leave_type === "Sick Leave"
                                    ? "success"
                                    : leave.leave_type === "Unpaid"
                                      ? "danger"
                                      : "secondary"
                              }
                              className="text-xs font-semibold text-slate-500 w-fit"
                            >
                              {leave.leave_type || "Available"}
                            </Badge>
                            {leave.is_half_day && (
                              <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-widest ml-1">
                                HALF DAY
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-5">
                          <p className="text-xs text-slate-600 max-w-xs truncate">
                            {leave.reason}
                          </p>
                        </TableCell>
                        <TableCell className="py-5">
                          <Badge
                            variant={
                              leave.status === "Approved"
                                ? "success"
                                : leave.status === "Rejected"
                                  ? "danger"
                                  : "primary"
                            }
                            className="text-xs font-semibold text-slate-500"
                          >
                            {leave.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          </PremiumCard>
        </div>
      </div>
    </div>
  );
};

export default LeavesPage;
