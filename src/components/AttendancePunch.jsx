import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Clock, LogIn, LogOut, Loader2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';
import Button from './ui/Button';

const AttendancePunch = () => {
    const [status, setStatus] = useState(null); // 'in', 'out', or null
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [location, setLocation] = useState(null);

    useEffect(() => {
        fetchStatus();
        preFetchLocation();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const preFetchLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation(`${pos.coords.latitude}, ${pos.coords.longitude}`),
                (err) => console.debug("Pre-fetch location failed", err),
                { enableHighAccuracy: true, timeout: 5000 }
            );
        }
    };

    const fetchStatus = async () => {
        try {
            const res = await axios.get('/hr/attendance/today');
            const data = res.data.data;
            if (data) {
                if (data.check_out) {
                    setStatus('out');
                } else if (data.check_in) {
                    setStatus('in');
                }
            }
        } catch (err) {
            console.error('Failed to fetch attendance status', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePunch = async () => {
        setActionLoading(true);
        const format = (d) => {
            const z = (n) => ('0' + n).slice(-2);
            const istDate = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
            return `${istDate.getFullYear()}-${z(istDate.getMonth() + 1)}-${z(istDate.getDate())}T${z(istDate.getHours())}:${z(istDate.getMinutes())}:${z(istDate.getSeconds())}+05:30`;
        };
        const now = format(new Date());
        const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

        try {
            if (!status) {
                let locationString = location || 'Location unavailable';
                if (!location) {
                    try {
                        const pos = await new Promise((resolve, reject) => {
                            navigator.geolocation.getCurrentPosition(resolve, reject, {
                                enableHighAccuracy: true,
                                timeout: 3000
                            });
                        });
                        locationString = `${pos.coords.latitude}, ${pos.coords.longitude}`;
                    } catch (geoErr) {
                        console.warn('Geolocation failed at punch time', geoErr);
                    }
                }

                await axios.post('/hr/attendance/check-in', {
                    date,
                    check_in: now,
                    status: 'Present',
                    location: locationString
                });
                setStatus('in');
                toast.success('Punched in successfully');
            } else if (status === 'in') {
                await axios.post('/hr/attendance/check-out', {
                    date,
                    check_out: now
                });
                setStatus('out');
                toast.success('Punched out successfully');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to process punch');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return (
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
                    {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {currentTime.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' })}
                </p>
            </div>

            <div className="space-y-2">
                <Button
                    onClick={handlePunch}
                    disabled={actionLoading || status === 'out'}
                    className={cn(
                        "w-full h-9 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all shadow-sm active:scale-[0.98]",
                        status === 'in'
                            ? "bg-rose-500 hover:bg-rose-600 shadow-rose-100"
                            : status === 'out'
                                ? "bg-slate-200 text-slate-500 shadow-none cursor-not-allowed"
                                : "bg-primary-600 hover:bg-primary-700 shadow-primary-100"
                    )}
                >
                    {actionLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : status === 'in' ? (
                        <><LogOut className="w-3.5 h-3.5 mr-1.5" /> Punch Out</>
                    ) : status === 'out' ? (
                        <><Clock className="w-3.5 h-3.5 mr-1.5" /> Day Ended</>
                    ) : (
                        <><LogIn className="w-3.5 h-3.5 mr-1.5" /> Punch In</>
                    )}
                </Button>

                <div className="flex items-center justify-center gap-1 text-[8px] font-bold text-slate-400 uppercase tracking-tight">
                    <MapPin className={cn("w-2.5 h-2.5", location ? "text-emerald-500" : "text-slate-300")} />
                    <span>{location ? 'Geo-Targeted' : 'location will be used'}</span>
                </div>
            </div>
        </div>
    );
};

export default AttendancePunch;
