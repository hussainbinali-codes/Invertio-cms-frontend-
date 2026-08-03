import React, { useState } from 'react';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import {
  Users, Calendar, Wallet, Send, Search, Eye, Filter,
  ChevronLeft, ChevronRight, Plus, Settings, CheckCircle2, Clock
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { hasPermission } from '../../../utils/permissionUtils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const PayrollTab = ({
  batches = [],
  loading,
  onOpenGenerateModal,
  onViewBatchDetails,
  stats = {}
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(parseFloat(val) || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
             ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  // Filter batches
  const filteredBatches = batches.filter(b => {
    const monthName = MONTH_NAMES[b.month - 1]?.toLowerCase() || '';
    const yearStr = String(b.year);
    const searchLower = searchQuery.toLowerCase().trim();

    const matchesSearch = !searchLower || monthName.includes(searchLower) || yearStr.includes(searchLower);
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredBatches.length / itemsPerPage) || 1;
  const paginatedBatches = filteredBatches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats calculation
  const latestBatch = batches[0] || {};
  const latestMonthName = latestBatch.month ? MONTH_NAMES[latestBatch.month - 1] : 'THIS MONTH';
  const totalEmployees = stats.totalEmployees || latestBatch.total_employees || 0;
  const workingDays = latestBatch.working_days || 22;
  const estPayroll = latestBatch.net_payroll !== undefined && latestBatch.net_payroll !== null ? parseFloat(latestBatch.net_payroll) : 0;
  const payslipsSent = latestBatch.payslips_sent_count || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ──────────────── HEADER & ACTION BUTTONS ──────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight">
            Payroll Management
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Generate, review and manage monthly payrolls for all employees.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" className="rounded-2xl text-xs font-bold py-2.5 px-4 flex items-center gap-2 border-slate-200">
            <Settings className="w-4 h-4 text-slate-500" />
            Payroll Settings
          </Button>

          {hasPermission('finance', 'payroll.manage') && (
            <Button
              onClick={onOpenGenerateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-2.5 px-5 text-xs font-bold shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Generate Payroll
            </Button>
          )}
        </div>
      </div>

      {/* ──────────────── TOP METRIC CARDS (4 CARDS) ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Total Employees */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">TOTAL EMPLOYEES</span>
            <span className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5 block">{totalEmployees}</span>
            <span className="text-[10px] text-blue-600 font-bold mt-0.5 block">Active Employees</span>
          </div>
        </div>

        {/* Card 2: Working Days */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">THIS MONTH WORKING DAYS</span>
            <span className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5 block">{workingDays}</span>
            <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">Auto Calculated</span>
          </div>
        </div>

        {/* Card 3: Est. Payroll */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">EST. PAYROLL ({latestMonthName})</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">{formatINR(estPayroll)}</span>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">Net Salary Total</span>
          </div>
        </div>

        {/* Card 4: Payslips Sent */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">PAYSLIPS SENT ({latestMonthName})</span>
            <span className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5 block">{payslipsSent}/{totalEmployees}</span>
            <span className={cn(
              "text-[10px] font-bold mt-0.5 block",
              payslipsSent > 0 ? "text-emerald-600" : "text-amber-600"
            )}>
              {payslipsSent > 0 ? `${payslipsSent} Sent` : "Not Sent Yet"}
            </span>
          </div>
        </div>

      </div>

      {/* ──────────────── PAYROLL RUNS TABLE SECTION ──────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
        
        {/* Table Header & Search/Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Payroll Runs</h2>
            <p className="text-xs text-slate-500 mt-0.5">View all payroll runs generated for different months.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search month or year..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Paid">Paid</option>
              <option value="Sent">Sent</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                <th className="py-3.5 px-5">MONTH & YEAR</th>
                <th className="py-3.5 px-4 text-center">EMPLOYEES</th>
                <th className="py-3.5 px-4">GROSS PAYROLL</th>
                <th className="py-3.5 px-4">ADJUSTMENTS</th>
                <th className="py-3.5 px-4">NET PAYROLL</th>
                <th className="py-3.5 px-4 text-center">STATUS</th>
                <th className="py-3.5 px-4">GENERATED ON</th>
                <th className="py-3.5 px-5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    Loading payroll runs...
                  </td>
                </tr>
              ) : paginatedBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No payroll runs found. Click "Generate Payroll" above to create a run.
                  </td>
                </tr>
              ) : (
                paginatedBatches.map((b) => {
                  const mName = MONTH_NAMES[b.month - 1] || 'Month';
                  const adjTotal = parseFloat(b.adjustments_total || 0);

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Month & Year */}
                      <td className="py-4 px-5 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="block font-bold text-slate-900">{mName} {b.year}</span>
                            <span className="block text-[10px] text-slate-400 font-medium">Payroll Run</span>
                          </div>
                        </div>
                      </td>

                      {/* Employees */}
                      <td className="py-4 px-4 text-center font-mono font-bold text-slate-800">
                        {b.total_employees}
                      </td>

                      {/* Gross Payroll */}
                      <td className="py-4 px-4 font-mono font-bold text-slate-900">
                        {formatINR(b.gross_payroll)}
                      </td>

                      {/* Adjustments */}
                      <td className="py-4 px-4 font-mono font-bold">
                        <span className={adjTotal >= 0 ? "text-emerald-600" : "text-rose-600"}>
                          {adjTotal >= 0 ? `+ ${formatINR(adjTotal)}` : formatINR(adjTotal)}
                        </span>
                      </td>

                      {/* Net Payroll */}
                      <td className="py-4 px-4 font-mono font-bold text-slate-900">
                        {formatINR(b.net_payroll)}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <Badge className={cn(
                          "font-bold text-[10px] px-2.5 py-0.5 uppercase tracking-wider",
                          b.status === 'Sent' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          b.status === 'Paid' ? "bg-blue-50 text-blue-700 border-blue-200" :
                          "bg-slate-100 text-slate-700 border-slate-200"
                        )}>
                          {b.status || 'DRAFT'}
                        </Badge>
                      </td>

                      {/* Generated On */}
                      <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">
                        {formatDate(b.generated_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onViewBatchDetails(b.id)}
                          className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Details
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500 font-medium">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredBatches.length)} of {filteredBatches.length} payroll runs
            </span>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={cn(
                    "w-8 h-8 rounded-xl text-xs font-bold transition-all",
                    currentPage === p ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default PayrollTab;
