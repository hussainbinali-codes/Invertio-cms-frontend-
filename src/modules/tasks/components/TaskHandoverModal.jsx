import React, { useState } from 'react';
import { X, UserCheck, ArrowRight, Loader2, AlertCircle, Sparkles, Building2 } from 'lucide-react';
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <CardHeader className="p-5 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Task Handover & Reassignment</CardTitle>
              <p className="text-[11px] text-slate-500 line-clamp-1">{taskTitle || 'Reassign ongoing work'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            
            {/* Current vs Next Transfer Banner */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">From Previous Developer</span>
                <div className="font-bold text-slate-800 truncate mt-0.5">{currentAssigneeName || 'Unassigned'}</div>
                <div className="text-[10px] text-slate-500">{currentAssigneeRole || 'Team Member'}</div>
              </div>
              <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1 text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">To Next Assignee</span>
                <div className="font-bold text-blue-700 truncate mt-0.5">{selectedMember?.name || 'Select below...'}</div>
                <div className="text-[10px] text-slate-500">{selectedMember?.role_name || selectedMember?.role || 'Pending selection'}</div>
              </div>
            </div>

            {/* Next Assignee Selection */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Assign to Next Team Member <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
                className="w-full text-xs font-semibold text-slate-800 bg-white rounded-xl p-3 border border-slate-200 shadow-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Reason for Transition
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer",
                      reason === r
                        ? "bg-blue-50 text-blue-700 border-blue-200 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Work Done & Handover Notes */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Work Completed & Handover Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Describe what has been completed, what remains to be done, branch names, or instructions for the next developer..."
                className="w-full text-xs text-slate-800 rounded-xl border border-slate-200 p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none leading-relaxed placeholder-slate-400"
              />
              <p className="text-[10px] text-slate-400 mt-1">This note will appear in the task's Jira Activity Stream for the next developer.</p>
            </div>

            {/* Next Work Status */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Set Work Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'In Progress', label: 'In Progress', desc: 'Ready to continue work' },
                  { value: 'Pending', label: 'Pending', desc: 'Needs pickup / review' }
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setNextStatus(s.value)}
                    className={cn(
                      "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col",
                      nextStatus === s.value
                        ? "bg-blue-50 border-blue-200 text-blue-800 shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <span className="text-xs font-bold">{s.label}</span>
                    <span className="text-[10px] text-slate-400">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

          </CardContent>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              onClick={onClose}
              className="text-xs font-semibold text-slate-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !selectedUserId}
              className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 h-9 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  <span>Transferring...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5 mr-1.5" />
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
