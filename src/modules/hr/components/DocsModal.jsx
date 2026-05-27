import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { X, Upload, Plus, Loader2, FileText, ExternalLink, Trash2 } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { BASE_URL } from '../../../api/baseUrl';

const DocsModal = ({
  isOpen,
  onClose,
  docsTarget,
  handleUploadDoc,
  isUploadingDoc,
  docsList,
  handleDeleteDoc,
  canManageConfidential
}) => {
  useLockBodyScroll(isOpen);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900">
      <Card className="w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between py-6 border-b border-slate-100">
          <div>
            <CardTitle className="text-xl font-bold">Personnel Records</CardTitle>
            <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wider">
              <span className="text-primary-600 font-bold">{docsTarget?.name}</span> • {docsTarget?.type === 'user' ? 'Employee Files' : 'Candidate Files'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 duration-200">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Upload Section */}
            <div className="md:col-span-1 space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Upload className="w-3 h-3" /> Upload New
                </h3>
                <form onSubmit={handleUploadDoc} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Doc Type</label>
                    <select 
                      name="doc_type" 
                      required 
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                      <option value="Resume">Resume</option>
                      <option value="Certificate">Certificate</option>
                      <option value="Offer Letter">Offer Letter</option>
                      <option value="Resignation">Resignation</option>
                      <option value="Appraisal">Appraisal</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Classification</label>
                    <select 
                      name="classification" 
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                      <option value="internal">Internal</option>
                      {canManageConfidential && <option value="confidential">Confidential</option>}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">File</label>
                    <input 
                      type="file" 
                      name="file" 
                      required 
                      className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" 
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-9 text-xs font-bold uppercase tracking-wider" 
                    disabled={isUploadingDoc}
                  >
                    {isUploadingDoc ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <><Plus className="w-3.5 h-3.5 mr-2" /> Add File</>}
                  </Button>
                </form>
              </div>
            </div>

            {/* Right: Docs List */}
            <div className="md:col-span-2 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <FileText className="w-3 h-3" /> Attached Documents ({docsList.length})
              </h3>
              {docsList.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
                  <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">No documents found for this profile.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {docsList.map(doc => (
                    <div key={doc.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between group hover:border-primary-200 hover:shadow-md transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-primary-600">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{doc.file_name || 'Untitled Document'}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0">{doc.doc_type}</Badge>
                            <Badge className={cn(
                              "text-[8px] font-bold uppercase py-0 px-1.5 h-4",
                              doc.classification === 'confidential' ? "bg-rose-100 text-rose-600 border-rose-200" : "bg-slate-100 text-slate-500 border-slate-200"
                            )}>
                              {doc.classification || 'INTERNAL'}
                            </Badge>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">{new Date(doc.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a 
                          href={doc.file_url || `${BASE_URL.replace('/api', '')}/${doc.file_key}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        <button 
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <Button variant="secondary" onClick={onClose} className="h-9 text-xs font-bold uppercase tracking-wider">Close</Button>
        </div>
      </Card>
    </div>
  );
};

export default DocsModal;
