import React from 'react';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { BASE_URL } from '../../../api/baseUrl';
import Badge from '../../../components/ui/Badge';
import Skeleton from '../../../components/ui/Skeleton';
import { X, Calendar, User, ClipboardList, Info, Clock, FolderOpen, Link, ExternalLink, FileText, CheckCircle2, Plus, Loader2, GitBranch, Trash2 } from 'lucide-react';
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
  const [activities, setActivities] = React.useState([]);
  const [assignableUsers, setAssignableUsers] = React.useState([]);
  const [loadingDocs, setLoadingDocs] = React.useState(false);
  const [loadingActivities, setLoadingActivities] = React.useState(false);
  const [loadingUsers, setLoadingUsers] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editData, setEditData] = React.useState({
    status: task?.status || 'Pending',
    description: task?.description || '',
    priority: task?.priority || 'Medium',
    assigned_to: task?.assigned_to || '',
    progress_note: ''
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

  // Sub Tasks states
  const [subTasks, setSubTasks] = React.useState([]);
  const [loadingSubTasks, setLoadingSubTasks] = React.useState(false);
  const [showAddSubTask, setShowAddSubTask] = React.useState(false);
  const [newSubTask, setNewSubTask] = React.useState({ title: '', priority: 'Medium', due_date: '', estimated_hours: '' });
  const [isCreatingSubTask, setIsCreatingSubTask] = React.useState(false);
  const [isDeveloper] = React.useState(!isAdmin && !user?.modules?.tasks?.edit);

  React.useEffect(() => {
    if (task && task.id) {
        setTaskData(task);
        fetchTaskDocuments();
        fetchTaskActivities();
        fetchSubTasks();
        if (isAdmin) {
          fetchAssignableUsers();
        }
        setCurrentStatus(task.status);
        setEditData({
          status: task.status || 'Pending',
          description: task.description || '',
          priority: task.priority || 'Medium',
          assigned_to: task.assigned_to || '',
          progress_note: ''
        });
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

  const fetchSubTasks = async () => {
    if (!taskId) return;
    setLoadingSubTasks(true);
    try {
        const res = await axios.get(`/tasks/${taskId}/subtasks`);
        setSubTasks(res.data.data || []);
    } catch (err) {
        console.error('Failed to fetch sub tasks', err);
    } finally {
        setLoadingSubTasks(false);
    }
  };

  const handleCreateSubTask = async () => {
    if (!newSubTask.title.trim()) { toast.error('Sub task title is required'); return; }
    setIsCreatingSubTask(true);
    try {
        const res = await axios.post(`/tasks/${taskId}/subtasks`, newSubTask);
        toast.success('Sub task created');
        setNewSubTask({ title: '', priority: 'Medium', due_date: '', estimated_hours: '' });
        setShowAddSubTask(false);
        fetchSubTasks();
    } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to create sub task');
    } finally {
        setIsCreatingSubTask(false);
    }
  };

  const handleSubTaskStatusChange = async (subTaskId, newStatus) => {
    try {
        await axios.patch(`/subtasks/${subTaskId}`, { status: newStatus });
        setSubTasks(prev => prev.map(st => st.id === subTaskId ? { ...st, status: newStatus } : st));
        toast.success('Sub task updated');
    } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to update sub task');
    }
  };

  const handleDeleteSubTask = async (subTaskId) => {
    try {
        await axios.delete(`/subtasks/${subTaskId}`);
        setSubTasks(prev => prev.filter(st => st.id !== subTaskId));
        toast.success('Sub task deleted');
    } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete sub task');
    }
  };

  const fetchTaskActivities = async () => {
    if (!taskId) return;
    setLoadingActivities(true);
    try {
      const res = await axios.get(`/projects/tasks/${taskId}/activities`);
      setActivities(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch task activities', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const fetchAssignableUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await axios.get('/users/selection');
      setAssignableUsers(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch assignable users', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUpdateTask = async () => {
    setIsUpdating(true);
    try {
        const payload = {
          ...editData,
          assigned_to: editData.assigned_to || null
        };
        const res = await axios.patch(`/projects/tasks/${taskId}`, payload);
        const updatedTask = res.data.data || {
          ...taskData,
          ...payload,
          updated_at: new Date().toISOString()
        };
        setTaskData(updatedTask);
        setCurrentStatus(updatedTask.status || editData.status);
        setIsEditing(false);
        setEditData((prev) => ({ ...prev, progress_note: '', assigned_to: updatedTask.assigned_to || '' }));
        fetchTaskActivities();
        toast.success('Task details updated');
        if (onUpdate) onUpdate(updatedTask);
    } catch (err) {
        console.error("Failed to update task", err);
        toast.error(err?.response?.data?.message || 'Failed to update task');
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
        const res = await axios.patch(`/projects/tasks/${taskId}`, { status: newStatus });
        const updatedTask = res.data.data || {
          ...taskData,
          status: newStatus,
          updated_at: new Date().toISOString()
        };
        setCurrentStatus(newStatus);
        setEditData(prev => ({ ...prev, status: newStatus, progress_note: '' }));
        setTaskData(updatedTask);
        fetchTaskActivities();
        toast.success(`Task status updated to ${newStatus}`);
        if (onUpdate) onUpdate(updatedTask);
    } catch (err) {
        console.error("Failed to update status", err);
        toast.error(err?.response?.data?.message || 'Failed to update status');
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
      const res = await axios.patch(`/projects/tasks/${taskId}`, {
        status: 'Completed',
        completion_notes: completionNotes,
        completion_date: new Date().toISOString(),
        progress_note: completionNotes
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
      const updatedTask = res.data.data || {
        ...taskData,
        status: 'Completed',
        completion_notes: completionNotes,
        completion_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setTaskData(updatedTask);
      fetchTaskDocuments();
      fetchTaskActivities();
      if (onUpdate) onUpdate(updatedTask);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit completion proof');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const completionTime = taskData?.completion_date ? new Date(taskData.completion_date).getTime() - 60000 : null;
  const initialDocs = documents.filter(d => !completionTime || new Date(d.created_at).getTime() < completionTime);
  const proofDocs = documents.filter(d => completionTime && new Date(d.created_at).getTime() >= completionTime);
  const showCompletionSection = taskData.status === 'Completed' && (Boolean(taskData.completion_notes) || proofDocs.length > 0);
  const latestActivity = activities[0] || null;

  const getActivityLabel = (activity) => {
    switch (activity.activity_type) {
      case 'created':
        return `created the task and assigned ${activity.new_label || 'it'}`;
      case 'reassigned':
        return `reassigned this task from ${activity.previous_label || 'Unassigned'} to ${activity.new_label || 'Unassigned'}`;
      case 'status_changed':
        return `changed status from ${activity.previous_label || activity.previous_value} to ${activity.new_label || activity.new_value}`;
      case 'hours_logged':
        return `logged time on the task (${activity.new_label || activity.new_value})`;
      case 'progress_submitted':
        return 'submitted a progress update';
      case 'updated':
        return `updated ${String(activity.field_name || 'task').replaceAll('_', ' ')}`;
      default:
        return activity.field_name ? `updated ${String(activity.field_name).replaceAll('_', ' ')}` : 'updated this task';
    }
  };

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
              <p className="text-[10px] text-slate-400">{(doc.file_size / 1024).toFixed(0)} KB</p>
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
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">{taskData.title}</CardTitle>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="outline" className="text-xs font-semibold text-slate-500">
                  {taskData.project_name || 'Individual Task'}
                </Badge>
                <Badge 
                    variant={
                        currentStatus === 'Completed' ? 'success' : 
                        currentStatus === 'In Progress' ? 'primary' : 
                        'default'
                    }
                    className="text-xs font-semibold text-slate-500"
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
                className="h-9 text-xs font-semibold text-slate-500 border-slate-200"
                onClick={() => setIsEditing(true)}
              >
                {isAdmin ? 'Edit Details' : 'Update Progress'}
              </Button>
            )}
            {isEditing && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 text-xs font-semibold text-slate-500"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="h-9 text-xs font-semibold text-slate-500"
                  onClick={handleUpdateTask}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isAdmin ? (
                    'Save Changes'
                  ) : (
                    'Submit Progress'
                  )}
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
                <span className="text-xs font-semibold text-slate-500">Description & Details</span>
              </div>
              <div className="prose prose-slate max-w-none mb-8">
                {isEditing ? (
                  <div className="space-y-4">
                    {isAdmin ? (
                      <textarea 
                        className="w-full p-4 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none min-h-[120px]"
                        value={editData.description}
                        onChange={(e) => setEditData({...editData, description: e.target.value})}
                      />
                    ) : (
                      <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm bg-slate-50 p-4 rounded-xl border border-slate-100/50">
                        {taskData.description || "No detailed description provided for this task."}
                      </p>
                    )}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold text-slate-500 mb-2">Progress Update</p>
                      <textarea
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none min-h-[96px]"
                        value={editData.progress_note}
                        onChange={(e) => setEditData({ ...editData, progress_note: e.target.value })}
                        placeholder={isAdmin ? 'Add an optional activity note for this change.' : 'Briefly describe what changed or what progress you made.'}
                      />
                      {!isAdmin && (
                        <p className="mt-2 text-[11px] text-slate-500">A short progress note is required when team members update a task.</p>
                      )}
                    </div>
                  </div>
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
                    <span className="text-xs font-semibold text-slate-500">References & Examples</span>
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
                    <span className="text-xs font-semibold text-slate-500">Initial Media & Assets</span>
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
                    <span className="text-xs font-semibold text-slate-500">Proof of Completion</span>
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
                      <div className="pt-2 flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <Clock className="w-3 h-3" />
                        Completed on {new Date(taskData.completion_date).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sub Tasks Section */}
            <div className="space-y-4 mt-8 pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <GitBranch className="w-4 h-4" />
                  <span className="text-xs font-semibold text-slate-500">Sub Tasks</span>
                  {subTasks.length > 0 && (
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
                      {subTasks.filter(s => s.status === 'Completed').length}/{subTasks.length}
                    </span>
                  )}
                </div>
                  {taskData.status !== 'Completed' ? (
                    <button
                      onClick={() => setShowAddSubTask(v => !v)}
                      className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add Sub Task
                    </button>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      Task Completed (Locked)
                    </span>
                  )}
                </div>

              {/* Add Sub Task inline form */}
              {showAddSubTask && taskData.status !== 'Completed' && (
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
                  <input
                    type="text"
                    placeholder="Sub task title..."
                    value={newSubTask.title}
                    onChange={e => setNewSubTask(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <div className="flex gap-2">
                    <select
                      value={newSubTask.priority}
                      onChange={e => setNewSubTask(prev => ({ ...prev, priority: e.target.value }))}
                      className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                      <option value="Critical">Critical Priority</option>
                    </select>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="Est Hours (e.g. 2.5)"
                      value={newSubTask.estimated_hours}
                      onChange={e => setNewSubTask(prev => ({ ...prev, estimated_hours: e.target.value }))}
                      className="w-32 px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
                    />
                    <input
                      type="date"
                      value={newSubTask.due_date}
                      onChange={e => setNewSubTask(prev => ({ ...prev, due_date: e.target.value }))}
                      className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => { setShowAddSubTask(false); setNewSubTask({ title: '', priority: 'Medium', due_date: '', estimated_hours: '' }); }}
                      className="text-xs text-slate-500 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    >Cancel</button>
                    <button
                      onClick={handleCreateSubTask}
                      disabled={isCreatingSubTask}
                      className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-70"
                    >
                      {isCreatingSubTask ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      Create
                    </button>
                  </div>
                </div>
              )}

              {/* Sub Tasks List */}
              {loadingSubTasks ? (
                <div className="space-y-2">
                  <div className="h-8 bg-slate-100 rounded-lg animate-pulse" />
                  <div className="h-8 bg-slate-100 rounded-lg animate-pulse" />
                </div>
              ) : subTasks.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-2">No sub tasks yet. {taskData.status !== 'Completed' && 'Add one above.'}</div>
              ) : (
                <div className="space-y-2">
                  {subTasks.map(st => (
                    <div key={st.id} className="flex items-center gap-3 p-2.5 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-colors group">
                      <button
                        onClick={() => taskData.status !== 'Completed' && handleSubTaskStatusChange(st.id, st.status === 'Completed' ? 'Pending' : 'Completed')}
                        disabled={taskData.status === 'Completed'}
                        className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                          taskData.status === 'Completed' ? 'cursor-not-allowed opacity-60' : '',
                          st.status === 'Completed'
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-slate-300 hover:border-emerald-400'
                        )}
                      >
                        {st.status === 'Completed' && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-xs font-semibold truncate', st.status === 'Completed' && 'line-through text-slate-400')}>{st.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn(
                            'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded',
                            st.priority === 'Critical' ? 'bg-rose-100 text-rose-600' :
                            st.priority === 'High' ? 'bg-amber-100 text-amber-600' :
                            st.priority === 'Medium' ? 'bg-blue-100 text-blue-600' :
                            'bg-slate-100 text-slate-500'
                          )}>{st.priority}</span>
                          {st.estimated_hours && (
                            <span className="text-[9px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                              {st.estimated_hours} hrs
                            </span>
                          )}
                          {st.assigned_to_name && <span className="text-[9px] text-slate-400">{st.assigned_to_name}</span>}
                          {st.due_date && <span className="text-[9px] text-slate-400">{new Date(st.due_date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <select
                        value={st.status}
                        onChange={e => handleSubTaskStatusChange(st.id, e.target.value)}
                        disabled={taskData.status === 'Completed'}
                        className="text-[9px] font-bold border border-slate-200 rounded-lg px-1.5 py-1 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-400 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Blocked">Blocked</option>
                      </select>
                      {isAdmin && taskData.status !== 'Completed' && (
                        <button
                          onClick={() => handleDeleteSubTask(st.id)}
                          className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar Details */}
            <div className="md:w-1/3 bg-slate-50/50 p-5 sm:p-8 space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-3 text-slate-400">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-semibold text-slate-500">Assignment & Impact</span>
                </div>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center text-primary-700 text-sm font-normal">
                         {(taskData.assigned_to_name || taskData.user_name || 'NA').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                         <div className="text-sm font-semibold text-slate-900">{taskData.assigned_to_name || taskData.user_name || "Unassigned"}</div>
                         <div className="text-xs text-slate-500 font-medium tracking-tighter">Primary Lead</div>
                        </div>
                    </div>
                    {isAdmin && isEditing && (
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">Reassign Task</p>
                        <select
                          className="w-full text-xs font-bold text-slate-900 bg-white rounded-lg p-2.5 border border-slate-200"
                          value={editData.assigned_to}
                          onChange={(e) => setEditData({ ...editData, assigned_to: e.target.value })}
                          disabled={loadingUsers}
                        >
                          <option value="">Unassigned</option>
                          {assignableUsers.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name} {member.designation ? `(${member.designation})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-0.5">Priority</p>
                      {isEditing && isAdmin ? (
                        <select 
                          className="text-sm font-normal uppercase tracking-wider text-slate-900 bg-transparent border-none p-0 focus:ring-0"
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
                          "text-sm font-normal uppercase tracking-wider",
                           taskData.priority === 'Urgent' ? "text-rose-600" : 
                           taskData.priority === 'High' ? "text-amber-600" : 
                           "text-slate-600"
                         )}>{taskData.priority || 'Medium'}</p>
                       )}
                     </div>
                     <div className="text-right">
                       <p className="text-xs text-slate-500 font-medium mb-0.5">Complexity</p>
                       <p className="text-sm font-normal text-slate-900">{taskData.story_points || 0} Points</p>
                     </div>
                   </div>
                  
                  {isAdmin && (
                    <div className="p-4 bg-primary-50/50 rounded-xl border border-primary-100 mt-4">
                       <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mb-3 flex items-center gap-2">
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
                                   "px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 transition-all border",
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

                  {/* Status dropdown hidden for non-admins to prevent direct status manipulation outside workflow */}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3 text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-semibold text-slate-500">Timeline</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-slate-500 font-medium mb-1">Due Date</div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                      <Calendar className="w-4 h-4 text-rose-400" />
                      {taskData.due_date ? new Date(taskData.due_date).toLocaleDateString() : "Flexible"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium mb-1">Last Activity</div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                      {latestActivity?.created_at ? new Date(latestActivity.created_at).toLocaleString() : (taskData.updated_at ? new Date(taskData.updated_at).toLocaleDateString() : 'N/A')}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3 text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-semibold text-slate-500">Task Activity</span>
                </div>
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {loadingActivities && (
                    <>
                      <Skeleton className="h-20 rounded-xl" />
                      <Skeleton className="h-20 rounded-xl" />
                    </>
                  )}
                  {!loadingActivities && activities.length === 0 && (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
                      No task activity recorded yet.
                    </div>
                  )}
                  {!loadingActivities && activities.map((activity) => (
                    <div key={activity.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{activity.actor_name || 'System'}</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{getActivityLabel(activity)}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{activity.created_at ? new Date(activity.created_at).toLocaleString() : ''}</span>
                      </div>
                      {activity.progress_note && (
                        <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-700 whitespace-pre-wrap">
                          {activity.progress_note}
                        </div>
                      )}
                    </div>
                  ))}
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
