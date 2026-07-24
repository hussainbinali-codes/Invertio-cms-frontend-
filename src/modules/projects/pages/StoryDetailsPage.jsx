import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Skeleton from '../../../components/ui/Skeleton';
import {
  ArrowLeft, Bookmark, CheckSquare, Clock, Flag,
  FileText, Activity, Paperclip, CheckCircle2, User, Calendar, Tag, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../../utils/cn';
import TaskDetailModal from '../../tasks/components/TaskDetailModal';

const StoryDetailsPage = () => {
  const { projectId, sprintId, storyId } = useParams();
  const navigate = useNavigate();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tabs: Overview (Functional), Tasks, Activity, Attachments
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    fetchStoryDetails();
  }, [storyId]);

  const fetchStoryDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/stories/${storyId}`);
      setStory(res.data.data);
    } catch (err) {
      toast.error('Failed to load user story details');
      navigate(`/projects/${projectId}/sprints/${sprintId}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
      case 'In Progress':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-3 py-1 text-xs">
            {status}
          </Badge>
        );
      case 'Completed':
        return (
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold px-3 py-1 text-xs">
            Completed
          </Badge>
        );
      case 'Ready':
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold px-3 py-1 text-xs">
            Ready
          </Badge>
        );
      case 'Draft':
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-bold px-3 py-1 text-xs">
            {status || 'Draft'}
          </Badge>
        );
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Critical':
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-bold text-xs px-2.5 py-1">
            Critical
          </Badge>
        );
      case 'High':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-bold text-xs px-2.5 py-1">
            High
          </Badge>
        );
      case 'Medium':
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold text-xs px-2.5 py-1">
            Medium
          </Badge>
        );
      case 'Low':
      default:
        return (
          <Badge className="bg-slate-100 text-slate-600 border-slate-200 font-bold text-xs px-2.5 py-1">
            Low
          </Badge>
        );
    }
  };

  const tabs = [
    { id: 'Overview', label: 'Overview', icon: FileText },
    { id: 'Tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'Activity', label: 'Activity', icon: Activity },
    { id: 'Attachments', label: 'Attachments', icon: Paperclip },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-[1400px] mx-auto py-2">
      {/* Top Back Nav */}
      <div>
        <Link
          to={`/projects/${projectId}/sprints/${sprintId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sprint Details
        </Link>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
        ) : (
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            {/* Header Title Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-mono font-bold">
                    {story?.story_key}
                  </span>
                  {getPriorityBadge(story?.priority)}
                  {getStatusBadge(story?.status)}
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-mono font-bold">
                    {story?.story_points || 0} Story Points
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-950 tracking-tight pt-1">
                  {story?.title}
                </h1>
              </div>

              <div className="text-xs text-slate-500 font-mono">
                Created by <strong>{story?.creator_name || 'System'}</strong> on {formatDate(story?.created_at)}
              </div>
            </div>

            {/* Labels */}
            {story?.labels && story.labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {(Array.isArray(story.labels) ? story.labels : []).map((label, idx) => (
                  <span key={idx} className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                    #{label}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 font-mono whitespace-nowrap",
                isActive
                  ? "border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENTS */}
      {activeTab === 'Overview' && (
        <div className="space-y-6">
          <div className="bg-slate-200/40 p-1.5 rounded-[2rem] border border-slate-200/20">
            <div className="bg-white p-6 rounded-[calc(2rem-0.375rem)] border border-slate-100 space-y-6">
              {/* Description Section */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">
                  User Story Description
                </h3>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <p className="text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-wrap">
                    {story?.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Acceptance Criteria Section */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">
                  Acceptance Criteria
                </h3>
                <div className="p-4 bg-blue-50/30 border border-blue-100 rounded-2xl">
                  <p className="text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-wrap">
                    {story?.acceptance_criteria || 'No acceptance criteria specified.'}
                  </p>
                </div>
              </div>

              {/* Associated Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Project</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{story?.project_name || 'N/A'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Sprint Iteration</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{story?.sprint_name || 'N/A'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Tasks Count</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{story?.task_count || 0} Tasks</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Tasks' && (
        <StoryTasksTab story={story} storyId={storyId} projectId={projectId} sprintId={sprintId} />
      )}

      {(activeTab === 'Activity' || activeTab === 'Attachments') && (
        <div className="bg-slate-200/40 p-1.5 rounded-[2rem] border border-slate-200/20">
          <div className="bg-white p-12 rounded-[calc(2rem-0.375rem)] border border-slate-100 text-center flex flex-col items-center justify-center space-y-3">
            <div className="p-4 bg-slate-100 text-slate-500 rounded-3xl mb-2">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{activeTab} Placeholder</h3>
            <p className="text-xs text-slate-500 font-normal">
              Story {activeTab.toLowerCase()} tracking module.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * StoryTasksTab component for managing tasks within a User Story
 */
const StoryTasksTab = ({ story, storyId, projectId, sprintId }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = (user.role_name || '').toLowerCase();
  const isAdmin = ['super admin', 'admin', 'administrator', 'project manager', 'pm'].includes(role);

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [projectTeam, setProjectTeam] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchTasks();
    if (projectId) {
      axios.get(`/projects/${projectId}/team`)
        .then(res => setProjectTeam(res.data.data || []))
        .catch(() => setProjectTeam([]));
    }
  }, [storyId, projectId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/stories/${storyId}/tasks`);
      setTasks(res.data.data || []);
    } catch {
      toast.error('Failed to load tasks for this user story.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Task title is required.');
      return;
    }
    setIsCreating(true);
    try {
      await axios.post(`/stories/${storyId}/tasks`, {
        title: newTitle.trim(),
        priority: newPriority,
        due_date: newDueDate || null,
        assigned_to: assignedTo || null,
        status: 'Pending'
      });
      toast.success('Task created successfully under this User Story!');
      setNewTitle('');
      setNewDueDate('');
      setAssignedTo('');
      setShowCreateModal(false);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">User Story Tasks</h3>
          <p className="text-xs text-slate-500 font-normal">All engineering tasks linked to [{story?.story_key || 'Story'}]</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-sm"
        >
          <CheckSquare className="w-4 h-4" />
          Add Task to Story
        </Button>
      </div>

      {/* Inline Quick Create Modal / Card */}
      {showCreateModal && (
        <form onSubmit={handleCreateTask} className="p-5 bg-blue-50/40 border border-blue-100 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">New Task under {story?.story_key}</span>
            <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Task Title (e.g. Build authentication middleware)..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              required
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Assignee (Project Team)</label>
                <select
                  value={assignedTo}
                  onChange={e => setAssignedTo(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned</option>
                  {projectTeam.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.role_name ? `(${u.role_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={e => setNewPriority(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Critical">Critical Priority</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Due Date</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={e => setNewDueDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" disabled={isCreating} size="sm" className="bg-blue-600 text-white font-bold">
              {isCreating ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="bg-slate-200/40 p-1.5 rounded-[2rem] border border-slate-200/20">
        <div className="bg-white rounded-[calc(2rem-0.375rem)] border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-600">No tasks created under this story yet.</p>
              <p className="text-xs text-slate-400">Click "Add Task to Story" above to break down this requirement into actionable tasks.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tasks.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTask(t)}
                  className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors shrink-0">
                      <CheckSquare className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{t.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                        <span>Assigned to: <strong className="text-slate-600">{t.assigned_to_name || 'Unassigned'}</strong></span>
                        {t.due_date && <span>• Due: {new Date(t.due_date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                      t.priority === 'Critical' ? "bg-rose-100 text-rose-700" :
                      t.priority === 'High' ? "bg-amber-100 text-amber-700" :
                      t.priority === 'Medium' ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                    )}>
                      {t.priority}
                    </span>
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                      t.status === 'Completed' ? "bg-emerald-100 text-emerald-700" :
                      t.status === 'In Progress' ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                    )}>
                      {t.status || 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={fetchTasks}
        />
      )}
    </div>
  );
};

export default StoryDetailsPage;
