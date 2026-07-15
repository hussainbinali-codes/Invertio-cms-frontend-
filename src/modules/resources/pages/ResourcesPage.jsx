import React, { useEffect, useState } from 'react';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis
} from 'recharts';
import Button from '../../../components/ui/Button';
import { Plus, X, Monitor, Cpu, Users, Layers, TrendingUp, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../../utils/cn';
import StatCard from '../../../components/ui/StatCard';
import { hasPermission } from '../../../utils/permissionUtils';
import Skeleton from '../../../components/ui/Skeleton';
import Switch from '../../../components/ui/Switch';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';


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

const ResourcesPage = () => {
  const [resources, setResources] = useState([]); // Inventory items
  const [utilization, setUtilization] = useState([]); // Chart data
  const [userAllocation, setUserAllocation] = useState([]); // Table data
  const [users, setUsers] = useState([]); // For assignment dropdown
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory'); // 'utilization' or 'inventory'
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAssignmentUsers, setSelectedAssignmentUsers] = useState([]); // Array of {id, name}

  useLockBodyScroll(showAddModal);



  const mockSkills = [
    { subject: 'React', A: 120, B: 110, fullMark: 150 },
    { subject: 'Node.js', A: 98, B: 130, fullMark: 150 },
    { subject: 'UI/UX', A: 86, B: 130, fullMark: 150 },
    { subject: 'DevOps', A: 99, B: 100, fullMark: 150 },
    { subject: 'Python', A: 85, B: 90, fullMark: 150 },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch utilization
      try {
        const utilRes = await axios.get('/resources/utilization');
        const usersAlloc = utilRes.data.data || [];
        setUserAllocation(usersAlloc);
        
        const bench = usersAlloc.filter(u => parseFloat(u.total_allocation) === 0).length;
        const overallocated = usersAlloc.filter(u => parseFloat(u.total_allocation) > 100).length;
        const allocated = usersAlloc.length - bench - overallocated;

        setUtilization([
          { name: 'Allocated', value: allocated, color: '#3b82f6' },
          { name: 'Bench', value: bench, color: '#94a3b8' },
          { name: 'Overallocated', value: overallocated, color: '#ef4444' },
        ]);
      } catch (e) { console.error("Util fetch error", e); }

      // Fetch resources
      try {
        const invRes = await axios.get('/resources');
        setResources(invRes.data.data || []);
      } catch (e) { console.error("Inv fetch error", e); }

      // Fetch users for assignment (Only if user can add/edit resources)
      if (hasPermission('resources', 'create') || hasPermission('resources', 'edit')) {
        try {
          const userRes = await axios.get('/users/selection');
          const allUsers = userRes.data.data || [];
          setUsers(allUsers);
        } catch (e) { console.error("User fetch error", e); }
      }

    } catch (err) {
      console.error("General fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData);
    
    // Capture selected users from state
    payload.assigned_to = selectedAssignmentUsers.map(u => u.id);

    try {
      if (selectedResource) {
        await axios.put(`/resources/${selectedResource.id}`, payload);
        toast.success('Resource updated');
      } else {
        await axios.post('/resources', payload);
        toast.success('Resource added');
      }
      setShowAddModal(false);
      setSelectedResource(null);
      setSelectedAssignmentUsers([]);
      fetchData();
    } catch (err) {
      toast.error('Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [confirmModal, setConfirmModal] = useState({ show: false, id: null });

  const handleDeleteResource = (id) => {
    setConfirmModal({
      show: true,
      id
    });
  };

  const performDeleteResource = async (id) => {
    try {
      await axios.delete(`/resources/${id}`);
      toast.success('Resource deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete resource');
    } finally {
      setConfirmModal({ show: false, id: null });
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 pb-10">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 max-w-[1400px] mx-auto py-2">
      {/* Header section with Asymmetric Layout */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight mt-1">
            Asset Center
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-normal">
            Manage institutional inventory and workforce allocation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tabs toggle */}
          <div className="bg-slate-200/40 border border-slate-200/25 rounded-2xl p-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap">
            {[
              { id: 'inventory', label: 'Inventory' },
              { id: 'utilization', label: 'Workforce' }
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 uppercase tracking-wider whitespace-nowrap active:scale-[0.98]",
                    isActive ? "bg-white text-blue-600 shadow-sm border border-slate-200/20" : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {hasPermission('resources', 'create') && (
            <div className="bg-slate-200/30 p-1 rounded-full border border-slate-200/20 active:scale-[0.98] transition-all duration-300">
              <Button 
                onClick={() => { 
                  setSelectedResource(null); 
                  setSelectedAssignmentUsers([]);
                  setShowAddModal(true); 
                }} 
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full py-2 px-5 text-sm font-semibold shadow-sm flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                New Asset
              </Button>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <KpiCard title="Total Inventory" value={resources.length} icon={Cpu} subtext="Tracked items" />
            <KpiCard title="Assigned" value={resources.filter(r => r.assigned_users?.length > 0).length} icon={Monitor} subtext="Currently in use" />
            <KpiCard title="Available" value={resources.filter(r => !r.assigned_users || r.assigned_users.length === 0).length} icon={AlertCircle} subtext="Ready to deploy" />
          </div>

          <PremiumCard 
            title="Inventory & Access" 
            subtitle="Manage hardware, software licenses, and repository access." 
            icon={Monitor}
          >
            <div className="flex-1">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="py-4">Asset</TableHead>
                                <TableHead className="py-4">Type</TableHead>
                                <TableHead className="py-4">Assigned To</TableHead>
                                <TableHead className="py-4">Status</TableHead>
                                <TableHead className="py-4">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <tbody>
                            {resources.map((item) => (
                                <TableRow key={item.id}>


                                    <TableCell className="py-5">
                                        <div className="font-bold text-slate-900">{item.name}</div>
                                        {/* <div className="text-xs text-slate-500 font-medium mt-0.5">{item.details || 'No details'}</div> */}
                                    </TableCell>
                                    <TableCell className="py-5">
                                        <Badge variant="outline" className="text-xs font-semibold text-slate-500">{item.type}</Badge>
                                    </TableCell>
                                    <TableCell className="py-5">
                                        {item.assigned_users?.length > 0 ? (
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {item.assigned_users.map(u => (
                                                    <Badge key={u.id} variant="secondary" className="text-[10px] font-medium py-0 px-1.5">
                                                        {u.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400">Unassigned</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-5">
                                        <Badge 
                                            variant={
                                                item.status === 'Active' ? 'success' : 
                                                item.status === 'Available' ? 'primary' : 
                                                item.status === 'Maintenance' ? 'warning' : 
                                                'danger'
                                            }
                                        >
                                            {item.status}
                                        </Badge>
                                    </TableCell>

                                    <TableCell className="py-5">
                                        <div className="flex justify-start gap-2">
                                            {hasPermission('resources', 'edit') && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-8 text-xs text-primary-600 font-bold uppercase"
                                                    onClick={() => { 
                                                        setSelectedResource(item); 
                                                        setSelectedAssignmentUsers(item.assigned_users || []);
                                                        setShowAddModal(true); 
                                                    }}
                                                >
                                                    Edit
                                                </Button>
                                            )}
                                            {hasPermission('resources', 'delete') && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-8 text-xs text-red-600 font-bold uppercase hover:bg-red-50"
                                                    onClick={() => handleDeleteResource(item.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </tbody>
                    </Table>
                </div>
            </PremiumCard>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <KpiCard title="Total Team" value={userAllocation.length} icon={Users} subtext="Global talent pool" />
            <KpiCard title="Bench Strength" value={utilization.find(u => u.name === 'Bench')?.value || 0} icon={Layers} subtext="Available now" />
            <KpiCard title="ROI Matrix" value="84%" icon={TrendingUp} trend="+5%" subtext="Efficiency score" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PremiumCard title="Workforce Utilization" icon={Layers}>
              <div className="h-[350px] p-6">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie data={utilization} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                      {utilization.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </PremiumCard>

            <PremiumCard title="Core Proficiency Matrix" icon={TrendingUp}>
              <div className="h-[350px] p-6">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={mockSkills}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 12}} />
                    <Radar name="Company Avg" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </PremiumCard>
          </div>

          <PremiumCard 
            title="Allocation Matrix" 
            subtitle={`Monitoring ${userAllocation.length} project assignees.`} 
            icon={Users}
          >
            <div className="flex-1">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead className="py-4">Resource</TableHead>
                            <TableHead className="py-4">Primary Skill</TableHead>
                            <TableHead className="py-4">Allocation</TableHead>
                            <TableHead className="py-4">Status</TableHead>
                        </TableRow>
                        </TableHeader>
                        <tbody>
                        {userAllocation.map((row) => {
                            const allocation = parseFloat(row.total_allocation);


                            const status = allocation === 0 ? 'Bench' : allocation > 100 ? 'Full' : 'Allocated';
                            return (
                            <TableRow key={row.id} className="group">
                                <TableCell className="py-5">
                                    <div className="font-bold text-slate-900">{row.name}</div>
                                    <div className="text-xs text-slate-500 font-medium mt-0.5 tracking-wider">{row.role || 'Contributor'}</div>
                                </TableCell>
                                <TableCell className="py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">{row.primary_skill}</TableCell>
                                <TableCell className="py-5">
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 max-w-[120px]">
                                    <div 
                                        className={cn("h-1.5 rounded-full transition-all duration-500", allocation > 100 ? "bg-rose-500" : "bg-primary-500")}
                                        style={{ width: `${Math.min(allocation, 100)}%` }}
                                    ></div>
                                    </div>
                                    <span className="text-[10px] text-slate-400 mt-1.5 block font-bold uppercase">{allocation}% Capacity</span>
                                </TableCell>
                                <TableCell className="py-5">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={row.status === 'Active' ? 'success' : 'destructive'} className="text-xs font-semibold text-slate-500">
                                            {row.status}
                                        </Badge>
                                        {hasPermission('users', 'status.edit') && (
                                            <Switch 
                                                checked={row.status === 'Active'}
                                                onChange={async (checked) => {
                                                    try {
                                                        const newStatus = checked ? 'Active' : 'Disabled';
                                                        await axios.patch(`/users/${row.id}/status`, { status: newStatus });
                                                        toast.success(`User set to ${newStatus}`);
                                                        fetchData();
                                                    } catch (err) {
                                                        toast.error('Failed to update status');
                                                    }
                                                }}
                                            />
                                        )}

                                    </div>
                                </TableCell>
                            </TableRow>
                            );
                        })}
                        </tbody>
                    </Table>
            </div>
          </PremiumCard>
        </div>
      )}

      {/* Add Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900 overflow-y-auto">
          <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[95vh] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between py-6">
              <div>
                <CardTitle className="text-xl font-bold">{selectedResource ? 'Edit Asset' : 'Add New Asset'}</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Hardware, software, or digital access.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 duration-200">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto">
              <form onSubmit={handleAddResource} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Type</label>
                        <select 
                            name="type" 
                            defaultValue={selectedResource?.type} 
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" 
                            required
                        >
                            <option value="Laptop">Laptop / Hardware</option>
                            <option value="GitHub Repo">GitHub Repository</option>
                            <option value="Software License">Software License</option>
                            <option value="Server Access">Server / Cloud Access</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Status</label>
                        <select 
                            name="status" 
                            defaultValue={selectedResource?.status || 'Available'} 
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                        >
                            <option value="Available">Available</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Maintenance">Maintenance</option>

                        </select>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Asset Name</label>
                    <input 
                        name="name" 
                        defaultValue={selectedResource?.name} 
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" 
                        placeholder="e.g. MacBook Pro M2 #001 or Frontend Repository" 
                        required 
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Details / Reference</label>
                    <textarea 
                        name="details" 
                        defaultValue={selectedResource?.details} 
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 h-20" 
                        placeholder="e.g. Serial Number, Repo URL, or Access Scope"
                    ></textarea>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700">Access Management</label>
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 rounded-lg border border-slate-100 bg-slate-50/50">
                        {selectedAssignmentUsers.length === 0 ? (
                            <span className="text-xs text-slate-400 italic py-1 px-2">No users assigned yet.</span>
                        ) : (
                            selectedAssignmentUsers.map(u => (
                                <Badge key={u.id} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1 group">
                                    {u.name}
                                    <button 
                                        type="button"
                                        onClick={() => setSelectedAssignmentUsers(prev => prev.filter(user => user.id !== u.id))}
                                        className="p-0.5 hover:bg-slate-200 rounded-full transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))
                        )}
                    </div>
                    <select 
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                        onChange={(e) => {
                            const userId = e.target.value;
                            if (!userId) return;
                            const user = users.find(u => u.id === userId);
                            if (user && !selectedAssignmentUsers.find(u => u.id === userId)) {
                                setSelectedAssignmentUsers(prev => [...prev, { id: user.id, name: user.name }]);
                            }
                            e.target.value = "";
                        }}
                    >
                        <option value="">+ Add User to Assignment...</option>
                        {users.filter(u => !selectedAssignmentUsers.find(au => au.id === u.id)).map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-3 justify-end pt-6">
                  <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-primary-600 hover:bg-primary-700">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (selectedResource ? 'Update Asset' : 'Add Asset')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.show}
        onClose={() => setConfirmModal({ show: false, id: null })}
        onConfirm={() => performDeleteResource(confirmModal.id)}
        title="Delete Asset"
        message="Are you sure you want to permanently delete this asset? This action cannot be undone."
        variant="danger"
        confirmText="Delete Asset"
      />
    </div>
  );
};

export default ResourcesPage;
