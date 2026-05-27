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

const TasksPage = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [activeTab, setActiveTab] = useState('my'); // 'my' or 'boards'
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, completed: 0, overdue: 0 });
  const [myTasks, setMyTasks] = useState([]);
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

      if (showBoardsTab) {
        requests.push(axios.get('/projects').catch(() => ({ data: { data: [] } })));
      }

      const results = await Promise.all(requests);

      setStats(results[0].data.data || { total: 0, pending: 0, in_progress: 0, completed: 0, overdue: 0 });
      setMyTasks(results[1].data.data || []);

      if (showBoardsTab && results[3]) {
        setProjects(Array.isArray(results[3].data.data) ? results[3].data.data : []);
      }

      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch data", error);
      toast.error("Some data could not be loaded due to permissions.");
      setLoading(false);
    }
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
        for (const file of completionFiles) {
          const formData = new FormData();
          formData.append('file', file);
          await axios.post(`/projects/tasks/${taskToComplete.id}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
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
        assigned_to: payload.assigned_to || null,
        story_points: parseInt(payload.story_points || 0),
        priority: payload.priority || 'Medium',
        task_references: taskReferences ? [{ title: 'Notes', value: taskReferences }] : []
      });

      const newTask = taskRes.data.data;

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          await axios.post(`/projects/tasks/${newTask.id}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
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
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tasks Center</h1>
          <p className="text-sm text-slate-500 mt-1">Institutional labor allocation and personal task pipelines.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total Backlog" value={stats.pending} icon={CheckSquare} subtext="Pending items" />
        <StatCard title="In Progress" value={stats.in_progress} icon={TrendingUp} subtext="Active items" />
        <StatCard title="Completed" value={stats.completed} icon={CheckCircle2} subtext="Resolved tasks" />
        <StatCard title="Overdue" value={stats.overdue} icon={AlertTriangle} subtext="Critical attention" />
        <StatCard title="Backlog Velocity" value={stats.total_points || 0} icon={Target} subtext="Total story points" />
        <StatCard title="Completed Pts" value={stats.completed_points || 0} icon={TrendingUp} subtext="Delivered value" />
      </div>

      {showBoardsTab && (
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('boards')}
            className={cn(
              "px-6 py-2 rounded-lg text-xs font-bold transition-all",
              activeTab === 'boards' ? "bg-white text-primary-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            GLOBAL BOARDS
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={cn(
              "px-6 py-2 rounded-lg text-xs font-bold transition-all",
              activeTab === 'my' ? "bg-white text-primary-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            MY PIPELINE
          </button>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-6">
          <div>
            <CardTitle className="text-xl font-bold">
              {activeTab === 'boards' ? 'Institutional Boards' : 'Personal Pipeline'}
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {activeTab === 'boards'
                ? `Managing tasks across ${projects.length} project pipelines.`
                : `Tracking ${myTasks.length} items assigned to you.`}
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              className="pl-10 h-10 text-sm"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
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
        </CardContent>
      </Card>

      <Suspense fallback={null}>
        <AddTaskModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          selectedProject={selectedProject}
          onSubmit={submitTask}
          isSubmitting={isSubmitting}
          projectTeam={projectTeam}
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
          />
        )}
      </Suspense>
    </div>
  );
};

export default TasksPage;
