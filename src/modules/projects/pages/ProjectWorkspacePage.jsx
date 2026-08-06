import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../../api/axios';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Skeleton from '../../../components/ui/Skeleton';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';
import SprintModal from '../components/SprintModal';
import ImportUserStoriesModal from '../components/ImportUserStoriesModal';
import UserStoryModal from '../components/UserStoryModal';
import ProjectTeamModal from '../components/ProjectTeamModal';
import {
  ArrowLeft, Plus, Edit, Trash2, Layers, Calendar, CheckSquare,
  Users, UserPlus, FileText, Clock, ChevronRight, ChevronDown,
  FileSpreadsheet, Bookmark, CheckCircle2, Search, Filter, AlertCircle, Play
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../../utils/cn';
import { hasPermission } from '../../../utils/permissionUtils';

const ProjectWorkspacePage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [project, setProject] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [backlogStories, setBacklogStories] = useState([]);
  const [allProjectStories, setAllProjectStories] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [sprintsLoading, setSprintsLoading] = useState(true);
  const [backlogLoading, setBacklogLoading] = useState(true);
  const [storiesLoading, setStoriesLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [storySprintFilter, setStorySprintFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  // Accordion Expand/Collapse States (Sprints & Backlog)
  const [collapsedSprints, setCollapsedSprints] = useState({});
  const [backlogCollapsed, setBacklogCollapsed] = useState(false);

  // Tab State: JiraBoard (Default), UserStories, Backlog, Sprints, Members, Reports
  const [activeTab, setActiveTab] = useState('JiraBoard');

  // Modal states
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [deletingSprint, setDeletingSprint] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const [showTeamModal, setShowTeamModal] = useState(false);

  const role = (user.role_name || '').toLowerCase();
  const isAdminOrPM = ['super admin', 'admin', 'administrator', 'project manager', 'pm'].includes(role) || hasPermission('projects', 'edit');

  useEffect(() => {
    fetchProjectDetails();
    fetchSprints();
    fetchBacklog();
    fetchAllStories();
    fetchTeamMembers();
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/projects');
      const allProjects = res.data.data || [];
      const found = allProjects.find(p => String(p.id) === String(projectId));
      if (found) {
        setProject(found);
      } else {
        toast.error('Project not found');
        navigate('/projects');
      }
    } catch (err) {
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const fetchSprints = async () => {
    try {
      setSprintsLoading(true);
      const res = await axios.get(`/projects/${projectId}/sprints`);
      setSprints(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load sprints');
    } finally {
      setSprintsLoading(false);
    }
  };

  const fetchBacklog = async () => {
    try {
      setBacklogLoading(true);
      const res = await axios.get(`/projects/${projectId}/backlog`);
      setBacklogStories(res.data.data || []);
    } catch (err) {
      console.error('Failed to load product backlog', err);
    } finally {
      setBacklogLoading(false);
    }
  };

  const fetchAllStories = async () => {
    try {
      setStoriesLoading(true);
      const res = await axios.get(`/projects/${projectId}/stories`);
      setAllProjectStories(res.data.data || []);
    } catch (err) {
      console.error('Failed to load all project stories', err);
    } finally {
      setStoriesLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await axios.get(`/projects/${projectId}/team`);
      setTeamMembers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load team members', err);
    }
  };

  const refreshAllData = () => {
    fetchSprints();
    fetchBacklog();
    fetchAllStories();
  };

  const handleMoveStoryToSprint = async (storyId, targetSprintId) => {
    try {
      await axios.patch(`/stories/${storyId}/sprint`, { sprint_id: targetSprintId || null });
      toast.success(targetSprintId ? 'User story assigned to Sprint' : 'User story moved to Backlog');
      refreshAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign sprint');
    }
  };

  const handleUpdateStoryStatus = async (storyId, newStatus) => {
    try {
      await axios.patch(`/stories/${storyId}`, { status: newStatus });
      toast.success(`Story status updated to ${newStatus}`);
      refreshAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update story status');
    }
  };

  const handleUpdateSprintStatus = async (sprintId, newStatus) => {
    try {
      await axios.patch(`/sprints/${sprintId}`, { status: newStatus });
      toast.success(`Sprint updated to ${newStatus}`);
      refreshAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update sprint status');
    }
  };

  const handleDeleteSprint = async () => {
    if (!deletingSprint) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/sprints/${deletingSprint.id}`);
      toast.success('Sprint deleted successfully');
      fetchSprints();
      setDeletingSprint(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete sprint');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSprintAccordion = (sprintId) => {
    setCollapsedSprints(prev => ({
      ...prev,
      [sprintId]: !prev[sprintId]
    }));
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
      case 'Completed':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-2.5 py-0.5 text-[11px]">
            Completed
          </Badge>
        );
      case 'In Progress':
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold px-2.5 py-0.5 text-[11px]">
            In Progress
          </Badge>
        );
      case 'Planning':
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-bold px-2.5 py-0.5 text-[11px]">
            Planning
          </Badge>
        );
    }
  };

  const tabs = [
    { id: 'JiraBoard', label: 'Jira Backlog & Sprints', icon: Layers, count: allProjectStories.length },
    { id: 'UserStories', label: 'All Stories Grid', icon: Bookmark },
    { id: 'Backlog', label: 'Product Backlog', icon: Clock, count: backlogStories.length },
    { id: 'Sprints', label: 'Sprints Grid', icon: Calendar, count: sprints.length },
    { id: 'Members', label: 'Team Allocated', icon: Users, count: teamMembers.length },
  ];

  // Helper to filter stories by search query & priority
  const filterStories = (storiesList = []) => {
    return storiesList.filter(story => {
      const matchesSearch = !searchQuery.trim() ||
        story.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.story_key?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPriority = priorityFilter === 'All' || story.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  };

  // Render a Jira-Style Horizontal Story Row
  const renderJiraStoryRow = (story) => {
    const priorityColors = {
      Critical: 'bg-rose-100 text-rose-700 border-rose-200',
      High: 'bg-amber-100 text-amber-700 border-amber-200',
      Medium: 'bg-blue-100 text-blue-700 border-blue-200',
      Low: 'bg-slate-100 text-slate-600 border-slate-200',
    };

    return (
      <div
        key={story.id}
        className="flex items-center gap-3 p-3 bg-white border border-slate-200/80 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all group"
      >
        {/* Story Key Badge */}
        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-mono font-bold shrink-0">
          {story.story_key}
        </span>

        {/* Story Title */}
        <span
          onClick={() => navigate(story.sprint_id ? `/projects/${projectId}/sprints/${story.sprint_id}/stories/${story.id}` : `/projects/${projectId}/stories/${story.id}`)}
          className="text-xs font-semibold text-slate-900 hover:text-blue-600 cursor-pointer flex-1 truncate transition-colors"
        >
          {story.title}
        </span>

        {/* Priority Badge */}
        <Badge className={cn('font-bold text-[10px] px-2 py-0.5 shrink-0', priorityColors[story.priority] || 'bg-slate-100 text-slate-600')}>
          {story.priority || 'Medium'}
        </Badge>

        {/* Story Points */}
        <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg shrink-0">
          {story.story_points || 0} pts
        </span>

        {/* Sprint Reassignment Selector */}
        {isAdminOrPM && (
          <select
            value={story.sprint_id || ''}
            onChange={(e) => handleMoveStoryToSprint(story.id, e.target.value)}
            className="text-[10px] font-bold py-1 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer shrink-0"
          >
            <option value="">Product Backlog</option>
            {sprints.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}

        {/* Status Dropdown (Backend Enforced) */}
        <select
          value={story.status || 'Draft'}
          onChange={(e) => handleUpdateStoryStatus(story.id, e.target.value)}
          className={cn(
            "text-[10px] font-bold py-1 px-2.5 rounded-lg border focus:outline-none cursor-pointer shrink-0 transition-colors",
            story.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            story.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
            story.status === 'Ready' ? 'bg-violet-50 text-violet-700 border-violet-200' :
            'bg-slate-50 text-slate-600 border-slate-200'
          )}
        >
          <option value="Draft">Draft</option>
          <option value="Ready">Ready</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>

        {/* Assignee Avatar */}
        {story.creator_name && (
          <div className="flex items-center gap-1 shrink-0 hidden md:flex" title={`Created by ${story.creator_name}`}>
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[9px] flex items-center justify-center border border-blue-200">
              {story.creator_name.charAt(0).toUpperCase()}
            </div>
            <span className="text-[10px] text-slate-400 max-w-[80px] truncate">{story.creator_name}</span>
          </div>
        )}

        {/* Actions Menu */}
        {isAdminOrPM && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => { setEditingStory(story); setShowStoryModal(true); }}
              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Story"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12 max-w-[1400px] mx-auto py-2">
      {/* Top Back Nav & Header */}
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-950 tracking-tight">
                  {project?.name}
                </h1>
                <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-bold text-xs">
                  {project?.status || 'Planned'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-3">
                <span>Client: <strong>{project?.client_name || 'Internal'}</strong></span>
                <span>•</span>
                <span>Tech: <strong>{project?.tech_stack || 'Standard'}</strong></span>
                <span>•</span>
                <span>Category: <strong>{project?.category || 'New Project'}</strong></span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono">
                {formatDate(project?.start_date)} - {formatDate(project?.end_date)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Bar */}
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
              {tab.count !== undefined && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold",
                  isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ──────────────── JIRA-STYLE BACKLOG & SPRINTS TAB ──────────────── */}
      {activeTab === 'JiraBoard' && (
        <div className="space-y-6">
          {/* Top Filters & Action Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search stories by title or key (e.g. US-001)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="All">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {isAdminOrPM && (
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <Button
                  onClick={() => setShowImportModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2 px-3.5 text-xs font-bold shadow-sm flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Bulk Import (Excel)
                </Button>

                <Button
                  onClick={() => { setEditingSprint(null); setShowSprintModal(true); }}
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2 px-3.5 text-xs font-bold shadow-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Sprint
                </Button>

                <Button
                  onClick={() => { setEditingStory(null); setShowStoryModal(true); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 px-3.5 text-xs font-bold shadow-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create User Story
                </Button>
              </div>
            )}
          </div>

          {/* Sprints Accordions List */}
          {sprintsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          ) : (
            <div className="space-y-4">
              {sprints.map((sprint) => {
                const sprintStories = allProjectStories.filter(s => String(s.sprint_id) === String(sprint.id));
                const filteredSprintStories = filterStories(sprintStories);
                const isCollapsed = collapsedSprints[sprint.id];
                const totalPoints = sprintStories.reduce((acc, curr) => acc + Number(curr.story_points || 0), 0);
                const completedStoriesCount = sprintStories.filter(s => s.status === 'Completed').length;

                return (
                  <div key={sprint.id} className="bg-slate-50/70 border border-slate-200/80 rounded-2xl overflow-hidden transition-all shadow-sm">
                    {/* Sprint Accordion Header */}
                    <div
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border-b border-slate-200/80 cursor-pointer hover:bg-slate-50/80 transition-colors"
                      onClick={() => toggleSprintAccordion(sprint.id)}
                    >
                      <div className="flex items-center gap-3">
                        <button className="text-slate-400 hover:text-slate-600">
                          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900">{sprint.name}</h3>
                            {getStatusBadge(sprint.status)}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {formatDate(sprint.start_date)} - {formatDate(sprint.end_date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-500">
                          <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
                            {sprintStories.length} issues
                          </span>
                          <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">
                            {totalPoints} pts
                          </span>
                          {sprintStories.length > 0 && (
                            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg">
                              {completedStoriesCount}/{sprintStories.length} done
                            </span>
                          )}
                        </div>

                        {isAdminOrPM && (
                          <div className="flex items-center gap-1.5">
                            {sprint.status !== 'Completed' && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateSprintStatus(sprint.id, sprint.status === 'In Progress' ? 'Completed' : 'In Progress')}
                                className={cn(
                                  "text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1",
                                  sprint.status === 'In Progress'
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                    : "bg-blue-600 hover:bg-blue-700 text-white"
                                )}
                              >
                                {sprint.status === 'In Progress' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                {sprint.status === 'In Progress' ? 'Complete Sprint' : 'Start Sprint'}
                              </Button>
                            )}

                            <button
                              onClick={() => { setEditingSprint(sprint); setShowSprintModal(true); }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Sprint"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingSprint(sprint)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Sprint"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sprint Stories List (Expanded Content) */}
                    {!isCollapsed && (
                      <div className="p-3 space-y-2 bg-slate-50/50">
                        {filteredSprintStories.length === 0 ? (
                          <div className="text-xs text-slate-400 italic py-3 text-center bg-white border border-dashed border-slate-200 rounded-xl">
                            {sprintStories.length === 0 ? 'No user stories in this sprint yet. Move stories from Backlog below.' : 'No stories match search/priority filter.'}
                          </div>
                        ) : (
                          filteredSprintStories.map(renderJiraStoryRow)
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ──────────────── PRODUCT BACKLOG ACCORDION ──────────────── */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm mt-6">
            <div
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border-b border-slate-200/80 cursor-pointer hover:bg-slate-50/80 transition-colors"
              onClick={() => setBacklogCollapsed(prev => !prev)}
            >
              <div className="flex items-center gap-3">
                <button className="text-slate-400 hover:text-slate-600">
                  {backlogCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Product Backlog</h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Unassigned stories awaiting sprint planning
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-500">
                  <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
                    {backlogStories.length} unassigned issues
                  </span>
                  <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg">
                    {backlogStories.reduce((acc, curr) => acc + Number(curr.story_points || 0), 0)} pts
                  </span>
                </div>

                {isAdminOrPM && (
                  <Button
                    size="sm"
                    onClick={() => { setEditingStory(null); setShowStoryModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Story
                  </Button>
                )}
              </div>
            </div>

            {/* Backlog Stories List */}
            {!backlogCollapsed && (
              <div className="p-3 space-y-2 bg-slate-50/50">
                {backlogLoading ? (
                  <Skeleton className="h-12 w-full rounded-xl" />
                ) : filterStories(backlogStories).length === 0 ? (
                  <div className="text-xs text-slate-400 italic py-4 text-center bg-white border border-dashed border-slate-200 rounded-xl">
                    {backlogStories.length === 0 ? 'Product backlog is empty. Create a user story or import from Excel.' : 'No backlog stories match search/priority filter.'}
                  </div>
                ) : (
                  filterStories(backlogStories).map(renderJiraStoryRow)
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────── OTHER TABS ──────────────── */}

      {/* Grid view of all stories */}
      {activeTab === 'UserStories' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Project User Stories</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Browse and filter all user stories across sprints and backlog. Click any story to view details.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={storySprintFilter}
                onChange={(e) => setStorySprintFilter(e.target.value)}
                className="text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
              >
                <option value="All">All Sprints & Backlog</option>
                <option value="Backlog">Product Backlog Only</option>
                {sprints.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.status || 'Planning'})</option>
                ))}
              </select>

              {isAdminOrPM && (
                <Button
                  onClick={() => { setEditingStory(null); setShowStoryModal(true); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-2 px-4 text-xs font-bold shadow-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create User Story
                </Button>
              )}
            </div>
          </div>

          {storiesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-slate-200/30 p-1.5 rounded-[2rem] border border-slate-200/10">
                  <div className="bg-white p-6 rounded-[calc(2rem-0.375rem)] border border-slate-100 space-y-4">
                    <Skeleton className="h-6 w-3/4 rounded-lg" />
                    <Skeleton className="h-4 w-full rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            (() => {
              const filteredStories = allProjectStories.filter(s => {
                if (storySprintFilter === 'All') return true;
                if (storySprintFilter === 'Backlog') return !s.sprint_id;
                return String(s.sprint_id) === String(storySprintFilter);
              });

              if (filteredStories.length === 0) {
                return (
                  <div className="bg-slate-200/30 p-1.5 rounded-[2rem] border border-slate-200/10 text-center py-12">
                    <div className="bg-white p-8 rounded-[calc(2rem-0.375rem)] border border-slate-100 flex flex-col items-center justify-center max-w-md mx-auto">
                      <Bookmark className="w-8 h-8 text-blue-500 mb-3" />
                      <h3 className="text-base font-bold text-slate-900">No User Stories Found</h3>
                      <p className="text-xs text-slate-500 mt-1 mb-4">No stories match the selected sprint filter.</p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredStories.map(story => (
                    <div
                      key={story.id}
                      onClick={() => navigate(story.sprint_id ? `/projects/${projectId}/sprints/${story.sprint_id}/stories/${story.id}` : `/projects/${projectId}/stories/${story.id}`)}
                      className="bg-slate-200/40 p-1.5 rounded-[2rem] border border-slate-200/20 hover:bg-slate-200/60 transition-all duration-300 group hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
                    >
                      <div className="bg-white p-6 rounded-[calc(2rem-0.375rem)] border border-slate-200/25 shadow-sm h-full flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-mono font-bold">
                              {story.story_key}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-bold text-[10px] px-2 py-0.5">
                                {story.priority || 'Medium'}
                              </Badge>
                              <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-bold text-[10px] px-2 py-0.5">
                                {story.sprint_name || 'Backlog'}
                              </Badge>
                            </div>
                          </div>

                          <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight mt-3 line-clamp-2">
                            {story.title}
                          </h3>

                          {story.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 mt-2 font-normal leading-relaxed">
                              {story.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                          <span className="bg-slate-100 px-2.5 py-1 rounded-lg font-mono text-[11px]">{story.story_points || 0} Story Points</span>
                          <span className="text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1 text-xs">
                            View Details <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </div>
      )}

      {activeTab === 'Members' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Team Allocated</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Resource team members assigned to this project. Filter by assignee name below.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <div className="relative w-full sm:w-64">
                <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by assigned name..."
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>

              {isAdminOrPM && (
                <Button
                  onClick={() => setShowTeamModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 px-3.5 text-xs font-bold shadow-sm flex items-center gap-1.5 shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Member
                </Button>
              )}
            </div>
          </div>

          {(() => {
            const filteredMembers = teamMembers.filter(m =>
              m.name?.toLowerCase().includes(assigneeFilter.toLowerCase()) ||
              m.email?.toLowerCase().includes(assigneeFilter.toLowerCase()) ||
              m.role_name?.toLowerCase().includes(assigneeFilter.toLowerCase())
            );

            if (filteredMembers.length === 0) {
              return (
                <div className="bg-slate-200/30 p-1.5 rounded-[2rem] border border-slate-200/10 text-center py-12">
                  <div className="bg-white p-8 rounded-[calc(2rem-0.375rem)] border border-slate-100 flex flex-col items-center justify-center max-w-md mx-auto">
                    <Users className="w-8 h-8 text-slate-400 mb-3" />
                    <h3 className="text-base font-bold text-slate-900">No Team Members Found</h3>
                    <p className="text-xs text-slate-500 mt-1">No allocated members match "{assigneeFilter}".</p>
                  </div>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMembers.map(member => (
                  <div key={member.id} className="bg-slate-200/40 p-1.5 rounded-[2rem] border border-slate-200/20 shadow-sm">
                    <div className="bg-white p-6 rounded-[calc(2rem-0.375rem)] border border-slate-200/25 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm border border-blue-200 shrink-0">
                          {member.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{member.name}</h4>
                          <p className="text-xs text-slate-500 truncate">{member.email}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Project Role</span>
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold text-[10px]">
                          {member.role_name || 'Team Member'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === 'Backlog' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Product Backlog</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Unassigned project user stories and requirements awaiting sprint allocation.
              </p>
            </div>

            {isAdminOrPM && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowImportModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-2.5 px-4 text-xs font-bold shadow-sm flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Import Excel
                </Button>
                <Button
                  onClick={() => { setEditingStory(null); setShowStoryModal(true); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-2.5 px-4 text-xs font-bold shadow-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create User Story
                </Button>
              </div>
            )}
          </div>

          {backlogLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-slate-200/30 p-1.5 rounded-[2rem] border border-slate-200/10">
                  <div className="bg-white p-6 rounded-[calc(2rem-0.375rem)] border border-slate-100 space-y-4">
                    <Skeleton className="h-6 w-3/4 rounded-lg" />
                    <Skeleton className="h-4 w-full rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : backlogStories.length === 0 ? (
            <div className="bg-slate-200/30 p-1.5 rounded-[2rem] border border-slate-200/10 text-center py-12">
              <div className="bg-white p-8 rounded-[calc(2rem-0.375rem)] border border-slate-100 flex flex-col items-center justify-center max-w-md mx-auto">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl mb-4">
                  <Bookmark className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Backlog is Empty</h3>
                <p className="text-xs text-slate-500 mt-1 mb-6 text-center">
                  All user stories have been assigned to sprints or no features have been created yet.
                </p>
                {isAdminOrPM && (
                  <Button
                    onClick={() => { setEditingStory(null); setShowStoryModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold py-2.5 px-5 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create First Story
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {backlogStories.map((story) => (
                <div
                  key={story.id}
                  className="bg-slate-200/40 p-1.5 rounded-[2rem] border border-slate-200/20 hover:bg-slate-200/60 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div className="bg-white p-6 rounded-[calc(2rem-0.375rem)] border border-slate-200/25 shadow-sm h-full flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-mono font-bold">
                          {story.story_key}
                        </span>
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-bold text-[10px] px-2 py-0.5">
                          {story.priority || 'Medium'}
                        </Badge>
                      </div>

                      <h3
                        onClick={() => navigate(`/projects/${projectId}/stories/${story.id}`)}
                        className="text-base font-bold text-slate-900 hover:text-blue-600 cursor-pointer tracking-tight mt-3 line-clamp-2"
                      >
                        {story.title}
                      </h3>

                      {story.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-2 font-normal leading-relaxed">
                          {story.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <span className="bg-slate-100 px-2 py-1 rounded-md font-mono">{story.story_points || 0} pts</span>
                        <span>• {story.task_count || 0} tasks</span>
                      </div>

                      {isAdminOrPM && (
                        <select
                          onChange={(e) => handleMoveStoryToSprint(story.id, e.target.value)}
                          defaultValue=""
                          className="text-[11px] font-bold py-1.5 px-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors focus:outline-none cursor-pointer"
                        >
                          <option value="" disabled>Move to Sprint ▾</option>
                          {sprints.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Sprints' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Sprints & Iterations</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage agile sprints, milestone goals, and delivery cycles.
              </p>
            </div>

            {isAdminOrPM && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowImportModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-2.5 px-4 text-xs font-bold shadow-sm flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Import Stories Excel
                </Button>
                <Button
                  onClick={() => { setEditingSprint(null); setShowSprintModal(true); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-2.5 px-4 text-xs font-bold shadow-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Sprint
                </Button>
              </div>
            )}
          </div>

          {sprintsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-slate-200/30 p-1.5 rounded-[2rem] border border-slate-200/10">
                  <div className="bg-white p-6 rounded-[calc(2rem-0.375rem)] border border-slate-100 space-y-4">
                    <Skeleton className="h-6 w-3/4 rounded-lg" />
                    <Skeleton className="h-4 w-full rounded-md" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-20 rounded-xl" />
                      <Skeleton className="h-8 w-20 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : sprints.length === 0 ? (
            <div className="bg-slate-200/30 p-1.5 rounded-[2rem] border border-slate-200/10 text-center py-12">
              <div className="bg-white p-8 rounded-[calc(2rem-0.375rem)] border border-slate-100 flex flex-col items-center justify-center max-w-md mx-auto">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl mb-4">
                  <Layers className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No Sprints Created Yet</h3>
                <p className="text-xs text-slate-500 mt-1 mb-6 text-center">
                  Organize software delivery into structured sprint cycles to track user stories and progress.
                </p>
                {isAdminOrPM && (
                  <Button
                    onClick={() => { setEditingSprint(null); setShowSprintModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold py-2.5 px-5 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create First Sprint
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sprints.map((sprint) => (
                <div
                  key={sprint.id}
                  className="bg-slate-200/40 p-1.5 rounded-[2rem] border border-slate-200/20 hover:bg-slate-200/60 transition-all duration-300 group hover:-translate-y-0.5 flex flex-col"
                >
                  <div className="bg-white p-6 rounded-[calc(2rem-0.375rem)] border border-slate-200/25 shadow-sm h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                            Sprint Iteration
                          </span>
                          <h3
                            onClick={() => navigate(`/projects/${projectId}/sprints/${sprint.id}`)}
                            className="text-base font-bold text-slate-900 hover:text-blue-600 cursor-pointer tracking-tight mt-0.5 flex items-center gap-1.5"
                          >
                            {sprint.name}
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                          </h3>
                        </div>
                        {getStatusBadge(sprint.status)}
                      </div>

                      {sprint.goal && (
                        <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <p className="text-xs text-slate-700 font-medium leading-relaxed">
                            <strong className="font-bold text-slate-900">Goal: </strong>
                            {sprint.goal}
                          </p>
                        </div>
                      )}

                      <div className="mt-4 flex items-center gap-2 text-xs font-mono text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(sprint.start_date)} - {formatDate(sprint.end_date)}</span>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/projects/${projectId}/sprints/${sprint.id}`)}
                        className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-xl"
                      >
                        View Details →
                      </Button>

                      {isAdminOrPM && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setEditingSprint(sprint); setShowSprintModal(true); }}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                            title="Edit Sprint"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeletingSprint(sprint)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                            title="Delete Sprint"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reports Tab Placeholder View */}
      {activeTab === 'Reports' && (
        <div className="bg-slate-200/30 p-1.5 rounded-[2rem] border border-slate-200/10 text-center py-16">
          <div className="bg-white p-8 rounded-[calc(2rem-0.375rem)] border border-slate-100 flex flex-col items-center justify-center max-w-md mx-auto">
            <div className="p-4 bg-slate-100 text-slate-500 rounded-3xl mb-4">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{activeTab} Section</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Detailed {activeTab.toLowerCase()} configuration and assets for project delivery.
            </p>
            <Button
              onClick={() => setActiveTab('JiraBoard')}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold py-2 px-4"
            >
              Switch to Jira Board Tab
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit Sprint Modal */}
      {showSprintModal && (
        <SprintModal
          projectId={projectId}
          sprint={editingSprint}
          onClose={() => { setShowSprintModal(false); setEditingSprint(null); }}
          onSuccess={refreshAllData}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingSprint && (
        <ConfirmationModal
          isOpen={Boolean(deletingSprint)}
          onClose={() => setDeletingSprint(null)}
          onConfirm={handleDeleteSprint}
          title="Delete Sprint"
          message={`Are you sure you want to delete "${deletingSprint?.name}"? All associated stories will be unassigned.`}
          confirmText="Delete Sprint"
          cancelText="Cancel"
          variant="danger"
          isLoading={isDeleting}
        />
      )}

      <ImportUserStoriesModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        project={project}
        projectId={projectId}
        onImportSuccess={refreshAllData}
      />

      {showStoryModal && (
        <UserStoryModal
          projectId={projectId}
          sprints={sprints}
          story={editingStory}
          onClose={() => { setShowStoryModal(false); setEditingStory(null); }}
          onSuccess={refreshAllData}
        />
      )}

      {showTeamModal && project && (
        <ProjectTeamModal
          project={project}
          onClose={() => {
            setShowTeamModal(false);
            fetchTeamMembers();
          }}
        />
      )}
    </div>
  );
};

export default ProjectWorkspacePage;
