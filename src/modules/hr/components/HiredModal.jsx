import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { X, UserCheck, Loader2 } from 'lucide-react';

const HiredModal = ({
  isOpen,
  onClose,
  onSubmit,
  candidateName,
  joiningDate,
  setJoiningDate,
  isSubmitting
}) => {
  useLockBodyScroll(isOpen);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900 animate-in fade-in duration-200">
      <Card className="w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
        <CardHeader className="flex flex-row items-center justify-between py-6">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-emerald-600" />
              Confirm Hire
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Finalize hiring for <span className="font-bold text-slate-700">{candidateName}</span>.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 duration-200">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-500 leading-relaxed">
              Upon confirming, a new employee record and user profile will be created automatically. Please specify their official joining date.
            </div>
            
            <Input 
              label="Joining Date" 
              name="joining_date" 
              type="date" 
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              required 
            />

            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 mr-2" /> Confirm & Hire
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default HiredModal;
