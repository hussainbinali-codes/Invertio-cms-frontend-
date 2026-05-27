import React, { useEffect, useState } from 'react';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Loader2, X, UserPlus, UserMinus, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { hasPermission } from '../../../utils/permissionUtils';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';

/**
 * ProjectTeamModal: Allows management of project team membership.
 * Uses the resource_allocations system to link users to projects.
 */
const ProjectTeamModal = ({ project, onClose }) => {
  useLockBodyScroll(true);
  const [team, setTeam] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    fetchTeamData();
  }, [project.id]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const [teamRes, usersRes] = await Promise.all([
        axios.get(`/projects/${project.id}/team`),
        axios.get('/users/selection')
      ]);

      setTeam(teamRes.data.data || []);
      setAllUsers(usersRes.data.data || []);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load team data');
      setLoading(false);
    }
  };

  const handleAddMember = async (userId) => {
    setIsActionLoading(true);
    try {
      await axios.post(`/projects/${project.id}/team`, {
        user_id: userId,
        allocation_percentage: 100
      });
      toast.success('Member assigned to project');
      fetchTeamData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign member');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    setIsActionLoading(true);
    try {
      await axios.delete(`/projects/${project.id}/team/${userId}`);
      toast.success('Member removed from project');
      fetchTeamData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Filter out users already in the team
  const availableUsers = allUsers.filter(
    user => !team.find(member => member.id === user.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900">
      <Card className="w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[95vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 shrink-0">
          <div>
            <CardTitle className="text-xl">Team Management</CardTitle>
            <p className="text-sm text-slate-500 mt-1">Project: <span className="font-semibold text-slate-700">{project.name}</span></p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Current Team */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold">
                  <Shield className="w-4 h-4 text-primary-500" />
                  Active Team Members ({team.length})
                </h3>
                <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {team.length === 0 ? (
                    <div className="text-center p-8 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-500 text-sm">
                      No members assigned yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {team.map(member => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{member.name}</p>
                            <p className="text-xs text-slate-500">{member.role_name || member.email}</p>
                          </div>
                          {hasPermission('projects', 'team.manage') && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:bg-red-50"
                              onClick={() => handleRemoveMember(member.id)}
                              disabled={isActionLoading}
                            >
                              <UserMinus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Add Members */}
              {hasPermission('projects', 'team.manage') && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">Add Team Members</h3>
                  <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {availableUsers.length === 0 ? (
                      <p className="text-center p-8 text-slate-500 text-sm italic">All users are assigned.</p>
                    ) : (
                      <div className="space-y-2">
                        {availableUsers.map(user => (
                          <div key={user.id} className="flex items-center justify-between p-3 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg transition-all group">
                            <div>
                              <p className="text-sm font-medium text-slate-900">{user.name}</p>
                              <p className="text-xs text-slate-500">{user.role_name || user.email}</p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="secondary"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleAddMember(user.id)}
                              disabled={isActionLoading}
                            >
                              <UserPlus className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="mt-8 flex justify-end">
            <Button onClick={onClose} variant="primary">Done</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectTeamModal;
