import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import PaginationControls from '../../../components/ui/PaginationControls';
import { LayoutDashboard, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../utils/cn';

const getDynamicPageLimit = () => {
  if (typeof window === 'undefined') return 6;
  const h = window.innerHeight;
  if (h < 720) return 5;
  if (h < 820) return 6;
  if (h < 920) return 7;
  return 8;
};

const GlobalBoardsTab = ({
  projects = [],
  allTasks = [],
  canCreate,
  handleViewTasks,
  handleCreateTask
}) => {
  const [pageLimit, setPageLimit] = useState(getDynamicPageLimit);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const handleResize = () => setPageLimit(getDynamicPageLimit());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset to page 1 if project list length changes
  useEffect(() => {
    setCurrentPage(1);
  }, [projects.length]);

  const totalPages = Math.ceil(projects.length / pageLimit) || 1;
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageLimit;
    return projects.slice(start, start + pageLimit);
  }, [projects, currentPage, pageLimit]);

  const paginationData = {
    page: currentPage,
    total: projects.length,
    totalPages,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="py-2.5 px-4 text-xs w-[30%]">Project Boards</TableHead>
              <TableHead className="py-2.5 px-4 text-xs w-[12%]">Status</TableHead>
              <TableHead className="py-2.5 px-4 text-xs w-[22%]">Progress</TableHead>
              <TableHead className="py-2.5 px-4 text-xs w-[13%]">In Progress</TableHead>
              <TableHead className="py-2.5 px-4 text-xs w-[13%]">Completed</TableHead>
              <TableHead className="py-2.5 px-4 text-xs w-[10%]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {paginatedProjects.map((project) => {
          const isBlocked = project.status?.includes('Blocked');
          
          // Match tasks for this project
          const projectTasks = (allTasks || []).filter(
            (t) => t.project_id === project.id || t.project_name === project.name
          );
          const inProgressTasks = projectTasks.filter((t) => t.status === 'In Progress');
          const completedTasks = projectTasks.filter((t) => t.status === 'Completed');
          const inProgressCount = inProgressTasks.length;
          const completedCount = completedTasks.length;
          const totalTasks = projectTasks.length;
          const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

          return (
            <TableRow key={project.id} className={cn("group hover:bg-slate-50/70 transition-colors", isBlocked ? "bg-rose-50/20" : "")}>
              {/* Column 1: Project Boards */}
              <TableCell className="py-2.5 px-4">
                <div 
                  className="font-semibold text-sm text-slate-900 hover:text-blue-600 cursor-pointer transition-colors"
                  onClick={() => handleViewTasks(project)}
                >
                  {project.name}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {project.tech_stack || 'Standard Pipeline'}
                </div>
              </TableCell>

              {/* Column 2: Status (Active / Blocked) */}
              <TableCell className="py-2.5 px-4">
                {isBlocked ? (
                  <Badge variant="destructive" className="flex items-center w-fit gap-1 text-[11px] font-semibold text-rose-600 px-2 py-0.5">
                    <AlertCircle className="w-3 h-3" />
                    {project.status}
                  </Badge>
                ) : (
                  <Badge variant="success" className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 inline-block" />
                    Active
                  </Badge>
                )}
              </TableCell>

              {/* Column 3: Live Progress (No Points) */}
              <TableCell className="py-2.5 px-4">
                <div className="flex flex-col gap-1 w-full max-w-[240px]">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-800">{progressPercent}%</span>
                    <span className="text-slate-400 font-medium">{completedCount}/{totalTasks} tasks</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        progressPercent === 100 ? "bg-emerald-500" : progressPercent > 0 ? "bg-blue-600" : "bg-slate-200"
                      )} 
                      style={{ width: `${progressPercent}%` }} 
                    />
                  </div>
                </div>
              </TableCell>

              {/* Column 4: In Progress Count */}
              <TableCell className="py-2.5 px-4">
                {inProgressCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    {inProgressCount} In Progress
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 font-normal">0 active</span>
                )}
              </TableCell>

              {/* Column 4: Completed Count */}
              <TableCell className="py-2.5 px-4">
                {completedCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {completedCount} Completed
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 font-normal">0 done</span>
                )}
              </TableCell>

              {/* Column 5: Actions */}
              <TableCell className="py-2.5 px-4">
                <div className="flex justify-start gap-1.5">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-7 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 px-2.5"
                    onClick={() => handleViewTasks(project)}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 mr-1" />
                    Open Board
                  </Button>
                  {canCreate && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className={cn(
                        "h-7 text-xs font-semibold px-2.5",
                        isBlocked ? "text-rose-500 hover:bg-rose-50 cursor-not-allowed" : "text-primary-600 hover:bg-primary-50"
                      )}
                      onClick={() => handleCreateTask(project)}
                      disabled={isBlocked}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      {isBlocked ? "Blocked" : "Add Task"}
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
        {projects.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="p-12 text-center text-slate-400 text-xs">
              No project boards found.
            </TableCell>
          </TableRow>
        )}
      </tbody>
    </Table>
  </div>

  {/* Pagination Footer Controls */}
  {projects.length > 0 && (
    <PaginationControls
      pagination={paginationData}
      itemCount={paginatedProjects.length}
      onPrevious={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
      onNext={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
      className="border-t border-slate-100 bg-white"
    />
  )}
</div>
);
};

export default GlobalBoardsTab;
