import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';
import Badge from '../../../components/ui/Badge';
import { 
  LayoutDashboard, 
  CheckCircle2, 
  Users, 
  TrendingUp, 
  Briefcase, 
  Clock,
  ArrowUpRight,
  Target,
  Zap
} from 'lucide-react';
import LiveAttendance from '../../../components/LiveAttendance';
import Skeleton from '../../../components/ui/Skeleton';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LabelList 
} from 'recharts';
import { hasPermission } from '../../../utils/permissionUtils';
import { cn } from '../../../utils/cn';

const formatCurrencyVal = (amount, symbol = '₹') => {
  const num = parseFloat(amount) || 0;
  const isNeg = num < 0;
  const formatted = Math.abs(num).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  return isNeg ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
};

const formatCompactNumber = (number, symbol = '₹') => {
  const num = parseFloat(number) || 0;
  const absNum = Math.abs(num);
  const isNeg = num < 0;

  let formatted = '0';
  if (absNum >= 1e7) {
    formatted = (absNum / 1e7).toFixed(2) + 'Cr';
  } else if (absNum >= 1e5) {
    formatted = (absNum / 1e5).toFixed(2) + 'L';
  } else if (absNum >= 1e3) {
    formatted = (absNum / 1e3).toFixed(1) + 'k';
  } else {
    formatted = absNum.toFixed(0);
  }

  return isNeg ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const name = item.payload.name;
    const val = item.value;
    const isLoss = name === 'Profit' && val < 0;

    let accentColor = '#3b82f6';
    if (name === 'Expenses' || name === 'Expense') accentColor = '#f59e0b';
    else if (name === 'Profit') accentColor = isLoss ? '#ef4444' : '#10b981';

    return (
      <div 
        className="bg-white p-3 rounded-2xl shadow-xl border border-slate-100/80 text-xs font-semibold space-y-1 min-w-[150px]"
        style={{ borderLeft: `4px solid ${accentColor}` }}
      >
        <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">{name}</p>
        <p 
          className="text-sm font-bold font-mono"
          style={{ color: accentColor }}
        >
          {formatCurrencyVal(val, '₹')}
        </p>
      </div>
    );
  }
  return null;
};

