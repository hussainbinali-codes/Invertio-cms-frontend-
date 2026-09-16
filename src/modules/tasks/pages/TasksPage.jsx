import React, { useEffect, useState, useRef, Suspense, lazy } from 'react';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { Search, CheckSquare, CheckCircle2, AlertTriangle, TrendingUp, Target, Loader2, BarChart3, ChevronDown, LayoutGrid, Users, X, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import StatCard from '../../../components/ui/StatCard';
import { cn } from '../../../utils/cn';
import Skeleton from '../../../components/ui/Skeleton';

// Lazy Load Modular Components
const MyPipelineTab = lazy(() => import('../components/MyPipelineTab'));
const GlobalBoardsTab = lazy(() => import('../components/GlobalBoardsTab'));
const TaskAssigneesTab = lazy(() => import('../components/TaskAssigneesTab'));
const DeveloperWorkspaceTab = lazy(() => import('../components/DeveloperWorkspaceTab'));
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

// Normal dimension KPI Card component
const KpiCard = ({ title, value, icon: Icon, subtext, trend }) => {
  return (
    <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg">
            <Icon className="w-3.5 h-3.5 text-slate-500" />
          </div>
        )}
      </div>

      <div className="mt-1.5">
        <span className="text-2xl font-bold text-slate-800 tracking-tight">
          {value}
        </span>
      </div>

      {(trend || subtext) && (
        <div className="mt-1.5 flex items-center gap-1.5">
          {trend && (
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded",
              trend.startsWith('+') ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
            )}>
              {trend}
            </span>
          )}
          {subtext && (
            <span className="text-[11px] text-slate-400 font-medium">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Premium Double-Bezel Card Container component
const PremiumCard = ({ title, subtitle, icon: Icon, children, className, headerRight }) => {
  return (
    <div className={cn("bg-slate-200/30 p-1.5 rounded-[2rem] border border-slate-200/10 w-full min-w-0", className)}>
      <div className="bg-white rounded-[calc(2rem-0.375rem)] border border-slate-200/20 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_4px_16px_-8px_rgba(0,0,0,0.02)] overflow-hidden h-full flex flex-col w-full min-w-0">
        {(title || subtitle) && (
          <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 shrink-0">
                  <Icon className="w-4 h-4 text-slate-500" />
                </div>
              )}
              <div className="min-w-0">
                {title && <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>}
                {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
              </div>
            </div>
            {headerRight}
          </div>
        )}
        <div className="flex-1 flex flex-col w-full min-w-0 overflow-x-auto">
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
  const [showKpiStats, setShowKpiStats] = useState(false);
  const [progressFilter, setProgressFilter] = useState('all'); // 'all', 'in_progress', 'completed', 'not_started'
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const role = (user.role_name || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'super admin' || role === 'administrator';

  const canViewAll = isAdmin || !!user.modules?.tasks?.view_all;
  const canCreate = isAdmin || !!user.modules?.tasks?.create;
  const showBoardsTab = canViewAll || canCreate;
  // Developers: users who have tasks view permission but cannot create/view all
  const isDeveloper = !showBoardsTab;

  // Developer-specific: assigned projects list
  const [assignedProjects, setAssignedProjects] = useState([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);

  const tabsList = [
    ...(showBoardsTab ? [{ id: 'boards', label: 'Project Boards', count: projects.length, icon: LayoutGrid }] : []),
    { id: 'my', label: 'My Pipeline', count: myTasks.length, icon: CheckSquare },
    ...(isAdmin ? [{ id: 'assignees', label: 'Assignees', count: allTasks.length, icon: Users }] : [])
  ];

  const tabRefs = useRef({});
  const [sliderStyle, setSliderStyle] = useState({ left: 4, width: 0, height: 0, top: 4, ready: false });

  useEffect(() => {
    const currentEl = tabRefs.current[activeTab];
    if (currentEl) {
      setSliderStyle({
        left: currentEl.offsetLeft,
        width: currentEl.offsetWidth,
        height: currentEl.offsetHeight,
        top: currentEl.offsetTop,
        ready: true
      });
    }
  }, [activeTab, projects.length, myTasks.length, allTasks.length, showBoardsTab]);

  useEffect(() => {
    fetchData();
    if (showBoardsTab) setActiveTab('boards');
    if (isDeveloper) fetchAssignedProjects();
  }, []);

  const fetchAssignedProjects = async () => {
    setLoadingAssigned(true);
    try {
      const res = await axios.get('/projects/user/assigned');
      setAssignedProjects(Array.isArray(res.data.data) ? res.data.data : []);
    } catch {
      // Fallback: try the regular projects endpoint which filters by user on backend
      try {
        const res = await axios.get('/projects');
        setAssignedProjects(Array.isArray(res.data.data) ? res.data.data : []);
      } catch { /* silent */ }
    } finally {
      setLoadingAssigned(false);
    }
  };

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
        const rawTasks = results[allTasksResIndex].data.data || [];
        setAllTasks(Array.isArray(rawTasks) ? rawTasks : (rawTasks.items || []));
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
      toast.error(err.response?.data?.message || 'Failed to update task');
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
      toast.error(err.response?.data?.message || 'Failed to submit completion proof');
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

    // Collect array inputs
    const functional_requirements = formData.getAll('functional_requirements');
    const acceptance_criteria = formData.getAll('acceptance_criteria');
    const testing_required = formData.getAll('testing_required');
    const definition_of_done = formData.getAll('definition_of_done');
    const deliverables = formData.getAll('deliverables');

    const payload = {
      title: formData.get('title'),
      module: formData.get('module') || '',
      task_type: formData.get('task_type'),
      priority: formData.get('priority') || 'Medium',
      story_points: parseInt(formData.get('story_points') || 0),
      assigned_to: formData.get('assigned_to') || undefined,
      reporter_id: formData.get('reporter_id') || undefined,

      estimated_start_date: formData.get('estimated_start_date') || undefined,
      estimated_end_date: formData.get('estimated_end_date') || undefined,
      estimated_hours: formData.get('estimated_hours') ? parseFloat(formData.get('estimated_hours')) : undefined,
      due_date: formData.get('due_date') || formData.get('estimated_end_date') || undefined,

      template_data: {
        business_objective: formData.get('business_objective') || '',
        current_issue: formData.get('current_issue') || '',
        expected_improvement: formData.get('expected_improvement') || '',
        business_impact: formData.get('business_impact') || '',
        functional_requirements: functional_requirements.filter(Boolean),
        technical_notes: {
          architecture: formData.get('tech_architecture') || '',
          libraries: formData.get('tech_libraries') || '',
          api_changes: formData.get('tech_api_changes') || '',
          database_changes: formData.get('tech_db_changes') || '',
          configurations: formData.get('tech_configurations') || '',
          dependencies: formData.get('tech_dependencies') || ''
        },
        acceptance_criteria: acceptance_criteria.filter(Boolean),
        deliverables: deliverables.filter(Boolean),
        testing_required: testing_required.filter(Boolean),
        definition_of_done: definition_of_done.filter(Boolean),
        blocker_status: formData.get('blocker_status') || undefined,
        blocker_waiting_for: formData.get('blocker_waiting_for') || undefined,
        blocker_expected_resolution: formData.get('blocker_expected_resolution') || undefined,
        next_update_date: formData.get('next_update_date') || undefined,
        risks: {
          performance: formData.get('risk_performance') || '',
          security: formData.get('risk_security') || '',
          compatibility: formData.get('risk_compatibility') || '',
          rollback_concerns: formData.get('risk_rollback') || ''
        },
        comments: {
          developer: formData.get('comment_developer') || '',
          qa: formData.get('comment_qa') || '',
          product: formData.get('comment_product') || ''
        }
      },
      task_references: taskReferences ? [{ title: 'Notes', value: taskReferences }] : []
    };

    try {
      const taskRes = await axios.post(`/projects/${selectedProject.id}/tasks`, payload);
      const newTask = taskRes.data.data;

      if (selectedFiles.length > 0) {
        const docFormData = new FormData();
        for (const file of selectedFiles) {
          docFormData.append('files', file);
        }
        await axios.post(`/projects/tasks/${newTask.id}/documents`, docFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      toast.success('Task successfully created and assigned');
      setShowAddModal(false);
      setTaskReferences('');
      setSelectedFiles([]);
      fetchData();
    } catch (err) {
      // Handled by central axios interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const term = searchTerm.trim().toLowerCase();

  const filteredMyTasks = myTasks.filter((task) => {
    if (!term) return true;
    return (
      task.title?.toLowerCase().includes(term) ||
      task.description?.toLowerCase().includes(term) ||
      task.project_name?.toLowerCase().includes(term) ||
      task.priority?.toLowerCase().includes(term) ||
      task.status?.toLowerCase().includes(term)
    );
  });

  const effectiveTasks = allTasks.length > 0 ? allTasks : myTasks;

  const filteredProjects = projects.filter((project) => {
    // 1. Filter by progress state (All / In Progress / Completed / Not Started)
    const projectTasks = (effectiveTasks || []).filter(
      (t) => t.project_id === project.id || t.project_name === project.name
    );
    const inProgressCount = projectTasks.filter((t) => t.status === 'In Progress').length;
    const completedCount = projectTasks.filter((t) => t.status === 'Completed').length;
    const totalTasks = projectTasks.length;
    const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    if (progressFilter === 'in_progress' && inProgressCount === 0) return false;
    if (progressFilter === 'completed' && (totalTasks === 0 || progressPercent < 100)) return false;
    if (progressFilter === 'not_started' && totalTasks > 0) return false;

    // 2. Search Term Filter
    if (!term) return true;

    // Project Name
    if (project.name?.toLowerCase().includes(term)) return true;

    // Tech Stack / Pipeline
    if (project.tech_stack?.toLowerCase().includes(term)) return true;

    // Client Name & Category
    if (project.client_name?.toLowerCase().includes(term)) return true;
    if (project.category?.toLowerCase().includes(term)) return true;

    // Status Column (Active / Blocked / etc.)
    const isBlocked = project.status?.includes('Blocked');
    if (isBlocked && 'blocked'.includes(term)) return true;
    if (!isBlocked && 'active'.includes(term)) return true;
    if (project.status?.toLowerCase().includes(term)) return true;

    // In Progress / Completed Task matches
    if (term.includes('progress') && inProgressCount > 0) return true;
    if ((term.includes('completed') || term.includes('done')) && completedCount > 0) return true;
    if (projectTasks.some((t) => t.title?.toLowerCase().includes(term))) return true;

    return false;
  });

  return (
    <div className="flex-1 min-h-0 flex flex-col w-full h-full gap-2.5 overflow-hidden">
      {/* Header section with Project Boards and Pipeline tabs aligned at the end */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 m-0 p-0 shrink-0">
        <div className="m-0 p-0">
          <h1 className="text-xl font-bold text-slate-950 tracking-tight m-0 p-0">
            Tasks & Workspaces
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            Manage project boards, sprint backlogs, and team deliverables.
          </p>
        </div>

        {/* Smooth Toggle Slider Tabs at the end of header */}
        {showBoardsTab && (
          <div className="relative bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 flex items-center overflow-x-auto no-scrollbar shadow-inner shrink-0">
            {/* Smooth Sliding Background Pill */}
            <div
              className={cn(
                "absolute bg-white rounded-lg shadow-sm border border-slate-200/90 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none",
                !sliderStyle.ready && "opacity-0"
              )}
              style={{
                left: `${sliderStyle.left}px`,
                top: `${sliderStyle.top}px`,
                width: `${sliderStyle.width}px`,
                height: `${sliderStyle.height}px`
              }}
            />

            {tabsList.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => (tabRefs.current[tab.id] = el)}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative z-10 flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold tracking-normal transition-colors duration-200",
                    isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5 transition-colors", isActive ? "text-blue-600" : "text-slate-400")} />
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-colors",
                      isActive ? "bg-blue-50 text-blue-700" : "bg-slate-200/70 text-slate-500"
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Manage Board Toggle Button (Commented out) */}
      {/*
      <button
        type="button"
        onClick={() => setShowKpiStats(prev => !prev)}
        className={cn(
          "flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-200 shadow-sm shrink-0",
          showKpiStats
            ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
        )}
      >
        <BarChart3 className="w-3.5 h-3.5" />
        <span>Manage Board</span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", showKpiStats && "rotate-180")} />
      </button>
      */}

      {/* KPI Stats Grid with Smooth Collapse Transition (Commented out) */}
      {/*
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out overflow-hidden",
          showKpiStats
            ? "grid-rows-[1fr] opacity-100 my-1"
            : "grid-rows-[0fr] opacity-0 -mt-4 pointer-events-none"
        )}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1 pb-1">
            <KpiCard title="Total Backlog" value={stats.pending} icon={CheckSquare} subtext="Pending items" />
            <KpiCard title="In Progress" value={stats.in_progress} icon={TrendingUp} subtext="Active items" />
            <KpiCard title="Completed" value={stats.completed} icon={CheckCircle2} subtext="Resolved tasks" />
            <KpiCard title="Overdue" value={stats.overdue} icon={AlertTriangle} subtext="Critical attention" />
            <KpiCard title="Completed Pts" value={stats.completed_points || 0} icon={TrendingUp} subtext="Delivered value" />
          </div>
        </div>
      </div>
      */}

      {/* Main Container Card in Double-Bezel layout */}
      <PremiumCard
        className="flex-1 min-h-0 flex flex-col overflow-hidden"
        title={activeTab === 'boards' ? 'Project Boards' : (activeTab === 'assignees' && isAdmin) ? 'Manage Task Assignees' : 'Personal Pipeline'}
        subtitle={
          activeTab === 'boards'
            ? `Managing tasks across ${projects.length} project pipelines.`
            : (activeTab === 'assignees' && isAdmin)
              ? `Viewing all ${allTasks.length} task assignments across the company.`
              : `Tracking ${myTasks.length} items assigned to you.`
        }
        icon={CheckSquare}
        headerRight={
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-600 transition-colors pointer-events-none z-10" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={activeTab === 'boards' ? "Search boards, tech, status..." : "Search tasks..."}
                className="w-full h-9 pl-9 pr-8 text-xs font-medium bg-slate-50/80 hover:bg-slate-100/60 focus:bg-white border border-slate-200/90 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all shadow-sm"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100 transition-colors z-10"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {activeTab === 'boards' && (
              <div className="relative" ref={filterDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowFilterDropdown((prev) => !prev)}
                  className={cn(
                    "h-9 px-3 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all shadow-sm shrink-0",
                    progressFilter !== 'all'
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-slate-50/80 hover:bg-slate-100/60 text-slate-700 border-slate-200/90"
                  )}
                  title="Filter boards by progress"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  <span className="capitalize">
                    {progressFilter === 'all'
                      ? 'All'
                      : progressFilter === 'in_progress'
                      ? 'In Progress'
                      : progressFilter === 'completed'
                      ? 'Completed'
                      : 'Not Started'}
                  </span>
                  <ChevronDown className={cn("w-3 h-3 text-slate-400 transition-transform", showFilterDropdown && "rotate-180")} />
                </button>

                {showFilterDropdown && (
                  <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-30 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setProgressFilter('all');
                        setShowFilterDropdown(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg flex items-center justify-between transition-colors",
                        progressFilter === 'all' ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <span>All Boards</span>
                      <span className="text-[10px] text-slate-400">{projects.length}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProgressFilter('in_progress');
                        setShowFilterDropdown(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg flex items-center justify-between transition-colors",
                        progressFilter === 'in_progress' ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        In Progress
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProgressFilter('completed');
                        setShowFilterDropdown(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg flex items-center justify-between transition-colors",
                        progressFilter === 'completed' ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Completed (100%)
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProgressFilter('not_started');
                        setShowFilterDropdown(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg flex items-center justify-between transition-colors",
                        progressFilter === 'not_started' ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <span className="text-slate-500">Not Started (0%)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        }
      >
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
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
                  allTasks={allTasks.length > 0 ? allTasks : myTasks}
                  canCreate={canCreate}
                  handleViewTasks={handleViewTasks}
                  handleCreateTask={handleCreateTask}
                  setSelectedTaskDetail={setSelectedTaskDetail}
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
          currentUser={user}
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

