import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Skeleton from '../../../components/ui/Skeleton';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';
import SprintModal from '../components/SprintModal';
import {
  ArrowLeft, Plus, Edit, Trash2, Layers, Calendar, CheckSquare,
  TrendingUp, Users, FolderOpen, FileText, Settings, BarChart2,
  Clock, Flag, AlertCircle, ChevronRight, ShieldCheck
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
  const [loading, setLoading] = useState(true);
  const [sprintsLoading, setSprintsLoading] = useState(true);

  // Tab State: Overview, Sprints, Members, Files, Reports, Settings
  const [activeTab, setActiveTab] = useState('Sprints');

  // Modal states
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [deletingSprint, setDeletingSprint] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const role = (user.role_name || '').toLowerCase();
  const isAdminOrPM = ['super admin', 'admin', 'administrator', 'project manager', 'pm'].includes(role) || hasPermission('projects', 'edit');

  useEffect(() => {
    fetchProjectDetails();
    fetchSprints();
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
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-2.5 py-0.5 text-[11px]">
            Active
          </Badge>
        );
      case 'Completed':
        return (
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold px-2.5 py-0.5 text-[11px]">
            Completed
          </Badge>
        );
      case 'Planning':
      default:
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold px-2.5 py-0.5 text-[11px]">
            Planning
          </Badge>
        );
    }
  };

  const tabs = [
    { id: 'Overview', label: 'Overview', icon: BarChart2 },
    { id: 'Sprints', label: 'Sprints', icon: Layers, count: sprints.length },
    { id: 'Members', label: 'Members', icon: Users },
    { id: 'Files', label: 'Files', icon: FolderOpen },
    { id: 'Reports', label: 'Reports', icon: FileText },
    { id: 'Settings', label: 'Settings', icon: Settings },
  ];

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

      {/* Tab Content Area */}
      {activeTab === 'Sprints' && (
        <div className="space-y-6">
          {/* Header & Create Action */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Sprints & Iterations</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage agile sprints, milestone goals, and delivery cycles.
              </p>
            </div>

            {isAdminOrPM && (
              <Button
                onClick={() => { setEditingSprint(null); setShowSprintModal(true); }}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-2.5 px-4 text-xs font-bold shadow-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Sprint
              </Button>
            )}
          </div>

          {/* Sprints Grid */}
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
                      {/* Top Header Row */}
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

                      {/* Goal & Description */}
                      {sprint.goal && (
                        <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <p className="text-xs text-slate-700 font-medium leading-relaxed">
                            <strong className="font-bold text-slate-900">Goal: </strong>
                            {sprint.goal}
                          </p>
                        </div>
                      )}

                      {/* Timelines */}
                      <div className="mt-4 flex items-center gap-2 text-xs font-mono text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(sprint.start_date)} - {formatDate(sprint.end_date)}</span>
                      </div>

                      {/* Placeholders Grid (Story Count, Task Count, Progress) */}
                      <div className="mt-5 grid grid-cols-3 gap-2 pt-4 border-t border-slate-100">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Stories</span>
                          <span className="text-xs font-bold text-slate-800 font-mono mt-0.5 block">{sprint.story_count || 0}</span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Tasks</span>
                          <span className="text-xs font-bold text-slate-800 font-mono mt-0.5 block">{sprint.task_count || 0}</span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Progress</span>
                          <span className="text-xs font-bold text-emerald-600 font-mono mt-0.5 block">{sprint.progress || 0}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
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

      {/* Non-Sprint Tabs Placeholder View */}
      {activeTab !== 'Sprints' && (
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
              onClick={() => setActiveTab('Sprints')}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold py-2 px-4"
            >
              Switch to Sprints Tab
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
          onSuccess={fetchSprints}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingSprint && (
        <ConfirmationModal
          isOpen={Boolean(deletingSprint)}
          onClose={() => setDeletingSprint(null)}
          onConfirm={handleDeleteSprint}
          title="Delete Sprint"
          message={`Are you sure you want to delete "${deletingSprint.name}"? All associated sprint records will be removed.`}
          confirmText="Delete Sprint"
          cancelText="Cancel"
          variant="danger"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default ProjectWorkspacePage;
