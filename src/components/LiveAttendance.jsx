import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import Badge from './ui/Badge';
import { Users, Clock, Loader2 } from 'lucide-react';

const LiveAttendance = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAttendance = async () => {
        try {
            const res = await axios.get('/hr/attendance/all-today');
            setAttendance(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch live attendance', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
        const interval = setInterval(fetchAttendance, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, []);

    if (loading) return null;

    return (
        <Card className="text-slate-900 shadow-xl">
            <CardHeader className="py-5 border-b border-slate-50 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-bold">Who's In Today</CardTitle>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Live Presence Tracker</p>
                </div>
                <Badge variant="primary" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] h-6">
                    {attendance.filter(a => !a.check_out).length} Active
                </Badge>
            </CardHeader>
            <CardContent className="p-0">
                <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-50">
                    {attendance.map((entry) => (
                        <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                                    {entry.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800">{entry.name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">{entry.email}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-1.5 justify-end">
                                    <Clock className="w-3 h-3 text-slate-300" />
                                    <span className="text-[10px] font-bold text-slate-600">
                                        {new Date(entry.check_in.includes('+') || entry.check_in.includes('Z') ? entry.check_in : `${entry.check_in}+05:30`).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
                                    </span>
                                </div>
                                <Badge 
                                    variant={entry.check_out ? 'secondary' : 'success'} 
                                    className="text-[8px] h-4 mt-1 font-bold uppercase tracking-widest px-1.5"
                                >
                                    {entry.check_out ? 'Checked Out' : 'On Site'}
                                </Badge>
                            </div>
                        </div>
                    ))}
                    {attendance.length === 0 && (
                        <div className="py-12 text-center">
                            <Users className="w-8 h-8 text-slate-100 mx-auto mb-2" />
                            <p className="text-xs text-slate-400 font-medium italic">No attendance logged yet today.</p>
                        </div>
                    )}
                </div>
                <div className="p-3 bg-slate-50/50 text-center border-t border-slate-50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Total Today: {attendance.length} Employees
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default LiveAttendance;
