import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import {
  Loader2, Plus, X, FolderPlus, Users, Briefcase, CheckCircle2,
  AlertTriangle, TrendingUp, Link, FolderOpen, ExternalLink,
  FileText, UploadCloud, Trash2, MessageSquare, Send, Layers,
  Lock, ShieldCheck, Phone, Mail, User, Info, Edit, Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import ProjectTeamModal from '../components/ProjectTeamModal';
import ProjectResourcesModal from '../components/ProjectResourcesModal';
import StatCard from '../../../components/ui/StatCard';
import { cn } from '../../../utils/cn';
import { hasPermission } from '../../../utils/permissionUtils';
import Skeleton from '../../../components/ui/Skeleton';
import { BASE_URL } from '../../../api/baseUrl';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' }
];

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

const ProjectsPage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  // Document & Resources state
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);

  useLockBodyScroll(showAddModal || showEditModal);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectCategory, setProjectCategory] = useState('New Project');
  const [expandedConfidential, setExpandedConfidential] = useState(null); // ID of project with visible confidential info
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  // Sprint planning state for project creation
  const [projectUsesSprints, setProjectUsesSprints] = useState(false);
  const [sprintCount, setSprintCount] = useState(1);
  const [sprintDates, setSprintDates] = useState([{ start_date: '', end_date: '' }]);

  const isAdmin = ['super admin', 'admin', 'administrator'].includes((user.role_name || '').toLowerCase());

  useEffect(() => {
    // RBAC: Check for module permission
    if (!hasPermission('projects', 'view')) {
      toast.error("Access Denied: You do not have permissions to access the Projects module.");
      navigate('/dashboard');
      return;
    }

    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        axios.get('/projects'),
        axios.get('/clients') // Get all clients/leads
      ]);
      setProjects(Array.isArray(pRes.data.data) ? pRes.data.data : (pRes.data.data || []));
      setClients(Array.isArray(cRes.data.data) ? cRes.data.data : (cRes.data.data || []));
    } catch (error) {
      console.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData);

    try {
      await axios.post('/projects', {
        ...payload,
        client_id: payload.client_id,
        budget: payload.budget ? parseFloat(payload.budget) : 0,
        resource_links: [],
        uses_sprints: projectUsesSprints,
        sprint_count: projectUsesSprints ? sprintCount : 0,
        sprints_data: projectUsesSprints ? sprintDates.slice(0, sprintCount) : []
      });
      toast.success('Project created successfully');
      setShowAddModal(false);
      setProjectUsesSprints(false);
      setSprintCount(1);
      setSprintDates([{ start_date: '', end_date: '' }]);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProjectClick = (project) => {
    setEditingProject(project);
    setShowEditModal(true);
  };

  const handleEditProject = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData);

    try {
      await axios.patch(`/projects/${editingProject.id}`, {
        ...payload,
        budget: payload.budget ? parseFloat(payload.budget) : 0,
      });
      toast.success('Project updated successfully');
      setShowEditModal(false);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (projectId, newStatus) => {
    try {
      await axios.patch(`/projects/${projectId}`, { status: newStatus });
      toast.success(`Project status updated to ${newStatus}`);
      fetchProjects();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const fetchProjectResources = (project) => {
    setSelectedProject(project);
    setShowResourceModal(true);
  };

  const handleManageTeam = (project) => {
    setSelectedProject(project);
    setShowTeamModal(true);
  };

  const getStatusBadge = (status) => {
    if (!status) return <Badge>Unknown</Badge>;
    const baseStyle = "text-[10px] font-bold  tracking-wider";
    if (status.includes('Blocked')) return <Badge variant="destructive" className={baseStyle}>{status}</Badge>;
    if (status === 'Completed') return <Badge variant="success" className={baseStyle}>{status}</Badge>;
    if (status === 'In Progress') return <Badge variant="primary" className={baseStyle}>{status}</Badge>;
    if (status === 'On Hold') return <Badge variant="warning" className={baseStyle}>{status}</Badge>;
    if (status === 'Cancelled') return <Badge variant="destructive" className={baseStyle}>{status}</Badge>;
    if (status === 'Maintenance') return <Badge variant="warning" className={baseStyle}>{status}</Badge>;
    return <Badge variant="secondary" className={baseStyle}>{status}</Badge>; // Planned
  };

  const getStatusColorClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'text-emerald-600 border-emerald-200 bg-emerald-50/50';
      case 'In Progress':
        return 'text-primary-600 border-primary-200 bg-primary-50/50';
      case 'On Hold':
        return 'text-amber-600 border-amber-200 bg-amber-50/50';
      case 'Planned':
        return 'text-slate-600 border-slate-200 bg-slate-50';
      case 'Maintenance':
        return 'text-violet-600 border-violet-200 bg-violet-50/50';
      case 'Cancelled':
        return 'text-rose-600 border-rose-200 bg-rose-50/50';
      default:
        if (status?.includes('Blocked')) return 'text-rose-600 border-rose-200 bg-rose-50/50';
        return 'text-slate-500 border-slate-200 bg-slate-50/50';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return '';
    }
  };

  const normalizeUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const filteredProjects = projects.filter(project => {
    const matchesSearch =
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.tech_stack?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (statusFilter !== 'All') {
      if (statusFilter === 'Blocked (Payment)') {
        matchesStatus = project.status?.includes('Blocked');
      } else {
        matchesStatus = project.status === statusFilter;
      }
    }
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


  const activeProjects = projects.filter(project =>
    project.status !== 'Cancelled' && project.status !== 'On Hold' && project.status !== 'On-hold' && project.status !== 'completed'
  )

  console.log("active projects", activeProjects)

  return (
    <div className="space-y-8 pb-10 max-w-[1400px] mx-auto py-2">
      {/* Header section with Asymmetric Layout */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight mt-1">
            Projects
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-normal">
            Overview of all client and internal institutional projects.
          </p>
        </div>
        {hasPermission('projects', 'create') && (
          <div className="bg-slate-200/30 p-1 rounded-full border border-slate-200/20 active:scale-[0.98] transition-all duration-300">
            <Button 
              onClick={() => { setProjectCategory('New Project'); setShowAddModal(true); }} 
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full py-2 px-5 text-sm font-semibold shadow-sm flex items-center gap-2"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              Create Project
            </Button>
          </div>
        )}
      </div>

      {/* KPI Stats Grid in Double-Bezel nested wrapper */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Projects" value={projects.length} icon={Briefcase} subtext="All Projects" />
        <KpiCard title="In Progress" value={projects.filter(p => p.status === 'In Progress').length} icon={TrendingUp} trend="+2" subtext="Current velocity" />
        <KpiCard title="Completed" value={projects.filter(p => p.status === 'Completed').length} icon={CheckCircle2} subtext="Lifetime delivery" />
        <KpiCard title="Maintenance" value={projects.filter(p => p.category === 'Maintenance').length} icon={Layers} subtext="Long-term support" />
      </div>

      <PremiumCard 
        title="Active Tracker" 
        subtitle={`Monitoring ${projects.length} active initiatives.`} 
        icon={Briefcase}
        headerRight={
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                className="pl-10 h-10 text-xs rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium w-full"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 text-xs border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/80 px-3.5 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer transition-colors shadow-sm font-bold text-slate-600"
            >
              <option value="All">All Statuses</option>
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Blocked (Payment)">Blocked (Payment)</option>
            </select>
          </div>
        }
      >
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="divide-y divide-slate-100">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-5 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No projects found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-4">Project Name</TableHead>
                  <TableHead className="py-4">Client</TableHead>
                  <TableHead className="py-4">Timeline</TableHead>
                  <TableHead className="py-4">Status</TableHead>
                  <TableHead className="py-4">Action</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {paginatedProjects.map((project) => (
                  <React.Fragment key={project.id}>
                    <TableRow className="group border-none">
                      <TableCell className="py-5">
                        <div 
                          onClick={() => navigate(`/projects/${project.id}`)}
                          className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors flex items-center gap-1.5"
                        >
                          {project.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-500 font-medium">{project.tech_stack || 'Standard Stack'}</span>
                          <Badge variant="secondary" className="text-xs font-semibold text-slate-500 tracking-tight py-0 px-1.5 border-slate-100">
                            {project.category || 'New Project'}
                          </Badge>
                          {hasPermission('projects', 'budget.view') && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-[10px] text-primary-600 font-bold uppercase tracking-wider">
                                {CURRENCIES.find(c => c.code === project.currency)?.symbol || '$'}
                                {(parseFloat(project.budget) || 0).toLocaleString()}
                              </span>
                            </>
                          )}
                          {(project.resource_links?.length > 0 || project.documents_count > 0) && (
                            <>
                              <span className="text-slate-300">•</span>
                              <button
                                onClick={() => fetchProjectResources(project)}
                                className="text-[10px] text-primary-600 hover:text-primary-700 font-bold uppercase tracking-wider flex items-center gap-1"
                              >
                                <FolderOpen className="w-3 h-3" />
                                {project.resource_links?.length || 0} Links
                              </button>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="text-sm font-semibold text-slate-700">{project.client_name || 'Internal'}</div>
                        {project.reference_name && (
                          <div className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                            Ref: {project.reference_name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-5 text-sm font-normal text-slate-600">
                        {project.start_date ? formatDate(project.start_date) : 'N/A'} - {project.end_date ? formatDate(project.end_date) : 'Ongoing'}
                      </TableCell>
                      <TableCell className="py-5">
                        {project.status?.includes('Blocked') ? (
                          getStatusBadge(project.status)
                        ) : hasPermission('projects', 'edit') ? (
                          <select
                            className={cn(
                              "text-xs font-medium border rounded-lg px-2.5 py-1 outline-none bg-white",
                              getStatusColorClass(project.status)
                            )}
                            value={project.status}
                            onChange={(e) => handleStatusChange(project.id, e.target.value)}
                          >
                            <option value="Planned">Planned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        ) : (
                          getStatusBadge(project.status)
                        )}
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex items-center justify-start gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs font-semibold text-blue-600 hover:bg-blue-50 px-2.5 rounded-lg flex items-center gap-1"
                            onClick={() => navigate(`/projects/${project.id}`)}
                            title="Open Workspace"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            Workspace
                          </Button>
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className={cn(
                                "h-8 w-8 p-0 transition-colors",
                                expandedConfidential === project.id
                                  ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
                                  : "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                              )}
                              onClick={() => setExpandedConfidential(expandedConfidential === project.id ? null : project.id)}
                              title="Confidential Info"
                            >
                              {expandedConfidential === project.id ? <ShieldCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </Button>
                          )}
                          {hasPermission('projects', 'edit') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-primary-600"
                              onClick={() => handleEditProjectClick(project)}
                              title="Edit Project"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {hasPermission('projects', 'team.manage') && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-primary-600"
                                onClick={() => fetchProjectResources(project)}
                                title="Project Resources"
                              >
                                <FolderOpen className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs font-semibold text-slate-500 text-primary-600 hover:bg-primary-50 px-3"
                                onClick={() => handleManageTeam(project)}
                              >
                                <Users className="w-3.5 h-3.5 mr-1.5" />
                                Members
                              </Button>
                            </>
                          )}
                          {!hasPermission('projects', 'team.manage') && (
                            <Badge variant="outline" className="text-[10px] font-bold text-slate-400">READ ONLY</Badge>
                          )}
                        </div>
                      </TableCell>

                    </TableRow>

                    {/* Confidential Info Section */}
                    {isAdmin && expandedConfidential === project.id && (
                      <TableRow className="bg-amber-50/30 border-none animate-in fade-in slide-in-from-top-1 duration-200">
                        <TableCell colSpan={5} className="py-4 px-6 border-b border-amber-100">
                          <div className="flex flex-col md:flex-row gap-8">
                            {/* Client Confidential */}
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-2 text-amber-800">
                                <User className="w-4 h-4" />
                                <h4 className="text-sm font-semibold tracking-widest">Client Contact Details</h4>
                              </div>
                              {(() => {
                                const client = clients.find(c => c.id === project.client_id);
                                return client ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                                    <div className="flex items-center gap-2">
                                      <Info className="w-3 h-3 text-amber-500" />
                                      <span className="text-[11px] font-semibold text-slate-600">Person:</span>
                                      <span className="text-[11px] text-slate-900">{client.contact_person || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Mail className="w-3 h-3 text-amber-500" />
                                      <span className="text-[11px] font-semibold text-slate-600">Email:</span>
                                      <a href={`mailto:${client.email}`} className="text-[11px] text-primary-600 hover:underline">{client.email || 'N/A'}</a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-3 h-3 text-amber-500" />
                                      <span className="text-[11px] font-semibold text-slate-600">Phone:</span>
                                      <span className="text-[11px] text-slate-900">{client.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <ExternalLink className="w-3 h-3 text-amber-500" />
                                      <span className="text-[11px] font-semibold text-slate-600">Website:</span>
                                      <a href={normalizeUrl(client.website)} target="_blank" rel="noreferrer" className="text-[11px] text-primary-600 hover:underline">{client.website || 'N/A'}</a>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-slate-400 italic">Client details not found.</p>
                                );
                              })()}
                            </div>

                            {/* Partner / Reference Confidential */}
                            <div className="flex-1 space-y-3 border-l border-amber-100 pl-8">
                              <div className="flex items-center gap-2 text-amber-800">
                                <Briefcase className="w-4 h-4" />
                                <h4 className="text-sm font-semibold tracking-widest">Partner & Commission Info</h4>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                                <div className="flex items-center gap-2">
                                  <User className="w-3 h-3 text-amber-500" />
                                  <span className="text-[11px] font-semibold text-slate-600">Partner/Ref:</span>
                                  <span className="text-[11px] text-slate-900">{project.reference_name || project.reference_name_other || 'Direct / None'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="w-3 h-3 text-amber-500" />
                                  <span className="text-[11px] font-semibold text-slate-600">Source:</span>
                                  <span className="text-[11px] text-slate-900">{project.lead_source || 'Direct'}</span>
                                </div>
                                {project.reference_share_value && (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <Layers className="w-3 h-3 text-amber-500" />
                                      <span className="text-[11px] font-semibold text-slate-600">Share Type:</span>
                                      <span className="text-[11px] text-slate-900">{project.reference_share_type || 'Percentage'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                      <span className="text-[11px] font-bold text-slate-600">Commission:</span>
                                      <span className="text-[11px] font-bold text-emerald-600">
                                        {project.reference_share_type === 'Fixed'
                                          ? (CURRENCIES.find(c => c.code === project.currency)?.symbol || '$')
                                          : ''}
                                        {project.reference_share_value}
                                        {project.reference_share_type === 'Percentage' || !project.reference_share_type ? '%' : ''}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </Table>
          )}

          {/* Pagination Footer */}
          {filteredProjects.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 px-6 border-t border-slate-100 bg-slate-50/30">
              <div className="text-sm font-normal text-slate-500 uppercase tracking-wider">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredProjects.length)} to {Math.min(currentPage * itemsPerPage, filteredProjects.length)} of {filteredProjects.length} projects
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-sm font-semibold"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <Button
                    key={idx}
                    variant={currentPage === idx + 1 ? 'primary' : 'outline'}
                    size="sm"
                    className="h-8 w-8 p-0 text-xs font-bold"
                    onClick={() => setCurrentPage(idx + 1)}
                  >
                    {idx + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-sm font-semibold"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </PremiumCard>

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900 overflow-y-auto">
          <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-slate-100">
              <div>
                <CardTitle className="text-xl font-bold">New Project</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Initiate a new institutional workflow.</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="p-5 overflow-y-auto flex-1">
              <form onSubmit={handleAddProject} className="space-y-4 text-slate-900">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Project Category</label>
                    <select
                      name="category"
                      value={projectCategory}
                      onChange={(e) => setProjectCategory(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                      required
                    >
                      <option value="New Project">New Project (Lead-based)</option>
                      <option value="Maintenance">Maintenance / Service</option>
                    </select>
                  </div>
                  <Input label="Project Name" name="name" placeholder="E-commerce Redesign" required />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Account / Client</label>
                  <select name="client_id" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" required>
                    <option value="">Select account...</option>
                    {/* For New Projects, only show Signed Leads. For Maintenance, show all active clients */}
                    {clients.filter(c => {
                      if (projectCategory === 'New Project') {
                        return c.lifecycle_stage === 'Proposal Signed' || c.lifecycle_stage === 'Project Started';
                      }
                      return true; // Maintenance allows all
                    }).map(c => (
                      <option key={c.id} value={c.id}>
                        {c.company_name} - {c.potential_project_name || 'Generic Project'}
                        {c.lifecycle_stage === 'Proposal Signed' ? ' (Signed Proposal)' : ''}
                      </option>
                    ))}
                  </select>
                  {projectCategory === 'New Project' && (
                    <p className="text-[10px] text-primary-600 mt-1 italic font-bold">
                      *Only the projects with 'Proposal Signed' or 'Project Started' status will be listed here.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Project Budget" name="budget" type="number" min="0" step="0.01" placeholder="5000" required />
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Currency</label>
                    <select name="currency" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                      {CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Initial Status</label>
                    <select name="status" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                      <option value="Planned">Planned</option>
                      <option value="In Progress">In Progress</option>
                    </select>
                  </div>
                  <Input label="Tech Stack" name="tech_stack" placeholder="React, Node.js, PostgreSQL" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Start Date" name="start_date" type="date" required />
                  <Input label="End Date" name="end_date" type="date" required />
                </div>

                {/* Sprint Planning Section */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Sprint Planning</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Auto-generate sprint iterations for this project</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={projectUsesSprints}
                        onChange={(e) => {
                          setProjectUsesSprints(e.target.checked);
                          if (!e.target.checked) {
                            setSprintCount(1);
                            setSprintDates([{ start_date: '', end_date: '' }]);
                          }
                        }}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {projectUsesSprints && (
                    <div className="p-4 space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Number of Sprints</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={sprintCount}
                          onChange={(e) => {
                            const count = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
                            setSprintCount(count);
                            setSprintDates(prev => {
                              const updated = [...prev];
                              while (updated.length < count) updated.push({ start_date: '', end_date: '' });
                              return updated.slice(0, count);
                            });
                          }}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sprint Date Ranges</p>
                        {Array.from({ length: sprintCount }).map((_, i) => (
                          <div key={i} className="grid grid-cols-3 gap-2 items-center p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-xs font-bold text-slate-600">Sprint {i + 1}</span>
                            <input
                              type="date"
                              value={sprintDates[i]?.start_date || ''}
                              onChange={(e) => {
                                const updated = [...sprintDates];
                                updated[i] = { ...updated[i], start_date: e.target.value };
                                setSprintDates(updated);
                              }}
                              className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              required={projectUsesSprints}
                            />
                            <input
                              type="date"
                              value={sprintDates[i]?.end_date || ''}
                              onChange={(e) => {
                                const updated = [...sprintDates];
                                updated[i] = { ...updated[i], end_date: e.target.value };
                                setSprintDates(updated);
                              }}
                              className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              required={projectUsesSprints}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-primary-600 hover:bg-primary-700">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Project"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900 overflow-y-auto">
          <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-slate-100">
              <div>
                <CardTitle className="text-lg font-bold">Edit Project</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Update the institutional project metadata.</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="p-5 overflow-y-auto flex-1">
              <form onSubmit={handleEditProject} className="space-y-4 text-slate-900">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Project Category</label>
                    <select
                      name="category"
                      defaultValue={editingProject.category}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                      required
                    >
                      <option value="New Project">New Project (Lead-based)</option>
                      <option value="Maintenance">Maintenance / Service</option>
                    </select>
                  </div>
                  <Input label="Project Name" name="name" defaultValue={editingProject.name} placeholder="E-commerce Redesign" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input label="Project Budget" name="budget" type="number" min="0" step="0.01" defaultValue={editingProject.budget} placeholder="5000" required />
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Currency</label>
                    <select name="currency" defaultValue={editingProject.currency} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                      {CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Status</label>
                    <select name="status" defaultValue={editingProject.status} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                      <option value="Planned">Planned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <Input label="Tech Stack" name="tech_stack" defaultValue={editingProject.tech_stack} placeholder="React, Node.js, PostgreSQL" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Start Date" name="start_date" type="date" defaultValue={formatDateForInput(editingProject.start_date)} required />
                  <Input label="End Date" name="end_date" type="date" defaultValue={formatDateForInput(editingProject.end_date)} required />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-primary-600 hover:bg-primary-700">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Manage Team Modal */}
      {showTeamModal && selectedProject && (
        <ProjectTeamModal
          project={selectedProject}
          onClose={() => {
            setShowTeamModal(false);
            fetchProjects();
          }}
        />
      )}

      {/* Project Resources Modal */}
      {showResourceModal && selectedProject && (
        <ProjectResourcesModal
          project={selectedProject}
          onClose={() => {
            setShowResourceModal(false);
            fetchProjects();
          }}
          onUpdate={fetchProjects}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
