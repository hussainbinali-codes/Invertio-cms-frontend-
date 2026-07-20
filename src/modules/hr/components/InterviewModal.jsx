import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { X, Clock, Loader2 } from 'lucide-react';

const InterviewModal = ({
  isOpen,
  onClose,
  selectedCandidate,
  roles,
  users,
  scheduleInterview,
  isSubmitting
}) => {
  useLockBodyScroll(isOpen);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900 overflow-y-auto">
      <Card className="w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[95vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between py-6 shrink-0">
          <div>
            <CardTitle className="text-xl font-bold font-sans tracking-tight text-slate-900">{selectedCandidate ? 'Schedule Interview' : 'Quick Register & Schedule'}</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Institutional talent evaluation workflow.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 duration-200">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto flex-1">
          <form onSubmit={scheduleInterview} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Candidate Name"
                name="candidate_name"
                placeholder="Full Name"
                defaultValue={selectedCandidate?.name || ''}
                disabled={!!selectedCandidate}
                required
              />
              <Input
                label="Candidate Email"
                name="candidate_email"
                type="email"
                placeholder="email@example.com"
                defaultValue={selectedCandidate?.email || ''}
                disabled={!!selectedCandidate}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Candidate Phone"
                name="candidate_phone"
                type="tel"
                pattern="\+?[0-9]{7,15}"
                placeholder="+15550192834"
                title="Please enter a valid phone number with country code (e.g., +15550192834 or +919876543210)"
                defaultValue={selectedCandidate?.phone || ''}
                disabled={!!selectedCandidate}
                required
              />
              <Input
                label="Target Designation"
                name="designation"
                placeholder="e.g. React Developer"
                defaultValue={selectedCandidate?.designation || ''}
                disabled={!!selectedCandidate}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Department</label>
                <Input
                  name="department"
                  placeholder="e.g. Engineering"
                  defaultValue={selectedCandidate?.department || ''}
                  disabled={!!selectedCandidate}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Future Role</label>
                <select
                  name="role_id"
                  defaultValue={selectedCandidate?.role_id || ''}
                  disabled={!!selectedCandidate}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  required
                >
                  <option value="">Select Role...</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <Input 
              label="Offered Salary" 
              name="salary" 
              type="number"
              min="0"
              placeholder="Monthly CTC" 
              defaultValue={selectedCandidate?.salary || ''}
              disabled={!!selectedCandidate}
              required
            />

            <div className="pt-4 border-t border-slate-100">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Schedule Interview Details</label>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Assign Interviewer</label>
                  <select
                    name="interviewer_id"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    required
                  >
                    <option value="">Select internal expert...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>

                <Input label="Interview Date & Time" name="date" type="datetime-local" required />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-6">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary-600 hover:bg-primary-700">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Clock className="w-4 h-4 mr-2" /> {selectedCandidate ? 'Confirm Schedule' : 'Register & Schedule'}</>}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InterviewModal;
