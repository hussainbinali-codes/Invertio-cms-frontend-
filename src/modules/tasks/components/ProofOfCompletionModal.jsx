import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Textarea from '../../../components/ui/Textarea';
import Button from '../../../components/ui/Button';
import { X, Loader2, CheckCircle2, UploadCloud, CheckSquare } from 'lucide-react';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';

const ProofOfCompletionModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  notes,
  completionNotes,
  setNotes,
  setCompletionNotes,
  files,
  completionFiles,
  setFiles,
  setCompletionFiles
}) => {
  useLockBodyScroll(isOpen);
  if (!isOpen) return null;

  const actualNotes = notes !== undefined ? notes : (completionNotes || '');
  const handleNotesChange = setNotes || setCompletionNotes || (() => {});
  const actualFiles = Array.isArray(files) ? files : (Array.isArray(completionFiles) ? completionFiles : []);
  const handleFilesChange = setFiles || setCompletionFiles || (() => {});

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900">
      <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[95vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between py-6 border-b border-slate-50 shrink-0">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              Proof of Completion
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">Please provide details and media of your work.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 duration-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Completion Notes</label>
            <Textarea 
              placeholder="Summarize the work done, results, or any important deployment notes..."
              className="min-h-[120px] text-sm"
              value={actualNotes}
              onChange={(e) => handleNotesChange(e.target.value)}
              required
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Media / Deliverables</label>
            </div>
            <div className="flex flex-col gap-3">
              <input 
                type="file" 
                multiple 
                id="proof-file-input"
                className="hidden" 
                onChange={(e) => handleFilesChange([...actualFiles, ...Array.from(e.target.files)])}
              />
              <Button 
                variant="outline" 
                className="w-full h-12 border-dashed border-2 border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer"
                onClick={() => document.getElementById('proof-file-input').click()}
              >
                <UploadCloud className="w-5 h-5 mr-2 text-primary-600" />
                {actualFiles.length > 0 ? `${actualFiles.length} Proof files attached` : "Upload Screenshots/Media"}
              </Button>
              
              {actualFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1">
                  {actualFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 bg-primary-50 px-3 py-1.5 rounded-lg text-[10px] font-bold text-primary-700 border border-primary-100">
                      <span className="truncate max-w-[120px]">{file.name}</span>
                      <button onClick={() => handleFilesChange(actualFiles.filter((_, idx) => idx !== i))} className="cursor-pointer">
                        <X className="w-3 h-3 hover:text-rose-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-50">
            <Button variant="ghost" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100"
              onClick={onSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <><CheckSquare className="w-4 h-4 mr-2" /> SUBMIT PROOF</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProofOfCompletionModal;
