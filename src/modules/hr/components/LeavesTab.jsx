import React, { useMemo } from 'react';
import PremiumCard from '../../../components/ui/PremiumCard';
import Table, { TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Input from '../../../components/ui/Input';
import { Clock, Check, X as XIcon, Search } from 'lucide-react';
import { hasPermission } from '../../../utils/permissionUtils';
import { cn } from '../../../utils/cn';

const LeavesTab = ({
  leaves = [],
  handleLeaveAction,
  searchTerm,
  setSearchTerm
}) => {
  // Always sort Pending requests to the top for immediate admin visibility
  const sortedLeaves = useMemo(() => {
    if (!Array.isArray(leaves)) return [];
    return [...leaves].sort((a, b) => {
      const aPending = (a?.status || '').toLowerCase() === 'pending';
      const bPending = (b?.status || '').toLowerCase() === 'pending';

      // Pending items first
      if (aPending && !bPending) return -1;
      if (!aPending && bPending) return 1;

      // Newest date first within same status
      const dateA = new Date(a?.created_at || a?.start_date || 0).getTime();
      const dateB = new Date(b?.created_at || b?.start_date || 0).getTime();
      return dateB - dateA;
    });
  }, [leaves]);

  const pendingCount = useMemo(() => {
    if (!Array.isArray(leaves)) return 0;
    return leaves.filter(l => (l?.status || '').toLowerCase() === 'pending').length;
  }, [leaves]);

  return (
    <PremiumCard
      title={
        <div className="flex items-center gap-2.5">
          <span>Leave Requests</span>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              {pendingCount} Pending
            </span>
          )}
        </div>
      }
      subtitle="Approve or reject employee time-off applications."
      icon={Clock}
      className="animate-in fade-in slide-in-from-bottom-4 duration-500"
      headerRight={
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            className="pl-9 h-9 w-full sm:w-64 text-xs"
            placeholder="Search leaves..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      }
    >
      <div className="flex-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="py-4">Employee</TableHead>
              <TableHead className="py-4">Type</TableHead>
              <TableHead className="py-4">Duration</TableHead>
              <TableHead className="py-4">Status</TableHead>
              <TableHead className="py-4">Action</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {sortedLeaves.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-slate-400 italic font-medium">
                  No leave requests found matching your search.
                </TableCell>
              </TableRow>
            )}
            {sortedLeaves.map(leave => {
              const isPending = (leave?.status || '').toLowerCase() === 'pending';

              return (
                <TableRow
                  key={leave.id}
                  className={cn(
                    "transition-colors",
                    isPending ? "bg-amber-50/40 hover:bg-amber-50/70" : "hover:bg-slate-50/60"
                  )}
                >
                  <TableCell className="py-4 font-bold text-slate-800">
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Action required" />
                      )}
                      <span>{leave?.employee_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge
                      variant={
                        leave.leave_type === 'Available' ? 'outline' :
                          leave.leave_type === 'Sick Leave' ? 'success' :
                            leave.leave_type === 'Unpaid' ? 'danger' : 'secondary'
                      }
                      className="text-xs font-semibold text-slate-600"
                    >
                      {leave?.leave_type || 'Available'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="text-sm font-normal text-slate-700">
                      {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {leave.days_count} Days
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge
                      variant={
                        leave.status === 'Approved' ? 'success' :
                          leave.status === 'Rejected' ? 'danger' :
                            isPending ? 'warning' : 'primary'
                      }
                      className="text-xs font-semibold"
                    >
                      {leave.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    {isPending && hasPermission('hr', 'leaves.approve') ? (
                      <div className="flex justify-start gap-2">
                        <Button
                          size="sm"
                          className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleLeaveAction(leave.id, 'Approved')}
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          className="h-8"
                          onClick={() => handleLeaveAction(leave.id, 'Rejected')}
                        >
                          <XIcon className="w-3.5 h-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-300 uppercase italic">PROCESSED</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </tbody>
        </Table>
      </div>
    </PremiumCard>
  );
};

export default LeavesTab;
