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
  Target
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

// Premium Double-Bezel KPI Card component
const KpiCard = ({ title, value, icon: Icon, subtext, trend, highlight }) => {
  return (
    <div className={cn(
      "bg-slate-200/40 p-1.5 rounded-[1.75rem] border border-slate-200/20 hover:bg-slate-200/60 active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group hover:-translate-y-0.5 flex-1",
      highlight && "bg-blue-50/50 border-blue-100"
    )}>
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
              <span className="text-xs text-slate-500 font-medium">
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
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
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
      <div className="space-y-8 pb-10">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-3xl" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="lg:col-span-2 h-[420px] rounded-[2rem]" />
          <div className="space-y-6">
            <Skeleton className="h-48 rounded-[2rem]" />
            <Skeleton className="h-48 rounded-[2rem]" />
          </div>
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

  const utilizationPercentage = Math.round(stats?.utilization?.percentage || 0);
  const attendancePercentage = Math.round((stats?.users?.present_today / stats?.users?.total_users) * 100 || 0);

  return (
    <div className="space-y-8 pb-10 max-w-[1400px] mx-auto py-2">
      {/* Header section with Asymmetric Layout */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight mt-1">
            Institutional Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-normal">
            Real-time performance monitoring across all departments.
          </p>
        </div>
        <div className="bg-slate-200/30 p-1 rounded-2xl border border-slate-200/20 active:scale-[0.98] transition-all duration-300">
          <Badge variant="outline" className="bg-white text-slate-600 border-transparent py-1.5 px-3.5 rounded-[calc(1rem-0.25rem)] shadow-sm font-mono font-bold text-[10px] uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 mr-2 text-slate-400" />
            {new Date().toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' })}
          </Badge>
        </div>
      </div>

      {/* Bento Row 1: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <KpiCard 
          title="Active Projects" 
          value={stats?.projects?.active || 0} 
          icon={Briefcase} 
          subtext={`${stats?.projects?.blocked || 0} Blocked (Financial)`} 
        />
        <KpiCard 
          title="Pending Tasks" 
          value={stats?.tasks?.pending || 0} 
          icon={CheckCircle2} 
          subtext="Across all pipelines" 
        />
        <KpiCard 
          title="Attendance Rate" 
          value={`${attendancePercentage}%`} 
          icon={Users} 
          subtext={`${stats?.users?.present_today || 0} Present Today`} 
          trend={`${stats?.users?.on_leave_today || 0} On Leave`}
        />
        <KpiCard 
          title="Total Clients" 
          value={stats?.clients?.total || 0} 
          icon={Target} 
          subtext="Active business entities" 
        />
        {hasPermission('finance', 'report.view') && (
          <KpiCard 
            title="Consolidated Revenue" 
            value={formatCompactNumber(stats?.finance?.revenue || 0)} 
            icon={TrendingUp} 
            subtext="INR (Live Rates)" 
            highlight={true}
          />
        )}
        {!hasPermission('finance', 'report.view') && (
          <KpiCard 
            title="Recruitment" 
            value={stats?.hr?.total_candidates || 0} 
            icon={Target} 
            subtext="Active candidates" 
          />
        )}
      </div>

      {/* Bento Row 2: Charts and secondary stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {hasPermission('finance', 'report.view') && (
          <PremiumCard 
            title="Financial Health" 
            subtitle="Consolidated institutional liquidity (INR)" 
            icon={TrendingUp} 
            className="lg:col-span-2"
            headerRight={
              <div className="flex gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div> Revenue</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div> Expenses</div>
              </div>
            }
          >
            <div className="h-[340px] p-4 sm:p-6">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={chartData} margin={{ top: 25, right: 30, left: 10, bottom: 10 }}>
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
                    radius={[8, 8, 8, 8]} 
                    barSize={55}
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
          </PremiumCard>
        )}
        {!hasPermission('finance', 'report.view') && (
          <PremiumCard 
            title="Operational Overview" 
            subtitle="Standard workspace view" 
            icon={LayoutDashboard}
            className="lg:col-span-2"
          >
            <div className="flex flex-col items-center justify-center text-center p-16 h-[340px] bg-slate-50/20">
               <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center mb-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                  <LayoutDashboard className="w-6 h-6 text-slate-300" />
               </div>
               <h3 className="text-sm font-semibold text-slate-900">Standard Operational View</h3>
               <p className="text-[10px] text-slate-400 mt-2 max-w-[240px] leading-relaxed font-bold uppercase tracking-wider">Financial analytics are restricted to authorized personnel.</p>
            </div>
          </PremiumCard>
        )}

        <div className="space-y-6">
          <PremiumCard title="Resource Utilization" subtitle="Workforce active on tasks" icon={Users}>
            <div className="p-6">
               <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-3xl font-bold text-slate-800 font-mono">{utilizationPercentage}%</p>
                    <p className="text-xs text-slate-500 font-medium mt-1">Assigned users</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-normal text-slate-500 font-mono">{stats?.utilization?.assigned} / {stats?.utilization?.total}</p>
                  </div>
               </div>
               <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(37,99,235,0.2)]" 
                    style={{ width: `${utilizationPercentage}%` }} 
                  />
               </div>
               <p className="text-[10px] text-slate-400 mt-4 leading-relaxed font-semibold italic">
                 Percentage of users currently assigned to active task pipelines.
               </p>
            </div>
          </PremiumCard>

          <PremiumCard title="Upcoming Milestones" subtitle="Project budget metrics" icon={Target}>
            <div className="p-2">
               <div className="divide-y divide-slate-100">
                  {stats?.upcoming_milestones?.length > 0 ? stats.upcoming_milestones.map((m, i) => (
                    <div key={i} className="px-4 py-3 flex justify-between items-center hover:bg-slate-50/50 transition-colors rounded-xl cursor-default">
                       <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{m.name}</p>
                          <p className="text-xs text-slate-500 font-medium font-mono">{new Date(m.end_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                       </div>
                       <Badge variant="outline" className="text-[10px] font-mono font-bold text-blue-600 border-blue-100 bg-blue-50/30">
                         ₹{(m.budget / 1000).toFixed(0)}k
                       </Badge>
                    </div>
                  )) : (
                    <div className="p-6 text-center text-xs text-slate-400">No upcoming milestones</div>
                  )}
               </div>
            </div>
          </PremiumCard>
        </div>
      </div>

      {/* Bento Row 3: Leaderboard, Margin, and Live Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {hasPermission('finance', 'report.view') && (
           <div className="bg-slate-900 border-transparent text-white p-1.5 rounded-[2rem] lg:col-span-1 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group active:scale-[0.98]">
              <div className="bg-slate-950 p-8 rounded-[calc(2rem-0.375rem)] h-full flex flex-col justify-between min-h-[220px]">
                 <div>
                    <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="text-slate-500 text-xs font-semibold text-slate-500 tracking-widest mb-1.5">Net Profit Margin</p>
                    <p className="text-4xl font-mono font-bold tracking-tight text-white">
                      {Math.round(stats?.finance?.margin || 0)}%
                    </p>
                 </div>
                 <div className="mt-6">
                   <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Outperforming Quarter</span>
                   </div>
                 </div>
              </div>
           </div>
         )}
         {!hasPermission('finance', 'report.view') && (
            <PremiumCard 
              title="Growth Metrics" 
              subtitle="Workspace performance" 
              icon={TrendingUp}
              className="lg:col-span-1"
            >
              <div className="p-8 flex flex-col h-full justify-center text-center bg-slate-50/20 min-h-[220px]">
                 <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                   <TrendingUp className="w-5 h-5 text-slate-300" />
                 </div>
                 <p className="text-slate-400 text-xs font-semibold text-slate-500 tracking-widest">Growth Metrics</p>
                 <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">Analytics restricted</p>
              </div>
            </PremiumCard>
         )}

         {/* Wrapped LiveAttendance in Double-Bezel layout for visual consistency */}
         <div className="lg:col-span-2">
            <div className="bg-slate-200/30 p-1.5 rounded-[2rem] border border-slate-200/10">
              <div className="bg-white rounded-[calc(2rem-0.375rem)] border border-slate-200/20 shadow-[inset_0_1px_1px_rgba(255,255,255,1)] p-1 overflow-hidden">
                 <LiveAttendance />
              </div>
            </div>
         </div>

         {/* Employee Performance Leaderboard */}
         <PremiumCard 
           title="Top Performers" 
           subtitle="Completed Velocity (Live)" 
           icon={TrendingUp}
           className="lg:col-span-1 overflow-hidden"
         >
           <div className="flex-1 flex flex-col justify-between">
             <div className="divide-y divide-slate-50 p-2">
                {stats?.leaderboard?.length > 0 ? stats.leaderboard.map((user, i) => (
                  <div key={i} className="px-3 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors rounded-xl">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 border border-blue-100/60 rounded-xl flex items-center justify-center text-blue-700 text-[10px] font-bold font-mono">
                           {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                           <p className="text-xs font-bold text-slate-800">{user.name}</p>
                           <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Velocity Target</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-sm font-normal text-blue-600 font-mono">{user.story_points} pts</p>
                        <div className="flex items-center gap-0.5 justify-end mt-1">
                           {[...Array(Math.min(5, Math.ceil(user.story_points / 20)))].map((_, star) => (
                              <div key={star} className="w-1 h-1 rounded-full bg-amber-400" />
                           ))}
                        </div>
                     </div>
                  </div>
                )) : (
                  <div className="p-8 text-center text-[10px] text-slate-400 font-medium">No performance data yet</div>
                )}
             </div>
             <div className="p-3.5 bg-slate-50/80 border-t border-slate-100 text-center mt-auto">
                <span className="text-[10px] font-semibold text-slate-500">Performance Metrics (Live)</span>
             </div>
           </div>
         </PremiumCard>
      </div>
    </div>
  );
};

export default DashboardPage;
