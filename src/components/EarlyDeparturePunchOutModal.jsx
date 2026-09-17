import React, { useState, useEffect, useMemo } from "react";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  AlertCircle
} from "lucide-react";
import Button from "./ui/Button";
import { cn } from "../utils/cn";
import { useLockBodyScroll } from "../hooks/useLockBodyScroll";

const EarlyDeparturePunchOutModal = ({
  isOpen,
  onClose,
  checkInTime,
  onConfirm,
  isLoading = false,
}) => {
  useLockBodyScroll(isOpen);

  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState("");
  const [now, setNow] = useState(new Date());

  // Keep live time updated while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Reset inputs when opened
  useEffect(() => {
    if (isOpen) {
      setNotes("");
      setValidationError("");
    }
  }, [isOpen]);

  // Calculate work metrics
  const {
    checkInDate,
    checkInFormatted,
    targetEndTimeFormatted,
    elapsedHours,
    hoursWorkedFormatted,
    isCompleted8Hours,
    isOffDayWindow,
    isEarly,
    progressPct,
    remainingFormatted
  } = useMemo(() => {
    if (!checkInTime) {
      return {
        checkInDate: null,
        checkInFormatted: "Not recorded",
        targetEndTimeFormatted: "--:--",
        elapsedHours: 0,
        hoursWorkedFormatted: "0h 0m",
        isCompleted8Hours: false,
        isOffDayWindow: false,
        isEarly: true,
        progressPct: 0,
        remainingFormatted: "8h 00m"
      };
    }

    const cIn = new Date(checkInTime);
    const diffMs = Math.max(0, now.getTime() - cIn.getTime());
    const totalHours = diffMs / (1000 * 60 * 60);

    const h = Math.floor(totalHours);
    const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    // Target completion is check_in + 8 hours
    const target = new Date(cIn.getTime() + 8 * 3600 * 1000);

    const completed = totalHours >= 8.0;
    // Rule: "the only reason of the off day is if he works more than 4 and less than 5 hours"
    const offDay = totalHours > 4.0 && totalHours < 5.0;
    const early = totalHours < 8.0;

    const remainingMs = Math.max(0, target.getTime() - now.getTime());
    const remH = Math.floor(remainingMs / (1000 * 60 * 60));
    const remM = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    const pct = Math.min(100, Math.round((totalHours / 8) * 100));

    const timeOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    };

    return {
      checkInDate: cIn,
      checkInFormatted: cIn.toLocaleTimeString("en-IN", timeOptions),
      targetEndTimeFormatted: target.toLocaleTimeString("en-IN", timeOptions),
      elapsedHours: totalHours,
      hoursWorkedFormatted: `${h}h ${m}m`,
      isCompleted8Hours: completed,
      isOffDayWindow: offDay,
      isEarly: early,
      progressPct: pct,
      remainingFormatted: `${remH}h ${remM}m`
    };
  }, [checkInTime, now]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e?.preventDefault?.();

    if (isEarly && !notes.trim()) {
      setValidationError("Please enter your reason for leaving early before submitting.");
      return;
    }

    setValidationError("");
    onConfirm({
      early_leave_reason: isEarly ? notes.trim().slice(0, 80) : null,
      early_leave_notes: isEarly ? notes.trim() : null,
      isOffDay: isOffDayWindow,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col min-h-[480px] max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-xl border shrink-0",
              isCompleted8Hours 
                ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                : isOffDayWindow
                  ? "bg-amber-50 text-amber-600 border-amber-200"
                  : "bg-blue-50 text-blue-600 border-blue-200"
            )}>
              {isCompleted8Hours ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : isOffDayWindow ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-snug">
                {isCompleted8Hours 
                  ? "End Workday Attendance" 
                  : isOffDayWindow 
                    ? "Punch Out (Off-Day / Half-Day Window)" 
                    : "Confirm Punch Out (Early Departure)"}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Standard company duration: 8 hours flexible shift
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 active:scale-95 transition-all border border-slate-200/50"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
          {/* Workday Metrics Card */}
          <div className="bg-slate-50/90 rounded-xl p-4 border border-slate-200/80 space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-2xs">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                  Checked In
                </span>
                <span className="text-xs font-bold text-slate-800 font-mono mt-0.5 block">
                  {checkInFormatted}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-2xs">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                  Hours Worked
                </span>
                <span className={cn(
                  "text-xs font-extrabold font-mono mt-0.5 block",
                  isCompleted8Hours ? "text-emerald-700" : isOffDayWindow ? "text-amber-700" : "text-blue-700"
                )}>
                  {hoursWorkedFormatted}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-2xs">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                  8h Target End
                </span>
                <span className="text-xs font-bold text-slate-800 font-mono mt-0.5 block">
                  {targetEndTimeFormatted}
                </span>
              </div>
            </div>
          </div>

          {/* Banner 1: Off-Day / Half-Day Condition (> 4h and < 5h) */}
          {isOffDayWindow && (
            <div className="p-3.5 bg-amber-50 border border-amber-200/90 rounded-xl flex items-start gap-2.5 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-amber-900">
                  Off-Day (Half-Day) Attendance Notice
                </p>
                <p className="text-amber-800/90 leading-relaxed font-normal">
                  You have worked <strong>{hoursWorkedFormatted}</strong> (between 4 and 5 hours). Per company policy, this will be recorded as an <strong>Off-Day (Half-Day)</strong>. Please state why you are leaving early.
                </p>
              </div>
            </div>
          )}

          {/* Banner 2: Early Departure outside 4-5h (e.g. 7 hours or < 4 hours) */}
          {isEarly && !isOffDayWindow && (
            <div className="p-3.5 bg-blue-50/80 border border-blue-200/90 rounded-xl flex items-start gap-2.5 text-blue-950">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-blue-900">
                  Early Departure Notice ({remainingFormatted} remaining)
                </p>
                <p className="text-blue-800/90 leading-relaxed font-normal">
                  You have worked <strong>{hoursWorkedFormatted}</strong> today. Your attendance will remain recorded as <strong>Present ({hoursWorkedFormatted})</strong>. Please provide your reason for leaving early for future records.
                </p>
              </div>
            </div>
          )}

          {/* Banner 3: Completed 8 Hours */}
          {isCompleted8Hours && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200/90 rounded-xl flex items-start gap-2.5 text-emerald-950">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-emerald-900">Full 8-Hour Workday Completed!</p>
                <p className="text-emerald-800/90 leading-relaxed font-normal">
                  You have fulfilled your company workday hours. Great job! You can punch out now.
                </p>
              </div>
            </div>
          )}

          {/* Early Departure Reason Section (Required when leaving early) */}
          {isEarly && (
            <div className="space-y-2 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-2">
                  <span className="text-sm font-bold">Reason for Leaving Early <span className="text-rose-600">*</span></span>
                  <span className="text-xs font-medium text-slate-400">Required for attendance log</span>
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setValidationError("");
                  }}
                  placeholder="Explain why you are leaving before completing 8 hours (e.g. sick / emergency / completed all daily tasks)..."
                  className="w-full text-sm p-3.5 rounded-xl border border-slate-200/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400 text-slate-800 transition-all outline-none resize-none leading-relaxed"
                />
              </div>

              {validationError && (
                <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200/80 px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/60">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="h-10 px-5 text-xs font-semibold rounded-xl"
          >
            Stay Checked In
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || (isEarly && !notes.trim())}
            className={cn(
              "h-10 px-5 text-xs font-semibold text-white transition-all shadow-xs rounded-xl",
              isCompleted8Hours
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                : isOffDayWindow
                  ? "bg-amber-600 hover:bg-amber-700 shadow-amber-200"
                  : "bg-rose-600 hover:bg-rose-700 shadow-rose-200"
            )}
          >
            {isLoading 
              ? "Recording Punch Out..." 
              : isCompleted8Hours 
                ? "Punch Out (Complete Day)" 
                : isOffDayWindow
                  ? "Confirm Half-Day Punch Out"
                  : "Confirm Early Punch Out"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EarlyDeparturePunchOutModal;
