import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Textarea from '../../../components/ui/Textarea';
import Button from '../../../components/ui/Button';
import { X, Loader2, CheckCircle2, UploadCloud, FileText } from 'lucide-react';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';

const InvoiceStatusModal = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  currentStatus,
  targetStatus,
  invoiceNumber
}) => {
  const [notes, setNotes] = useState('');
  const [proofFile, setProofFile] = useState(null);

  useLockBodyScroll(isOpen);
  if (!isOpen) return null;

  // The proof is only required if we are transitioning TO 'Paid' from a different status.
  const isTransitioningToPaid = targetStatus === 'Paid' && currentStatus !== 'Paid';
  const isValid = !isTransitioningToPaid || (notes.trim() !== '' && proofFile !== null);

  const handleSubmit = () => {
    if (isTransitioningToPaid && !isValid) return;
    onConfirm({
      status: targetStatus,
      notes,
      proof: proofFile
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 text-slate-900">
      <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        <CardHeader className="flex flex-row items-center justify-between py-6 border-b border-slate-50">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-primary-500" />
              Update Invoice Status
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">Changing {invoiceNumber} to <span className="font-bold text-primary-600">{targetStatus}</span></p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 duration-200">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Payment / Transaction Notes {isTransitioningToPaid && <span className="text-rose-500">*</span>}
            </label>
            <Textarea
              placeholder={isTransitioningToPaid ? "Enter payment reference, bank details (REQUIRED)..." : "Enter payment reference, bank details, or reason for status change..."}
              className={`min-h-[100px] text-sm ${isTransitioningToPaid && !notes.trim() ? 'border-rose-200 focus:ring-rose-500' : ''}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            {isTransitioningToPaid && !notes.trim() && (
              <p className="text-[10px] text-rose-500 font-bold italic">Notes are required when marking as PAID.</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Proof of Payment / Media {isTransitioningToPaid && <span className="text-rose-500">*</span>}
            </label>
            <div className="flex flex-col gap-3">
              <input
                type="file"
                id="invoice-proof-input"
                className="hidden"
                onChange={(e) => setProofFile(e.target.files[0])}
              />
              <Button
                variant="outline"
                className={`w-full h-12 border-dashed border-2 bg-slate-50/50 hover:bg-slate-50 ${isTransitioningToPaid && !proofFile ? 'border-rose-200' : 'border-slate-200'}`}
                onClick={() => document.getElementById('invoice-proof-input').click()}
              >
                <UploadCloud className={`w-5 h-5 mr-2 ${isTransitioningToPaid && !proofFile ? 'text-rose-500' : 'text-primary-600'}`} />
                {proofFile ? proofFile.name : "Upload Payment Receipt/Proof"}
              </Button>
              {isTransitioningToPaid && !proofFile && (
                <p className="text-[10px] text-rose-500 font-bold italic">Payment proof document is required.</p>
              )}

              {proofFile && (
                <div className="flex items-center justify-between bg-primary-50 px-3 py-2 rounded-lg text-[10px] font-bold text-primary-700 border border-primary-100">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="truncate">{proofFile.name}</span>
                  </div>
                  <button onClick={() => setProofFile(null)}>
                    <X className="w-3 h-3 hover:text-rose-500" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-50">
            <Button variant="ghost" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className={`flex-1 ${isValid ? 'bg-primary-600 hover:bg-primary-700' : 'bg-slate-400 cursor-not-allowed'} shadow-lg shadow-primary-100`}
              onClick={handleSubmit}
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "CONFIRM UPDATE"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>


  );
};

export default InvoiceStatusModal;
