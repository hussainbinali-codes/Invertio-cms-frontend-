import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { X, Clock, Loader2, User, Mail, Phone, Briefcase } from 'lucide-react';

const InterviewModal = ({
  isOpen,
  onClose,
  selectedCandidate,
  roles = [],
  users = [],
  scheduleInterview,
  isSubmitting
}) => {
  useLockBodyScroll(isOpen);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-3 sm:p-4 text-slate-900">
      <Card className="w-full max-w-xl bg-white rounded-2xl shadow-lg border border-slate-200/80 overflow-hidden flex flex-col">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-6 shrink-0 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
                {selectedCandidate ? 'Step 2 of 2' : 'Quick Schedule'}
              </span>
              <CardTitle className="text-lg font-bold font-sans tracking-tight text-slate-900">
                {selectedCandidate ? 'Schedule Interview' : 'Quick Register & Schedule'}
              </CardTitle>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {selectedCandidate
                ? `Assign an interviewer and select date & time for ${selectedCandidate.name}.`
                : 'Register candidate profile and assign interview schedule in one step.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        {/* Content */}
        <CardContent className="p-5 sm:p-6">
          <form onSubmit={scheduleInterview} className="space-y-4">
            {selectedCandidate ? (
              <>
                {/* Hidden inputs to preserve all form data keys */}
                <input type="hidden" name="candidate_name" value={selectedCandidate.name || ''} />
                <input type="hidden" name="candidate_email" value={selectedCandidate.email || ''} />
                <input type="hidden" name="candidate_phone" value={selectedCandidate.phone || ''} />
                <input type="hidden" name="designation" value={selectedCandidate.designation || ''} />
                <input type="hidden" name="department" value={selectedCandidate.department || ''} />
                <input type="hidden" name="role_id" value={selectedCandidate.role_id || ''} />
                <input type="hidden" name="salary" value={selectedCandidate.salary || ''} />

                {/* Candidate Overview Card */}
                <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Candidate Details</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
                      {selectedCandidate.stage || 'Applied'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-900 truncate">{selectedCandidate.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-600 truncate">{selectedCandidate.email}</span>
                    </div>
                    {selectedCandidate.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-600 truncate">{selectedCandidate.phone}</span>
                      </div>
                    )}
                    {(selectedCandidate.designation || selectedCandidate.department) && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-600 truncate">
                          {selectedCandidate.designation} {selectedCandidate.department ? `• ${selectedCandidate.department}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Interview Scheduling Fields */}
                <div className="space-y-3.5 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Assign Interviewer <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="interviewer_id"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      required
                      defaultValue=""
                    >
                      <option value="" disabled>Select internal expert / interviewer...</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Input
                      label="Interview Date & Time"
                      name="date"
                      type="datetime-local"
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Fallback for Direct Schedule (when no candidate is selected beforehand) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Candidate Name" name="candidate_name" placeholder="Full Name" required />
                  <Input label="Email Address" name="candidate_email" type="email" placeholder="name@example.com" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Phone Number" name="candidate_phone" type="tel" placeholder="+919876543210" required />
                  <Input label="Designation" name="designation" placeholder="e.g. Frontend Developer" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Department" name="department" placeholder="e.g. Engineering" required />
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Role</label>
                    <select
                      name="role_id"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      required
                      defaultValue=""
                    >
                      <option value="" disabled>Select Role...</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Input label="Offered Salary" name="salary" type="number" min="0" placeholder="Monthly CTC" required />

                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Assign Interviewer <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="interviewer_id"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      required
                      defaultValue=""
                    >
                      <option value="" disabled>Select interviewer...</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                  <Input label="Interview Date & Time" name="date" type="datetime-local" required />
                </div>
              </>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="rounded-lg shadow-none border-slate-200 py-2 px-4 text-xs sm:text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-none py-2 px-4 text-xs sm:text-sm whitespace-nowrap"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-1.5" />
                    {selectedCandidate ? 'Confirm Schedule' : 'Register & Schedule'}
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

export default InterviewModal;
