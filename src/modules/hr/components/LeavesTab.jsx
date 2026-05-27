import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Table, { TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Input from '../../../components/ui/Input';
import { Clock, Check, X as XIcon, Search } from 'lucide-react';
import { hasPermission } from '../../../utils/permissionUtils';

const LeavesTab = ({
  leaves,
  handleLeaveAction,
  searchTerm,
  setSearchTerm
}) => {
  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-900">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6">
        <div>
          <CardTitle className="text-lg sm:text-xl font-bold">Leave Requests</CardTitle>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Approve or reject employee time-off applications.</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            className="pl-9 h-9 w-full sm:w-64 text-xs" 
            placeholder="Search leaves..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
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
            {leaves.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-slate-400 italic font-medium">No leave requests found matching your search.</TableCell>
              </TableRow>
            )}
            {leaves.map(leave => (
              <TableRow key={leave.id}>
                <TableCell className="py-5 font-bold">{leave?.employee_name}</TableCell>
                <TableCell className="py-5">
                  <Badge
                    variant={
                      leave.leave_type === 'Available' ? 'outline' :
                        leave.leave_type === 'Sick Leave' ? 'success' :
                          leave.leave_type === 'Unpaid' ? 'danger' : 'secondary'
                    }
                    className="text-[10px] font-bold uppercase"
                  >
                    {leave?.leave_type || 'Available'}
                  </Badge>
                </TableCell>
                <TableCell className="py-5">
                  <div className="text-xs font-semibold">{new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {leave.days_count} Days
                  </div>
                </TableCell>
                <TableCell className="py-5">
                  <Badge
                    variant={leave.status === 'Approved' ? 'success' : leave.status === 'Rejected' ? 'danger' : 'primary'}
                    className="text-[10px] font-bold uppercase"
                  >
                    {leave.status}
                  </Badge>
                </TableCell>
                <TableCell className="py-5">
                  {leave.status === 'Pending' && hasPermission('hr', 'leaves.approve') ? (
                    <div className="flex justify-start gap-2">
                      <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleLeaveAction(leave.id, 'Approved')}>
                        <Check className="w-3.5 h-3.5 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="danger" className="h-8" onClick={() => handleLeaveAction(leave.id, 'Rejected')}>
                        <XIcon className="w-3.5 h-3.5 mr-1" /> Reject
                      </Button>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-300 uppercase italic">PROCESSED</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default LeavesTab;
