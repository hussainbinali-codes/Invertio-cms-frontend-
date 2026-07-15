import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Skeleton from '../../../components/ui/Skeleton';
import {
  X,
  Clock,
  Edit,
  Globe,
  Shield,
  MessageSquare,
  Phone,
  Mail,
  Users,
  Zap,
  Folder,
  FileText,
  UploadCloud,
  ExternalLink,
  Trash2,
  Loader2
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { hasPermission } from '../../../utils/permissionUtils';
import { BASE_URL } from '../../../api/baseUrl';

const ClientDetailModal = ({
  isOpen,
  onClose,
  selectedClient,
  activeDetailTab,
  setActiveDetailTab,
  getAvatarColor,
  getStageColor,
  handleDeleteDocument,
  logInteraction,
  logs,
  logsLoading,
  documents,
  docLoading,
  handleUpload,
  isUploading,
  uploadClassification,
  setUploadClassification,
  canManageConfidential,
  setShowDetailModal,
  setEditingClient,
  setShowEditModal,
  PIPELINE_STAGES,
  CURRENCIES
}) => {
  useLockBodyScroll(isOpen);
  const activityEndRef = React.useRef(null);

  const scrollToBottom = () => {
    activityEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    if (activeDetailTab === 'Activity') {
      scrollToBottom();
    }
  }, [logs, activeDetailTab]);

  if (!isOpen || !selectedClient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900 overflow-y-auto">
      <Card className="w-full max-w-7xl shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden h-[95vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between py-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm", getAvatarColor(selectedClient.id))}>
              {selectedClient.company_name?.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-bold">{selectedClient.company_name}</CardTitle>
                <Badge className={cn("text-xs font-semibold text-slate-500", getStageColor(selectedClient.lifecycle_stage))}>
                  {selectedClient.lifecycle_stage}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{selectedClient.contact_person} • {selectedClient.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 duration-200 bg-slate-50 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>
        
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-6">
          {['Overview', 'Activity', 'Files'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveDetailTab(tab)}
              className={cn(
                "py-3 px-6 text-sm font-bold uppercase tracking-wider transition-all border-b-2",
                activeDetailTab === tab 
                  ? "border-primary-500 text-primary-600 bg-white" 
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <CardContent className="p-0 flex-1 overflow-hidden bg-white">
          {activeDetailTab === 'Overview' && (
            <div className="h-full overflow-y-auto p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Company Details</label>
                      <div className="space-y-3 mt-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 font-medium">Industry</span>
                          <span className="text-slate-900 font-bold">{selectedClient.industry || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 font-medium">Website</span>
                          <a href={selectedClient.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 font-bold hover:underline flex items-center gap-1">
                            {selectedClient.website ? 'Visit Site' : 'N/A'} {selectedClient.website && <ExternalLink className="w-3 h-3" />}
                          </a>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 font-medium">Country</span>
                          <span className="text-slate-900 font-bold">{selectedClient.country || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Contact Info</label>
                      <div className="space-y-3 mt-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 font-medium">Name</span>
                          <span className="text-slate-900 font-bold">{selectedClient.contact_person || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 font-medium">Phone</span>
                          <span className="text-slate-900 font-bold">{selectedClient.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 font-medium">Source</span>
                          <span className="text-emerald-600 font-bold uppercase text-[10px] tracking-tight">{selectedClient.lead_source || 'Direct'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-primary-50/30 rounded-2xl border border-primary-100">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-primary-700 uppercase">Sales Potential</span>
                          <span className="text-lg font-bold text-primary-900">{selectedClient.currency || 'USD'} {selectedClient.expected_value?.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-2 bg-primary-200 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-600" style={{ width: `${selectedClient.lead_score || 0}%` }} />
                        </div>
                        <div className="flex justify-between mt-1.5">
                          <span className="text-[10px] font-bold text-primary-500 uppercase">Lead Quality</span>
                          <span className="text-[10px] font-bold text-primary-700 uppercase">{selectedClient.lead_score || 0}% Quality Score</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5" />
                      Business Address
                    </h3>
                    <p className="p-4 bg-slate-50 rounded-xl text-sm font-medium text-slate-600 border border-slate-100 leading-relaxed">
                      {selectedClient.address || 'No physical address provided.'}
                      {selectedClient.city && ` • ${selectedClient.city}`}
                      {selectedClient.zip_code && ` (${selectedClient.zip_code})`}
                    </p>
                  </div>
                </div>

                {/* Quick Stats Sidebar */}
                <div className="space-y-6">
                  <div className="p-5 bg-slate-900 rounded-2xl text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-white/10 rounded-lg">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-semibold text-slate-400">Timeline</span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Created On</div>
                        <div className="text-sm font-bold">{new Date(selectedClient.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Last Update</div>
                        <div className="text-sm font-bold text-primary-400">Recently updated</div>
                      </div>
                      <div className="pt-4 border-t border-white/10 mt-4">
                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Project Status</div>
                        <Badge variant="outline" className={cn("text-xs font-semibold text-slate-500 border-white/20", 
                          selectedClient.maintenance_status === 'Active' ? "text-emerald-400" : "text-slate-400"
                        )}>
                          {selectedClient.maintenance_status || 'NOT APPLICABLE'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-12 font-bold text-slate-700"
                    disabled={selectedClient.lead_status === 'Not Interested'}
                    onClick={() => { setShowDetailModal(false); setEditingClient(selectedClient); setShowEditModal(true); }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Client Profile
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeDetailTab === 'Activity' && (
            <div className="flex flex-col md:flex-row h-full overflow-hidden">
              <div className="w-full md:w-80 p-6 border-r border-slate-100 bg-slate-50 overflow-y-auto">
                {hasPermission('clients', 'interactions.create') && selectedClient.lead_status !== 'Not Interested' ? (
                  <form onSubmit={logInteraction} className="space-y-4">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Log New Activity</h3>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
                      <select name="type" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                        <option value="Call">Call</option>
                        <option value="Email">Email</option>
                        <option value="Meeting">Meeting</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Notes</label>
                      <textarea
                        name="notes"
                        rows={8}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white resize-none"
                        placeholder="Detail of the conversation..."
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full shadow-lg shadow-primary-200">Save Log Entry</Button>
                  </form>
                ) : (
                  <div className="text-center p-8 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <Shield className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {selectedClient.lead_status === 'Not Interested' ? 'Archived (Not Interested)' : 'Read Only'}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex-1 p-8 overflow-y-auto bg-white">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                    Activity Timeline
                  </h3>
                  <Badge variant="secondary" className="font-bold">{logs.length} Entries</Badge>
                </div>
                {logsLoading ? (
                  <div className="space-y-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex gap-4">
                        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                        <Skeleton className="h-32 w-full rounded-2xl" />
                      </div>
                    ))}
                  </div>
                ) : logs.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <Zap className="w-8 h-8 text-slate-200" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">No activity logged yet</p>
                    <p className="text-xs text-slate-400 mt-1">Start by recording your first client interaction.</p>
                  </div>
                ) : (
                  <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                    {logs.map((log) => (
                      <div key={log.id} className="relative pl-12 group">
                        <div className={cn(
                          "absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center text-white z-10 shadow-md group-hover:scale-110 transition-transform duration-200",
                          log.type === 'Call' ? "bg-blue-500" : log.type === 'Email' ? "bg-amber-500" : "bg-emerald-500"
                        )}>
                          {log.type === 'Call' ? <Phone className="w-4 h-4" /> : log.type === 'Email' ? <Mail className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                        </div>
                        <div className="p-6 rounded-2xl border border-slate-100 bg-white group-hover:border-slate-200 group-hover:shadow-sm transition-all duration-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-normal text-slate-900 uppercase tracking-wide">{log.type}</span>
                              {log.stage && (
                                <Badge variant="outline" className="text-xs font-semibold text-slate-500 tracking-tight px-1.5 border-slate-200 text-slate-500">
                                  Stage: {log.stage}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 font-medium">{new Date(log.date || log.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed font-medium">"{log.notes}"</p>
                        </div>
                      </div>
                    ))}
                    <div ref={activityEndRef} />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeDetailTab === 'Files' && (
            <div className="h-full flex flex-col bg-slate-50/30">
              <div className="p-8 bg-white border-b border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="max-w-md">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Folder className="w-5 h-5 text-primary-500" />
                      Document Repository
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Store contracts, proposals, and project specifications securely.</p>
                  </div>
                  {selectedClient.lead_status !== 'Not Interested' && (
                    <div className="flex items-center gap-3">
                      <select 
                        className="text-[10px] font-bold border border-slate-200 rounded-lg bg-white p-2 focus:ring-primary-500 focus:border-primary-500 outline-none uppercase"
                        value={uploadClassification}
                        onChange={(e) => setUploadClassification(e.target.value)}
                      >
                        <option value="internal">Internal</option>
                        {canManageConfidential && <option value="confidential">Confidential</option>}
                      </select>
                      <input type="file" id="doc-upload-unified" className="hidden" multiple onChange={handleUpload} disabled={isUploading} />
                      <label htmlFor="doc-upload-unified" className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-bold cursor-pointer transition-all shadow-md shadow-primary-200">
                        {isUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <UploadCloud className="w-4 h-4 mr-2" />
                        )}
                        {isUploading ? "Uploading..." : "Upload New File"}
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {docLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
                  </div>
                ) : documents.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <FileText className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Archive Empty</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-xs">There are no files attached to this client record yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 hover:border-primary-200 hover:shadow-lg transition-all group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:text-primary-500 transition-colors">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <a 
                              href={doc.file_url || `${BASE_URL.replace('/api', '')}/${doc.file_key}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-sm font-semibold text-slate-900 hover:text-primary-600 transition-colors flex items-center gap-2"
                            >
                              {doc.file_name}
                              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              <Badge className={cn(
                                "text-[8px] font-bold uppercase py-0 px-1.5 h-4",
                                doc.classification === 'confidential' ? "bg-rose-100 text-rose-600 border-rose-200" : "bg-slate-100 text-slate-500 border-slate-200"
                              )}>
                                {doc.classification || 'INTERNAL'}
                              </Badge>
                            </a>
                            <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                              <span>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                              <span className="text-slate-200">•</span>
                              <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                              {doc.stage && (
                                <>
                                  <span className="text-slate-200">•</span>
                                  <span className="text-primary-600">{doc.stage}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {hasPermission('clients', 'documents.delete') && selectedClient.lead_status !== 'Not Interested' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 w-9 p-0 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full" 
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientDetailModal;
