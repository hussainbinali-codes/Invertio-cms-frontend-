import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { X, Loader2, Edit3 } from 'lucide-react';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';

const PayrollAdjustmentModal = ({
  isOpen,
  onClose,
  record,
  onSave,
  isSaving
}) => {
  useLockBodyScroll(isOpen);

  const [daysAdjustment, setDaysAdjustment] = useState(0);
  const [bonusAmount, setBonusAmount] = useState(0);
  const [justification, setJustification] = useState('');

  useEffect(() => {
    if (isOpen && record) {
      setDaysAdjustment(parseFloat(record.days_adjustment || 0));
      setBonusAmount(parseFloat(record.bonus_deduction_amount || 0));
      setJustification(record.justification || '');
    }
  }, [isOpen, record]);

  if (!isOpen || !record) return null;

  const handleClose = () => {
    setDaysAdjustment(0);
    setBonusAmount(0);
    setJustification('');
    onClose();
  };

  const baseSalary = parseFloat(record.base_salary || 0);
  const workingDays = parseFloat(record.working_days || 22);
  const activeDays = parseFloat(record.active_days || workingDays);
  const paidLeaves = parseFloat(record.paid_leaves || 0);
  const unpaidLeaves = parseFloat(record.unpaid_leaves || 0);
  const attendancePresent = record.attendance_present_days !== null && record.attendance_present_days !== undefined
    ? parseFloat(record.attendance_present_days)
    : Math.max(0, activeDays - unpaidLeaves);

  const baseWorkedDays = attendancePresent + paidLeaves;
  const daysAdjNum = parseFloat(daysAdjustment || 0);
  const bonusNum = parseFloat(bonusAmount || 0);
  const targetWorkedDays = Math.max(0, baseWorkedDays + daysAdjNum);
  const perDayRate = workingDays > 0 ? (baseSalary / workingDays) : 0;
  const estimatedSalary = Math.max(0, (targetWorkedDays * perDayRate) + bonusNum);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(record.id, {
      days_adjustment: daysAdjNum,
      bonus_deduction_amount: bonusNum,
      justification
    });
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 text-slate-900">
      <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        <CardHeader className="flex flex-row items-center justify-between py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Adjust Salary</CardTitle>
              <p className="text-xs text-slate-500 font-medium">{record.employee_name} ({record.employee_designation || 'Team Member'})</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            {baseSalary === 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
                ⚠️ <strong>Notice:</strong> This employee's Base Salary is set to ₹0 in their profile. Update their salary profile to calculate Net Salary correctly.
              </div>
            )}

            {/* Realtime Math Preview Box */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Base Worked Days:</span>
                <span className="font-mono font-bold text-slate-900">{baseWorkedDays} days</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Resulting Worked Days:</span>
                <span className="font-mono font-bold text-blue-600">{targetWorkedDays} days</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Daily Salary Rate:</span>
                <span className="font-mono font-bold text-slate-900">₹{perDayRate.toFixed(2)}/day</span>
              </div>
              <div className="border-t border-slate-200 pt-1.5 flex justify-between items-center font-bold">
                <span className="text-slate-800">Estimated Net Salary:</span>
                <span className="font-mono text-emerald-600 text-sm">₹{estimatedSalary.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Days Adjustment (+/- Days)</label>
              <input
                type="number"
                step="0.5"
                value={daysAdjustment}
                onChange={(e) => setDaysAdjustment(e.target.value)}
                placeholder="e.g. +1.0 or -0.5"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <p className="text-[10px] text-slate-400 font-medium">Add (+) or deduct (-) working days value.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Bonus / Extra Deduction (₹ Amount)</label>
              <input
                type="number"
                step="100"
                value={bonusAmount}
                onChange={(e) => setBonusAmount(e.target.value)}
                placeholder="e.g. +5000 or -1000"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <p className="text-[10px] text-slate-400 font-medium">Enter positive for bonus or negative for deduction.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Justification Note</label>
              <textarea
                rows="3"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Required justification for payroll adjustment..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={handleClose} className="rounded-xl text-xs font-bold">
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold px-5">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Adjustment"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollAdjustmentModal;
