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
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import StatCard from "../../../components/ui/StatCard";
import { cn } from "../../../utils/cn";
import Skeleton from "../../../components/ui/Skeleton";

// Normal dimension KPI Card component
const KpiCard = ({ title, value, icon: Icon, subtext, trend }) => {
  return (
    <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg">
            <Icon className="w-3.5 h-3.5 text-slate-500" />
          </div>
        )}
      </div>

      <div className="mt-1.5">
        <span className="text-2xl font-bold text-slate-800 tracking-tight">
          {value}
        </span>
      </div>

      {(trend || subtext) && (
        <div className="mt-1.5 flex items-center gap-1.5">
          {trend && (
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded",
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
  );
};

// Premium Double-Bezel Card Container component
const PremiumCard = ({ title, subtitle, icon: Icon, children, className, headerRight }) => {
  return (
    <div className={cn("bg-slate-200/30 p-1.5 rounded-2xl border border-slate-200/10 flex flex-col min-h-0", className)}>
      <div className="bg-white rounded-[calc(1rem-0.125rem)] border border-slate-200/20 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_4px_16px_-8px_rgba(0,0,0,0.02)] overflow-hidden h-full flex flex-col min-h-0 flex-1">
        {(title || subtitle) && (
          <div className="px-4 py-2.5 sm:py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              {Icon && (
                <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
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
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};

const LeavesPage = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectionType, setSelectionType] = useState("single");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLeaves = async () => {
    try {
      // First try fetching the user's personal leaves
      const res = await axios.get("/hr/leaves/my");
      const myLeaves = res.data.data || [];
      if (myLeaves.length > 0) {
        setLeaves(myLeaves);
      } else {
        // If no personal leaves, check if company leaves are available (e.g. for Admin role)
        try {
          const fallbackRes = await axios.get("/hr/leaves");
          setLeaves(fallbackRes.data.data && fallbackRes.data.data.length > 0 ? fallbackRes.data.data : myLeaves);
        } catch {
          setLeaves(myLeaves);
        }
      }
    } catch (err) {
      console.warn("Could not fetch personal leaves, falling back to /hr/leaves:", err);
      try {
        const fallbackRes = await axios.get("/hr/leaves");
        setLeaves(fallbackRes.data.data || []);
      } catch (fallbackErr) {
        console.error("Failed to load leaves:", fallbackErr);
        toast.error("Failed to load leaves");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const start_date = formData.get("start_date");
    let end_date = formData.get("end_date");
    const reason = formData.get("reason");
    const leave_type = formData.get("leave_type");

    if (selectionType === "single") {
      end_date = start_date;
    }

    if (new Date(end_date) < new Date(start_date)) {
      toast.error("End date cannot be earlier than start date");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post("/hr/leaves", {
        start_date,
        end_date,
        reason,
        is_half_day: isHalfDay,
        leave_type,
      });
      toast.success("Leave requested successfully");
      fetchLeaves();
      e.target.reset();
      setStartDate("");
      setIsHalfDay(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to apply");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-w-0 space-y-6 sm:space-y-8 pb-10">
        <div className="space-y-2 w-full max-w-md">
          <Skeleton className="h-8 w-48 sm:w-64" />
          <Skeleton className="h-4 w-full max-w-sm sm:w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full min-w-0">
          <div className="lg:col-span-1 space-y-5 w-full min-w-0">
            <Skeleton className="h-32 rounded-2xl w-full" />
            <Skeleton className="h-[400px] rounded-2xl w-full" />
          </div>
          <Skeleton className="lg:col-span-2 h-[550px] rounded-2xl w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 flex-1 flex flex-col lg:h-full lg:overflow-hidden gap-3 pb-1">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-950 tracking-tight">
            Time Off & Holidays
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            Manage your annual leave balance and request time off.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full min-w-0 flex-1 min-h-0">
        {/* Left Column: Apply for Leave at TOP + Monthly Allowance Note underneath */}
        <div className="lg:col-span-1 flex flex-col gap-3 w-full min-w-0 overflow-y-auto lg:overflow-visible">
          {/* Apply for Leave Card */}
          <PremiumCard title="Apply for Leave" subtitle="Submit request for authorization" icon={Calendar}>
            <div className="p-3.5 sm:p-4">
              <form onSubmit={handleApply} className="space-y-3">
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
                        ? "bg-white text-blue-600 shadow-sm border border-slate-200/20 font-semibold"
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
                        ? "bg-white text-blue-600 shadow-sm border border-slate-200/20 font-semibold"
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
                  className="rounded-xl border-slate-200 text-xs py-1.5 h-8.5"
                />

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Leave Type
                  </label>
                  <select
                    name="leave_type"
                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                    className="rounded-xl border-slate-200 text-xs py-1.5 h-8.5"
                  />
                ) : null}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Reason
                  </label>
                  <textarea
                    name="reason"
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                    placeholder="Briefly explain your absence..."
                    required
                  />
                </div>

                <div className="bg-slate-200/30 p-0.5 rounded-xl border border-slate-200/20 active:scale-[0.98] transition-all duration-300">
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 text-xs font-semibold shadow-sm flex items-center justify-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Submit Request
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </PremiumCard>

          {/* Monthly Allowance Note */}
          <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-3 shadow-xs space-y-1.5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800 tracking-tight">Monthly Allowance Note</span>
              </div>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-md font-mono border border-blue-200">
                1 Day / Month
              </span>
            </div>
            <div className="text-xs text-slate-600 leading-relaxed font-normal">
              <span className="font-semibold text-slate-700">Paid Leave / Sick Leave:</span> 1 day allowance allocated each month (resets on the 1st).
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-normal italic border-t border-blue-100/90 pt-1.5">
              * Allowances do not carry forward. Any additional requests within the same month will be marked as Unpaid Leave.
            </p>
          </div>
        </div>

        {/* Right Column: Leave History */}
        <div className="lg:col-span-2 w-full min-w-0 flex flex-col h-full min-h-0">
          <PremiumCard
            title="Leave History"
            subtitle="Historical timeline of requests & approvals"
            icon={History}
            className="h-full flex-1 flex flex-col min-h-0"
            headerRight={
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-mono border border-slate-200/60">
                {leaves.length} {leaves.length === 1 ? 'Record' : 'Records'}
              </span>
            }
          >
            <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 custom-scrollbar">
              {leaves.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Clock className="w-9 h-9 mx-auto mb-3 opacity-20" />
                  <p className="font-medium text-sm text-slate-600">No leave history found.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 bg-slate-50/95 backdrop-blur-xs z-10 shadow-xs border-b border-slate-200">
                    <TableRow>
                      <TableHead className="py-1.5 px-3 sm:py-2 sm:px-3 text-[11px] font-semibold text-slate-500">Dates</TableHead>
                      <TableHead className="py-1.5 px-3 sm:py-2 sm:px-3 text-[11px] font-semibold text-slate-500">Type</TableHead>
                      <TableHead className="py-1.5 px-3 sm:py-2 sm:px-3 text-[11px] font-semibold text-slate-500">Reason</TableHead>
                      <TableHead className="py-1.5 px-3 sm:py-2 sm:px-3 text-[11px] font-semibold text-slate-500 text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <tbody>
                    {leaves.map((leave) => (
                      <TableRow key={leave.id} className="hover:bg-slate-50/60 transition-colors">
                        <TableCell className="py-1.5 px-3 sm:py-2 sm:px-3">
                          <div className="text-xs font-medium text-slate-800">
                            {new Date(leave.start_date).toLocaleDateString(
                              "en-IN",
                              { timeZone: "Asia/Kolkata" },
                            )}
                            {leave.start_date !== leave.end_date &&
                              ` - ${new Date(leave.end_date).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}`}
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                            {leave.days_count}{" "}
                            {parseFloat(leave.days_count) === 1
                              ? "day"
                              : "days"}
                          </div>
                        </TableCell>
                        <TableCell className="py-1.5 px-3 sm:py-2 sm:px-3">
                          <div className="flex items-center gap-1">
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
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                            >
                              {leave.leave_type || "Available"}
                            </Badge>
                            {leave.is_half_day && (
                              <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1 py-0.5 rounded-md">
                                HALF DAY
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-1.5 px-3 sm:py-2 sm:px-3">
                          <p className="text-[11px] text-slate-600 max-w-xs truncate" title={leave.reason}>
                            {leave.reason}
                          </p>
                        </TableCell>
                        <TableCell className="py-1.5 px-3 sm:py-2 sm:px-3 text-right">
                          <Badge
                            variant={
                              leave.status === "Approved"
                                ? "success"
                                : leave.status === "Rejected"
                                  ? "danger"
                                  : "primary"
                            }
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
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
