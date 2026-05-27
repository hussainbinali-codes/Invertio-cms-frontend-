import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, PieChart as PieIcon } from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
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

  return (
    <>
      <div className="flex justify-end mb-4">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">View Currency:</span>
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="text-sm font-bold text-slate-900 border-none bg-transparent focus:ring-0 cursor-pointer"
          >
            <option value="All">All (Consolidated INR)</option>
            {Object.keys(reportData.byCurrency || {}).map(curr => (
              <option key={curr} value={curr}>{curr}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={selectedCurrency === 'All'
            ? `₹${reportData.consolidated?.revenue?.toLocaleString() || 0}`
            : `${currentSymbol}${reportData.byCurrency?.[selectedCurrency]?.revenue?.toLocaleString() || 0}`
          }
          icon={TrendingUp}
          subtext={selectedCurrency === 'All' ? "Converted to INR" : "Lifetime earnings"}
        />
        <StatCard
          title="Expenses"
          value={selectedCurrency === 'All'
            ? `₹${reportData.consolidated?.expenses?.toLocaleString() || 0}`
            : `${currentSymbol}${reportData.byCurrency?.[selectedCurrency]?.expenses?.toLocaleString() || 0}`
          }
          icon={TrendingDown}
          subtext={selectedCurrency === 'All' ? "Converted to INR" : "Operational spend"}
        />
        <StatCard
          title="Net Profit"
          value={selectedCurrency === 'All'
            ? `₹${reportData.consolidated?.profit?.toLocaleString() || 0}`
            : `${currentSymbol}${reportData.byCurrency?.[selectedCurrency]?.profit?.toLocaleString() || 0}`
          }
          icon={Wallet}
          trend="+12%"
          subtext="After-tax liquidity"
        />
        <StatCard
          title="Margin"
          value={`${(selectedCurrency === 'All' ? reportData.consolidated?.margin : reportData.byCurrency?.[selectedCurrency]?.margin)?.toFixed(1) || 0}%`}
          icon={PieIcon}
          subtext="Profitability ratio"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Profit & Loss Performance ({selectedCurrency === 'All' ? 'INR Consolidated' : selectedCurrency})</CardTitle>
            <div className="flex gap-4 text-xs font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div> Revenue</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#ef4444]"></div> Expense</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#10b981]"></div> Profit</div>
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [selectedCurrency === 'All' ? `₹${value.toLocaleString()}` : `${currentSymbol}${value.toLocaleString()}`, '']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-6">
            <CardTitle className="text-lg font-bold">Expense Breakdown ({selectedCurrency === 'All' ? 'INR' : selectedCurrency})</CardTitle>
          </CardHeader>
          <CardContent className="p-0 px-6 pb-6">
            <div className="space-y-4">
              {[
                { label: 'Vendor Invoices', value: data?.breakdown?.inboundInvoices || 0, color: 'bg-indigo-500' },
                { label: 'General Expenses', value: data?.breakdown?.generalExpenses || 0, color: 'bg-rose-500' },
                { label: 'Payroll Costs', value: data?.breakdown?.payroll || 0, color: 'bg-amber-500' }
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1.5 font-bold uppercase tracking-wider">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="text-slate-900">
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
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Financial Health Note</p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedCurrency === 'All'
                      ? "All currencies are consolidated to INR using live institutional exchange rates."
                      : `Calculations are segregated for ${selectedCurrency} to maintain accuracy.`
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default FinanceOverview;
