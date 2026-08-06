import React from 'react';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { BASE_URL } from '../../../api/baseUrl';
import Badge from '../../../components/ui/Badge';
import Skeleton from '../../../components/ui/Skeleton';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';
import { X, Calendar, User, ClipboardList, Info, Clock, FolderOpen, Link, ExternalLink, FileText, CheckCircle2, Plus, Loader2, GitBranch, Trash2, CheckSquare, Layers, ShieldAlert, Target } from 'lucide-react';
import { cn } from '../../../utils/cn';
import ProjectResourcesModal from '../../projects/components/ProjectResourcesModal';
import Button from '../../../components/ui/Button';
import ProofOfCompletionModal from './ProofOfCompletionModal';
import toast from 'react-hot-toast';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';

const parseList = (val) => {
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      return val.split('\n').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
};

const formatDateForInput = (d) => {
  if (!d) return '';
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  const [userStories, setUserStories] = React.useState([]);
  const [loadingStories, setLoadingStories] = React.useState(false);
  const [loadingDocs, setLoadingDocs] = React.useState(false);
  const [loadingActivities, setLoadingActivities] = React.useState(false);
  const [loadingUsers, setLoadingUsers] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);

  const [editData, setEditData] = React.useState({
    title: task?.title || '',
    status: task?.status || 'Pending',
    module: task?.module || '',
    task_type: task?.task_type || 'Feature',
    priority: task?.priority || 'Medium',
    story_points: task?.story_points || 3,
    due_date: task?.due_date ? task.due_date.split('T')[0] : '',
    assigned_to: task?.assigned_to || '',
    user_story_id: task?.user_story_id || '',
    business_objective: task?.business_objective || '',
    current_issue: task?.current_issue || '',
    expected_improvement: task?.expected_improvement || '',
    business_impact: task?.business_impact || '',
    functional_requirements: parseList(task?.functional_requirements).length > 0 ? parseList(task?.functional_requirements) : [''],
    acceptance_criteria: parseList(task?.acceptance_criteria).length > 0 ? parseList(task?.acceptance_criteria) : [''],
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

  React.useEffect(() => {
    if (task && task.id) {
      const tmpl = task.template_data || {};
      const normalized = {
        ...task,
        due_date: task.due_date || task.estimated_end_date || null,
        business_objective: task.business_objective || tmpl.business_objective || '',
        current_issue: task.current_issue || tmpl.current_issue || '',
        expected_improvement: task.expected_improvement || tmpl.expected_improvement || '',
        business_impact: task.business_impact || tmpl.business_impact || '',
        functional_requirements: parseList(task.functional_requirements).length > 0 
          ? parseList(task.functional_requirements) 
          : parseList(tmpl.functional_requirements),
        acceptance_criteria: parseList(task.acceptance_criteria).length > 0 
          ? parseList(task.acceptance_criteria) 
          : parseList(tmpl.acceptance_criteria)
      };

      setTaskData(normalized);
      fetchTaskDocuments();
      fetchTaskActivities();
      fetchSubTasks();
      if (isAdmin) {
        fetchAssignableUsers();
      }
      if (task.project_id) {
        setLoadingStories(true);
        axios.get(`/projects/${task.project_id}/stories`)
          .then(res => setUserStories(res.data.data || []))
          .catch(() => setUserStories([]))
          .finally(() => setLoadingStories(false));
      }
      setCurrentStatus(normalized.status);
      setEditData({
        title: normalized.title || '',
        status: normalized.status || 'Pending',
        module: normalized.module || '',
        task_type: normalized.task_type || 'Feature',
        priority: normalized.priority || 'Medium',
        story_points: normalized.story_points || 3,
        due_date: formatDateForInput(normalized.due_date),
        assigned_to: normalized.assigned_to || '',
        user_story_id: normalized.user_story_id || '',
        business_objective: normalized.business_objective,
        current_issue: normalized.current_issue,
        expected_improvement: normalized.expected_improvement,
        business_impact: normalized.business_impact,
        functional_requirements: normalized.functional_requirements.length > 0 ? normalized.functional_requirements : [''],
        acceptance_criteria: normalized.acceptance_criteria.length > 0 ? normalized.acceptance_criteria : [''],
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
      await axios.post(`/tasks/${taskId}/subtasks`, newSubTask);
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
        due_date: editData.due_date || null,
        assigned_to: editData.assigned_to || null,
        functional_requirements: editData.functional_requirements.filter(Boolean),
        acceptance_criteria: editData.acceptance_criteria.filter(Boolean)
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
      e.target.value = '';
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

  const funcReqList = parseList(taskData.functional_requirements);
  const acceptCritList = parseList(taskData.acceptance_criteria);

  if (!taskData) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900">
      <Card className="w-full max-w-5xl shadow-2xl animate-in fade-in zoom-in duration-300 border-none flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* Header */}
        <CardHeader className="flex flex-row items-start sm:items-center justify-between bg-white border-b border-slate-100 py-5 sm:py-6 px-5 sm:px-8 shrink-0">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{taskData.title}</CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <Badge variant="outline" className="text-xs font-semibold text-slate-600">
                  {taskData.project_name || 'Individual Task'}
                </Badge>
                <Badge 
                  variant={
                    currentStatus === 'Completed' ? 'success' : 
                    currentStatus === 'In Progress' ? 'primary' : 
                    'default'
                  }
                  className="text-xs font-semibold"
                >
                  {currentStatus}
                </Badge>
                {taskData.due_date && (
                  <Badge variant="outline" className="text-xs font-semibold text-rose-600 border-rose-200 bg-rose-50 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Due {new Date(taskData.due_date).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canEdit && !isEditing && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 text-xs font-semibold text-slate-700 border-slate-200"
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
                  className="h-9 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700"
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
            
            {/* Left 2/3 Main Body: Structured 5 Engineering Sections */}
            <div className="md:w-2/3 p-5 sm:p-8 border-b md:border-b-0 md:border-r border-slate-100 space-y-8 bg-slate-50/20">
              
              {/* SECTION 01: Basic Information */}
              <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="text-primary-600 font-extrabold">01.</span> Basic Information
                  </h3>
                  <Badge variant="outline" className="text-[10px] font-bold text-slate-500">
                    {taskData.module || 'General Module'}
                  </Badge>
                </div>

                {isEditing && isAdmin ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Input 
                        label="Task Title" 
                        value={editData.title}
                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                        required 
                      />
                    </div>
                    <div>
                      <Input 
                        label="Module" 
                        value={editData.module}
                        onChange={(e) => setEditData({ ...editData, module: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Task Type</label>
                      <select 
                        value={editData.task_type}
                        onChange={(e) => setEditData({ ...editData, task_type: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold bg-white"
                      >
                        <option value="Feature">Feature</option>
                        <option value="Enhancement">Enhancement</option>
                        <option value="Bug">Bug</option>
                        <option value="Research">Research</option>
                        <option value="Refactor">Refactor</option>
                        <option value="DevOps">DevOps</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Priority Level</label>
                      <select 
                        value={editData.priority}
                        onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold bg-white"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Story Points</label>
                      <select 
                        value={editData.story_points}
                        onChange={(e) => setEditData({ ...editData, story_points: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold bg-white"
                      >
                        <option value="1">1 Point</option>
                        <option value="2">2 Points</option>
                        <option value="3">3 Points</option>
                        <option value="5">5 Points</option>
                        <option value="8">8 Points</option>
                        <option value="13">13 Points</option>
                      </select>
                    </div>
                    <div>
                      <Input 
                        label="Due Date" 
                        type="date"
                        value={editData.due_date}
                        onChange={(e) => setEditData({ ...editData, due_date: e.target.value })}
                        required 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Type</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">{taskData.task_type || 'Feature'}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Priority</span>
                      <span className={cn(
                        "font-bold uppercase tracking-wider mt-0.5 block",
                        taskData.priority === 'Critical' ? "text-rose-600" :
                        taskData.priority === 'High' ? "text-amber-600" : "text-slate-800"
                      )}>{taskData.priority || 'Medium'}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Complexity</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">{taskData.story_points || 3} Story Points</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Due Date</span>
                      <span className="font-bold text-rose-600 mt-0.5 block">{taskData.due_date ? new Date(taskData.due_date).toLocaleDateString() : 'Not Set'}</span>
                    </div>
                  </div>
                )}
              </section>

              {/* SECTION 02: Business Objective & Problem Statement */}
              <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="text-primary-600 font-extrabold">02.</span> Business Objective & Problem Statement
                </h3>

                {isEditing && isAdmin ? (
                  <div className="space-y-4">
                    <Textarea 
                      label="Business Objective"
                      value={editData.business_objective}
                      onChange={(e) => setEditData({ ...editData, business_objective: e.target.value })}
                      placeholder="Why are we implementing this task?"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Textarea 
                        label="Current Issue"
                        value={editData.current_issue}
                        onChange={(e) => setEditData({ ...editData, current_issue: e.target.value })}
                      />
                      <Textarea 
                        label="Expected Improvement"
                        value={editData.expected_improvement}
                        onChange={(e) => setEditData({ ...editData, expected_improvement: e.target.value })}
                      />
                      <Textarea 
                        label="Business Impact"
                        value={editData.business_impact}
                        onChange={(e) => setEditData({ ...editData, business_impact: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Business Objective</span>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {taskData.business_objective || taskData.description || "No specific business objective detailed for this engineering task."}
                      </p>
                    </div>
                    
                    {(taskData.current_issue || taskData.expected_improvement || taskData.business_impact) && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {taskData.current_issue && (
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Current Issue</span>
                            <p className="text-xs text-slate-700 leading-relaxed">{taskData.current_issue}</p>
                          </div>
                        )}
                        {taskData.expected_improvement && (
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Expected Improvement</span>
                            <p className="text-xs text-slate-700 leading-relaxed">{taskData.expected_improvement}</p>
                          </div>
                        )}
                        {taskData.business_impact && (
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Business Impact</span>
                            <p className="text-xs text-slate-700 leading-relaxed">{taskData.business_impact}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* SECTION 03: Functional Requirements */}
              <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="text-primary-600 font-extrabold">03.</span> Functional Requirements
                  </h3>
                  {isEditing && isAdmin && (
                    <button 
                      type="button" 
                      onClick={() => setEditData({ ...editData, functional_requirements: [...editData.functional_requirements, ''] })}
                      className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add FR
                    </button>
                  )}
                </div>

                {isEditing && isAdmin ? (
                  <div className="space-y-2">
                    {editData.functional_requirements.map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 shrink-0">FR-{idx + 1}:</span>
                        <input
                          type="text"
                          value={req}
                          onChange={(e) => {
                            const updated = [...editData.functional_requirements];
                            updated[idx] = e.target.value;
                            setEditData({ ...editData, functional_requirements: updated });
                          }}
                          placeholder="Requirement description..."
                          className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setEditData({ ...editData, functional_requirements: editData.functional_requirements.filter((_, i) => i !== idx) })}
                          className="text-slate-400 hover:text-rose-600 p-1 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {funcReqList.length > 0 ? (
                      funcReqList.map((req, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[10px] font-bold bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded shrink-0 font-mono">
                            FR-{i + 1}
                          </span>
                          <span className="text-xs text-slate-700 font-medium leading-relaxed">{req}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No specific functional requirements listed.</p>
                    )}
                  </div>
                )}
              </section>

              {/* SECTION 04: Acceptance Criteria */}
              <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="text-primary-600 font-extrabold">04.</span> Acceptance Criteria
                  </h3>
                  {isEditing && isAdmin && (
                    <button 
                      type="button" 
                      onClick={() => setEditData({ ...editData, acceptance_criteria: [...editData.acceptance_criteria, ''] })}
                      className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Criteria
                    </button>
                  )}
                </div>

                {isEditing && isAdmin ? (
                  <div className="space-y-2">
                    {editData.acceptance_criteria.map((ac, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 shrink-0">AC-{idx + 1}:</span>
                        <input
                          type="text"
                          value={ac}
                          onChange={(e) => {
                            const updated = [...editData.acceptance_criteria];
                            updated[idx] = e.target.value;
                            setEditData({ ...editData, acceptance_criteria: updated });
                          }}
                          placeholder="Acceptance criteria..."
                          className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setEditData({ ...editData, acceptance_criteria: editData.acceptance_criteria.filter((_, i) => i !== idx) })}
                          className="text-slate-400 hover:text-rose-600 p-1 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {acceptCritList.length > 0 ? (
                      acceptCritList.map((ac, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-xs text-slate-700 font-medium leading-relaxed">{ac}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No acceptance criteria defined.</p>
                    )}
                  </div>
                )}
              </section>

              {/* Developer Progress Update Drawer / Admin Progress Note */}
              {isEditing && (
                <section className="bg-primary-50/40 p-5 rounded-2xl border border-primary-100 space-y-3">
                  <span className="text-xs font-bold text-primary-700 uppercase tracking-wider block">
                    {isAdmin ? 'Optional Activity Log Note' : 'Mandatory Progress Update Note'}
                  </span>
                  <textarea
                    className="w-full rounded-xl border border-primary-200 bg-white p-3 text-xs focus:ring-2 focus:ring-primary-500 outline-none min-h-[80px]"
                    value={editData.progress_note}
                    onChange={(e) => setEditData({ ...editData, progress_note: e.target.value })}
                    placeholder={isAdmin ? 'Add an optional activity note for this change.' : 'Briefly describe what progress you made...'}
                  />
                </section>
              )}

              {/* SECTION 05: Resources & Task Media */}
              <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="text-primary-600 font-extrabold">05.</span> Resources & Task Media
                </h3>

                {taskData.task_references && taskData.task_references.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">References & Examples</span>
                    <div className="grid grid-cols-1 gap-2">
                      {taskData.task_references.map((ref, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{ref.title || 'Note'}</p>
                            <p className="text-xs font-medium text-slate-700 break-words">{ref.value}</p>
                          </div>
                          {ref.value && (ref.value.startsWith('http') || ref.value.includes('.')) && (
                            <a 
                              href={ref.value.startsWith('http') ? ref.value : `https://${ref.value}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 bg-white rounded-lg shadow-sm text-primary-600 hover:bg-primary-50"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attached Task Media Files</span>
                  <div className="grid grid-cols-2 gap-3">
                    {loadingDocs && (
                      <>
                        <Skeleton className="h-[60px] rounded-xl" />
                        <Skeleton className="h-[60px] rounded-xl" />
                      </>
                    )}
                    {documents.map(renderDoc)}
                    {canEdit && (
                      <div className="relative">
                        <input type="file" id="task-detail-upload" className="hidden" multiple onChange={handleUploadFile} disabled={isUploading} />
                        <label htmlFor="task-detail-upload" className="flex flex-col items-center justify-center gap-1.5 p-3 bg-slate-50 border border-slate-200 border-dashed rounded-xl hover:bg-white hover:border-primary-300 transition-all cursor-pointer h-[60px]">
                          {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-primary-500" /> : <Plus className="w-4 h-4 text-slate-400" />}
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Upload Asset</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Sub Tasks Section */}
              <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <GitBranch className="w-4 h-4 text-primary-600" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Sub Tasks</span>
                    {subTasks.length > 0 && (
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
                        {subTasks.filter(s => s.status === 'Completed').length}/{subTasks.length}
                      </span>
                    )}
                  </div>
                  {taskData.status !== 'Completed' && (
                    <button
                      onClick={() => setShowAddSubTask(v => !v)}
                      className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add Sub Task
                    </button>
                  )}
                </div>

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
                        className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
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
                        placeholder="Est Hours"
                        value={newSubTask.estimated_hours}
                        onChange={e => setNewSubTask(prev => ({ ...prev, estimated_hours: e.target.value }))}
                        className="w-24 px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono"
                      />
                      <input
                        type="date"
                        value={newSubTask.due_date}
                        onChange={e => setNewSubTask(prev => ({ ...prev, due_date: e.target.value }))}
                        className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => { setShowAddSubTask(false); setNewSubTask({ title: '', priority: 'Medium', due_date: '', estimated_hours: '' }); }}
                        className="text-xs text-slate-500 px-3 py-1.5 rounded-lg hover:bg-slate-100"
                      >Cancel</button>
                      <button
                        onClick={handleCreateSubTask}
                        disabled={isCreatingSubTask}
                        className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg flex items-center gap-1"
                      >
                        {isCreatingSubTask ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                        Create
                      </button>
                    </div>
                  </div>
                )}

                {loadingSubTasks ? (
                  <div className="space-y-2">
                    <div className="h-8 bg-slate-100 rounded-lg animate-pulse" />
                    <div className="h-8 bg-slate-100 rounded-lg animate-pulse" />
                  </div>
                ) : subTasks.length === 0 ? (
                  <div className="text-xs text-slate-400 italic py-2">No sub tasks added.</div>
                ) : (
                  <div className="space-y-2">
                    {subTasks.map(st => (
                      <div key={st.id} className="flex items-center gap-3 p-2.5 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-colors group">
                        <button
                          onClick={() => taskData.status !== 'Completed' && handleSubTaskStatusChange(st.id, st.status === 'Completed' ? 'Pending' : 'Completed')}
                          disabled={taskData.status === 'Completed'}
                          className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                            st.status === 'Completed' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 hover:border-emerald-400'
                          )}
                        >
                          {st.status === 'Completed' && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-xs font-semibold truncate', st.status === 'Completed' && 'line-through text-slate-400')}>{st.title}</p>
                        </div>
                        <select
                          value={st.status}
                          onChange={e => handleSubTaskStatusChange(st.id, e.target.value)}
                          disabled={taskData.status === 'Completed'}
                          className="text-[9px] font-bold border border-slate-200 rounded-lg px-1.5 py-1 bg-slate-50"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Blocked">Blocked</option>
                        </select>
                        {isAdmin && taskData.status !== 'Completed' && (
                          <button
                            onClick={() => handleDeleteSubTask(st.id)}
                            className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Proof of Completion Section */}
              {showCompletionSection && (
                <section className="space-y-4 pt-4 border-t border-emerald-100 bg-emerald-50/30 p-5 rounded-2xl">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Proof of Completion Submitted</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm space-y-3">
                    {taskData.completion_notes && (
                      <p className="text-xs text-slate-700 italic border-l-2 border-emerald-300 pl-3">"{taskData.completion_notes}"</p>
                    )}
                    {proofDocs.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        {proofDocs.map(renderDoc)}
                      </div>
                    )}
                  </div>
                </section>
              )}

            </div>

            {/* Right 1/3 Sidebar: Assignment, Due Date, Status, Activity */}
            <div className="md:w-1/3 bg-slate-50/50 p-5 sm:p-8 space-y-8">
              
              {/* Assignee & Reassignment */}
              <div>
                <div className="flex items-center gap-2 mb-3 text-slate-400">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-semibold text-slate-500">Assignee & Role</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100">
                    <div className="w-9 h-9 bg-primary-50 border border-primary-100 rounded-full flex items-center justify-center text-primary-700 text-xs font-bold">
                      {(taskData.assigned_to_name || taskData.user_name || 'UN').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{taskData.assigned_to_name || taskData.user_name || "Unassigned"}</div>
                      <div className="text-[10px] text-slate-500 font-medium">Primary Engineering Lead</div>
                    </div>
                  </div>

                  {isAdmin && isEditing && (
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Reassign Task</label>
                      <select
                        className="w-full text-xs font-semibold text-slate-900 bg-white rounded-xl p-2.5 border border-slate-200"
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
              </div>

              {/* Status Update Quick Buttons (Admin) */}
              {isAdmin && (
                <div className="p-4 bg-primary-50/50 rounded-2xl border border-primary-100 space-y-3">
                  <p className="text-[10px] font-bold text-primary-700 uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" />
                    Quick Status Change
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
                          "px-3 py-2 rounded-xl text-xs font-bold transition-all border",
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

              {/* Timeline */}
              <div>
                <div className="flex items-center gap-2 mb-3 text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-semibold text-slate-500">Timeline & Deadlines</span>
                </div>
                <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Target Due Date</div>
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-600">
                      <Calendar className="w-3.5 h-3.5" />
                      {taskData.due_date ? new Date(taskData.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : "Flexible Schedule"}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Last Activity</div>
                    <div className="text-xs font-medium text-slate-600">
                      {latestActivity?.created_at ? new Date(latestActivity.created_at).toLocaleString() : (taskData.updated_at ? new Date(taskData.updated_at).toLocaleDateString() : 'N/A')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Activity Log */}
              <div>
                <div className="flex items-center gap-2 mb-3 text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-semibold text-slate-500">Task Activity Feed</span>
                </div>
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {loadingActivities && (
                    <>
                      <Skeleton className="h-16 rounded-xl" />
                      <Skeleton className="h-16 rounded-xl" />
                    </>
                  )}
                  {!loadingActivities && activities.length === 0 && (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
                      No activity recorded yet.
                    </div>
                  )}
                  {!loadingActivities && activities.map((activity) => (
                    <div key={activity.id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{activity.actor_name || 'System'}</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{getActivityLabel(activity)}</p>
                        </div>
                        <span className="text-[9px] text-slate-400 whitespace-nowrap">{activity.created_at ? new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </div>
                      {activity.progress_note && (
                        <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-xs text-slate-700 whitespace-pre-wrap font-medium">
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

        <div className="bg-white border-t border-slate-100 p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-center px-5 sm:px-8 gap-3 shrink-0">
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
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-md"
          >
            Close Modal
          </button>
        </div>

      </Card>

      {/* Project Resources Modal */}
      {showResources && (
        <ProjectResourcesModal 
          projectId={taskData.project_id}
          onClose={() => setShowResources(false)}
        />
      )}

      {/* Proof of Completion Modal */}
      {showProofModal && (
        <ProofOfCompletionModal
          isOpen={showProofModal}
          onClose={() => setShowProofModal(false)}
          onSubmit={submitCompletionProof}
          notes={completionNotes}
          setNotes={setCompletionNotes}
          files={completionFiles}
          setFiles={setCompletionFiles}
          isSubmitting={isSubmittingProof}
        />
      )}

    </div>
  );
};

export default TaskDetailModal;