const renderCustomBarLabel = (props) => {
  const { x, y, width, height, value, name } = props;
  const isLoss = name === 'Profit' && value < 0;
  const isExpense = name === 'Expenses' || name === 'Expense';

  let textColor = '#3b82f6';
  if (isExpense) textColor = '#d97706';
  else if (name === 'Profit') textColor = isLoss ? '#e11d48' : '#059669';

  const formattedVal = formatCompactNumber(value, '₹');
  const labelY = value < 0 ? y + height + 18 : y - 8;

  return (
    <g>
      <text
        x={x + width / 2}
        y={labelY}
        fill={textColor}
        textAnchor="middle"
        fontSize="11"
        fontWeight="800"
        fontFamily="monospace"
      >
        {formattedVal}
      </text>
    </g>
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    Promise.all([fetchStats(), fetchProfile()]).finally(() => setLoading(false));
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/dashboard/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error("Dashboard fetch error", err);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/auth/me');
      setProfile(res.data.data);
    } catch (err) {
      console.error("Profile fetch error", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 pb-10 max-w-[1400px] mx-auto py-2">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>

        <Skeleton className="h-32 w-full rounded-[2.25rem]" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Skeleton className="lg:col-span-8 h-[450px] rounded-[2.5rem]" />
          <Skeleton className="lg:col-span-4 h-[450px] rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  const rev = stats?.finance?.revenue || 0;
  const exp = stats?.finance?.expenses || 0;

  const chartData = [
    { name: 'Revenue', value: rev },
    { name: 'Expenses', value: exp }
  ];

  const hasNegativeValues = chartData.some(item => Number(item.value) < 0);
  const utilizationPercentage = Math.round(stats?.utilization?.percentage || 0);
  const attendancePercentage = Math.round((stats?.users?.present_today / stats?.users?.total_users) * 100 || 0);

  return (
    <div className="space-y-8 pb-10 max-w-[1400px] mx-auto py-2">
      {/* Header section with Executive Live Badge */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight">
            Enterprise Operational Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Real-time executive performance monitoring across core business pillars.
          </p>
        </div>
        <div className="bg-slate-200/30 p-1 rounded-2xl border border-slate-200/20 active:scale-[0.98] transition-all duration-300">
          <Badge variant="outline" className="bg-white text-slate-700 border-transparent py-1.5 px-3.5 rounded-[calc(1rem-0.25rem)] shadow-sm font-mono font-bold text-[10px] uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE SYSTEM FEED • {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' })}
          </Badge>
        </div>
      </div>

      {/* Unified Executive Metric Dock (Replaces Card Overload) */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03)] rounded-[2.25rem] p-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-0 md:divide-x divide-slate-100">
          
          {/* Active Projects */}
          <div className="md:px-6 first:pl-0 space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Projects</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 font-mono tracking-tight pt-1">
              {stats?.projects?.active || 0}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              {stats?.projects?.blocked || 0} Financial Holds
            </p>
          </div>

          {/* Task Pipeline */}
          <div className="md:px-6 space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Task Pipeline</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 font-mono tracking-tight pt-1">
              {stats?.tasks?.pending || 0}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Active work execution
            </p>
          </div>

          {/* Workforce Presence */}
          <div className="md:px-6 space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <Users className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attendance Rate</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 font-mono tracking-tight pt-1">
              {attendancePercentage}%
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              {stats?.users?.present_today || 0} Present • {stats?.users?.on_leave_today || 0} On Leave
            </p>
          </div>

          {/* Client Accounts */}
          <div className="md:px-6 space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Target className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client Accounts</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 font-mono tracking-tight pt-1">
              {stats?.clients?.total || 0}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Active corporate entities
            </p>
          </div>

          {/* Consolidated Liquidity */}
          <div className="md:px-6 last:pr-0 space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-violet-50 text-violet-600 rounded-lg">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consolidated Liquidity</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 font-mono tracking-tight pt-1">
              {formatCompactNumber(stats?.finance?.revenue || 0)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Net Margin: {Math.round(stats?.finance?.margin || 0)}%
            </p>
          </div>

        </div>
      </div>

      {/* Primary Bento Grid 2.0 (8 Cols / 4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Primary Stream (8 Cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Liquidity Chart Card */}
          {hasPermission('finance', 'report.view') && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)] p-6 md:p-8">
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
                    <TrendingUp className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">Institutional Liquidity & Cash Flow</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Consolidated Revenue vs. Expenses (INR)</p>
                  </div>
                </div>

                <div className="flex gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" /> Revenue</div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" /> Expenses</div>
                </div>
              </div>

              <div className="h-[290px] pt-6">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={chartData} margin={{ top: 20, right: 25, left: 5, bottom: 5 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.85} />
                      </linearGradient>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                        <stop offset="100%" stopColor="#d97706" stopOpacity={0.9} />
                      </linearGradient>
                      <linearGradient id="profitPosGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.9} />
                      </linearGradient>
                      <linearGradient id="profitNegGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f87171" stopOpacity={1} />
                        <stop offset="100%" stopColor="#dc2626" stopOpacity={0.95} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#475569', fontSize: 12, fontWeight: 700 }} 
                    />
                    <YAxis 
                      domain={[
                        hasNegativeValues ? (dataMin => Math.floor(dataMin * 1.1)) : 0, 
                        (dataMax => dataMax === 0 ? 100 : Math.ceil(dataMax * 1.08))
                      ]}
                      axisLine={false} 
                      tickLine={false} 
                      width={80}
                      tickFormatter={(val) => formatCompactNumber(val, '₹')}
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }} 
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(241, 245, 249, 0.6)', radius: 12 }}
                      content={<CustomTooltip />}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[10, 10, 10, 10]} 
                      barSize={60}
                      minPointSize={10}
                    >
                      <LabelList content={renderCustomBarLabel} />
                      {chartData.map((entry, index) => {
                        let fillGrad = 'url(#revenueGrad)';
                        if (entry.name === 'Expense' || entry.name === 'Expenses') {
                          fillGrad = 'url(#expenseGrad)';
                        } else if (entry.name === 'Profit') {
                          fillGrad = entry.value < 0 ? 'url(#profitNegGrad)' : 'url(#profitPosGrad)';
                        }
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={fillGrad}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Sub-Bento Strip: Executive Financial Summary + Resource Allocation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Executive Financial Performance Card */}
            {hasPermission('finance', 'report.view') && (
              <div className="bg-slate-950 text-white rounded-[2rem] p-6 border border-slate-800 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-white/5 border border-white/10 rounded-xl">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                      Executive Summary
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Net Profit Margin</p>
                      <p className="text-3xl font-mono font-bold tracking-tight text-white mt-1">
                        {Math.round(stats?.finance?.margin || 0)}%
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                      <div>
                        <p className="text-slate-400 text-[9px] font-semibold uppercase tracking-wider">Net Profit</p>
                        <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                          ₹{formatCompactNumber(stats?.finance?.profit || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[9px] font-semibold uppercase tracking-wider">Unpaid Bills</p>
                        <p className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                          {stats?.finance?.pending_invoices || 0} Pending
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Outperforming Quarter</span>
                  </div>
                </div>
              </div>
            )}

            {/* Resource Allocation Rate Card */}
            <div className="bg-white rounded-[2rem] p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
                    <Users className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Resource Allocation
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <p className="text-3xl font-bold text-slate-900 font-mono tracking-tight">{utilizationPercentage}%</p>
                    <p className="text-xs font-mono font-bold text-slate-500">{stats?.utilization?.assigned} / {stats?.utilization?.total} assigned</p>
                  </div>

                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(37,99,235,0.2)]" 
                      style={{ width: `${utilizationPercentage}%` }} 
                    />
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 mt-4 leading-relaxed font-semibold italic">
                Active workforce assigned across operational task pipelines.
              </p>
            </div>

          </div>

        </div>

        {/* Right Operations Stream (4 Cols) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Live Workforce Attendance Card */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)] p-2 overflow-hidden">
            <LiveAttendance />
          </div>

          {/* Upcoming Release Milestones */}
          <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Target className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Milestone Commitments</h4>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {stats?.upcoming_milestones?.length > 0 ? stats.upcoming_milestones.map((m, i) => (
                <div key={i} className="py-3 first:pt-0 last:pb-0 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 truncate max-w-[160px]">{m.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium font-mono">
                      {new Date(m.end_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono font-bold text-blue-600 border-blue-100 bg-blue-50/50 px-2.5 py-1 rounded-full">
                    ₹{(m.budget / 1000).toFixed(0)}k
                  </Badge>
                </div>
              )) : (
                <div className="py-6 text-center text-xs text-slate-400 font-medium">No upcoming milestone deadlines</div>
              )}
            </div>
          </div>

          {/* Engineering Velocity Leaderboard */}
          <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Zap className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Engineering Velocity</h4>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {stats?.leaderboard?.length > 0 ? stats.leaderboard.map((user, i) => (
                <div key={i} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-blue-700 text-[10px] font-bold font-mono">
                      {user.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{user.name}</p>
                      <p className="text-[10px] font-medium text-slate-400">Velocity contributor</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded-full">
                    {user.story_points} pts
                  </span>
                </div>
              )) : (
                <div className="py-6 text-center text-xs text-slate-400 font-medium">No performance data yet</div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
