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
  setCheckInTime,
}) => {
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchStatus = useCallback(async () => {
    try {
      const res = await axios.get("/hr/attendance/today");
      const data = res.data.data;
      if (data) {
        if (data.check_in) {
          setCheckInTime?.(data.check_in);
        }
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
  }, [setStatus, setCheckInTime]);

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
    <div className="bg-slate-200/40 p-1 rounded-2xl border border-slate-200/20 mx-0.5">
      <div className="bg-white p-3 rounded-xl border border-slate-200/25 shadow-xs flex flex-col gap-2.5">
        {/* Top: Punch In / Out Button */}
        <div className="bg-slate-200/30 p-0.5 rounded-xl border border-slate-200/20 active:scale-[0.98] transition-all duration-300">
          <Button
            onClick={handlePunchButtonClick}
            disabled={actionLoading || isDetectingLocation || status === "out"}
            className={cn(
              "w-full h-9 text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5",
              status === "in"
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : status === "out"
                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
                  : "bg-blue-600 hover:bg-blue-700 text-white",
            )}
          >
            {isDetectingLocation ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Detecting...
              </>
            ) : actionLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : status === "in" ? (
              <>
                <LogOut className="w-3.5 h-3.5" /> Punch Out
              </>
            ) : status === "out" ? (
              <>
                <Clock className="w-3.5 h-3.5" /> Day Ended
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" /> Punch In
              </>
            )}
          </Button>
        </div>

        {/* Below Button: Time & Day on Left, Location badge on Right */}
        <div className="flex items-center justify-between px-0.5">
          <div>
            <p className="text-lg font-bold text-slate-800 tracking-tight font-mono leading-none">
              {currentTime.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
                timeZone: "Asia/Kolkata",
              })}
            </p>
            <p className="text-[11px] font-semibold text-slate-500 mt-1 leading-none">
              {currentTime.toLocaleDateString("en-IN", {
                weekday: "long",
                timeZone: "Asia/Kolkata",
              })}
            </p>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
            <MapPin
              className={cn(
                "w-2.5 h-2.5",
                location ? "text-emerald-500" : "text-blue-500",
              )}
            />
            <span className="capitalize text-[10px]">
              {isDetectingLocation
                ? "detecting..."
                : location
                  ? "office verified"
                  : "office"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePunch;
