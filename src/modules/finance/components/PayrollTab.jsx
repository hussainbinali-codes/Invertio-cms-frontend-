import React from 'react';
import PremiumCard from '../../../components/ui/PremiumCard';
import Table, { TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import { Search, CheckCircle2, Wallet } from 'lucide-react';
import { hasPermission } from '../../../utils/permissionUtils';

const PayrollTab = ({
  payrollData,
  payrollSearch,
  setPayrollSearch,
  payrollYearFilter,
  setPayrollYearFilter,
  currencies,
  updatePayrollStatus
}) => {
  const filteredPayroll = payrollData.filter(pay => {
    const matchesSearch = pay.user_name?.toLowerCase().includes(payrollSearch.toLowerCase()) || 
                        pay.project_name?.toLowerCase().includes(payrollSearch.toLowerCase());
    const matchesYear = payrollYearFilter === 'All' || pay.year.toString() === payrollYearFilter;
    return matchesSearch && matchesYear;
  });

  return (
    <PremiumCard 
      title="Payroll & Labor Costs" 
      subtitle="Tracking employee compensation and project-labor allocation." 
      icon={Wallet}
      className="animate-in fade-in slide-in-from-bottom-2 duration-300"
      headerRight={
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search name or project..." 
              value={payrollSearch}
              onChange={(e) => setPayrollSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:ring-primary-500 w-full sm:w-64"
            />
          </div>
          <select 
            value={payrollYearFilter}
            onChange={(e) => setPayrollYearFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 py-2 focus:ring-primary-500"
          >
            <option value="All">All Years</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>
      }
    >
      <div className="flex-grow">
         <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="py-4">Employee</TableHead>
                <TableHead className="py-4">Project Allocation</TableHead>
                <TableHead className="py-4">Period</TableHead>
                <TableHead className="py-4">Amount</TableHead>
                <TableHead className="py-4">Status</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {filteredPayroll.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-slate-500">No payroll records found.</TableCell></TableRow>
              ) : (
                filteredPayroll.map(pay => (
                  <TableRow key={pay.id}>
                    <TableCell className="py-5 font-bold text-slate-800 text-sm">
                      {pay.user_name}
                      {pay.proof_url && (
                        <a
                          href={pay.proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-1 mt-1 uppercase"
                        >
                          <CheckCircle2 className="w-3 h-3" /> View Proof
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="py-5 font-bold text-slate-500 text-xs">{pay.project_name || 'General Admin'}</TableCell>
                    <TableCell className="py-5 text-xs text-slate-600">{pay.month}/{pay.year}</TableCell>
                    <TableCell className="py-5 font-bold text-slate-900 font-mono">
                      {currencies.find(c => c.code === pay.currency)?.symbol || '$'}
                      {pay.amount?.toLocaleString()}
                    </TableCell>
                    <TableCell className="py-5">
                      {hasPermission('finance', 'payroll.manage') ? (
                        <div className="flex flex-col">
                          <select
                            value={pay.status}
                            onChange={(e) => updatePayrollStatus(pay.id, e.target.value)}
                            className="bg-transparent border-none text-[10px] font-bold text-slate-400 focus:ring-0 cursor-pointer hover:text-primary-600 transition-colors uppercase tracking-wider"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                            <option value="Failed">Failed</option>
                          </select>
                          {pay.payment_notes && (
                            <p className="text-xs text-slate-500 font-medium mt-1 max-w-[120px] truncate" title={pay.payment_notes}>
                              {pay.payment_notes}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <Badge variant={pay.status === 'Paid' ? 'success' : 'default'} className="text-xs font-semibold text-slate-500 w-fit">{pay.status}</Badge>
                          {pay.payment_notes && (
                            <p className="text-xs text-slate-500 font-medium truncate max-w-[100px]" title={pay.payment_notes}>
                              {pay.payment_notes}
                            </p>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
         </Table>
      </div>
    </PremiumCard>
  );
};

export default PayrollTab;
