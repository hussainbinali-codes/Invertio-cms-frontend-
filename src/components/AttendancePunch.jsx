import React, { useState, useEffect, useCallback } from "react";
import axios from "../api/axios";
import { Clock, LogIn, LogOut, Loader2, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "../utils/cn";
import Button from "./ui/Button";
import { LocationAccessDialog, WorkModeDialog } from "./AttendancePunchDialogs";

const LOCATION_REQUIRED_MESSAGE =
    "Location access is required to punch in. Please enable your device location and try again.";

const formatAttendanceTimestamp = (d) => {
    const z = (n) => ("0" + n).slice(-2);
    const istDate = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    return `${istDate.getFullYear()}-${z(istDate.getMonth() + 1)}-${z(istDate.getDate())}T${z(istDate.getHours())}:${z(istDate.getMinutes())}:${z(istDate.getSeconds())}+05:30`;
};

const formatAttendanceDate = (d) => {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
};

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

const AttendancePunch = ({
    setShowPunchOutModal,
    actionLoading: propActionLoading,
    isDetectingLocation: propIsDetectingLocation,
    status: propStatus,
    setStatus: propSetStatus,
    handlePunchInRequest,
    location: propLocation,
    setCheckInTime,
} = {}) => {
    const [internalStatus, setInternalStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [internalActionLoading, setInternalActionLoading] = useState(false);
    const [internalIsDetectingLocation, setInternalIsDetectingLocation] = useState(false);
    const [internalLocation, setInternalLocation] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Location Access Dialog State
    const [locationDialog, setLocationDialog] = useState({
        isOpen: false,
        detailMessage: "",
    });

    // Work Mode Dialog State
    const [isWorkModeDialogOpen, setIsWorkModeDialogOpen] = useState(false);
    const [selectedWorkMode, setSelectedWorkMode] = useState("work_from_office");
    const [workModeError, setWorkModeError] = useState("");

    const status = propStatus !== undefined ? propStatus : internalStatus;
    const setStatus = propSetStatus || setInternalStatus;
    const actionLoading = propActionLoading !== undefined ? propActionLoading : internalActionLoading;
    const isDetectingLocation = propIsDetectingLocation !== undefined ? propIsDetectingLocation : internalIsDetectingLocation;
    const location = propLocation !== undefined ? propLocation : internalLocation;
    const setLocation = setInternalLocation;

    const fetchStatus = useCallback(async () => {
        try {
            const res = await axios.get("/hr/attendance/today");
            const data = res.data?.data;
            if (data) {
                if (data.check_in && setCheckInTime) {
                    setCheckInTime(data.check_in);
                }
                if (data.check_out) {
                    setStatus("out");
                } else if (data.check_in) {
                    setStatus("in");
                } else {
                    setStatus(null);
                }
            }
        } catch (err) {
            console.error("Failed to fetch attendance status", err);
        } finally {
            setLoading(false);
        }
    }, [setStatus, setCheckInTime]);

    const requestCurrentLocation = async () => {
        if (!("geolocation" in navigator)) {
            setLocationDialog({
                isOpen: true,
                detailMessage: "This device or browser does not support location access for attendance.",
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

        setInternalIsDetectingLocation(true);

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                });
            });

            const locationString = `${position.coords.latitude},${position.coords.longitude}`;
            setLocation(locationString);
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
            setInternalIsDetectingLocation(false);
        }
    };

    const handleRetryLocationAccess = async () => {
        const loc = await requestCurrentLocation();
        if (!loc) {
            return;
        }

        setLocationDialog({ isOpen: false, detailMessage: "" });
        setSelectedWorkMode("work_from_office");
        setWorkModeError("");
        setIsWorkModeDialogOpen(true);
    };

    const handleConfirmPunchIn = async () => {
        if (!selectedWorkMode) {
            setWorkModeError("Please select where you are working today.");
            return;
        }

        let locationString = location;
        if (!locationString) {
            locationString = await requestCurrentLocation();
            if (!locationString) {
                return;
            }
        }

        setInternalActionLoading(true);
        setWorkModeError("");

        const now = formatAttendanceTimestamp(new Date());
        const date = formatAttendanceDate(new Date());

        try {
            const response = await axios.post("/hr/attendance/check-in", {
                date,
                check_in: now,
                status: "Present",
                location: locationString,
                mode: selectedWorkMode,
            });

            if (response.data?.success === false) {
                const msg = response.data?.message || "Failed to process punch in";
                setWorkModeError(msg);
                toast.error(msg);
                return;
            }

            setStatus("in");
            if (setCheckInTime) {
                setCheckInTime(now);
            }
            setIsWorkModeDialogOpen(false);
            toast.success("Punched in successfully");
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to process punch in";
            setWorkModeError(msg);
            toast.error(msg);
        } finally {
            setInternalActionLoading(false);
        }
    };

    const handleDirectPunchOut = async () => {
        setInternalActionLoading(true);
        const now = formatAttendanceTimestamp(new Date());
        const date = formatAttendanceDate(new Date());

        try {
            await axios.post("/hr/attendance/check-out", {
                date,
                check_out: now,
            });
            setStatus("out");
            toast.success("Punched out successfully");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to process punch out");
        } finally {
            setInternalActionLoading(false);
        }
    };

    const handlePunchButtonClick = async () => {
        if (status === "in") {
            if (typeof setShowPunchOutModal === "function") {
                setShowPunchOutModal(true);
            } else {
                handleDirectPunchOut();
            }
            return;
        }

        if (typeof handlePunchInRequest === "function") {
            handlePunchInRequest();
            return;
        }

        // Prompt / Request device location first before Punch In
        const loc = await requestCurrentLocation();
        if (!loc) {
            // LocationAccessDialog opened automatically by requestCurrentLocation
            return;
        }

        // Location verified successfully, now ask for work mode
        setSelectedWorkMode("work_from_office");
        setWorkModeError("");
        setIsWorkModeDialogOpen(true);
    };

    useEffect(() => {
        fetchStatus();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [fetchStatus]);

    if (loading)
        return (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
            </div>
        );

    return (
        <div className="bg-slate-200/40 p-1 rounded-2xl border border-slate-200/20 mx-0.5">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/25 shadow-sm text-center">
                <div className="mb-2">
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        <Clock className="w-2.5 h-2.5 text-blue-600" />
                        Live Time
                    </div>
                    <p className="text-xl font-bold text-slate-800 tracking-tight font-mono leading-none mt-1">
                        {currentTime.toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                            timeZone: "Asia/Kolkata",
                        })}
                    </p>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                        {currentTime.toLocaleDateString("en-IN", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            timeZone: "Asia/Kolkata",
                        })}
                    </p>
                </div>

                <div className="space-y-2">
                    <div className="bg-slate-200/30 p-0.5 rounded-xl border border-slate-200/20 active:scale-[0.98] transition-all duration-300">
                        <Button
                            onClick={handlePunchButtonClick}
                            disabled={actionLoading || isDetectingLocation || status === "out"}
                            className={cn(
                                "w-full h-9 text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5",
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
                                    Detecting Location...
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

                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-slate-400">
                        <MapPin
                            className={cn(
                                "w-2.5 h-2.5",
                                location ? "text-emerald-500" : "text-slate-300",
                            )}
                        />
                        <span>
                            {isDetectingLocation
                                ? "detecting location"
                                : location
                                    ? "verified"
                                    : "gps required"}
                        </span>
                    </div>
                </div>
            </div>

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
                onClose={() => !actionLoading && setIsWorkModeDialogOpen(false)}
                selectedMode={selectedWorkMode}
                onSelect={(mode) => {
                    setSelectedWorkMode(mode);
                    setWorkModeError("");
                }}
                onConfirm={handleConfirmPunchIn}
                isLoading={actionLoading}
                errorMessage={workModeError}
            />
        </div>
    );
};

export default AttendancePunch;