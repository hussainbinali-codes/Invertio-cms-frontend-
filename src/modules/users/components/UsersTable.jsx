import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Skeleton from '../../../components/ui/Skeleton';
import { Edit, ShieldCheck } from 'lucide-react';
import { hasPermission } from '../../../utils/permissionUtils';

const UsersTable = ({
  users,
  loading,
  handleStatusChange,
  handleEdit
}) => {
  if (loading) {
    return (
      <div className="divide-y divide-slate-100">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return <div className="p-8 text-center text-slate-500">No users found.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="py-4">Member</TableHead>
          <TableHead className="py-4">Role</TableHead>
          {hasPermission('users', 'salary.view') && <TableHead className="py-4">Salary</TableHead>}
          <TableHead className="py-4">Skills</TableHead>
          <TableHead className="py-4">Status</TableHead>
          <TableHead className="py-4">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <tbody>
        {users.map((user) => (
          <TableRow key={user.id} className="group">
            <TableCell className="py-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{user.name}</div>
                  <div className="text-xs text-slate-500 font-medium">{user.email}</div>
                </div>
              </div>
            </TableCell>
            <TableCell className="py-5">
              <div className="flex flex-col gap-1">
                <Badge variant="primary" className="text-[10px] font-bold uppercase tracking-wider w-fit">{user.role_name || 'User'}</Badge>
                {user.module_permissions && Object.keys(user.module_permissions).length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                     <ShieldCheck className="w-3 h-3 text-amber-500" />
                     <span className="text-[9px] font-bold text-amber-600 uppercase tracking-tighter">Custom Access</span>
                  </div>
                )}
              </div>
            </TableCell>
            {hasPermission('users', 'salary.view') && (
              <TableCell className="py-5">
                <div className="text-xs font-bold text-slate-900">
                  {user.salary ? `₹${user.salary.toLocaleString()}` : 'N/A'}
                </div>
                <div className="text-[9px] text-slate-400 font-medium uppercase mt-0.5">Monthly CTC</div>
              </TableCell>
            )}
            <TableCell className="py-5">
              <div className="flex flex-wrap gap-1 max-w-[200px]">
                {user.skills && user.skills.length > 0 ? (
                    user.skills.map(s => (
                        <Badge key={s.id} variant="outline" className="text-[9px] px-1.5 py-0 border-slate-200 text-slate-500 whitespace-nowrap">{s.name}</Badge>
                    ))
                ) : (
                    <span className="text-[10px] text-slate-400">No skills</span>
                )}
              </div>
            </TableCell>
            <TableCell className="py-5">
              <Badge variant={user.status === 'Active' ? 'success' : 'default'} className="text-[10px] font-bold uppercase tracking-wider">
                {user.status || 'Pending'}
              </Badge>
            </TableCell>
            <TableCell className="py-5">
              <div className="flex items-center justify-start gap-3">
                {hasPermission('users', 'status.edit') && (
                  <select 
                    className="text-[10px] font-bold uppercase bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    value={user.status || 'Pending'}
                    onChange={(e) => handleStatusChange(user.id, e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Disabled">Disabled</option>
                    <option value="Pending">Pending</option>
                  </select>
                )}
                {hasPermission('users', 'permissions.edit') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(user)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-primary-600 hover:bg-primary-50"
                    title="Edit Member"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                {!hasPermission('users', 'permissions.edit') && !hasPermission('users', 'status.edit') && (
                  <Badge variant="outline" className="text-[10px] font-bold text-slate-400">READ ONLY</Badge>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  );
};

export default UsersTable;
