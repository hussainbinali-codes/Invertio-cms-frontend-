import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Table, { TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Input from '../../../components/ui/Input';
import StatCard from '../../../components/ui/StatCard';
import { 
  Users, 
  Briefcase, 
  UserCheck, 
  Clock, 
  Mail, 
  FileText, 
  ExternalLink,
  Filter,
  Search
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { hasPermission } from '../../../utils/permissionUtils';

const DirectoryTab = ({
  employees,
  candidates,
  openDocs,
  setSelectedCandidate,
  setShowInterviewModal,
  searchTerm,
  setSearchTerm
}) => {
  const [statusFilter, setStatusFilter] = React.useState('All');

  const filteredPersonnel = [
    ...employees.map(e => ({ ...e, id: e.user_id, employee_id: e.id, recordType: 'Employee', displayStatus: e.status || 'Active' })),
    ...candidates.map(c => ({ ...c, recordType: 'Candidate', displayStatus: c.stage || 'Applied' }))
  ].filter(person => {
    if (statusFilter === 'All') return true;
    return person.displayStatus === statusFilter;
  }).sort((a, b) => a.recordType.localeCompare(b.recordType));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard title="Active Staff" value={employees.length} icon={Users} subtext="Full-time equivalent" />
        <StatCard title="Departments" value="4" icon={Briefcase} subtext="Org structure" />
        <StatCard title="Retention" value="98%" icon={UserCheck} subtext="Annual score" />
        <StatCard title="Avg Tenure" value="2.4y" icon={Clock} subtext="Stability metric" />
      </div>

      <Card className="text-slate-900 overflow-hidden">
        <CardHeader className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 py-6">
          <div>
            <CardTitle className="text-lg sm:text-xl font-bold">Employee Directory</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Accessing {employees.length} personnel files.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                className="pl-9 h-9 w-full sm:w-64 text-xs" 
                placeholder="Search directory..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none text-[11px] font-bold text-slate-600 focus:ring-0 cursor-pointer w-full"
              >
                <option value="Active">Active Staff</option>
                <option value="Disabled">Disabled</option>
                <option value="Applied">Applied</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Hired">Hired Candidates</option>
                <option value="Rejected">Rejected</option>
                <option value="All">Show All</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="py-4">Employee</TableHead>
                <TableHead className="py-4">Designation</TableHead>
                <TableHead className="py-4">Joining Date</TableHead>
                {hasPermission('users', 'salary.view') && <TableHead className="py-4">Salary</TableHead>}
                <TableHead className="py-4">Status</TableHead>
                <TableHead className="py-4">Action</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {filteredPersonnel.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={hasPermission('users', 'salary.view') ? 6 : 5} className="py-10 text-center text-slate-400 font-medium italic">No personnel records found.</TableCell>
                </TableRow>
              ) : filteredPersonnel.map(person => (
                <TableRow key={`${person.recordType}-${person.id}`} className="group hover:bg-slate-50/50 transition-colors">
                  <TableCell className="py-5">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm",
                        person.recordType === 'Employee' ? "bg-primary-100 text-primary-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {person.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          {person.name}
                          <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter h-4 px-1">
                            {person.recordType}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {person.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="text-xs font-bold text-slate-800">{person.designation || 'N/A'}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{person.department || 'General'}</div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="text-xs font-semibold text-slate-600">
                      {person.joining_date ? new Date(person.joining_date).toLocaleDateString() : 'Pending'}
                    </div>
                  </TableCell>
                  {hasPermission('users', 'salary.view') && (
                    <TableCell className="py-5">
                      <div className="text-xs font-bold text-slate-900">
                        {person.salary ? `₹${parseFloat(person.salary).toLocaleString('en-IN')}` : 'N/A'}
                      </div>
                      <div className="text-[9px] text-slate-400 font-medium uppercase mt-0.5">
                        {person.recordType === 'Employee' ? 'Monthly CTC' : 'Offered Salary'}
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="py-5">
                    <Badge 
                      variant={
                        person.displayStatus === 'Active' ? 'default' : 
                        person.displayStatus === 'Hired' ? 'success' :
                        person.displayStatus === 'Rejected' ? 'danger' : 
                        person.displayStatus === 'Interview' ? 'primary' : 'outline'
                      }
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        person.displayStatus === 'Active' && "bg-indigo-50 text-indigo-700 border-indigo-200"
                      )}
                    >
                      {person.displayStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex justify-start gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-slate-400 hover:text-primary-600 hover:bg-primary-50"
                        onClick={() => openDocs(person, person.recordType === 'Employee' ? 'user' : 'candidate')}
                        title="Personnel Records"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-slate-400 hover:text-primary-600 hover:bg-primary-50"
                        onClick={() => {
                          if (person.recordType === 'Employee') {
                            // Future: Open Employee Edit
                          } else {
                            setSelectedCandidate(person);
                            setShowInterviewModal(true);
                          }
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DirectoryTab;
