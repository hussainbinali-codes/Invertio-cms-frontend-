import React, { useEffect, useState } from 'react';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Table, { TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Input from '../../../components/ui/Input';
import { 
  Calendar, 
  Clock, 
  Send, 
  Loader2,
  AlertCircle,
  History
} from 'lucide-react';
import toast from 'react-hot-toast';
import StatCard from '../../../components/ui/StatCard';
import { cn } from '../../../utils/cn';
import Skeleton from '../../../components/ui/Skeleton';

const LeavesPage = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectionType, setSelectionType] = useState('range'); // 'single' or 'range'
    const [isHalfDay, setIsHalfDay] = useState(false);

    const [startDate, setStartDate] = useState('');

    useEffect(() => {
        fetchMyLeaves();
    }, []);


    const fetchMyLeaves = async () => {
        try {
            // First try to get the current user profile from backend
            let userData = null;
            try {
                const userRes = await axios.get('/auth/me');
                userData = userRes.data.data;
            } catch (authErr) {
                console.warn("Could not fetch profile from /auth/me, falling back to localStorage");
                userData = JSON.parse(localStorage.getItem('user') || '{}');
            }

            if (!userData || !userData.id) {
                throw new Error("User identity not found.");
            }

            // Fetch personal leaves
            const leaveRes = await axios.get('/hr/leaves/my');
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
        const type = payload.leave_type || 'Available';

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
        if (selectionType === 'single') {
            payload.end_date = payload.start_date;
        }
        payload.is_half_day = isHalfDay;

        try {
            await axios.post('/hr/leaves', payload);
            toast.success('Leave request submitted');
            e.target.reset();
            setStartDate('');
            setSelectionType('range');
            setIsHalfDay(false);
            fetchMyLeaves();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit request');
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
        <div className="space-y-8 pb-10 text-slate-900">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Time Off & Holidays</h1>
                <p className="text-sm text-slate-500 mt-1">Manage your annual leave balance and request time off.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="space-y-4">
                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-indigo-50 rounded-lg">
                                    <Calendar className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Monthly Allowance</h3>
                                    <p className="text-[10px] text-slate-500 font-medium">Reset every 1st of the month</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Paid Leave</span>
                                    <span className="text-xs font-black text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-100">1 Day / Month</span>
                                </div>
                                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Sick Leave</span>
                                    <span className="text-xs font-black text-emerald-600 bg-white px-2 py-0.5 rounded border border-emerald-100">1 Day / Month</span>
                                </div>
                            </div>
                            
                            <p className="text-[10px] text-slate-400 mt-4 leading-relaxed italic">
                                * Allowances do not carry forward. Any additional requests within the same month will be marked as **Unpaid Leave**.
                            </p>
                        </div>
                    </div>

                    <Card>
                        <CardHeader className="py-6 border-b border-slate-50">
                            <CardTitle className="text-lg font-bold">Apply for Leave</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleApply} className="space-y-4">
                                <div className="flex p-1 bg-slate-100 rounded-lg mb-4">
                                    <button
                                        type="button"
                                        onClick={() => { setSelectionType('single'); setIsHalfDay(false); }}
                                        className={cn(
                                            "flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all",
                                            selectionType === 'single' ? "bg-white text-primary-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        Single Day
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setSelectionType('range'); setIsHalfDay(false); }}
                                        className={cn(
                                            "flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all",
                                            selectionType === 'range' ? "bg-white text-primary-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        Date Range
                                    </button>
                                </div>

                                <Input 
                                    label={selectionType === 'single' ? "Select Date" : "Start Date"} 
                                    name="start_date" 
                                    type="date" 
                                    required 
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Leave Type</label>
                                    <select 
                                        name="leave_type"
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                        required
                                    >
                                        <option value="Available">Available (Paid Leave)</option>
                                        <option value="Sick Leave">Sick Leave (Medical Grounds)</option>
                                        <option value="Unpaid">Unpaid (No Deduction)</option>
                                    </select>
                                    <p className="text-[10px] text-slate-400 font-medium italic mt-1">
                                        * First Paid Leave and first Sick Leave of the month are paid. Subsequent ones are unpaid.
                                    </p>
                                </div>
                                
                                {selectionType === 'range' ? (
                                    <Input 
                                        label="End Date" 
                                        name="end_date" 
                                        type="date" 
                                        required 
                                        min={startDate}
                                    />
                                ) : (
                                    <div className="flex items-center space-x-2 py-1 px-1">
                                        <input 
                                            type="checkbox" 
                                            id="half_day"
                                            checked={isHalfDay}
                                            onChange={(e) => setIsHalfDay(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <label htmlFor="half_day" className="text-xs font-bold text-slate-600 cursor-pointer uppercase tracking-tight">
                                            Half Day (0.5 days)
                                        </label>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Reason</label>
                                    <textarea 
                                        name="reason" 
                                        rows={4}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white resize-none"
                                        placeholder="Briefly explain your absence..."
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Submit Request</>}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader className="py-6 border-b border-slate-50 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <History className="w-5 h-5 text-slate-400" />
                                Leave History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
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
                                        {leaves.map(leave => (
                                            <TableRow key={leave.id}>
                                                <TableCell className="py-5">
                                                    <div className="text-xs font-semibold text-slate-700">
                                                        {new Date(leave.start_date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                                        {leave.start_date !== leave.end_date && ` - ${new Date(leave.end_date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                                        {leave.days_count} {parseFloat(leave.days_count) === 1 ? 'day' : 'days'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    <div className="flex flex-col gap-1">
                                                        <Badge 
                                                            variant={
                                                                leave.leave_type === 'Available' ? 'outline' : 
                                                                leave.leave_type === 'Sick Leave' ? 'success' : 
                                                                leave.leave_type === 'Unpaid' ? 'danger' : 'secondary'
                                                            }
                                                            className="text-[9px] font-bold uppercase tracking-wider w-fit"
                                                        >
                                                            {leave.leave_type || 'Available'}
                                                        </Badge>
                                                        {leave.is_half_day && (
                                                            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest ml-1">HALF DAY</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    <p className="text-xs text-slate-600 max-w-xs truncate">{leave.reason}</p>
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    <Badge 
                                                        variant={leave.status === 'Approved' ? 'success' : leave.status === 'Rejected' ? 'danger' : 'primary'}
                                                        className="text-[10px] font-bold uppercase tracking-wider"
                                                    >
                                                        {leave.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default LeavesPage;
