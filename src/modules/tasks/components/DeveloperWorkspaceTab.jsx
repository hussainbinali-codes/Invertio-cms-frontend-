import React, { useState, useCallback } from 'react';
import axios from '../../../api/axios';
import { cn } from '../../../utils/cn';
import {
  FolderKanban, ChevronRight, Bookmark, CheckSquare, GitBranch,
  Plus, CheckCircle2, Loader2, AlertTriangle, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * DeveloperWorkspaceTab
 *
 * Shows a hierarchical view of the developer's assigned work:
 * Projects → User Stories (Features) → Tasks → Sub Tasks
 *
 * All sections are lazy-loaded when the user expands them.
 * Developers can update status on tasks/subtasks and create sub tasks.
 */

const STATUS_COLORS = {
  'Completed': 'bg-emerald-100 text-emerald-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Pending': 'bg-slate-100 text-slate-600',
  'Blocked': 'bg-rose-100 text-rose-700',
  'Draft': 'bg-slate-100 text-slate-500',
  'Ready': 'bg-violet-100 text-violet-700',
};

const statusBadge = (status) => (
  <span className={cn('text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded', STATUS_COLORS[status] || 'bg-slate-100 text-slate-500')}>
    {status || 'N/A'}
  </span>
);

const priorityDot = (priority) => {
  const colors = { Critical: 'bg-rose-500', High: 'bg-amber-500', Medium: 'bg-blue-400', Low: 'bg-slate-400' };
  return <span className={cn('w-2 h-2 rounded-full shrink-0', colors[priority] || 'bg-slate-300')} />;
};

// ──────────────── Sub Tasks Row ────────────────
const SubTaskRow = ({ subTask, onStatusChange, disabled }) => (
  <div className="flex items-center gap-2.5 py-1.5 px-3 hover:bg-slate-50 rounded-lg transition-colors">
    <GitBranch className="w-3 h-3 text-slate-300 shrink-0" />
    {priorityDot(subTask.priority)}
    <span className={cn('text-xs flex-1 truncate', subTask.status === 'Completed' && 'line-through text-slate-400')}>
      {subTask.title}
    </span>
    <select
      value={subTask.status}
      onChange={e => onStatusChange(subTask.id, e.target.value)}
      disabled={disabled}
      className="text-[9px] font-bold border border-slate-200 rounded-lg px-1.5 py-0.5 bg-white focus:outline-none shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <option value="Pending">Pending</option>
      <option value="In Progress">In Progress</option>
      <option value="Completed">Completed</option>
      <option value="Blocked">Blocked</option>
    </select>
  </div>
);

// ──────────────── Task Row ────────────────
const TaskRow = ({ task }) => {
  const [expanded, setExpanded] = useState(false);
  const [subTasks, setSubTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const isTaskCompleted = task.status === 'Completed';

  const toggle = useCallback(async () => {
    setExpanded(v => !v);
    if (!fetched) {
      setLoading(true);
      setFetched(true);
      try {
        const res = await axios.get(`/tasks/${task.id}/subtasks`);
        setSubTasks(res.data.data || []);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    }
  }, [task.id, fetched]);

  const handleSubTaskStatusChange = async (subTaskId, newStatus) => {
    try {
      await axios.patch(`/subtasks/${subTaskId}`, { status: newStatus });
      setSubTasks(prev => prev.map(st => st.id === subTaskId ? { ...st, status: newStatus } : st));
    } catch {
      toast.error('Failed to update sub task');
    }
  };

  const handleAddSubTask = async () => {
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      const res = await axios.post(`/tasks/${task.id}/subtasks`, { title: newTitle });
      setSubTasks(prev => [...prev, res.data.data]);
      setNewTitle('');
      setShowAdd(false);
      toast.success('Sub task added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add sub task');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="border-l-2 border-slate-100 pl-3 ml-2">
      <div
        className="flex items-center gap-2 py-1.5 px-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
        onClick={toggle}
      >
        <ChevronRight className={cn('w-3 h-3 text-slate-400 shrink-0 transition-transform', expanded && 'rotate-90')} />
        <CheckSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        {priorityDot(task.priority)}
        <span className="text-xs font-medium flex-1 truncate">{task.title}</span>
        {task.assigned_to_name && (
          <span className="text-[9px] text-slate-400 hidden sm:block">{task.assigned_to_name}</span>
        )}
        {statusBadge(task.status)}
        {subTasks.length > 0 && (
          <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{subTasks.length}</span>
        )}
      </div>

      {expanded && (
        <div className="mt-1 mb-2 space-y-0.5">
          {loading && <div className="text-[10px] text-slate-400 pl-6 py-1"><Loader2 className="w-3 h-3 animate-spin inline mr-1" />Loading...</div>}
          {!loading && subTasks.map(st => (
            <SubTaskRow key={st.id} subTask={st} onStatusChange={handleSubTaskStatusChange} disabled={isTaskCompleted} />
          ))}
          {!loading && subTasks.length === 0 && (
            <div className="text-[10px] text-slate-400 italic pl-6 py-1">No sub tasks</div>
          )}

          {/* Inline add sub task */}
          {!isTaskCompleted && (
            showAdd ? (
              <div className="flex items-center gap-1.5 pl-6 py-1">
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Sub task title..."
                  className="flex-1 text-xs px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  onKeyDown={e => e.key === 'Enter' && handleAddSubTask()}
                  autoFocus
                />
                <button
                  onClick={handleAddSubTask}
                  disabled={isCreating}
                  className="text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded-lg flex items-center gap-1"
                >
                  {isCreating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                  Add
                </button>
                <button onClick={() => { setShowAdd(false); setNewTitle(''); }} className="text-[10px] text-slate-400 hover:text-slate-600">✕</button>
              </div>
            ) : (
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline pl-6 py-0.5"
              >
                <Plus className="w-3 h-3" /> Add sub task
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};

// ──────────────── Story Row (Feature) ────────────────
const StoryRow = ({ story }) => {
  const [expanded, setExpanded] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const toggle = useCallback(async () => {
    setExpanded(v => !v);
    if (!fetched) {
      setLoading(true);
      setFetched(true);
      try {
        const res = await axios.get(`/stories/${story.id}/tasks`);
        setTasks(res.data.data || []);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    }
  }, [story.id, fetched]);

  return (
    <div className="border-l-2 border-slate-100 pl-3 ml-2">
      <div
        className="flex items-center gap-2 py-1.5 px-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
        onClick={toggle}
      >
        <ChevronRight className={cn('w-3 h-3 text-slate-400 shrink-0 transition-transform', expanded && 'rotate-90')} />
        <Bookmark className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span className="text-xs font-semibold flex-1 truncate">{story.title}</span>
        {story.story_points > 0 && (
          <span className="text-[9px] font-bold text-slate-400">{story.story_points}pts</span>
        )}
        {statusBadge(story.status)}
        {tasks.length > 0 && (
          <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">{tasks.length}</span>
        )}
      </div>

      {expanded && (
        <div className="mt-1 mb-2 space-y-0.5">
          {loading && <div className="text-[10px] text-slate-400 pl-6 py-1"><Loader2 className="w-3 h-3 animate-spin inline mr-1" />Loading tasks...</div>}
          {!loading && tasks.map(t => <TaskRow key={t.id} task={t} />)}
          {!loading && tasks.length === 0 && (
            <div className="text-[10px] text-slate-400 italic pl-6 py-1">No tasks in this story</div>
          )}
        </div>
      )}
    </div>
  );
};

// ──────────────── Project Row ────────────────
const ProjectRow = ({ project }) => {
  const [expanded, setExpanded] = useState(false);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const toggle = useCallback(async () => {
    setExpanded(v => !v);
    if (!fetched) {
      setLoading(true);
      setFetched(true);
      try {
        // Fetch all sprints for the project, then all stories across sprints
        const sprintsRes = await axios.get(`/projects/${project.id}/sprints`);
        const sprints = sprintsRes.data.data || [];
        const allStories = [];
        await Promise.all(
          sprints.map(async (s) => {
            try {
              const sRes = await axios.get(`/projects/${project.id}/sprints/${s.id}/stories`);
              allStories.push(...(sRes.data.data || []).map(st => ({ ...st, sprint_name: s.name })));
            } catch { /* sprint may have no stories */ }
          })
        );
        setStories(allStories);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    }
  }, [project.id, fetched]);

  const statusColor = {
    'In Progress': 'bg-blue-100 text-blue-700',
    'Completed': 'bg-emerald-100 text-emerald-700',
    'Planned': 'bg-slate-100 text-slate-600',
    'On Hold': 'bg-amber-100 text-amber-700',
  }[project.status] || 'bg-slate-100 text-slate-500';

  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden hover:border-slate-200 transition-colors">
      <div
        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={toggle}
      >
        <div className="p-1.5 bg-blue-50 rounded-xl shrink-0">
          <FolderKanban className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 truncate">{project.name}</span>
            <span className={cn('text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full', statusColor)}>
              {project.status}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{project.client_name || 'Internal'}</p>
        </div>
        {stories.length > 0 && (
          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full shrink-0">
            {stories.length} stories
          </span>
        )}
        <ChevronRight className={cn('w-4 h-4 text-slate-400 shrink-0 transition-transform', expanded && 'rotate-90')} />
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-1 bg-white">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading features...
            </div>
          )}
          {!loading && stories.length === 0 && (
            <div className="text-xs text-slate-400 italic py-2">No user stories (features) in this project yet.</div>
          )}
          {!loading && stories.map(s => (
            <div key={s.id}>
              {s.sprint_name && (
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-2 mb-1 pl-2">
                  {s.sprint_name}
                </div>
              )}
              <StoryRow story={s} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ──────────────── Main Component ────────────────
const DeveloperWorkspaceTab = ({ projects = [], loading }) => {
  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 bg-slate-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 bg-slate-100 rounded-2xl mb-4">
          <FolderKanban className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-sm font-bold text-slate-700">No Projects Assigned</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          You haven't been added to any project teams yet. Contact your Project Manager.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {projects.length} project{projects.length !== 1 ? 's' : ''} assigned to you
        </span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>
      {projects.map(project => (
        <ProjectRow key={project.id} project={project} />
      ))}
    </div>
  );
};

export default DeveloperWorkspaceTab;
