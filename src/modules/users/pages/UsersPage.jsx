import React, { useEffect, useState } from 'react';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import StatCard from '../../../components/ui/StatCard';
import PaginationControls from '../../../components/ui/PaginationControls';
import {
  Search, UserPlus, Users,
  ShieldCheck, UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { hasPermission } from '../../../utils/permissionUtils';

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
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Members</h1>
          <p className="text-sm text-slate-500 mt-1">Manage employees, permissions, and system access.</p>
        </div>
        {hasPermission('users', 'create') && (
          <Button onClick={() => { resetForm(); setShowAddModal(true); }} className="bg-primary-600 hover:bg-primary-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Users" value={pagination.total} icon={Users} subtext="Registered members" />
        <StatCard title="Active" value={users.filter(u => u.status === 'Active').length} icon={UserCheck} trend="+2" subtext="On this page" />
        <StatCard title="Admins" value={users.filter(u => u.role_name === 'Admin' || u.role_name === 'Super Admin').length} icon={ShieldCheck} subtext="On this page" />
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-6">
          <CardTitle className="text-xl font-bold">All Users</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name or email..."
              className="pl-10 h-10 text-sm"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <UsersTable
            users={filteredUsers}
            loading={loading}
            handleStatusChange={handleStatusChange}
            handleEdit={handleEdit}
          />
          <PaginationControls
            pagination={pagination}
            itemCount={users.length}
            onPrevious={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            onNext={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages || 1))}
          />
        </CardContent>
      </Card>

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
