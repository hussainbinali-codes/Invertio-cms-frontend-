import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { X, Loader2, UploadCloud, FileText } from 'lucide-react';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';

const PayrollProofModal = ({
  isOpen,
  onClose,
  record,
  onUpload,
  isUploading
}) => {
  useLockBodyScroll(isOpen);

  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState('');

  if (!isOpen || !record) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('status', 'Paid');
    if (file) formData.append('proof', file);
    if (notes) formData.append('notes', notes);
    onUpload(record.id, formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 text-slate-900">
      <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        <CardHeader className="flex flex-row items-center justify-between py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Upload Payment Proof</CardTitle>
              <p className="text-xs text-slate-500 font-medium">{record.employee_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Payment Receipt / Screenshot</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Transaction Notes / Reference</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. UTR / Bank Transfer Ref #129048"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={onClose} className="rounded-xl text-xs font-bold">
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold px-5">
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mark Paid & Upload Proof"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollProofModal;
