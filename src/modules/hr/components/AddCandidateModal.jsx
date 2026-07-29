import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { X, UserPlus, Upload, Clock, Loader2 } from 'lucide-react';

const AddCandidateModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  roles = []
}) => {
  useLockBodyScroll(isOpen);

  const [scheduleNext, setScheduleNext] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    onSubmit(formData, scheduleNext);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900 overflow-y-auto">
      <Card className="w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[95vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between py-6 shrink-0 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider border border-blue-100">Step 1 of 2</span>
              <CardTitle className="text-xl font-bold font-sans tracking-tight text-slate-900">Add New Candidate</CardTitle>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Candidate registration & initial profile entry for recruitment pipeline.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 duration-200">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Personal Details Section */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                Personal Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Candidate Name"
                  name="name"
                  placeholder="e.g. John Doe"
                  required
                />
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  pattern="\+?[0-9]{7,15}"
                  placeholder="+919876543210"
                  title="Please enter a valid phone number with country code"
                  required
                />
                <Input
                  label="Total Experience"
                  name="experience"
                  placeholder="e.g. 3.5 Years / Fresher"
                  required
                />
              </div>
            </div>

            {/* Compensation & CTC Section */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                Compensation Details (CTC)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Current CTC (Per Annum / Month)"
                  name="current_ctc"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 600000"
                />
                <Input
                  label="Expected CTC (Per Annum / Month)"
                  name="expected_ctc"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 900000"
                />
              </div>
            </div>

            {/* Role & Resume Section */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                Target Role & Resume Upload
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Target Designation"
                  name="designation"
                  placeholder="e.g. Frontend Developer"
                  required
                />
                <Input
                  label="Department"
                  name="department"
                  placeholder="e.g. Engineering"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Notice Period"
                  name="notice_period"
                  placeholder="e.g. Immediate / 30 Days"
                />
                {roles.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Future System Role</label>
                    <select
                      name="role_id"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                      <option value="">Select Role (Optional)...</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5 text-primary-600" /> Resume / CV File (PDF / DOC)
                </label>
                <input
                  type="file"
                  name="resume"
                  accept=".pdf,.doc,.docx"
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200/60">
              <span className="text-xs text-slate-500 font-medium italic">Candidate will be added in "Applied" stage.</span>
              
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  onClick={() => setScheduleNext(false)}
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  {isSubmitting && !scheduleNext ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4 mr-1.5" /> Save Candidate</>}
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  onClick={() => setScheduleNext(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting && scheduleNext ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Clock className="w-4 h-4 mr-1.5" /> Save & Schedule Interview</>}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddCandidateModal;
