import React, { useState } from 'react';
import KpiCard from '../../../components/ui/KpiCard';
import PremiumCard from '../../../components/ui/PremiumCard';
import Table, { TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Input from '../../../components/ui/Input';
import PaginationControls from '../../../components/ui/PaginationControls';
import {
  Users,
  Calendar,
  UserCheck,
  Search,
  Clock,
  FileText,
  Loader2,
  Maximize2,
  Minimize2
} from 'lucide-react';
import {
  FunnelChart,
  Funnel,
  LabelList,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { hasPermission } from '../../../utils/permissionUtils';
import { cn } from '../../../utils/cn';

const RecruitmentTab = ({
  candidates,
  pipeline,
  recruitmentStats,
  recruitmentPagination,
  updateStage,
  activateLinkedUser,
  activatingUserId,
  formatDate,
  setSelectedCandidate,
  setShowInterviewModal,
  openDocs,
  searchTerm,
  onSearchTermChange,
  onPreviousPage,
  onNextPage
}) => {
  const [isTableExpanded, setIsTableExpanded] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <KpiCard title="Total Candidates" value={recruitmentStats.totalCandidates} icon={Users} subtext="Active pipeline" />
        <KpiCard title="Interviews" value={recruitmentStats.interviews} icon={Calendar} subtext="Active interviews" />
        <KpiCard title="Hired" value={recruitmentStats.hired} icon={UserCheck} subtext="Total hired" />
      </div>

      <div className={cn("grid gap-6", isTableExpanded ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3")}>
        {!isTableExpanded && (
          <PremiumCard title="Hiring Funnel" className="lg:col-span-1" icon={Users}>
            <div className="h-[350px] p-4 flex flex-col justify-center min-w-0 min-h-0 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <FunnelChart margin={{ top: 20, right: 60, bottom: 20, left: 20 }}>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Funnel dataKey="value" data={pipeline} isAnimationActive>
                    <LabelList position="right" fill="#64748b" stroke="none" dataKey="name" style={{ fontSize: '10px', fontWeight: 'bold' }} />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          </PremiumCard>
        )}

        <PremiumCard
          title="Recruitment Tracker"
          subtitle={`Monitoring ${recruitmentPagination?.total || candidates.length} applications.`}
          icon={Users}
          className={isTableExpanded ? "col-span-1 w-full" : "lg:col-span-2"}
          headerRight={
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  className="pl-9 h-9 w-full text-xs"
                  placeholder="Filter candidates..."
                  value={searchTerm}
                  onChange={(e) => onSearchTermChange(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => setIsTableExpanded(!isTableExpanded)}
                className={cn(
                  "h-9 px-2.5 sm:px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0",
                  isTableExpanded
                    ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                )}
                title={isTableExpanded ? "Show Hiring Funnel (Split View)" : "Expand Table (Full Width)"}
              >
                {isTableExpanded ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Split View</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Expand</span>
                  </>
                )}
              </button>
            </div>
          }
        >
          <div className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-4">Candidate</TableHead>
                  <TableHead className="py-4">Employee ID</TableHead>
                  <TableHead className="py-4">Current Stage</TableHead>
                  <TableHead className="py-4">Next Step</TableHead>
                  <TableHead className="py-4">Action</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {candidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-slate-400 font-medium italic">No data found.</TableCell>
                  </TableRow>
                ) : candidates.map((candidate) => {
                  const isHired = candidate.stage === 'Hired';
                  const displayStatus = !isHired
                    ? candidate.stage
                    : candidate.user_status === 'Active'
                      ? 'Active'
                      : 'Hired';
                  const canActivate = isHired && candidate.user_id && candidate.user_status !== 'Active';
                  const isActivating = activatingUserId === candidate.user_id;

                  return (
                    <TableRow key={candidate.id} className="group">
                      <TableCell className="py-5">
                        <div className="font-bold text-slate-900">{candidate.name}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                          {candidate.email}{candidate.phone ? ` • ${candidate.phone}` : ''}
                        </div>
                        {(candidate.designation || candidate.experience) && (
                          <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            {candidate.designation || ''} {candidate.experience ? `(${candidate.experience})` : ''}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-5">
                        {candidate.employee_id ? (
                          <div className="text-xs font-bold text-slate-800">{candidate.employee_id}</div>
                        ) : null}
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={displayStatus === 'Active' || displayStatus === 'Hired' ? 'success' : displayStatus === 'Rejected' ? 'danger' : 'primary'}
                            className="text-xs font-semibold text-slate-500"
                          >
                            {displayStatus}
                          </Badge>
                          {hasPermission('hr', 'recruitment.manage') && !isHired ? (
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
                          ) : null}
                          {!hasPermission('hr', 'recruitment.manage') && !isHired ? (
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic ml-2">LOCKED</span>
                          ) : null}
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
                          <span className="text-xs text-slate-500 font-medium italic">Not Scheduled</span>
                        )}
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {canActivate ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs font-semibold text-slate-500 border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-3"
                              onClick={() => activateLinkedUser(candidate.user_id)}
                              disabled={isActivating}
                            >
                              {isActivating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Activate'}
                            </Button>
                          ) : null}
                          {!isHired ? (
                            hasPermission('hr', 'recruitment.manage') ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs font-semibold text-slate-500 text-primary-600 hover:bg-primary-50 px-3"
                                onClick={() => {
                                  setSelectedCandidate(candidate);
                                  setShowInterviewModal(true);
                                }}
                              >
                                {candidate.stage === 'Interview' ? 'Reschedule' : 'Schedule'}
                              </Button>
                            ) : (
                              <Badge variant="outline" className="text-[10px] font-bold text-slate-400">READ ONLY</Badge>
                            )
                          ) : null}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs font-semibold text-slate-500 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 ml-1 px-2"
                            onClick={() => openDocs(candidate, 'candidate')}
                            title="Manage Documents"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </tbody>
            </Table>
            <PaginationControls
              pagination={recruitmentPagination}
              itemCount={candidates.length}
              onPrevious={onPreviousPage}
              onNext={onNextPage}
            />
          </div>
        </PremiumCard>
      </div>
    </div>
  );
};

export default RecruitmentTab;
