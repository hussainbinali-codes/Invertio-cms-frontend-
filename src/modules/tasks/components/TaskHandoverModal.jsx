import React, { useState } from 'react';
import { X, UserCheck, ArrowRight, Loader2, Sparkles, User, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';

const PRESET_REASONS = [
  'Moved to another project',
  'Work partially completed',
  'Resource reallocation',
  'Specialized domain handoff',
  'Sprint priority change'
];

const TaskHandoverModal = ({
  isOpen,
  onClose,
  taskTitle,
  currentAssigneeName,
  currentAssigneeRole,
  currentAssigneeId,
  assignableUsers = [],
  currentStatus = 'In Progress',
  onSubmit,
  isSubmitting = false
}) => {
  useLockBodyScroll(isOpen);

  const [selectedUserId, setSelectedUserId] = useState('');
  const [reason, setReason] = useState(PRESET_REASONS[0]);
  const [notes, setNotes] = useState('');
  const [nextStatus, setNextStatus] = useState(currentStatus === 'Completed' ? 'In Progress' : currentStatus);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    onSubmit({
      newAssigneeId: selectedUserId,
      reason,
      notes: notes.trim(),
      nextStatus
    });
  };

  const selectedMember = assignableUsers.find(u => String(u.id) === String(selectedUserId));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200 font-sans">
      <Card className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100/90 overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <CardHeader className="px-6 sm:px-7 py-5 border-b border-slate-100 flex flex-row items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <UserCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                Task Handover & Reassignment
              </CardTitle>
              <p className="text-xs text-slate-500 font-normal truncate mt-0.5">
                {taskTitle || 'Reassign ongoing work to team member'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        {/* Body Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <CardContent className="px-6 sm:px-7 py-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-white">

            {/* Current vs Next Transfer Banner */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-blue-50/20 to-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4 text-xs shadow-2xs">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Current Assignee
                </span>
                <div className="font-bold text-slate-900 text-sm truncate mt-1">
                  {currentAssigneeName || 'Unassigned'}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {currentAssigneeRole || 'Team Member'}
                </div>
              </div>

              <div className="w-9 h-9 rounded-2xl bg-white shadow-xs border border-slate-200/80 text-blue-600 flex items-center justify-center shrink-0">
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </div>

              <div className="min-w-0 flex-1 text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Next Assignee
                </span>
                <div className="font-bold text-blue-600 text-sm truncate mt-1">
                  {selectedMember?.name || 'Select below...'}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {selectedMember?.role_name || selectedMember?.role || selectedMember?.designation || 'Pending selection'}
                </div>
              </div>
            </div>

            {/* Next Assignee Selection */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-2">
                Assign to Next Team Member <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
                className="w-full text-xs font-semibold text-slate-800 bg-white rounded-xl h-11 px-3.5 border border-slate-200/90 shadow-2xs focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all cursor-pointer"
              >
                <option value="">-- Select Team Member --</option>
                {assignableUsers
                  .filter(u => String(u.id) !== String(currentAssigneeId))
                  .map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} {member.role_name || member.role || member.designation ? `• ${member.role_name || member.role || member.designation}` : ''}
                    </option>
                  ))}
              </select>
            </div>

            {/* Handover Reason Pills */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-2.5">
                Reason for Transition
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none active:scale-95",
                      reason === r
                        ? "bg-blue-50 text-blue-700 border-blue-300 shadow-2xs font-bold ring-1 ring-blue-200"
                        : "bg-slate-50/70 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Work Done & Handover Notes */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-2">
                Work Completed & Handover Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Describe what has been completed, what remains to be done, branch names, or instructions for the next developer..."
                className="w-full text-xs text-slate-800 rounded-2xl border border-slate-200/90 p-3.5 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none resize-none leading-relaxed placeholder-slate-400 transition-all shadow-2xs"
              />
              <p className="text-[11px] text-slate-400 mt-1.5 leading-normal">
                This note will be logged in the task&apos;s activity stream for the next developer to review.
              </p>
            </div>

            {/* Next Work Status */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-2">
                Set Work Status
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'In Progress', label: 'In Progress', desc: 'Ready for developer to continue' },
                  { value: 'Pending', label: 'Pending', desc: 'Needs pickup or review' }
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setNextStatus(s.value)}
                    className={cn(
                      "p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-center gap-0.5 select-none",
                      nextStatus === s.value
                        ? "bg-blue-50/80 border-blue-300 text-blue-900 shadow-2xs ring-1 ring-blue-200 font-bold"
                        : "bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100/70"
                    )}
                  >
                    <span className="text-xs font-bold text-slate-900">{s.label}</span>
                    <span className="text-[11px] text-slate-500 font-normal">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

          </CardContent>

          {/* Footer Actions */}
          <div className="px-6 sm:px-7 py-4.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              onClick={onClose}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 h-10 px-4 rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedUserId}
              className="text-xs font-bold bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-5 h-10 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transferring...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 stroke-[2.2]" />
                  <span>Confirm Handover & Reassign</span>
                </>
              )}
            </Button>
          </div>
        </form>

      </Card>
    </div>
  );
};

export default TaskHandoverModal;
