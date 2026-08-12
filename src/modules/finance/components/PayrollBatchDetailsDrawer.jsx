import React, { useState } from 'react';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import {
  X, Download, Send, Edit, FileText, CheckCircle2,
  Clock, AlertCircle, Loader2, UploadCloud, User
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { hasPermission } from '../../../utils/permissionUtils';
import PayrollAdjustmentModal from './PayrollAdjustmentModal';
import PayrollProofModal from './PayrollProofModal';
import toast from 'react-hot-toast';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const PayrollBatchDetailsDrawer = ({
  isOpen,
  onClose,
  batchDetails,
  loading,
  onUpdateAdjustment,
  onUploadProof,
  onSendSinglePayslip,
  onSendBatchPayslips,
  isSendingBatch
}) => {
  const [editingRecord, setEditingRecord] = useState(null);
  const [proofRecord, setProofRecord] = useState(null);
  const [isSavingAdj, setIsSavingAdj] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [sendingSingleId, setSendingSingleId] = useState(null);

  if (!isOpen) return null;

  const { batch, employees = [] } = batchDetails || {};
  const monthName = batch ? MONTH_NAMES[batch.month - 1] : '';

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

  const handleSaveAdjustment = async (payrollId, payload) => {
    try {
      setIsSavingAdj(true);
      await onUpdateAdjustment(payrollId, payload);
      toast.success('Adjustment saved successfully');
      setEditingRecord(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save adjustment');
    } finally {
      setIsSavingAdj(false);
    }
  };

  const handleUploadProofSubmit = async (payrollId, formData) => {
    try {
      setIsUploadingProof(true);
      await onUploadProof(payrollId, formData);
      toast.success('Payment proof uploaded');
      setProofRecord(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload proof');
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleSendSingle = async (payrollId) => {
    try {
      setSendingSingleId(payrollId);
      await onSendSinglePayslip(payrollId);
      toast.success('Payslip PDF emailed to employee');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send payslip');
    } finally {
      setSendingSingleId(null);
    }
  };

  // Helper to render adjustment tag badge
  const renderAdjustmentTag = (emp) => {
    const daysAdj = parseFloat(emp.days_adjustment || 0);
    const bonus = parseFloat(emp.bonus_deduction_amount || 0);

    if (daysAdj === 0 && bonus === 0) {
      return <span className="text-slate-400 font-mono text-[11px]">—</span>;
    }

    return (
      <div className="flex flex-col text-[10px] font-bold">
        {daysAdj !== 0 && (
          <span className={daysAdj > 0 ? "text-emerald-600 font-mono" : "text-rose-600 font-mono"}>
            {daysAdj > 0 ? `+${daysAdj} Day` : `${daysAdj} Day`}
          </span>
        )}
        {bonus !== 0 && (
          <span className={bonus > 0 ? "text-emerald-600 font-mono" : "text-rose-600 font-mono"}>
            {bonus > 0 ? `Bonus +₹${bonus.toLocaleString('en-IN')}` : `Deduction -₹${Math.abs(bonus).toLocaleString('en-IN')}`}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-4xl bg-white shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Payroll Details</h2>
                <Badge className={cn(
                  "font-bold text-xs px-2.5 py-0.5 uppercase tracking-wider",
                  batch?.status === 'Sent' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  batch?.status === 'Paid' ? "bg-blue-50 text-blue-700 border-blue-200" :
                  "bg-slate-100 text-slate-700 border-slate-200"
                )}>
                  {monthName} {batch?.year} • {batch?.status || 'Draft'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Detailed breakdown for all {batch?.total_employees || 0} active employees included in this payroll run.
              </p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub Metrics Banner */}
          <div className="p-6 bg-slate-50/80 border-b border-slate-200/80 grid grid-cols-3 gap-4 text-center">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Employees</span>
              <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">{batch?.total_employees || 0}</span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Working Days</span>
              <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">{batch?.working_days || 22}</span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Generated On</span>
              <span className="text-xs font-bold text-slate-800 font-mono mt-1 block">{formatDate(batch?.generated_at)}</span>
            </div>
          </div>

          {/* Employee Breakdown Table Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-slate-400 font-medium gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                Loading employee payroll breakdown...
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-medium">
                No employee records found in this payroll run.
              </div>
            ) : (
              <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      <th className="py-3 px-4">EMPLOYEE</th>
                      <th className="py-3 px-3 text-center">WORKED DAYS</th>
                      <th className="py-3 px-3 text-center">PAID LEAVE</th>
                      <th className="py-3 px-3 text-center">UNPAID LEAVE</th>
                      <th className="py-3 px-3">ADJUSTMENT</th>
                      <th className="py-3 px-4 text-right">NET SALARY</th>
                      <th className="py-3 px-3 text-center">PROOF</th>
                      <th className="py-3 px-3 text-center">STATUS</th>
                      <th className="py-3 px-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {employees.map((emp) => {
                      const activeDaysNum = parseFloat(emp.active_days || emp.working_days || 22);
                      const unpaidLeavesNum = parseFloat(emp.unpaid_leaves || 0);
                      const daysAdjNum = parseFloat(emp.days_adjustment || 0);
                      const actualWorkedDays = emp.worked_days !== undefined && emp.worked_days !== null && emp.worked_days !== ''
                        ? Math.max(0, parseFloat(emp.worked_days))
                        : Math.max(0, activeDaysNum - unpaidLeavesNum + daysAdjNum);

                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Employee Avatar & Name */}
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200">
                                {emp.employee_name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div className="min-w-0">
                                <span className="block truncate font-bold text-slate-900">{emp.employee_name}</span>
                                <span className="block truncate text-[10px] text-slate-400 font-medium">{emp.employee_designation || 'Team Member'}</span>
                              </div>
                            </div>
                          </td>

                          {/* Worked Days */}
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700">
                            {actualWorkedDays}
                          </td>

                        {/* Paid Leave */}
                        <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-600">
                          {emp.paid_leaves || 0}
                        </td>

                        {/* Unpaid Leave */}
                        <td className="py-3.5 px-3 text-center font-mono font-bold text-rose-600">
                          {emp.unpaid_leaves || 0}
                        </td>

                        {/* Adjustment */}
                        <td className="py-3.5 px-3">
                          {renderAdjustmentTag(emp)}
                        </td>

                        {/* Net Salary */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                          {formatINR(emp.amount)}
                        </td>

                        {/* Proof Link / Upload */}
                        <td className="py-3.5 px-3 text-center">
                          {emp.proof_url ? (
                            <a
                              href={emp.proof_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-emerald-600 hover:text-emerald-700 inline-block"
                              title="View Payment Proof"
                            >
                              <FileText className="w-4 h-4" />
                            </a>
                          ) : (
                            <button
                              onClick={() => setProofRecord(emp)}
                              className="p-1 text-slate-300 hover:text-blue-600 transition-colors"
                              title="Upload Payment Proof"
                            >
                              <UploadCloud className="w-4 h-4" />
                            </button>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider",
                            emp.is_payslip_sent ? "bg-emerald-50 text-emerald-700" :
                            emp.status === 'Paid' ? "bg-blue-50 text-blue-700" :
                            "bg-slate-100 text-slate-600"
                          )}>
                            {emp.is_payslip_sent ? 'SENT' : emp.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingRecord(emp)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Adjustment"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleSendSingle(emp.id)}
                              disabled={sendingSingleId === emp.id}
                              className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Email Payslip PDF"
                            >
                              {sendingSingleId === emp.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer Summary & Action Controls */}
          <div className="p-6 bg-slate-50 border-t border-slate-200/80 space-y-4">
            {/* Metric Summary Row */}
            <div className="grid grid-cols-4 gap-2 text-center py-2 px-4 bg-white border border-slate-200/80 rounded-2xl">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">TOTAL EMPLOYEES</span>
                <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">{batch?.total_employees || 0}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">GROSS PAYROLL</span>
                <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">{formatINR(batch?.gross_payroll)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">ADJUSTMENTS</span>
                <span className={cn(
                  "text-xs font-bold font-mono mt-0.5 block",
                  (parseFloat(batch?.adjustments_total || 0)) >= 0 ? "text-emerald-600" : "text-rose-600"
                )}>
                  {(parseFloat(batch?.adjustments_total || 0)) >= 0 ? `+ ${formatINR(batch?.adjustments_total)}` : formatINR(batch?.adjustments_total)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">NET PAYROLL</span>
                <span className="text-xs font-bold text-blue-600 font-mono mt-0.5 block">{formatINR(batch?.net_payroll)}</span>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button variant="secondary" className="text-xs font-bold rounded-xl flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" /> Download Summary
                </Button>
              </div>

              {hasPermission('finance', 'payroll.manage') && (
                <Button
                  onClick={() => onSendBatchPayslips(batch?.id)}
                  disabled={isSendingBatch}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold px-5 py-2.5 flex items-center gap-2 shadow-sm"
                >
                  {isSendingBatch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Payslips to All
                </Button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Adjustment Modal */}
      {editingRecord && (
        <PayrollAdjustmentModal
          isOpen={Boolean(editingRecord)}
          onClose={() => setEditingRecord(null)}
          record={editingRecord}
          onSave={handleSaveAdjustment}
          isSaving={isSavingAdj}
        />
      )}

      {/* Proof Modal */}
      {proofRecord && (
        <PayrollProofModal
          isOpen={Boolean(proofRecord)}
          onClose={() => setProofRecord(null)}
          record={proofRecord}
          onUpload={handleUploadProofSubmit}
          isUploading={isUploadingProof}
        />
      )}
    </div>
  );
};

export default PayrollBatchDetailsDrawer;
