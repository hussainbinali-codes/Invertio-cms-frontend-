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
    if (record) {
      setDaysAdjustment(parseFloat(record.days_adjustment || 0));
      setBonusAmount(parseFloat(record.bonus_deduction_amount || 0));
      setJustification(record.justification || '');
    }
  }, [record]);

  if (!isOpen || !record) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(record.id, {
      days_adjustment: parseFloat(daysAdjustment || 0),
      bonus_deduction_amount: parseFloat(bonusAmount || 0),
      justification
    });
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
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Button type="button" variant="secondary" onClick={onClose} className="rounded-xl text-xs font-bold">
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
