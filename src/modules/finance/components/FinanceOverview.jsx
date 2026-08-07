import React from 'react';
import PremiumCard from '../../../components/ui/PremiumCard';
import KpiCard from '../../../components/ui/KpiCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, PieChart as PieIcon } from 'lucide-react';
import { cn } from '../../../utils/cn';

const FinanceOverview = ({
  selectedCurrency,
  setSelectedCurrency,
  reportData,
  chartData,
  currencies
}) => {
  const currentSymbol = currencies.find(c => c.code === selectedCurrency)?.symbol || '$';
  const data = selectedCurrency === 'All' ? reportData.consolidated : reportData.byCurrency?.[selectedCurrency];

  const formatCurrencyVal = (amount, symbol = '₹') => {
    const num = parseFloat(amount) || 0;
    const isNeg = num < 0;
    const formatted = Math.abs(num).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    return isNeg ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
  };

  const profitVal = data?.profit || 0;
  const isNegativeProfit = profitVal < 0;

  const marginVal = data?.margin || 0;
  const isNegativeMargin = marginVal < 0;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const name = item.payload.name;
      const val = item.value;
      const isLoss = (name === 'Profit' || name === 'Loss') && val < 0;

      let accentColor = '#3b82f6';
      if (name === 'Expense') accentColor = '#f59e0b';
      else if (name === 'Profit' || name === 'Loss') accentColor = isLoss ? '#ef4444' : '#10b981';

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
            {formatCurrencyVal(val, selectedCurrency === 'All' ? '₹' : currentSymbol)}
          </p>
        </div>
      );
    }
    return null;
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

  const renderCustomBarLabel = (props) => {
    const { x, y, width, height, value, name } = props;
    const isLoss = (name === 'Profit' || name === 'Loss') && value < 0;
    const isExpense = name === 'Expense';

    let textColor = '#3b82f6';
    if (isExpense) textColor = '#d97706';
    else if (name === 'Profit' || name === 'Loss') textColor = isLoss ? '#e11d48' : '#059669';

    const formattedVal = formatCompactNumber(value, selectedCurrency === 'All' ? '₹' : currentSymbol);
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

  return (
    <>
      <div className="flex justify-end mb-4">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">View Currency:</span>
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="text-sm font-semibold text-slate-900 border-none bg-transparent focus:ring-0 cursor-pointer"
          >
            <option value="All">All (Consolidated INR)</option>
            {Object.keys(reportData.byCurrency || {}).map(curr => (
              <option key={curr} value={curr}>{curr}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total Revenue"
          value={formatCurrencyVal(data?.revenue || 0, selectedCurrency === 'All' ? '₹' : currentSymbol)}
          icon={TrendingUp}
          subtext={selectedCurrency === 'All' ? "Converted to INR" : "Lifetime earnings"}
        />
        <KpiCard
          title="Expenses"
          value={formatCurrencyVal(data?.expenses || 0, selectedCurrency === 'All' ? '₹' : currentSymbol)}
          icon={TrendingDown}
          subtext={selectedCurrency === 'All' ? "Converted to INR" : "Operational spend"}
        />
        <KpiCard
          title="Net Profit"
          value={formatCurrencyVal(profitVal, selectedCurrency === 'All' ? '₹' : currentSymbol)}
          icon={isNegativeProfit ? TrendingDown : TrendingUp}
          valueClassName={isNegativeProfit ? "text-rose-600" : "text-emerald-600"}
          iconClassName={isNegativeProfit ? "bg-rose-50 border-rose-100 text-rose-600" : "bg-emerald-50 border-emerald-100 text-emerald-600"}
          subtext={isNegativeProfit ? "Net Loss Incurred" : "Operational Liquidity"}
        />
        <KpiCard
          title="Margin"
          value={`${marginVal.toFixed(1)}%`}
          valueClassName={isNegativeMargin ? "text-rose-600" : "text-slate-800"}
          icon={PieIcon}
          subtext="Profitability ratio"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <PremiumCard 
          title={`Profit & Loss Performance (${selectedCurrency === 'All' ? 'INR Consolidated' : selectedCurrency})`}
          icon={TrendingUp}
          className="lg:col-span-2"
          headerRight={
            <div className="flex gap-4 text-sm font-semibold">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div> Revenue</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div> Expense</div>
              <div className="flex items-center gap-1.5">
                <div className={cn("w-2 h-2 rounded-full", isNegativeProfit ? "bg-[#ef4444]" : "bg-[#10b981]")}></div> 
                {isNegativeProfit ? 'Loss' : 'Profit'}
              </div>
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
                  tickFormatter={(val) => formatCompactNumber(val, selectedCurrency === 'All' ? '₹' : currentSymbol)}
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
                    if (entry.name === 'Expense') {
                      fillGrad = 'url(#expenseGrad)';
                    } else if (entry.name === 'Profit' || entry.name === 'Loss') {
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

        <PremiumCard 
          title={`Expense Breakdown (${selectedCurrency === 'All' ? 'INR' : selectedCurrency})`}
          icon={PieIcon}
        >
          <div className="flex-1 p-6">
            <div className="space-y-4">
              {[
                { label: 'Vendor Invoices', value: data?.breakdown?.inboundInvoices || 0, color: 'bg-indigo-500' },
                { label: 'General Expenses', value: data?.breakdown?.generalExpenses || 0, color: 'bg-rose-500' },
                { label: 'Payroll Costs', value: data?.breakdown?.payroll || 0, color: 'bg-amber-500' }
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="text-slate-900 font-semibold">
                      {selectedCurrency === 'All' ? '₹' : currentSymbol}
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-1000", item.color)}
                      style={{ width: `${(item.value / (data?.expenses || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}

              <div className="pt-6 mt-6 border-t border-slate-100">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Financial Health Note</p>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">
                    {selectedCurrency === 'All'
                      ? "All currencies are consolidated to INR using live institutional exchange rates."
                      : `Calculations are segregated for ${selectedCurrency} to maintain accuracy.`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </PremiumCard>
      </div>
    </>
  );
};

export default FinanceOverview;
