import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { X, Loader2 } from 'lucide-react';

const PerformanceActionModal = ({
  isOpen,
  onClose,
  perfModalType,
  selectedUserForPerf,
  handlePerfSubmit,
  isSubmitting
}) => {
  useLockBodyScroll(isOpen);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900">
      <Card className="w-full max-w-xl shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[95vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between py-6 shrink-0">
          <div>
            <CardTitle className="text-xl font-bold">
              {perfModalType === 'rating' ? 'Employee Performance Review' : 
               perfModalType === 'bonus' ? 'Issue Financial Bonus' : 'Process Salary Hike'}
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5 font-medium uppercase tracking-wider">Target: {selectedUserForPerf?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 duration-200">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto flex-1">
          <form onSubmit={handlePerfSubmit} className="space-y-4">
            {perfModalType === 'rating' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Review Period</label>
                  <select name="period" required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white">
                    <option value="Q1 2026">Q1 2026</option>
                    <option value="Q2 2026">Q2 2026</option>
                    <option value="Q3 2026">Q3 2026</option>
                    <option value="Q4 2026">Q4 2026</option>
                    <option value="Annual 2025">Annual 2025</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Rating (1-5)</label>
                  <select name="rating" required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white">
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Evaluation Comments</label>
                  <textarea name="comments" rows={4} required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none" placeholder="Detail the performance highlights and growth areas..." />
                </div>
              </>
            )}

            {perfModalType === 'bonus' && (
              <>
                <Input label="Bonus Amount" name="amount" type="number" min="0" step="0.01" required placeholder="0.00" />
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Bonus Category</label>
                  <select name="bonus_type" required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white">
                    <option value="Quarterly Performance">Quarterly Performance</option>
                    <option value="Annual Profit Share">Annual Profit Share</option>
                    <option value="Spot Award">Spot Award</option>
                    <option value="Referral Bonus">Referral Bonus</option>
                  </select>
                </div>
                <Input label="Payout Date" name="payout_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                <Input label="Justification / Reason" name="reason" required placeholder="e.g. Exceptional delivery on Project X" />
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Supporting Document</label>
                  <input 
                    type="file" 
                    name="file" 
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" 
                  />
                </div>
              </>
            )}

            {perfModalType === 'hike' && (
              <>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Salary</div>
                  <div className="text-lg font-bold text-slate-900">₹{parseFloat(selectedUserForPerf?.salary || 0).toLocaleString()}</div>
                </div>
                <Input label="New Base Salary" name="new_salary" type="number" min="0" step="0.01" required placeholder="Enter new salary amount" />
                <Input label="Effective Date" name="effective_date" type="date" required />
                <Input label="Hike Justification" name="reason" required placeholder="e.g. Annual Appraisal / Promotion" />
              </>
            )}

            <div className="flex gap-3 justify-end pt-6">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary-600 hover:bg-primary-700">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log Record'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceActionModal;
