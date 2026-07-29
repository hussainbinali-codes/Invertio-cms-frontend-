import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Skeleton from '../../../components/ui/Skeleton';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';
import UserStoryModal from '../components/UserStoryModal';
import ImportUserStoriesModal from '../components/ImportUserStoriesModal';
import {
  ArrowLeft, Calendar, Layers, CheckSquare, Clock, Flag,
  FileText, Plus, AlertCircle, Info, Bookmark, Sparkles,
  Edit, Trash2, Tag, LayoutDashboard, ChevronRight, User, CheckCircle2, FileSpreadsheet
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../../utils/cn';
import { hasPermission } from '../../../utils/permissionUtils';

const SprintDetailsPage = () => {
  const { projectId, sprintId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [sprint, setSprint] = useState(null);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storiesLoading, setStoriesLoading] = useState(true);

  // Tabs: Overview, User Stories, Board (Placeholder), Timeline (Placeholder)
  const [activeTab, setActiveTab] = useState('User Stories');

  // Modal States
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const [deletingStory, setDeletingStory] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const role = (user.role_name || '').toLowerCase();
  const isAdminOrPM = ['super admin', 'admin', 'administrator', 'project manager', 'pm'].includes(role) || hasPermission('projects', 'edit');

  useEffect(() => {
    fetchSprintDetails();
    fetchStories();
  }, [sprintId]);

  const fetchSprintDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/sprints/${sprintId}`);
      setSprint(res.data.data);
    } catch (err) {
      toast.error('Failed to load sprint details');
      navigate(`/projects/${projectId}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchStories = async () => {
    try {
      setStoriesLoading(true);
      const res = await axios.get(`/projects/${projectId}/sprints/${sprintId}/stories`);
      setStories(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load user stories');
    } finally {
      setStoriesLoading(false);
    }
  };

  const handleDeleteStory = async () => {
    if (!deletingStory) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/stories/${deletingStory.id}`);
      toast.success('User story deleted successfully');
      fetchStories();
      setDeletingStory(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user story');
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
      case 'In Progress':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-2.5 py-0.5 text-[11px]">
            {status}
          </Badge>
        );
      case 'Completed':
        return (
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold px-2.5 py-0.5 text-[11px]">
            Completed
          </Badge>
        );
      case 'Ready':
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold px-2.5 py-0.5 text-[11px]">
            Ready
          </Badge>
        );
      case 'Draft':
      case 'Planning':
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-bold px-2.5 py-0.5 text-[11px]">
            {status || 'Draft'}
          </Badge>
        );
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Critical':
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-bold text-[10px] px-2 py-0.5">
            Critical
          </Badge>
        );
      case 'High':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-bold text-[10px] px-2 py-0.5">
            High
          </Badge>
        );
      case 'Medium':
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold text-[10px] px-2 py-0.5">
            Medium
          </Badge>
        );
      case 'Low':
      default:
        return (
          <Badge className="bg-slate-100 text-slate-600 border-slate-200 font-bold text-[10px] px-2 py-0.5">
            Low
          </Badge>
        );
    }
  };

  const tabs = [
    { id: 'Overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'User Stories', label: 'User Stories', icon: Bookmark, count: stories.length },
    { id: 'Board', label: 'Board (Placeholder)', icon: Layers },
    { id: 'Timeline', label: 'Timeline (Placeholder)', icon: Calendar },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-[1400px] mx-auto py-2">
      {/* Top Back Nav */}
      <div>
        <Link
          to={`/projects/${projectId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Project Workspace
        </Link>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
        ) : (
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-950 tracking-tight">
                      {sprint?.name}
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Agile Sprint Iteration & Scope
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {getStatusBadge(sprint?.status)}
                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-xl">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDate(sprint?.start_date)} - {formatDate(sprint?.end_date)}</span>
                </div>
              </div>
            </div>

            {sprint?.goal && (
              <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block font-mono">
                  Sprint Milestone Goal
                </span>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">
                  {sprint.goal}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
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

      {/* USER STORIES TAB CONTENT */}
      {activeTab === 'User Stories' && (
        <div className="space-y-6">
          {/* Header & Create Action */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Sprint User Stories</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Define functional requirements, story points, and acceptance criteria.
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

          {/* Story Cards Grid */}
          {storiesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-slate-200/30 p-1.5 rounded-[2rem] border border-slate-200/10">
                  <div className="bg-white p-6 rounded-[calc(2rem-0.375rem)] border border-slate-100 space-y-4">
                    <Skeleton className="h-5 w-24 rounded-md" />
                    <Skeleton className="h-6 w-3/4 rounded-lg" />
                    <Skeleton className="h-4 w-full rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : stories.length === 0 ? (
            <div className="bg-slate-200/30 p-1.5 rounded-[2rem] border border-slate-200/10 text-center py-12">
              <div className="bg-white p-8 rounded-[calc(2rem-0.375rem)] border border-slate-100 flex flex-col items-center justify-center max-w-md mx-auto">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl mb-4">
                  <Bookmark className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No User Stories Yet</h3>
                <p className="text-xs text-slate-500 mt-1 mb-6 text-center">
                  Add user story backlog cards to define user requirements and acceptance criteria for this sprint.
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
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="bg-slate-200/40 p-1.5 rounded-[2rem] border border-slate-200/20 hover:bg-slate-200/60 transition-all duration-300 group hover:-translate-y-0.5 flex flex-col"
                >
                  <div className="bg-white p-6 rounded-[calc(2rem-0.375rem)] border border-slate-200/25 shadow-sm h-full flex flex-col justify-between">
                    <div>
                      {/* Top Key & Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-mono font-bold">
                          {story.story_key}
                        </span>
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(story.priority)}
                          {getStatusBadge(story.status)}
                        </div>
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => navigate(`/projects/${projectId}/sprints/${sprintId}/stories/${story.id}`)}
                        className="text-base font-bold text-slate-900 hover:text-blue-600 cursor-pointer tracking-tight mt-3 flex items-center justify-between gap-2"
                      >
                        <span className="line-clamp-2">{story.title}</span>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </h3>

                      {/* Description snippet */}
                      {story.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-2 font-normal leading-relaxed">
                          {story.description}
                        </p>
                      )}

                      {/* Labels */}
                      {story.labels && story.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {(Array.isArray(story.labels) ? story.labels : []).map((label, idx) => (
                            <span key={idx} className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/50">
                              #{label}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Story Points & Creator Bar */}
                      <div className="mt-5 grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 text-xs">
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Story Points</span>
                          <span className="text-xs font-bold text-slate-800 font-mono mt-0.5 block">{story.story_points || 0} pts</span>
                        </div>

                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Tasks (Placeholder)</span>
                          <span className="text-xs font-bold text-slate-800 font-mono mt-0.5 block">{story.task_count || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Metadata & Actions */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-[11px] text-slate-400 font-medium truncate max-w-[150px]">
                        By {story.creator_name || 'System'} • {formatDate(story.created_at)}
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/projects/${projectId}/sprints/${sprintId}/stories/${story.id}`)}
                          className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-2.5 py-1 rounded-xl"
                        >
                          Details →
                        </Button>

                        {isAdminOrPM && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { setEditingStory(story); setShowStoryModal(true); }}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                              title="Edit Story"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeletingStory(story)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                              title="Delete Story"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Overview Tab Content */}
      {activeTab === 'Overview' && (
        <div className="bg-slate-200/30 p-1.5 rounded-[2rem] border border-slate-200/10">
          <div className="bg-white p-8 rounded-[calc(2rem-0.375rem)] border border-slate-100 space-y-6">
            <h3 className="text-base font-bold text-slate-900">Sprint Iteration Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Total Stories</span>
                <span className="text-2xl font-bold text-slate-900 font-mono mt-1 block">{stories.length}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Total Story Points</span>
                <span className="text-2xl font-bold text-blue-600 font-mono mt-1 block">
                  {stories.reduce((acc, s) => acc + (Number(s.story_points) || 0), 0)} pts
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Completed Stories</span>
                <span className="text-2xl font-bold text-emerald-600 font-mono mt-1 block">
                  {stories.filter(s => s.status === 'Completed').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Placeholder Tabs (Board & Timeline) */}
      {(activeTab === 'Board' || activeTab === 'Timeline') && (
        <div className="bg-slate-200/30 p-1.5 rounded-[2rem] border border-slate-200/10 text-center py-16">
          <div className="bg-white p-8 rounded-[calc(2rem-0.375rem)] border border-slate-100 flex flex-col items-center justify-center max-w-md mx-auto">
            <div className="p-4 bg-slate-100 text-slate-500 rounded-3xl mb-4">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{activeTab} View</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Agile {activeTab.toLowerCase()} visualization module placeholder.
            </p>
            <Button
              onClick={() => setActiveTab('User Stories')}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold py-2 px-4"
            >
              Switch to User Stories Tab
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit User Story Modal */}
      {showStoryModal && (
        <UserStoryModal
          projectId={projectId}
          sprintId={sprintId}
          sprints={sprint ? [sprint] : []}
          story={editingStory}
          onClose={() => { setShowStoryModal(false); setEditingStory(null); }}
          onSuccess={fetchStories}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingStory && (
        <ConfirmationModal
          isOpen={Boolean(deletingStory)}
          onClose={() => setDeletingStory(null)}
          onConfirm={handleDeleteStory}
          title="Delete User Story"
          message={`Are you sure you want to delete "${deletingStory.story_key}: ${deletingStory.title}"? This action cannot be undone.`}
          confirmText="Delete Story"
          cancelText="Cancel"
          variant="danger"
          isLoading={isDeleting}
        />
      )}

      {/* Import User Stories Modal */}
      <ImportUserStoriesModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        projectId={projectId}
        sprintId={sprintId}
        sprintName={sprint?.name}
        onImportSuccess={fetchStories}
      />
    </div>
  );
};

export default SprintDetailsPage;
