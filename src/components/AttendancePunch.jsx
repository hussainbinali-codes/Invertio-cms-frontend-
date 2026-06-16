import React, { useState, useEffect, useCallback } from "react";
import axios from "../api/axios";
import { Clock, LogIn, LogOut, Loader2, MapPin } from "lucide-react";
import { cn } from "../utils/cn";
import Button from "./ui/Button";

const AttendancePunch = ({
  setShowPunchOutModal,
  actionLoading,
  isDetectingLocation,
  status,
  setStatus,
  handlePunchInRequest,
  location,
}) => {
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchStatus = useCallback(async () => {
    try {
      const res = await axios.get("/hr/attendance/today");
      const data = res.data.data;
      if (data) {
        if (data.check_out) {
          setStatus("out");
        } else if (data.check_in) {
          setStatus("in");
        }
      }
    } catch (err) {
      console.error("Failed to fetch attendance status", err);
    } finally {
      setLoading(false);
    }
  }, [setStatus]);

  const handlePunchButtonClick = () => {
    if (status === "in") {
      setShowPunchOutModal(true);
      return;
    }

    handlePunchInRequest();
  };

  useEffect(() => {
    const initTimer = window.setTimeout(() => {
      fetchStatus();
    }, 0);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      window.clearTimeout(initTimer);
      clearInterval(timer);
    };
  }, [fetchStatus]);

  if (loading)
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
      </div>
    );

  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-slate-200/50 p-3 shadow-sm mx-1">
      <div className="text-center mb-3">
        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">
          <Clock className="w-2.5 h-2.5" />
          Live Time
        </div>
        <p className="text-xl font-bold text-slate-800 tracking-tight font-mono leading-none">
          {currentTime.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata",
          })}
        </p>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          {currentTime.toLocaleDateString("en-IN", {
            weekday: "short",
            month: "short",
            day: "numeric",
            timeZone: "Asia/Kolkata",
          })}
        </p>
      </div>

      <div className="space-y-2">
        <Button
          onClick={handlePunchButtonClick}
          disabled={actionLoading || isDetectingLocation || status === "out"}
          className={cn(
            "w-full h-9 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all shadow-sm active:scale-[0.98]",
            status === "in"
              ? "bg-rose-500 hover:bg-rose-600 shadow-rose-100"
              : status === "out"
                ? "bg-slate-200 text-slate-500 shadow-none cursor-not-allowed"
                : "bg-primary-600 hover:bg-primary-700 shadow-primary-100",
          )}
        >
          {isDetectingLocation ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              Detecting Location
            </>
          ) : actionLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : status === "in" ? (
            <>
              <LogOut className="w-3.5 h-3.5 mr-1.5" /> Punch Out
            </>
          ) : status === "out" ? (
            <>
              <Clock className="w-3.5 h-3.5 mr-1.5" /> Day Ended
            </>
          ) : (
            <>
              <LogIn className="w-3.5 h-3.5 mr-1.5" /> Punch In
            </>
          )}
        </Button>

        <div className="flex items-center justify-center gap-1 text-[8px] font-bold text-slate-400 uppercase tracking-tight">
          <MapPin
            className={cn(
              "w-2.5 h-2.5",
              location ? "text-emerald-500" : "text-slate-300",
            )}
          />
          <span>
            {isDetectingLocation
              ? "detecting current location"
              : location
                ? "location verified"
                : "location will be required"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AttendancePunch;
