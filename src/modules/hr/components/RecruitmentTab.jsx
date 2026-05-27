import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Table, { TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Input from '../../../components/ui/Input';
import StatCard from '../../../components/ui/StatCard';
import { 
  Users, 
  Calendar, 
  UserCheck, 
  Search, 
  Clock, 
  FileText,
  UserPlus
} from 'lucide-react';
import { 
  FunnelChart, 
  Funnel, 
  LabelList, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { hasPermission } from '../../../utils/permissionUtils';

const RecruitmentTab = ({
  candidates,
  pipeline,
  updateStage,
  formatDate,
  setSelectedCandidate,
  setShowInterviewModal,
  openDocs,
  searchTerm,
  setSearchTerm
}) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Candidates" value={candidates.length} icon={Users} subtext="Active pipeline" />
        <StatCard title="Interviews" value={candidates.filter(c => c.stage === 'Interview').length} icon={Calendar} subtext="This week" />
        <StatCard title="Hired" value={candidates.filter(c => c.stage === 'Hired').length} icon={UserCheck} subtext="Month-to-date" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="py-6">
            <CardTitle className="text-lg font-bold">Hiring Funnel</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <FunnelChart>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Funnel dataKey="value" data={pipeline} isAnimationActive>
                  <LabelList position="right" fill="#64748b" stroke="none" dataKey="name" style={{ fontSize: '10px', fontWeight: 'bold' }} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 text-slate-900 overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6">
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold">Recruitment Tracker</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Monitoring {candidates.length} active applications.</p>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                className="pl-9 h-9 w-full sm:w-64 text-xs" 
                placeholder="Filter candidates..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-4">Candidate</TableHead>
                  <TableHead className="py-4">Current Stage</TableHead>
                  <TableHead className="py-4">Next Step</TableHead>
                  <TableHead className="py-4">Action</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {candidates.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="py-10 text-center text-slate-400 font-medium italic">No candidates found matching your criteria.</TableCell>
                    </TableRow>
                ) : candidates.map(candidate => (
                  <TableRow key={candidate.id} className="group">
                    <TableCell className="py-5">
                      <div className="font-bold text-slate-900">{candidate.name}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{candidate.email}</div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={candidate.stage === 'Hired' ? 'success' : candidate.stage === 'Rejected' ? 'danger' : 'primary'} 
                          className="text-[10px] font-bold uppercase tracking-wider"
                        >
                          {candidate.stage}
                        </Badge>
                        {hasPermission('hr', 'recruitment.manage') ? (
                          <select 
                            className="bg-transparent border-none text-[10px] font-bold text-slate-400 focus:ring-0 cursor-pointer hover:text-primary-600 transition-colors"
                            value={candidate.stage}
                            onChange={(e) => updateStage(candidate.id, e.target.value)}
                          >
                            <option value="Applied">Applied</option>
                            <option value="Interview">Interview</option>
                            <option value="Offer">Offer</option>
                            <option value="Hired">Hired</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic ml-2">LOCKED</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      {candidate.interview_date ? (
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-primary-500" />
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                            {formatDate(candidate.interview_date)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">Not Scheduled</span>
                      )}
                    </TableCell>
                    <TableCell className="py-5">
                      {hasPermission('hr', 'recruitment.manage') ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-[10px] font-bold uppercase text-primary-600 hover:bg-primary-50 px-3"
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setShowInterviewModal(true);
                          }}
                        >
                          {candidate.stage === 'Interview' ? 'Reschedule' : 'Schedule'}
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-bold text-slate-400">READ ONLY</Badge>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-[10px] font-bold uppercase text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 ml-1 px-2"
                        onClick={() => openDocs(candidate, 'candidate')}
                        title="Manage Documents"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RecruitmentTab;
