import React, { useState } from 'react';
import { cn } from '../../../utils/cn';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-3 sm:p-4 text-slate-900">
      <Card className="w-full max-w-3xl border border-slate-200/90 shadow-lg animate-in fade-in zoom-in duration-200 flex flex-col bg-white rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between py-3.5 px-5 sm:px-6 shrink-0 border-b border-slate-100 bg-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider border border-blue-100">Step 1 of 2</span>
              <CardTitle className="text-lg sm:text-xl font-bold font-sans tracking-tight text-slate-900">Add New Candidate</CardTitle>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-normal">Candidate registration & initial profile entry for recruitment pipeline.</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 bg-white">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Details Section */}
            <div className="space-y-2.5">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Personal Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Candidate Name"
                  name="name"
                  placeholder="e.g. John Doe"
                  className="py-2 px-3 text-xs sm:text-sm rounded-lg shadow-none"
                  required
                />
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  className="py-2 px-3 text-xs sm:text-sm rounded-lg shadow-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  pattern="\+?[0-9]{7,15}"
                  placeholder="+919876543210"
                  title="Please enter a valid phone number with country code"
                  className="py-2 px-3 text-xs sm:text-sm rounded-lg shadow-none"
                  required
                />
                <Input
                  label="Total Experience"
                  name="experience"
                  placeholder="e.g. 3.5 Years / Fresher"
                  className="py-2 px-3 text-xs sm:text-sm rounded-lg shadow-none"
                  required
                />
              </div>
            </div>

            {/* Compensation & Role Section */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Role & Compensation Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Target Designation"
                  name="designation"
                  placeholder="e.g. Frontend Developer"
                  className="py-2 px-3 text-xs sm:text-sm rounded-lg shadow-none"
                  required
                />
                <Input
                  label="Department"
                  name="department"
                  placeholder="e.g. Engineering"
                  className="py-2 px-3 text-xs sm:text-sm rounded-lg shadow-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Current CTC (Per Annum / Month)"
                  name="current_ctc"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 600000"
                  className="py-2 px-3 text-xs sm:text-sm rounded-lg shadow-none"
                />
                <Input
                  label="Expected CTC (Per Annum / Month)"
                  name="expected_ctc"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 900000"
                  className="py-2 px-3 text-xs sm:text-sm rounded-lg shadow-none"
                />
              </div>

              <div className={cn("grid grid-cols-1 gap-3", roles.length > 0 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
                <Input
                  label="Notice Period"
                  name="notice_period"
                  placeholder="e.g. Immediate / 30 Days"
                  className="py-2 px-3 text-xs sm:text-sm rounded-lg shadow-none"
                />
                {roles.length > 0 && (
                  <div className="w-full">
                    <label className="block text-sm font-semibold text-slate-800 mb-1.5">Future System Role</label>
                    <select
                      name="role_id"
                      className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-none cursor-pointer"
                    >
                      <option value="">Select Role (Optional)...</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="w-full">
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5 text-primary-600" /> Resume / CV File
                  </label>
                  <input
                    type="file"
                    name="resume"
                    accept=".pdf,.doc,.docx"
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400 font-normal italic">Candidate will be added in "Applied" stage.</span>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button type="button" variant="secondary" onClick={onClose} className="rounded-lg shadow-none border-slate-200 py-2 px-4 text-xs sm:text-sm">
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  onClick={() => setScheduleNext(false)}
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg shadow-none py-2 px-4 text-xs sm:text-sm whitespace-nowrap"
                >
                  {isSubmitting && !scheduleNext ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4 mr-1.5" /> Save Candidate</>}
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  onClick={() => setScheduleNext(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-none py-2 px-4 text-xs sm:text-sm whitespace-nowrap"
                >
                  {isSubmitting && scheduleNext ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Clock className="w-4 h-4 mr-1.5" /> Save & Schedule</>}
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
