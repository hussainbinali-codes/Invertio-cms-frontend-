import React, { useEffect, useState } from 'react';
import axios from '../../../api/axios';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import PaginationControls from '../../../components/ui/PaginationControls';
import {
  Search, UserPlus, Users,
  ShieldCheck, UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { hasPermission } from '../../../utils/permissionUtils';
import { cn } from '../../../utils/cn';

import UserModal from '../components/UserModal';
import UsersTable from '../components/UsersTable';

const PAGE_LIMIT = 10;
const DEFAULT_PAGINATION = {
  page: 1,
  limit: PAGE_LIMIT,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false
};

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

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [pages, setPages] = useState({});
  const [modules, setModules] = useState({});

  useEffect(() => {
    const loadStaticData = async () => {
      try {
        await Promise.all([fetchRoles(), fetchSkills()]);
      } finally {
        setLoading(false);
      }
    };

    loadStaticData();
  }, []);

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  const fetchSkills = async () => {
    try {
      const res = await axios.get('/skills');
      setSkills(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch skills', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await axios.get('/users/roles');
      setRoles(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch roles', error);
    }
  };

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(`/users?page=${page}&limit=${PAGE_LIMIT}`);
      const payload = res.data.data || {};
      const items = Array.isArray(payload.items)
        ? payload.items
        : Array.isArray(payload)
          ? payload
          : [];
      const nextPagination = payload.pagination || {
        ...DEFAULT_PAGINATION,
        page,
        total: items.length,
        totalPages: 1
      };

      setUsers(items);
      setPagination(nextPagination);
    } catch (error) {
      console.error('Failed to fetch users', error);
      setUsers([]);
      setPagination(DEFAULT_PAGINATION);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsEditing(true);
    setSelectedSkills(user.skills || []);
    setPages(user.permissions_json || {});
    setModules(user.module_permissions || {});
    setShowAddModal(true);
  };

  const handleAddSkill = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (skillInput.trim()) {
        const name = skillInput.trim();
        if (selectedSkills.some(s => s.name.toLowerCase() === name.toLowerCase())) {
          setSkillInput('');
          return;
        }
        const existing = skills.find(s => s.name.toLowerCase() === name.toLowerCase());
        if (existing) {
          setSelectedSkills([...selectedSkills, existing]);
        } else {
          setSelectedSkills([...selectedSkills, { id: 'new-' + Date.now(), name, isNew: true }]);
        }
        setSkillInput('');
      }
    }
  };

  const removeSkill = (skillId) => {
    setSelectedSkills(selectedSkills.filter(s => s.id !== skillId));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();

    if (selectedSkills.length === 0) {
      toast.error('Please add at least one skill to the skill set.');
      return;
    }

    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      toast.error('Please enter a valid email address (e.g. john@gmail.com).');
      return;
    }

    setIsSubmitting(true);

    try {
      const finalSkillIds = [];
      for (const skill of selectedSkills) {
        if (skill.isNew) {
          const skillRes = await axios.post('/skills', { name: skill.name });
          finalSkillIds.push(skillRes.data.data.id);
        } else {
          finalSkillIds.push(skill.id);
        }
      }

      const userPayload = {
        ...payload,
        role_id: payload.role_id,
        salary: payload.salary ? parseFloat(payload.salary) : 0,
        permissions_json: pages,
        module_permissions: modules,
        skills: finalSkillIds
      };

      if (isEditing) {
        await axios.put(`/users/${selectedUser.id}`, userPayload);
        toast.success('Member updated successfully');
      } else {
        await axios.post('/users', userPayload);
        toast.success('Member added successfully. Activation OTP sent!');
      }

      setShowAddModal(false);
      resetForm();
      fetchUsers(currentPage);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        return;
      }
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await axios.patch(`/users/${userId}/status`, { status: newStatus });
      toast.success(`User status updated to ${newStatus}`);
      fetchUsers(currentPage);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        return;
      }
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.employee_id?.toLowerCase?.().includes(searchTerm.toLowerCase())
  );

  function resetForm() {
    setIsEditing(false);
    setSelectedUser(null);
    setSelectedSkills([]);
    setSkillInput('');
    setPages({
      tasks: true,
      attendance: true,
      my_time_offs: true
    });
    setModules({
      tasks: { view: true, edit: true },
      attendance: { view: true },
      my_time_offs: { view: true, create: true }
    });
  }

  return (
    <div className="space-y-8 pb-10 max-w-[1400px] mx-auto py-2">
      {/* Header section with Asymmetric Layout */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight mt-1">
            Team Members
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-normal">
            Manage employees, permissions, and system access.
          </p>
        </div>
        {hasPermission('users', 'create') && (
          <div className="bg-slate-200/30 p-1 rounded-full border border-slate-200/20 active:scale-[0.98] transition-all duration-300">
            <Button 
              onClick={() => { resetForm(); setShowAddModal(true); }} 
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full py-2 px-5 text-sm font-semibold shadow-sm flex items-center gap-2"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Member
            </Button>
          </div>
        )}
      </div>

      {/* KPI Stats Grid in Double-Bezel nested wrapper */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <KpiCard 
          title="Total Users" 
          value={pagination.total || 0} 
          icon={Users} 
          subtext="Registered staff members" 
        />
        <KpiCard 
          title="Active Users" 
          value={users.filter(u => u.status === 'Active').length} 
          icon={UserCheck} 
          trend="+2" 
          subtext="Active on this page" 
        />
        <KpiCard 
          title="Security Admins" 
          value={users.filter(u => u.role_name === 'Admin' || u.role_name === 'Super Admin').length} 
          icon={ShieldCheck} 
          subtext="Authorized system managers" 
        />
      </div>

      {/* Main Table Enclosure wrapped in Premium Double-Bezel Card */}
      <PremiumCard 
        title="All Workspace Users" 
        subtitle="Staff roster and role profiles" 
        icon={Users}
        headerRight={
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name or email..."
              className="pl-10 h-10 text-xs rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        }
      >
        <div className="flex-1 flex flex-col justify-between">
          <UsersTable
            users={filteredUsers}
            loading={loading}
            handleStatusChange={handleStatusChange}
            handleEdit={handleEdit}
          />
          <div className="border-t border-slate-100 p-4">
            <PaginationControls
              pagination={pagination}
              itemCount={users.length}
              onPrevious={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              onNext={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages || 1))}
            />
          </div>
        </div>
      </PremiumCard>

      <UserModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); resetForm(); }}
        onSubmit={handleAddUser}
        isEditing={isEditing}
        selectedUser={selectedUser}
        isSubmitting={isSubmitting}
        roles={roles}
        skills={skills}
        selectedSkills={selectedSkills}
        skillInput={skillInput}
        setSkillInput={setSkillInput}
        handleAddSkill={handleAddSkill}
        removeSkill={removeSkill}
        pages={pages}
        setPages={setPages}
        modules={modules}
        setModules={setModules}
      />
    </div>
  );
};

export default UsersPage;
