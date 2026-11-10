import React from 'react';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { BASE_URL } from '../../../api/baseUrl';
import Badge from '../../../components/ui/Badge';
import Skeleton from '../../../components/ui/Skeleton';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';
import { X, Calendar, User, ClipboardList, Info, Clock, FolderOpen, Link, ExternalLink, FileText, CheckCircle2, Plus, Loader2, GitBranch, Trash2, CheckSquare, Layers, ShieldAlert, Target, Building2, MessageSquare, Send, ChevronDown, UserCheck } from 'lucide-react';
import { cn } from '../../../utils/cn';
import ProjectResourcesModal from '../../projects/components/ProjectResourcesModal';
import Button from '../../../components/ui/Button';
import ProofOfCompletionModal from './ProofOfCompletionModal';
import TaskHandoverModal from './TaskHandoverModal';
import TaskChatSection from './TaskChatSection';
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
  const [newSubTaskTitle, setNewSubTaskTitle] = React.useState('');
  const [activityFilter, setActivityFilter] = React.useState('all');
  const [isCreatingSubTask, setIsCreatingSubTask] = React.useState(false);

  // Comments states
  const [comments, setComments] = React.useState([]);
  const [loadingComments, setLoadingComments] = React.useState(false);
  const [newComment, setNewComment] = React.useState('');
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false);
  const [sidebarTab, setSidebarTab] = React.useState('comments');
  const [activeLeftTab, setActiveLeftTab] = React.useState('details'); // 'details' | 'resources' | 'activity'
  const commentInputRef = React.useRef(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = React.useState(false);
  const statusDropdownRef = React.useRef(null);
  const [subTaskDropdownOpen, setSubTaskDropdownOpen] = React.useState(false);
  const subTaskDropdownRef = React.useRef(null);
  const [showHandoverModal, setShowHandoverModal] = React.useState(false);
  const [isSubmittingHandover, setIsSubmittingHandover] = React.useState(false);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setStatusDropdownOpen(false);
      }
      if (subTaskDropdownRef.current && !subTaskDropdownRef.current.contains(event.target)) {
        setSubTaskDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      fetchTaskComments();
      fetchSubTasks();
      fetchAssignableUsers();
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

  const fetchTaskComments = async () => {
    if (!taskId) return;
    setLoadingComments(true);
    try {
      const res = await axios.get(`/projects/tasks/${taskId}/comments`);
      setComments(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch task comments', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handlePostComment = async (e, customText = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const textToSubmit = (customText !== null ? customText : newComment).trim();
    if (!textToSubmit) return;
    const projectId = taskData?.project_id || task?.project_id;
    if (!projectId) {
      toast.error('Project ID is required to post comments');
      return;
    }
    setIsSubmittingComment(true);
    try {
      await axios.post(`/projects/${projectId}/comments`, {
        comment: textToSubmit,
        task_id: taskId
      });
      setNewComment('');
      toast.success('Message sent');
      fetchTaskComments();
      fetchTaskActivities();
    } catch (err) {
      console.error('Failed to post comment', err);
      toast.error(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
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
      fetchTaskActivities();
    } catch (err) {
      console.error("Failed to upload file(s)", err);
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleQuickStatusUpdate = async (newStatus) => {
    if (newStatus === currentStatus) return;

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

  const handleQuickReassign = async (newAssigneeId) => {
    setIsUpdating(true);
    try {
      const updatedUser = assignableUsers.find(u => String(u.id) === String(newAssigneeId));
      const res = await axios.patch(`/projects/tasks/${taskId}`, {
        assigned_to: newAssigneeId || null,
        progress_note: newAssigneeId
          ? `Task assigned to ${updatedUser?.name || 'team member'}`
          : 'Task unassigned'
      });
      const updatedTask = res.data.data || {
        ...taskData,
        assigned_to: newAssigneeId,
        assigned_to_name: updatedUser?.name || '',
        assigned_to_role: updatedUser?.role_name || updatedUser?.role || updatedUser?.designation || '',
        updated_at: new Date().toISOString()
      };
      setTaskData(updatedTask);
      setEditData(prev => ({ ...prev, assigned_to: newAssigneeId || '' }));
      fetchTaskActivities();
      toast.success(newAssigneeId ? `Task assigned to ${updatedUser?.name || 'team member'}` : 'Task unassigned');
      if (onUpdate) onUpdate(updatedTask);
    } catch (err) {
      console.error("Failed to reassign task", err);
      toast.error(err?.response?.data?.message || 'Failed to reassign task');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTaskHandover = async ({ newAssigneeId, reason, notes, nextStatus }) => {
    setIsSubmittingHandover(true);
    try {
      const handoverNote = `[Task Handover: ${reason}] ${notes ? notes : 'Work transferred to next team member.'}`;
      const res = await axios.patch(`/projects/tasks/${taskId}`, {
        assigned_to: newAssigneeId || null,
        status: nextStatus || currentStatus,
        progress_note: handoverNote
      });

      const updatedUser = assignableUsers.find(u => String(u.id) === String(newAssigneeId));
      const updatedTask = res.data.data || {
        ...taskData,
        assigned_to: newAssigneeId,
        assigned_to_name: updatedUser?.name || '',
        assigned_to_role: updatedUser?.role_name || updatedUser?.role || updatedUser?.designation || '',
        status: nextStatus || currentStatus,
        updated_at: new Date().toISOString()
      };

      setTaskData(updatedTask);
      setCurrentStatus(updatedTask.status);
      setEditData(prev => ({
        ...prev,
        assigned_to: newAssigneeId || '',
        status: updatedTask.status,
        progress_note: ''
      }));
      fetchTaskActivities();
      toast.success(`Task handed over to ${updatedUser?.name || 'team member'} successfully`);
      setShowHandoverModal(false);
      if (onUpdate) onUpdate(updatedTask);
    } catch (err) {
      console.error("Failed to handover task", err);
      toast.error(err?.response?.data?.message || 'Failed to handover task');
    } finally {
      setIsSubmittingHandover(false);
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

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 45) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getAvatarBg = (name) => {
    const colors = [
      'bg-amber-500 text-white',
      'bg-blue-600 text-white',
      'bg-indigo-600 text-white',
      'bg-emerald-600 text-white',
      'bg-violet-600 text-white',
      'bg-rose-500 text-white',
      'bg-cyan-600 text-white',
      'bg-purple-600 text-white'
    ];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[Math.abs(hash) % colors.length];
  };

  const filteredActivities = React.useMemo(() => {
    if (activityFilter === 'comments') {
      return activities.filter(a => a.activity_type === 'commented');
    }
    if (activityFilter === 'history') {
      return activities.filter(a => a.activity_type !== 'commented' && a.activity_type !== 'hours_logged');
    }
    if (activityFilter === 'worklog') {
      return activities.filter(a => a.activity_type === 'hours_logged');
    }
    return activities;
  }, [activities, activityFilter]);

  const developerUsers = React.useMemo(() => {
    const devs = assignableUsers.filter(u => {
      const role = (u.role_name || u.role || u.designation || '').toLowerCase();
      const name = (u.name || '').toLowerCase();
      if (role.includes('admin') || name.includes('admin') || role.includes('super')) return false;
      return role.includes('dev') || role.includes('engineer');
    });
    if (devs.length > 0) return devs;
    // Fallback: exclude any admin users
    return assignableUsers.filter(u => {
      const role = (u.role_name || u.role || u.designation || '').toLowerCase();
      const name = (u.name || '').toLowerCase();
      return !role.includes('admin') && !name.includes('admin') && !role.includes('super');
    });
  }, [assignableUsers]);

  const groupedActivities = React.useMemo(() => {
    const groups = {};
    const todayStr = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    filteredActivities.forEach((act) => {
      const actDate = act.created_at ? new Date(act.created_at) : new Date();
      const actDateStr = actDate.toDateString();
      let groupLabel = 'Older';
      if (actDateStr === todayStr) {
        groupLabel = 'Today';
      } else if (actDateStr === yesterdayStr) {
        groupLabel = 'Yesterday';
      } else {
        groupLabel = actDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      if (!groups[groupLabel]) groups[groupLabel] = [];
      groups[groupLabel].push(act);
    });
    return groups;
  }, [filteredActivities]);

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
      case 'commented':
        return 'commented on this task';
      case 'attached_file':
        return `attached file ${activity.new_label || ''}`;
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
  const displayType = isEditing ? editData.task_type : (taskData.task_type || 'Feature');
  const displayPriority = isEditing ? editData.priority : (taskData.priority || 'Medium');
  const displayStoryPoints = isEditing ? editData.story_points : (taskData.story_points || 3);

  if (!taskData) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-3 sm:p-5 text-slate-900">
      <Card className="w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[1440px] shadow-2xl animate-in fade-in zoom-in duration-300 border-none flex flex-col h-[92vh] max-h-[92vh] overflow-hidden bg-white">

        {/* Header */}
        <CardHeader className="flex flex-row items-start sm:items-center justify-between bg-white border-b border-slate-100 py-5 sm:py-6 px-5 sm:px-8 shrink-0">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{taskData.title}</CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {taskData.client_name && (
                  <Badge variant="outline" className="text-xs font-semibold text-indigo-700 border-indigo-200 bg-indigo-50 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-indigo-500" /> Client: {taskData.client_name}
                  </Badge>
                )}
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

                {/* Feature / Task Type Badge */}
                <Badge variant="outline" className="text-xs font-semibold text-blue-700 border-blue-200 bg-blue-50/80 flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-blue-500" />
                  <span>{displayType}</span>
                </Badge>

                {/* Priority Badge */}
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-semibold flex items-center gap-1.5",
                    displayPriority === 'Critical' ? "text-rose-700 border-rose-200 bg-rose-50" :
                      displayPriority === 'High' ? "text-amber-700 border-amber-200 bg-amber-50" :
                        displayPriority === 'Low' ? "text-emerald-700 border-emerald-200 bg-emerald-50" :
                          "text-sky-700 border-sky-200 bg-sky-50"
                  )}
                >
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    displayPriority === 'Critical' ? "bg-rose-500" :
                      displayPriority === 'High' ? "bg-amber-500" :
                        displayPriority === 'Low' ? "bg-emerald-500" :
                          "bg-sky-500"
                  )} />
                  <span>{displayPriority} Priority</span>
                </Badge>

                {/* Story Points Badge */}
                <Badge variant="outline" className="text-xs font-semibold text-purple-700 border-purple-200 bg-purple-50/80 flex items-center gap-1.5">
                  <Target className="w-3 h-3 text-purple-500" />
                  <span>{displayStoryPoints} {Number(displayStoryPoints) === 1 ? 'Story Point' : 'Story Points'}</span>
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {taskData.due_date && (
              <Badge variant="outline" className="text-xs font-semibold text-rose-600 border-rose-200 bg-rose-50 flex items-center gap-1.5 py-1 px-2.5">
                <Calendar className="w-3.5 h-3.5" /> Due {new Date(taskData.due_date).toLocaleDateString()}
              </Badge>
            )}

            {/* Sub Tasks Dropdown in Top Header */}
            <div className="relative" ref={subTaskDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  const next = !subTaskDropdownOpen;
                  setSubTaskDropdownOpen(next);
                  if (next) {
                    setShowAddSubTask(true);
                  }
                }}
                className={cn(
                  "h-9 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer select-none",
                  subTaskDropdownOpen ? "bg-blue-50 text-blue-700 border-blue-300" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                )}
              >
                <GitBranch className="w-3.5 h-3.5 text-blue-600" />
                <span>Sub Tasks</span>
                {subTasks.length > 0 && (
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-full">
                    {subTasks.filter(s => s.status === 'Completed').length}/{subTasks.length}
                  </span>
                )}
                <ChevronDown className={cn("w-3 h-3 text-slate-400 transition-transform duration-200", subTaskDropdownOpen && "rotate-180")} />
              </button>

              {subTaskDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl border border-slate-200 shadow-xl z-50 p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-xs font-bold text-slate-800">Sub Tasks</span>
                      {subTasks.length > 0 && (
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
                          {subTasks.filter(s => s.status === 'Completed').length}/{subTasks.length} completed
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddSubTask(v => !v)}
                      className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      {showAddSubTask ? 'Hide Form' : 'Add Sub Task'}
                    </button>
                  </div>

                  {/* Add Sub Task Form */}
                  {showAddSubTask && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                      <input
                        type="text"
                        placeholder="Sub task title..."
                        value={newSubTask.title}
                        onChange={e => setNewSubTask(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                      <div className="flex flex-col gap-1.5">
                        <select
                          value={newSubTask.priority}
                          onChange={e => setNewSubTask(prev => ({ ...prev, priority: e.target.value }))}
                          className="w-full px-2 py-1 text-xs rounded-md border border-slate-200 bg-white"
                        >
                          <option value="Low">Low Priority</option>
                          <option value="Medium">Medium Priority</option>
                          <option value="High">High Priority</option>
                          <option value="Critical">Critical Priority</option>
                        </select>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            placeholder="Est Hours"
                            value={newSubTask.estimated_hours}
                            onChange={e => setNewSubTask(prev => ({ ...prev, estimated_hours: e.target.value }))}
                            className="w-20 px-2 py-1 text-xs rounded-md border border-slate-200 bg-white font-mono"
                          />
                          <input
                            type="date"
                            value={newSubTask.due_date}
                            onChange={e => setNewSubTask(prev => ({ ...prev, due_date: e.target.value }))}
                            className="flex-1 px-2 py-1 text-xs rounded-md border border-slate-200 bg-white"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => { setShowAddSubTask(false); setNewSubTask({ title: '', priority: 'Medium', due_date: '', estimated_hours: '' }); }}
                          className="text-xs text-slate-500 px-2.5 py-1 rounded-md hover:bg-slate-200/60 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateSubTask}
                          disabled={isCreatingSubTask}
                          className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md flex items-center gap-1 cursor-pointer"
                        >
                          {isCreatingSubTask ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          Create
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sub Tasks List */}
                  {loadingSubTasks ? (
                    <div className="space-y-1.5 py-2">
                      <div className="h-6 bg-slate-100 rounded animate-pulse" />
                      <div className="h-6 bg-slate-100 rounded animate-pulse" />
                    </div>
                  ) : subTasks.length === 0 ? (
                    <div className="text-center py-3 space-y-2">
                      <p className="text-xs text-slate-400 italic">No sub tasks added yet.</p>
                      {!showAddSubTask && (
                        <button
                          type="button"
                          onClick={() => setShowAddSubTask(true)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Sub Task
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
                      {subTasks.map(st => (
                        <div key={st.id} className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100/70 transition-colors group">
                          <button
                            type="button"
                            onClick={() => handleSubTaskStatusChange(st.id, st.status === 'Completed' ? 'Pending' : 'Completed')}
                            className={cn(
                              'w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors cursor-pointer',
                              st.status === 'Completed' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 hover:border-emerald-400'
                            )}
                          >
                            {st.status === 'Completed' && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-xs font-medium truncate', st.status === 'Completed' && 'line-through text-slate-400')}>
                              {st.title}
                            </p>
                          </div>
                          <select
                            value={st.status}
                            onChange={e => handleSubTaskStatusChange(st.id, e.target.value)}
                            className="text-[9px] font-bold border border-slate-200 rounded px-1 py-0.5 bg-white shrink-0 cursor-pointer"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Blocked">Blocked</option>
                          </select>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSubTask(st.id)}
                              className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 p-0.5 cursor-pointer transition-opacity"
                              title="Delete sub task"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Status Dropdown in Navbar (Available to both Admin & Team Member) */}
            {!isEditing && (
              <div className="relative" ref={statusDropdownRef}>
                <button
                  type="button"
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  disabled={isUpdating}
                  className={cn(
                    "h-9 px-3.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 shadow-xs cursor-pointer select-none",
                    currentStatus === 'Completed' ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100/80" :
                      currentStatus === 'In Progress' ? "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100/80" :
                        currentStatus === 'Cancelled' ? "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100/80" :
                          "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100/80"
                  )}
                >
                  <span className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    currentStatus === 'Completed' ? "bg-emerald-500" :
                      currentStatus === 'In Progress' ? "bg-blue-500" :
                        currentStatus === 'Cancelled' ? "bg-rose-500" :
                          "bg-amber-500"
                  )} />
                  <span>{currentStatus === 'Completed' ? 'Done' : currentStatus}</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200 opacity-70", statusDropdownOpen && "rotate-180")} />
                </button>

                {statusDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      Update Work Status
                    </div>
                    {[
                      { label: 'Pending', value: 'Pending', desc: 'Not Started', dot: 'bg-amber-500' },
                      { label: 'In Progress', value: 'In Progress', desc: 'Working', dot: 'bg-blue-500' },
                      { label: 'Done', value: 'Completed', desc: 'Mark Completed', dot: 'bg-emerald-500' },
                      { label: 'Cancelled', value: 'Cancelled', desc: 'Cancelled', dot: 'bg-rose-500' },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          handleQuickStatusUpdate(item.value);
                          setStatusDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all text-left cursor-pointer",
                          currentStatus === item.value
                            ? "bg-slate-100 text-slate-900 font-bold"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full", item.dot)} />
                          <span>{item.label}</span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-400">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Admin Edit Details button */}
            {isAdmin && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
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

        <CardContent className="flex-1 min-h-0 flex flex-col h-full p-0 overflow-hidden">
          <div className="flex-1 min-h-0 flex flex-col md:flex-row h-full w-full overflow-hidden">

            {/* Left Main Body: Structured 3 Tabs (Task Details, Resources, Activity) with Fixed Header */}
            <div className="flex-1 min-w-0 min-h-0 h-full flex flex-col bg-slate-50/20 border-b md:border-b-0 md:border-r border-slate-100 overflow-hidden">

              {/* Fixed Left Tab Navigation (Pinned at top - does NOT scroll away) */}
              <div className="px-5 sm:px-8 py-3.5 bg-white border-b border-slate-100 shrink-0 z-10">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/90 shadow-xs w-fit">
                  <button
                    type="button"
                    onClick={() => setActiveLeftTab('details')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                      activeLeftTab === 'details'
                        ? "bg-primary-600 text-white shadow-sm shadow-primary-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white"
                    )}
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>Task Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveLeftTab('resources')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                      activeLeftTab === 'resources'
                        ? "bg-primary-600 text-white shadow-sm shadow-primary-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white"
                    )}
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>Resources</span>
                    {documents.length > 0 && (
                      <span className={cn(
                        "px-1.5 py-0.2 rounded-full text-[10px] font-extrabold",
                        activeLeftTab === 'resources' ? "bg-white/25 text-white" : "bg-slate-200 text-slate-600"
                      )}>
                        {documents.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveLeftTab('activity')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                      activeLeftTab === 'activity'
                        ? "bg-primary-600 text-white shadow-sm shadow-primary-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white"
                    )}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Activity</span>
                    {activities.length > 0 && (
                      <span className={cn(
                        "px-1.5 py-0.2 rounded-full text-[10px] font-extrabold",
                        activeLeftTab === 'activity' ? "bg-white/25 text-white" : "bg-slate-200 text-slate-600"
                      )}>
                        {activities.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Scrollable Content Container (Smooth Scroll underneath the fixed tabs) */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 scroll-smooth">

                {/* 1. TASK DETAILS (&& operation) */}
                {activeLeftTab === 'details' && (
                  <div className="space-y-3 p-0 m-0">
                    {/* Edit Form when editing */}
                    {isEditing && isAdmin && (
                      <div className="space-y-3 pb-4 border-b border-slate-100">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100">
                          Edit Task Attributes
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                              className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold bg-white"
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
                              className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold bg-white"
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
                              className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold bg-white"
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
                          <div className="sm:col-span-2">
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">Assign To Developer</label>
                            <select
                              className="w-full text-xs font-semibold text-slate-900 bg-white rounded-md p-2 border border-slate-200"
                              value={editData.assigned_to}
                              onChange={(e) => setEditData({ ...editData, assigned_to: e.target.value })}
                              disabled={loadingUsers}
                            >
                              <option value="">Unassigned</option>
                              {developerUsers.map((member) => (
                                <option key={member.id} value={member.id}>
                                  {member.name} {member.role_name || member.role || member.designation ? `• ${member.role_name || member.role || member.designation}` : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}


                    {/* Assign Work / Assignee Bar in Task Details Tab */}
                    {!isEditing && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 mb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0", getAvatarBg(taskData.assigned_to_name || taskData.user_name))}>
                            {(taskData.assigned_to_name || taskData.user_name || 'U').substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Developer</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {taskData.assigned_to_name || taskData.user_name || 'Unassigned'}
                              </span>
                              {taskData.assigned_to_role && (
                                <span className="text-[10px] text-slate-400 font-medium shrink-0">({taskData.assigned_to_role})</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Assign to:</span>
                          <div className="relative w-48 sm:w-56">
                            <select
                              value={taskData.assigned_to || ''}
                              onChange={(e) => handleQuickReassign(e.target.value)}
                              disabled={isUpdating}
                              className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors hover:border-slate-300 appearance-none"
                            >
                              <option value="">Unassigned</option>
                              {developerUsers.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.name} {u.role_name || u.role || u.designation ? `(${u.role_name || u.role || u.designation})` : ''}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                              {isUpdating ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SECTION 01: Business Objective & Problem Statement */}
                    <div className="space-y-2 pb-3 border-b border-slate-100">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <span className="text-primary-600 font-extrabold">01.</span> Business Objective & Problem Statement
                      </h3>

                      {isEditing && isAdmin ? (
                        <div className="space-y-2 mt-2">
                          <Textarea
                            label="Business Objective"
                            value={editData.business_objective}
                            onChange={(e) => setEditData({ ...editData, business_objective: e.target.value })}
                            placeholder="Why are we implementing this task?"
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                        <div className="space-y-2 mt-1">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Business Objective</span>
                            <p className="text-xs text-slate-700 leading-relaxed font-normal">
                              {taskData.business_objective || taskData.description || "No specific business objective detailed for this engineering task."}
                            </p>
                          </div>

                          {(taskData.current_issue || taskData.expected_improvement || taskData.business_impact) && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                              {taskData.current_issue && (
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Current Issue</span>
                                  <p className="text-xs text-slate-700 leading-relaxed font-normal">{taskData.current_issue}</p>
                                </div>
                              )}
                              {taskData.expected_improvement && (
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Expected Improvement</span>
                                  <p className="text-xs text-slate-700 leading-relaxed font-normal">{taskData.expected_improvement}</p>
                                </div>
                              )}
                              {taskData.business_impact && (
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Business Impact</span>
                                  <p className="text-xs text-slate-700 leading-relaxed font-normal">{taskData.business_impact}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* SECTION 02: Functional Requirements */}
                    <div className="space-y-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <span className="text-primary-600 font-extrabold">02.</span> Functional Requirements
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
                        <div className="space-y-2 mt-1.5">
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
                                className="w-full rounded-md border border-slate-200 px-2.5 py-1 text-xs bg-white"
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
                        <div className="space-y-1.5 mt-1">
                          {funcReqList.length > 0 ? (
                            funcReqList.map((req, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                                <span className="text-[10px] font-bold text-primary-600 font-mono shrink-0 mt-0.5">
                                  FR-{i + 1}:
                                </span>
                                <span className="leading-relaxed font-normal">{req}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 italic font-normal">No specific functional requirements listed.</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* SECTION 03: Acceptance Criteria */}
                    <div className="space-y-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <span className="text-primary-600 font-extrabold">03.</span> Acceptance Criteria
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
                        <div className="space-y-2 mt-1.5">
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
                                className="w-full rounded-md border border-slate-200 px-2.5 py-1 text-xs bg-white"
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
                        <div className="space-y-1.5 mt-1">
                          {acceptCritList.length > 0 ? (
                            acceptCritList.map((ac, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                <span className="leading-relaxed font-normal">{ac}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 italic font-normal">No acceptance criteria defined.</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Developer Progress Update Drawer / Admin Progress Note */}
                    {isEditing && (
                      <div className="space-y-2 pb-3 border-b border-slate-100">
                        <span className="text-xs font-bold text-primary-700 uppercase tracking-wider block">
                          {isAdmin ? 'Optional Activity Log Note' : 'Mandatory Progress Update Note'}
                        </span>
                        <textarea
                          className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs focus:ring-1 focus:ring-primary-500 outline-none min-h-[70px]"
                          value={editData.progress_note}
                          onChange={(e) => setEditData({ ...editData, progress_note: e.target.value })}
                          placeholder={isAdmin ? 'Add an optional activity note for this change.' : 'Briefly describe what progress you made...'}
                        />
                      </div>
                    )}

                    {/* Proof of Completion Section */}
                    {showCompletionSection && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-2 text-emerald-700">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Proof of Completion Submitted</span>
                        </div>
                        {taskData.completion_notes && (
                          <p className="text-xs text-slate-700 italic border-l-2 border-emerald-300 pl-2.5">"{taskData.completion_notes}"</p>
                        )}
                        {proofDocs.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            {proofDocs.map(renderDoc)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. RESOURCES */}
                {activeLeftTab === 'resources' && (
                  <div className="space-y-4 p-0 m-0">
                    {/* Top Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-slate-900">Resources</h2>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                            {documents.length + (taskData.task_references?.length || 0)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">Attached media, task references, and project documentation</p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-semibold text-blue-600 hover:bg-blue-50 border-slate-200 rounded-lg px-3 py-1.5 h-8 flex items-center gap-1.5 shrink-0"
                        onClick={() => setShowResources(true)}
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                        <span>Project Resources</span>
                      </Button>
                    </div>

                    {/* References & Notes */}
                    {taskData.task_references && taskData.task_references.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">References & Notes</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {taskData.task_references.map((ref, i) => {
                            const isLink = ref.value && (/^https?:\/\//i.test(ref.value.trim()) || /^(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/i.test(ref.value.trim()));
                            return (
                              <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="min-w-0 flex-1 mr-2">
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{ref.title || 'Note'}</p>
                                  <p className="text-xs font-normal text-slate-700 break-words mt-0.5">{ref.value}</p>
                                </div>
                                {isLink && (
                                  <a
                                    href={ref.value.startsWith('http') ? ref.value : `https://${ref.value}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 bg-white rounded border border-slate-200 text-blue-600 hover:bg-blue-50 shrink-0"
                                    title="Open link"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Attached Task Media Files */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attached Media Files</span>
                        <span className="text-[10px] text-slate-400 font-medium">{documents.length} {documents.length === 1 ? 'file' : 'files'}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {loadingDocs && (
                          <>
                            <Skeleton className="h-[48px] rounded-lg" />
                            <Skeleton className="h-[48px] rounded-lg" />
                          </>
                        )}
                        {documents.map(renderDoc)}
                        {canEdit && (
                          <div className="relative">
                            <input type="file" id="task-detail-upload" className="hidden" multiple onChange={handleUploadFile} disabled={isUploading} />
                            <label htmlFor="task-detail-upload" className="flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 border border-slate-200 border-dashed rounded-lg hover:bg-white hover:border-blue-400 transition-all cursor-pointer h-[48px]">
                              {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> : <Plus className="w-3.5 h-3.5 text-slate-400" />}
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Upload</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Project-Wide Resources Card */}
                    <div className="bg-slate-50 p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                          Project-Wide Resources & Docs
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-normal">Access repository links, design guidelines, and assets for this project.</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-semibold text-blue-600 bg-white hover:bg-slate-100 border-slate-200 rounded-lg px-2.5 py-1 h-7 shrink-0"
                        onClick={() => setShowResources(true)}
                      >
                        <FolderOpen className="w-3 h-3 mr-1" />
                        Open
                      </Button>
                    </div>
                  </div>
                )}

                {/* 3. ACTIVITY FEED */}
                {activeLeftTab === 'activity' && (
                  <div className="space-y-4 p-0 m-0">
                    {/* Top Header & View Filter Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-slate-900">Activity</h2>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                            {filteredActivities.length}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">Stream of events, updates, comments, and attachments</p>
                      </div>

                      {/* View Filter Pills */}
                      <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 text-xs font-semibold shrink-0">
                        {[
                          { id: 'all', label: 'All' },
                          { id: 'comments', label: 'Comments' },
                          { id: 'history', label: 'History' },
                          { id: 'worklog', label: 'Work Log' }
                        ].map(tab => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActivityFilter(tab.id)}
                            className={cn(
                              "px-2.5 py-1 rounded-lg transition-all text-xs font-semibold",
                              activityFilter === tab.id
                                ? "bg-white text-blue-700 font-bold"
                                : "text-slate-600 hover:text-slate-900"
                            )}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Timeline Feed */}
                    <div className="space-y-4">
                      {loadingActivities && (
                        <div className="space-y-3">
                          <Skeleton className="h-16 rounded-xl" />
                          <Skeleton className="h-16 rounded-xl" />
                        </div>
                      )}

                      {!loadingActivities && filteredActivities.length === 0 && (
                        <div className="text-center py-10 px-4 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                          <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-700">No activity recorded for this view.</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Status updates, comments, and file uploads will appear here.</p>
                        </div>
                      )}

                      {!loadingActivities && Object.entries(groupedActivities).map(([dateGroup, items]) => (
                        <div key={dateGroup} className="space-y-2">
                          {/* Date Header */}
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">
                            {dateGroup}
                          </div>

                          {/* Items for this date */}
                          <div className="divide-y divide-slate-100">
                            {items.map((activity) => {
                              const taskKeyTitle = `${taskData.story_key ? taskData.story_key + ' - ' : ''}${taskData.title}`;
                              let fileMeta = null;
                              if (activity.activity_type === 'attached_file' && activity.progress_note) {
                                try {
                                  fileMeta = JSON.parse(activity.progress_note);
                                } catch (e) {
                                  fileMeta = { file_name: activity.new_label, file_key: activity.new_value };
                                }
                              }
                              const fileUrl = fileMeta?.file_key ? `${BASE_URL.replace('/api', '')}/${fileMeta.file_key}` : null;

                              // Standard Activity Item (Render all items, including comments, uniformly without chat bubbles)
                              return (
                                <div
                                  key={activity.id}
                                  className="flex items-start gap-3 py-3 hover:bg-slate-50/50 transition-colors"
                                >
                                  {/* User Avatar */}
                                  <div className={cn(
                                    "w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5",
                                    getAvatarBg(activity.actor_name)
                                  )}>
                                    {(activity.actor_name || 'U').substring(0, 2).toUpperCase()}
                                  </div>

                                  {/* Activity Body */}
                                  <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-bold text-xs text-slate-900">
                                        {activity.actor_name || 'Team Member'}
                                      </span>

                                      {activity.activity_type === 'commented' && (
                                        <span className="text-xs text-slate-500">commented</span>
                                      )}

                                      {activity.activity_type === 'created' && (
                                        <span className="text-xs text-slate-500">created task</span>
                                      )}

                                      {activity.activity_type === 'reassigned' && (
                                        <span className="text-xs text-slate-500">
                                          reassigned to <span className="font-semibold text-slate-800">{activity.new_label || 'Unassigned'}</span>
                                        </span>
                                      )}

                                      {activity.activity_type === 'status_changed' && (
                                        <span className="text-xs text-slate-500">
                                          changed status to <span className="font-semibold text-slate-800">{activity.new_label || activity.new_value}</span>
                                        </span>
                                      )}

                                      {activity.activity_type === 'attached_file' && (
                                        <span className="text-xs text-slate-500">attached a file</span>
                                      )}

                                      {activity.activity_type === 'hours_logged' && (
                                        <span className="text-xs text-slate-500">
                                          logged {activity.new_label || activity.new_value} hours
                                        </span>
                                      )}

                                      {activity.activity_type === 'updated' && (
                                        <span className="text-xs text-slate-500">
                                          updated {String(activity.field_name || 'details').replaceAll('_', ' ')}
                                        </span>
                                      )}

                                      <span className="text-slate-300">•</span>
                                      <span className="text-[11px] text-slate-400">
                                        {getRelativeTime(activity.created_at)}
                                      </span>
                                    </div>

                                    {/* Attachment Link */}
                                    {activity.activity_type === 'attached_file' && (
                                      <div className="flex items-center gap-1.5 text-xs text-blue-700 pt-0.5">
                                        <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                        <a
                                          href={fileUrl || '#'}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="font-semibold hover:underline"
                                        >
                                          {fileMeta?.file_name || activity.new_label || 'Attachment'}
                                        </a>
                                      </div>
                                    )}

                                    {/* Comment / Progress Note Text */}
                                    {activity.progress_note && activity.activity_type !== 'attached_file' && (
                                      <div className="bg-slate-50 rounded-lg p-2.5 text-xs text-slate-700 leading-relaxed font-normal border border-slate-100 mt-1">
                                        {activity.progress_note}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Right Sidebar: Subtasks, Project Details, Activity Feed with Independent Smooth Scroll */}
            <div className="w-full md:w-[380px] lg:w-[420px] xl:w-[460px] shrink-0 min-h-0 h-full overflow-y-auto bg-slate-50/50 p-5 sm:p-8 space-y-6 border-t md:border-t-0 md:border-l border-slate-100 scroll-smooth">

              {/* Client Details */}
              <div>
                <div className="flex items-center gap-2 mb-2 text-slate-400">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-600">Client Details</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Client</div>
                  <div className="text-xs font-bold text-slate-800">
                    {taskData.client_name || 'Internal / N/A'}
                  </div>
                </div>
              </div>


              {/* Team Task & Chat */}
              <TaskChatSection
                comments={comments}
                loading={loadingComments}
                currentUser={user}
                onSendMessage={(msg) => handlePostComment(null, msg)}
                isSubmitting={isSubmittingComment}
              />

            </div>
          </div>
        </CardContent>

        <div className="bg-white border-t border-slate-100 p-4 sm:p-5 flex items-center justify-start px-5 sm:px-8 gap-3 shrink-0">
          <Button
            variant="ghost"
            className="text-primary-600 font-bold text-xs"
            onClick={() => setShowResources(true)}
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            PROJECT RESOURCES
          </Button>
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

      {/* Task Handover & Transition Modal */}
      {showHandoverModal && (
        <TaskHandoverModal
          isOpen={showHandoverModal}
          onClose={() => setShowHandoverModal(false)}
          taskTitle={taskData.title}
          currentAssigneeName={taskData.assigned_to_name || taskData.user_name}
          currentAssigneeRole={taskData.assigned_to_role}
          currentAssigneeId={taskData.assigned_to}
          assignableUsers={assignableUsers}
          currentStatus={currentStatus}
          onSubmit={handleTaskHandover}
          isSubmitting={isSubmittingHandover}
        />
      )}

    </div>
  );
};

export default TaskDetailModal;
