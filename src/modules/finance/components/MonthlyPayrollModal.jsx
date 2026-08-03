import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { X, Loader2, Calendar } from 'lucide-react';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const MonthlyPayrollModal = ({
  isOpen,
  onClose,
  onGenerate,
  isGenerating
}) => {
  useLockBodyScroll(isOpen);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate({ month: parseInt(month, 10), year: parseInt(year, 10) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 text-slate-900">
      <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        <CardHeader className="flex flex-row items-center justify-between py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Generate Monthly Payroll</CardTitle>
              <p className="text-xs text-slate-500 font-medium">Auto-calculate payroll for all active employees.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Year</label>
              <input
                type="number"
                min="2020"
                max="2030"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              />
            </div>

            <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-700 space-y-1 font-medium">
              <p>⚡ <strong>Automatic Payroll Engine Rules:</strong></p>
              <ul className="list-disc list-inside text-[11px] text-blue-600 space-y-0.5 font-normal">
                <li>Fetches working days excluding weekends & company holidays.</li>
                <li>Applies 1 paid leave max policy per employee.</li>
                <li>Prorates mid-month joining dates automatically.</li>
              </ul>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={onClose} className="rounded-xl text-xs font-bold">
                Cancel
              </Button>
              <Button type="submit" disabled={isGenerating} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold px-5">
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Run Monthly Payroll"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyPayrollModal;
