import React from 'react';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { BASE_URL } from '../../../api/baseUrl';
import Badge from '../../../components/ui/Badge';
import Skeleton from '../../../components/ui/Skeleton';
import { X, Calendar, User, ClipboardList, Info, Clock, FolderOpen, Link, ExternalLink, FileText, CheckCircle2, Plus, Loader2 } from 'lucide-react';
import { cn } from '../../../utils/cn';
import ProjectResourcesModal from '../../projects/components/ProjectResourcesModal';
import Button from '../../../components/ui/Button';
import ProofOfCompletionModal from './ProofOfCompletionModal';
import toast from 'react-hot-toast';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';

const TaskDetailModal = ({ task, onClose, onUpdate }) => {
  useLockBodyScroll(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = (user?.role_name || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'super admin' || role === 'administrator';
  const canEdit = isAdmin || user?.modules?.tasks?.edit;
  const [taskData, setTaskData] = React.useState(task);

  const [showResources, setShowResources] = React.useState(false);
  const [documents, setDocuments] = React.useState([]);
  const [loadingDocs, setLoadingDocs] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editData, setEditData] = React.useState({
    status: task?.status || 'Pending',
    description: task?.description || '',
    priority: task?.priority || 'Medium'
  });
  const [currentStatus, setCurrentStatus] = React.useState(task?.status || 'Pending');
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  // Proof of Completion states
  const [showProofModal, setShowProofModal] = React.useState(false);
  const [completionNotes, setCompletionNotes] = React.useState('');
  const [completionFiles, setCompletionFiles] = React.useState([]);
  const [isSubmittingProof, setIsSubmittingProof] = React.useState(false);
  const taskId = taskData?.id || task?.id;

  React.useEffect(() => {
    if (task && task.id) {
        setTaskData(task);
        fetchTaskDocuments();
        setCurrentStatus(task.status);
        setEditData(prev => ({ ...prev, status: task.status, description: task.description, priority: task.priority }));
    }
  }, [task]);

  const fetchTaskDocuments = async () => {
    if (!taskId) return;
    setLoadingDocs(true);
    try {
        const res = await axios.get(`/projects/tasks/${taskId}/documents`);
        setDocuments(res.data.data || []);
    } catch (err) {
        console.error("Failed to fetch task documents", err);
    } finally {
        setLoadingDocs(false);
    }
  };

  const handleUpdateTask = async () => {
    setIsUpdating(true);
    try {
        await axios.patch(`/projects/tasks/${taskId}`, editData);
        const updatedTask = {
          ...taskData,
          ...editData,
          updated_at: new Date().toISOString()
        };
        setTaskData(updatedTask);
        setCurrentStatus(editData.status);
        setIsEditing(false);
        toast.success('Task details updated');
        if (onUpdate) onUpdate(updatedTask);
    } catch (err) {
        console.error("Failed to update task", err);
        toast.error("Failed to update task");
    } finally {
        setIsUpdating(false);
    }
  };

  const handleUploadFile = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }
    try {
        await axios.post(`/projects/tasks/${taskId}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success(`${files.length} document(s) uploaded`);
        fetchTaskDocuments();
    } catch (err) {
        console.error("Failed to upload file(s)", err);
        toast.error("Upload failed");
    } finally {
        setIsUploading(false);
        e.target.value = ''; // Reset input
    }
  };

  const handleQuickStatusUpdate = async (newStatus) => {
    if (newStatus === 'Completed') {
        setShowProofModal(true);
        return;
    }

    setIsUpdating(true);
    try {
        await axios.patch(`/projects/tasks/${taskId}`, { status: newStatus });
        setCurrentStatus(newStatus);
        setEditData(prev => ({ ...prev, status: newStatus }));
        const updatedTask = {
          ...taskData,
          status: newStatus,
          updated_at: new Date().toISOString()
        };
        setTaskData(updatedTask);
        toast.success(`Task status updated to ${newStatus}`);
        if (onUpdate) onUpdate(updatedTask);
    } catch (err) {
        console.error("Failed to update status", err);
        toast.error("Failed to update status");
    } finally {
        setIsUpdating(false);
    }
  };

  const submitCompletionProof = async () => {
    if (!completionNotes.trim()) {
      toast.error("Please provide completion notes as proof.");
      return;
    }

    setIsSubmittingProof(true);
    try {
      await axios.patch(`/projects/tasks/${taskId}`, {
        status: 'Completed',
        completion_notes: completionNotes,
        completion_date: new Date().toISOString()
      });

      if (completionFiles.length > 0) {
        const formData = new FormData();
        for (const file of completionFiles) {
          formData.append('files', file);
        }
        await axios.post(`/projects/tasks/${taskId}/documents`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      toast.success('Task completed with proof of work');
      setShowProofModal(false);
      setCompletionNotes('');
      setCompletionFiles([]);
      setCurrentStatus('Completed');
      setEditData(prev => ({ ...prev, status: 'Completed' }));
      const updatedTask = {
        ...taskData,
        status: 'Completed',
        completion_notes: completionNotes,
        completion_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setTaskData(updatedTask);
      fetchTaskDocuments();
      if (onUpdate) onUpdate(updatedTask);
    } catch (err) {
      toast.error('Failed to submit completion proof');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const completionTime = taskData?.completion_date ? new Date(taskData.completion_date).getTime() - 60000 : null;
  const initialDocs = documents.filter(d => !completionTime || new Date(d.created_at).getTime() < completionTime);
  const proofDocs = documents.filter(d => completionTime && new Date(d.created_at).getTime() >= completionTime);
  const showCompletionSection = taskData.status === 'Completed' && (Boolean(taskData.completion_notes) || proofDocs.length > 0);

  const renderDoc = (doc) => {
    const fileUrl = doc.file_url || `${BASE_URL.replace('/api', '')}/${doc.file_key}`;
    return (
        <a key={doc.id} href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:border-primary-200 transition-all group shadow-sm h-[60px]">
           <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-primary-50 transition-colors shrink-0">
              <FileText className="w-4 h-4 text-slate-400 group-hover:text-primary-500" />
           </div>
           <div className="overflow-hidden">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold text-slate-900 truncate max-w-[120px]">{doc.file_name}</p>
                <span className={cn(
                  "text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                  doc.classification === 'confidential' ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"
                )}>
                  {doc.classification || 'Internal'}
                </span>
              </div>
              <p className="text-[9px] text-slate-400">{(doc.file_size / 1024).toFixed(0)} KB</p>
           </div>
        </a>
    );
  };

  if (!taskData) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900">
      <Card className="w-full max-w-5xl shadow-2xl animate-in fade-in zoom-in duration-300 border-none flex flex-col max-h-[95vh] overflow-hidden">
        <CardHeader className="flex flex-row items-start sm:items-center justify-between bg-white border-b border-slate-100 py-5 sm:py-6 px-5 sm:px-8 shrink-0">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black tracking-tight text-slate-900">{taskData.title}</CardTitle>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
                  {taskData.project_name || 'Individual Task'}
                </Badge>
                <Badge 
                    variant={
                        currentStatus === 'Completed' ? 'success' : 
                        currentStatus === 'In Progress' ? 'primary' : 
                        'default'
                    }
                    className="text-[10px] font-bold uppercase tracking-wider"
                >
                    {currentStatus}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canEdit && !isEditing && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 text-[10px] font-bold uppercase border-slate-200"
                onClick={() => setIsEditing(true)}
              >
                Edit Details
              </Button>
            )}
            {isEditing && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 text-[10px] font-bold uppercase"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="h-9 text-[10px] font-bold uppercase"
                  onClick={handleUpdateTask}
                  disabled={isUpdating}
                >
                  {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
                </Button>
              </div>
            )}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-600 group"
            >
              <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 overflow-y-auto">
          <div className="flex flex-col md:flex-row">
            {/* Main Content */}
            <div className="md:w-2/3 p-5 sm:p-8 border-b md:border-b-0 md:border-r border-slate-50 min-h-[300px]">
              <div className="flex items-center gap-2 mb-4 text-slate-400">
                <Info className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Description & Details</span>
              </div>
              <div className="prose prose-slate max-w-none mb-8">
                {isEditing ? (
                  <textarea 
                    className="w-full p-4 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none min-h-[120px]"
                    value={editData.description}
                    onChange={(e) => setEditData({...editData, description: e.target.value})}
                  />
                ) : (
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm">
                     {taskData.description || "No detailed description provided for this task."}
                   </p>
                 )}
               </div>

              {taskData.task_references && taskData.task_references.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Link className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">References & Examples</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {taskData.task_references.map((ref, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{ref.title || 'Note'}</p>
                          <p className="text-xs font-medium text-slate-700 break-words leading-relaxed">{ref.value}</p>
                        </div>
                        {ref.value && (ref.value.startsWith('http') || ref.value.includes('.')) && (
                          <a 
                            href={ref.value.startsWith('http') ? ref.value : `https://${ref.value}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 bg-white rounded-lg shadow-sm text-primary-600 hover:bg-primary-50 transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(loadingDocs || initialDocs.length > 0 || canEdit) && (
                <div className="space-y-4 mt-8 pt-8 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-slate-400">
                    <FileText className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Initial Media & Assets</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {loadingDocs && (
                      <>
                        <Skeleton className="h-[60px] rounded-xl" />
                        <Skeleton className="h-[60px] rounded-xl" />
                      </>
                    )}
                    {/* {initialDocs.map(renderDoc)} */}
                    {documents.map(renderDoc)}
                    {canEdit && (
                      <div className="relative">
                        <input type="file" id="task-detail-upload" className="hidden" multiple onChange={handleUploadFile} disabled={isUploading} />
                        <label htmlFor="task-detail-upload" className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 border border-slate-200 border-dashed rounded-xl hover:bg-white hover:border-primary-300 transition-all cursor-pointer h-[60px]">
                          {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-primary-500" /> : <Plus className="w-4 h-4 text-slate-400" />}
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Add Resource</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {showCompletionSection && (
                <div className="space-y-4 mt-8 pt-8 border-t border-emerald-100 bg-emerald-50/20 -mx-5 sm:-mx-8 px-5 sm:px-8 pb-8">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Proof of Completion</span>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm space-y-4">
                    {taskData.completion_notes && (
                      <p className="text-sm text-slate-700 leading-relaxed italic border-l-2 border-emerald-200 pl-3">"{taskData.completion_notes}"</p>
                    )}
                     
                    {proofDocs.length > 0 && (
                      <div className="pt-2">
                        <div className="grid grid-cols-2 gap-3">
                          {proofDocs.map(renderDoc)}
                        </div>
                      </div>
                    )}

                    {taskData.completion_date && (
                      <div className="pt-2 flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        <Clock className="w-3 h-3" />
                        Completed on {new Date(taskData.completion_date).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Details */}
            <div className="md:w-1/3 bg-slate-50/50 p-5 sm:p-8 space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-3 text-slate-400">
                  <User className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Assignment & Impact</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center text-primary-700 text-xs font-black">
                       {(taskData.assigned_to_name || taskData.user_name || 'NA').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                       <div className="text-sm font-bold text-slate-900">{taskData.assigned_to_name || taskData.user_name || "Unassigned"}</div>
                       <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Primary Lead</div>
                      </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Priority</p>
                      {isEditing ? (
                        <select 
                          className="text-xs font-black uppercase tracking-wider text-slate-900 bg-transparent border-none p-0 focus:ring-0"
                          value={editData.priority}
                          onChange={(e) => setEditData({...editData, priority: e.target.value})}
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      ) : (
                        <p className={cn(
                          "text-xs font-black uppercase tracking-wider",
                           taskData.priority === 'Urgent' ? "text-rose-600" : 
                           taskData.priority === 'High' ? "text-amber-600" : 
                           "text-slate-600"
                         )}>{taskData.priority || 'Medium'}</p>
                       )}
                     </div>
                     <div className="text-right">
                       <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Complexity</p>
                       <p className="text-xs font-black text-slate-900">{taskData.story_points || 0} Points</p>
                     </div>
                   </div>
                  
                  {isAdmin && (
                    <div className="p-4 bg-primary-50/50 rounded-xl border border-primary-100 mt-4">
                       <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Update Status
                       </p>
                       <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: 'Start', value: 'Pending' },
                            { label: 'In Progress', value: 'In Progress' },
                            { label: 'Complete', value: 'Completed' },
                            { label: 'Cancel', value: 'Cancelled' }
                          ].map((s) => (
                             <button
                                key={s.value}
                                disabled={isUpdating}
                                onClick={() => handleQuickStatusUpdate(s.value)}
                                className={cn(
                                   "px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border",
                                   currentStatus === s.value
                                      ? "bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-200"
                                      : "bg-white text-slate-600 border-slate-200 hover:border-primary-300 hover:text-primary-600"
                                )}
                             >
                                {s.label}
                             </button>
                          ))}
                       </div>
                    </div>
                  )}

                  {isEditing && !isAdmin && (
                    <div className="p-3 bg-white rounded-xl border border-slate-100 mt-2">
                       <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Status</p>
                       <select 
                          className="w-full text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-50 rounded-lg p-2 border border-slate-100"
                          value={editData.status}
                          onChange={(e) => setEditData({...editData, status: e.target.value})}
                       >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                       </select>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3 text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Timeline</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Due Date</div>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <Calendar className="w-4 h-4 text-rose-400" />
                      {taskData.due_date ? new Date(taskData.due_date).toLocaleDateString() : "Flexible"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Last Activity</div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                      {taskData.updated_at ? new Date(taskData.updated_at).toLocaleDateString() : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <div className="bg-white border-t border-slate-50 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center px-5 sm:px-8 gap-3 shrink-0">
            <Button 
                variant="ghost" 
                className="w-full sm:w-auto text-primary-600 font-bold text-xs"
                onClick={() => setShowResources(true)}
            >
                <FolderOpen className="w-4 h-4 mr-2" />
                PROJECT RESOURCES
            </Button>
            <button 
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
                CLOSE DETAILS
            </button>
        </div>
      </Card>

      {showResources && (
        <ProjectResourcesModal 
          project={{ id: taskData.project_id, name: taskData.project_name }} 
          onClose={() => setShowResources(false)} 
        />
      )}

      <ProofOfCompletionModal 
        isOpen={showProofModal}
        onClose={() => setShowProofModal(false)}
        onSubmit={submitCompletionProof}
        isSubmitting={isSubmittingProof}
        completionNotes={completionNotes}
        setCompletionNotes={setCompletionNotes}
        completionFiles={completionFiles}
        setCompletionFiles={setCompletionFiles}
      />
    </div>
  );
};

export default TaskDetailModal;
