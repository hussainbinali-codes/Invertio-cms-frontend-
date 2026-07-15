import React, { useEffect, useState, Suspense, lazy } from 'react';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import { Search, CheckSquare, CheckCircle2, AlertTriangle, TrendingUp, Target, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import StatCard from '../../../components/ui/StatCard';
import { cn } from '../../../utils/cn';
import Skeleton from '../../../components/ui/Skeleton';

// Lazy Load Modular Components
const MyPipelineTab = lazy(() => import('../components/MyPipelineTab'));
const GlobalBoardsTab = lazy(() => import('../components/GlobalBoardsTab'));
const TaskAssigneesTab = lazy(() => import('../components/TaskAssigneesTab'));
const AddTaskModal = lazy(() => import('../components/AddTaskModal'));
const ProofOfCompletionModal = lazy(() => import('../components/ProofOfCompletionModal'));

// Pre-existing Modals
const TaskViewModal = lazy(() => import('../components/TaskViewModal'));
const TaskDetailModal = lazy(() => import('../components/TaskDetailModal'));

const TabLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
  </div>
);

// Premium Double-Bezel KPI Card component
const KpiCard = ({ title, value, icon: Icon, subtext, trend }) => {
  return (
    <div className="bg-slate-200/40 p-1.5 rounded-[1.75rem] border border-slate-200/20 hover:bg-slate-200/60 active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group hover:-translate-y-0.5 flex-1">
      <div className="bg-white p-5 rounded-[calc(1.75rem-0.375rem)] border border-slate-200/25 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_8px_-4px_rgba(0,0,0,0.03)] h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none">
              {title}
            </span>
            {Icon && (
              <div className="p-2 bg-slate-50 border border-slate-100/60 rounded-xl group-hover:scale-105 transition-transform duration-300">
                <Icon className="w-3.5 h-3.5 text-slate-500" />
              </div>
            )}
          </div>
          
          <div className="mt-3">
            <span className="text-3xl font-bold text-slate-800 tracking-tight font-mono">
              {value}
            </span>
          </div>
        </div>

        {(trend || subtext) && (
          <div className="mt-4 flex items-center gap-2">
            {trend && (
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full font-mono",
                trend.startsWith('+') ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
              )}>
                {trend}
              </span>
            )}
            {subtext && (
              <span className="text-xs text-slate-500 font-medium font-mono">
                {subtext}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Premium Double-Bezel Card Container component
const PremiumCard = ({ title, subtitle, icon: Icon, children, className, headerRight }) => {
  return (
    <div className={cn("bg-slate-200/30 p-1.5 rounded-[2rem] border border-slate-200/10", className)}>
      <div className="bg-white rounded-[calc(2rem-0.375rem)] border border-slate-200/20 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_4px_16px_-8px_rgba(0,0,0,0.02)] overflow-hidden h-full flex flex-col">
        {(title || subtitle) && (
          <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <Icon className="w-4 h-4 text-slate-500" />
                </div>
              )}
              <div>
                {title && <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>}
                {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
              </div>
            </div>
            {headerRight}
          </div>
        )}
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
};

const TasksPage = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [activeTab, setActiveTab] = useState('my'); // 'my' or 'boards'
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, completed: 0, overdue: 0 });
  const [myTasks, setMyTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectTeam, setProjectTeam] = useState([]);
  const [isFetchingTeam, setIsFetchingTeam] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState(null);
  const [taskReferences, setTaskReferences] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Proof of Completion states
  const [showProofModal, setShowProofModal] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionFiles, setCompletionFiles] = useState([]);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const role = (user.role_name || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'super admin' || role === 'administrator';

  const canViewAll = isAdmin || !!user.modules?.tasks?.view_all;
  const canCreate = isAdmin || !!user.modules?.tasks?.create;
  const showBoardsTab = canViewAll || canCreate;

  useEffect(() => {
    fetchData();
    if (showBoardsTab) setActiveTab('boards');
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const canViewTasks = isAdmin || !!user.modules?.tasks?.view;

      if (!canViewTasks) {
        setLoading(false);
        return;
      }

      const requests = [
        axios.get('/projects/stats/tasks'),
        axios.get('/projects/tasks/my'),
        axios.get('/users/selection').catch(() => ({ data: { data: [] } }))
      ];

      let projectsResIndex = -1;
      if (showBoardsTab) {
        projectsResIndex = requests.length;
        requests.push(axios.get('/projects').catch(() => ({ data: { data: [] } })));
      }

      let allTasksResIndex = -1;
      if (canViewAll) {
        allTasksResIndex = requests.length;
        requests.push(axios.get('/projects/tasks/all').catch(() => ({ data: { data: [] } })));
      }

      const results = await Promise.all(requests);

      setStats(results[0].data.data || { total: 0, pending: 0, in_progress: 0, completed: 0, overdue: 0 });
      setMyTasks(results[1].data.data || []);

      if (projectsResIndex > -1) {
        setProjects(Array.isArray(results[projectsResIndex].data.data) ? results[projectsResIndex].data.data : []);
      }

      if (allTasksResIndex > -1) {
        setAllTasks(results[allTasksResIndex].data.data || []);
      }

      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch data", error);
      toast.error("Some data could not be loaded due to permissions.");
      setLoading(false);
    }
  };

  const handleTaskDetailUpdate = (updatedTask) => {
    if (!updatedTask?.id) return;

    setMyTasks((prevTasks) => prevTasks.map((task) => (
      task.id === updatedTask.id ? { ...task, ...updatedTask } : task
    )));
    setSelectedTaskDetail((prevTask) => (
      prevTask?.id === updatedTask.id ? { ...prevTask, ...updatedTask } : prevTask
    ));
  };

  const handleUpdateTask = async (taskId, updates) => {
    if (updates.status === 'Completed') {
      setTaskToComplete({ id: taskId, ...updates });
      setShowProofModal(true);
      return;
    }

    setUpdatingTaskId(taskId);
    try {
      await axios.patch(`/projects/tasks/${taskId}`, updates);
      toast.success('Task updated successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to update task');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const submitCompletionProof = async () => {
    if (!completionNotes.trim()) {
      toast.error("Please provide completion notes as proof.");
      return;
    }

    setIsSubmittingProof(true);
    try {
      await axios.patch(`/projects/tasks/${taskToComplete.id}`, {
        status: 'Completed',
        completion_notes: completionNotes,
        completion_date: new Date().toISOString()
      });

      if (completionFiles.length > 0) {
        const formData = new FormData();
        for (const file of completionFiles) {
          formData.append('files', file);
        }
        await axios.post(`/projects/tasks/${taskToComplete.id}/documents`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      toast.success('Task completed with proof of work');
      setShowProofModal(false);
      setCompletionNotes('');
      setCompletionFiles([]);
      setTaskToComplete(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to submit completion proof');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const handleCreateTask = async (project) => {
    if (project.status?.includes('Blocked')) {
      toast.error("Access Denied: Project is currently Blocked (Financial). Clear outstanding payments to resume operations.");
      return;
    }

    setSelectedProject(project);
    setIsFetchingTeam(true);

    try {
      const res = await axios.get(`/projects/${project.id}/team`);
      setProjectTeam(res.data.data || []);
      setShowAddModal(true);
    } catch (error) {
      toast.error('Failed to fetch project team members');
    } finally {
      setIsFetchingTeam(false);
    }
  };

  const handleViewTasks = (project) => {
    setSelectedProject(project);
    setShowTasksModal(true);
  };

  const submitTask = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData);

    try {
      const taskRes = await axios.post(`/projects/${selectedProject.id}/tasks`, {
        ...payload,
        assigned_to: payload.assigned_to || undefined,
        story_points: parseInt(payload.story_points || 0),
        priority: payload.priority || 'Medium',
        task_references: taskReferences ? [{ title: 'Notes', value: taskReferences }] : []
      });

      const newTask = taskRes.data.data;

      if (selectedFiles.length > 0) {
        const formData = new FormData();
        for (const file of selectedFiles) {
          formData.append('files', file);
        }
        await axios.post(`/projects/tasks/${newTask.id}/documents`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      toast.success('Task successfully created and assigned');
      setShowAddModal(false);
      setTaskReferences('');
      setSelectedFiles([]);
      fetchData();
    } catch (err) {
      // Handled by global interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMyTasks = myTasks.filter(task =>
    task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProjects = projects.filter(project =>
    project.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10 max-w-[1400px] mx-auto py-2">
      {/* Header section with Asymmetric Layout */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight mt-1">
            Tasks Center
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-normal">
            Institutional labor allocation and personal task pipelines.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid in Double-Bezel nested wrapper */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <KpiCard title="Total Backlog" value={stats.pending} icon={CheckSquare} subtext="Pending items" />
        <KpiCard title="In Progress" value={stats.in_progress} icon={TrendingUp} subtext="Active items" />
        <KpiCard title="Completed" value={stats.completed} icon={CheckCircle2} subtext="Resolved tasks" />
        <KpiCard title="Overdue" value={stats.overdue} icon={AlertTriangle} subtext="Critical attention" />
        <KpiCard title="Backlog Velocity" value={stats.total_points || 0} icon={Target} subtext="Total story points" />
        <KpiCard title="Completed Pts" value={stats.completed_points || 0} icon={TrendingUp} subtext="Delivered value" />
      </div>

      {/* Tabs capsules */}
      {showBoardsTab && (
        <div className="bg-slate-200/40 border border-slate-200/25 rounded-2xl p-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar w-fit">
          <button
            onClick={() => setActiveTab('boards')}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 active:scale-[0.98]",
              activeTab === 'boards' ? "bg-white text-blue-600 shadow-sm border border-slate-200/20" : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
            )}
          >
            GLOBAL BOARDS
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 active:scale-[0.98]",
              activeTab === 'my' ? "bg-white text-blue-600 shadow-sm border border-slate-200/20" : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
            )}
          >
            MY PIPELINE
          </button>
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('assignees')}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 active:scale-[0.98]",
                activeTab === 'assignees' ? "bg-white text-blue-600 shadow-sm border border-slate-200/20" : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
              )}
            >
              MANAGE ASSIGNEES
            </button>
          )}
        </div>
      )}

      {/* Main Container Card in Double-Bezel layout */}
      <PremiumCard 
        title={activeTab === 'boards' ? 'Institutional Boards' : (activeTab === 'assignees' && isAdmin) ? 'Manage Task Assignees' : 'Personal Pipeline'} 
        subtitle={
          activeTab === 'boards'
            ? `Managing tasks across ${projects.length} project pipelines.`
            : (activeTab === 'assignees' && isAdmin)
            ? `Viewing all ${allTasks.length} task assignments across the company.`
            : `Tracking ${myTasks.length} items assigned to you.`
        } 
        icon={CheckSquare}
        headerRight={
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              className="pl-10 h-10 text-xs rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        }
      >
        <div className="flex-1">
          {loading ? (
            <div className="divide-y divide-slate-100">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-5 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : (
            <Suspense fallback={<TabLoader />}>
              {activeTab === 'my' ? (
                <MyPipelineTab
                  tasks={filteredMyTasks}
                  handleUpdateTask={handleUpdateTask}
                  updatingTaskId={updatingTaskId}
                  setSelectedTaskDetail={setSelectedTaskDetail}
                />
              ) : (activeTab === 'assignees' && isAdmin) ? (
                <TaskAssigneesTab
                  tasks={allTasks.filter(task =>
                    task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    task.description?.toLowerCase().includes(searchTerm.toLowerCase())
                  )}
                  setSelectedTaskDetail={setSelectedTaskDetail}
                />
              ) : (
                <GlobalBoardsTab
                  projects={filteredProjects}
                  canCreate={canCreate}
                  handleViewTasks={handleViewTasks}
                  handleCreateTask={handleCreateTask}
                />
              )}
            </Suspense>
          )}
        </div>
      </PremiumCard>

      <Suspense fallback={null}>
        <AddTaskModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          selectedProject={selectedProject}
          onSubmit={submitTask}
          isSubmitting={isSubmitting}
          projectTeam={projectTeam}
          isAdmin={isAdmin}
          taskReferences={taskReferences}
          setTaskReferences={setTaskReferences}
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
        />

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

        {showTasksModal && selectedProject && (
          <TaskViewModal
            project={selectedProject}
            onClose={() => setShowTasksModal(false)}
          />
        )}

        {selectedTaskDetail && (
          <TaskDetailModal
            task={selectedTaskDetail}
            onClose={() => setSelectedTaskDetail(null)}
            onUpdate={handleTaskDetailUpdate}
          />
        )}
      </Suspense>
    </div>
  );
};

export default TasksPage;

