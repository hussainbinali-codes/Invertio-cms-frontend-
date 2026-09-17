import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import PaginationControls from '../../../components/ui/PaginationControls';
import { Plus, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../../../utils/cn';

const getDynamicPageLimit = () => {
  if (typeof window === 'undefined') return 10;
  const h = window.innerHeight;
  if (h < 700) return 7;
  if (h < 800) return 9;
  if (h < 920) return 11;
  if (h < 1080) return 13;
  return 15;
};

const GlobalBoardsTab = ({
  projects = [],
  allTasks = [],
  canCreate,
  handleViewTasks,
  handleCreateTask,
  sortField: propSortField,
  setSortField: propSetSortField,
  sortDirection: propSortDirection,
  setSortDirection: propSetSortDirection
}) => {
  const [pageLimit, setPageLimit] = useState(getDynamicPageLimit);
  const [currentPage, setCurrentPage] = useState(1);
  const [internalSortField, setInternalSortField] = useState('name');
  const [internalSortDirection, setInternalSortDirection] = useState('asc'); // 'asc' | 'desc'

  const sortField = propSortField !== undefined ? propSortField : internalSortField;
  const setSortField = propSetSortField || setInternalSortField;
  const sortDirection = propSortDirection !== undefined ? propSortDirection : internalSortDirection;
  const setSortDirection = propSetSortDirection || setInternalSortDirection;

  useEffect(() => {
    const handleResize = () => setPageLimit(getDynamicPageLimit());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset to page 1 if project list length changes
  useEffect(() => {
    setCurrentPage(1);
  }, [projects.length]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover/th:text-slate-500 transition-colors inline ml-1.5 shrink-0" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-blue-600 inline ml-1.5 shrink-0" />
      : <ArrowDown className="w-3 h-3 text-blue-600 inline ml-1.5 shrink-0" />;
  };

  // Pre-enrich projects with calculated task metrics
  const enrichedProjects = useMemo(() => {
    return projects.map((project) => {
      const projectTasks = (allTasks || []).filter(
        (t) => t.project_id === project.id || t.project_name === project.name
      );
      const yetToStartTasks = projectTasks.filter(
        (t) => t.status !== 'In Progress' && t.status !== 'Completed' && t.status !== 'Cancelled'
      );
      const inProgressTasks = projectTasks.filter((t) => t.status === 'In Progress');
      const completedTasks = projectTasks.filter((t) => t.status === 'Completed');
      const yetToStartCount = yetToStartTasks.length;
      const inProgressCount = inProgressTasks.length;
      const completedCount = completedTasks.length;
      const totalTasks = projectTasks.length;
      const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
      const isBlocked = project.status?.includes('Blocked');

      return {
        ...project,
        yetToStartCount,
        inProgressCount,
        completedCount,
        totalTasks,
        progressPercent,
        isBlocked
      };
    });
  }, [projects, allTasks]);

  // Sort projects according to active field and direction
  const sortedProjects = useMemo(() => {
    if (!sortField) return enrichedProjects;

    return [...enrichedProjects].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string' || typeof bVal === 'string') {
        aVal = (aVal || '').toLowerCase();
        bVal = (bVal || '').toLowerCase();
        const cmp = aVal.localeCompare(bVal);
        return sortDirection === 'asc' ? cmp : -cmp;
      }

      // Numeric comparison
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [enrichedProjects, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedProjects.length / pageLimit) || 1;
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageLimit;
    return sortedProjects.slice(start, start + pageLimit);
  }, [sortedProjects, currentPage, pageLimit]);

  const paginationData = {
    page: currentPage,
    total: sortedProjects.length,
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
              <TableHead 
                className="py-2 sm:py-2.5 px-2.5 sm:px-3 text-[11px] sm:text-[11px] text-left w-[20%] cursor-pointer select-none hover:bg-slate-100/70 transition-colors group/th"
                onClick={() => handleSort('name')}
                title="Sort by Project Name"
              >
                <div className="flex items-center justify-start">
                  <span>Project Boards</span>
                  {renderSortIcon('name')}
                </div>
              </TableHead>
              <TableHead 
                className="py-2 sm:py-2.5 px-4 sm:px-5 text-[11px] sm:text-[11px] text-center w-[13%] cursor-pointer select-none hover:bg-slate-100/70 transition-colors group/th"
                onClick={() => handleSort('client_name')}
                title="Sort by Client"
              >
                <div className="flex items-center justify-center">
                  <span>Client</span>
                  {renderSortIcon('client_name')}
                </div>
              </TableHead>
              <TableHead 
                className="py-2 sm:py-2.5 px-4 sm:px-5 text-[11px] sm:text-[11px] text-center w-[10%] cursor-pointer select-none hover:bg-slate-100/70 transition-colors group/th"
                onClick={() => handleSort('status')}
                title="Sort by Status"
              >
                <div className="flex items-center justify-center">
                  <span>Status</span>
                  {renderSortIcon('status')}
                </div>
              </TableHead>
              <TableHead 
                className="py-2 sm:py-2.5 px-4 sm:px-5 text-[11px] sm:text-[11px] text-center w-[17%] cursor-pointer select-none hover:bg-slate-100/70 transition-colors group/th"
                onClick={() => handleSort('progressPercent')}
                title="Sort by Progress"
              >
                <div className="flex items-center justify-center">
                  <span>Progress</span>
                  {renderSortIcon('progressPercent')}
                </div>
              </TableHead>
              <TableHead 
                className="py-2 sm:py-2.5 px-4 sm:px-5 text-[11px] sm:text-[11px] text-center w-[10%] cursor-pointer select-none hover:bg-slate-100/70 transition-colors group/th"
                onClick={() => handleSort('yetToStartCount')}
                title="Sort by Yet to Start Tasks"
              >
                <div className="flex items-center justify-center">
                  <span>Yet to Start</span>
                  {renderSortIcon('yetToStartCount')}
                </div>
              </TableHead>
              <TableHead 
                className="py-2 sm:py-2.5 px-4 sm:px-5 text-[11px] sm:text-[11px] text-center w-[10%] cursor-pointer select-none hover:bg-slate-100/70 transition-colors group/th"
                onClick={() => handleSort('inProgressCount')}
                title="Sort by In Progress Tasks"
              >
                <div className="flex items-center justify-center">
                  <span>In Progress</span>
                  {renderSortIcon('inProgressCount')}
                </div>
              </TableHead>
              <TableHead 
                className="py-2 sm:py-2.5 px-4 sm:px-5 text-[11px] sm:text-[11px] text-center w-[10%] cursor-pointer select-none hover:bg-slate-100/70 transition-colors group/th"
                onClick={() => handleSort('completedCount')}
                title="Sort by Completed Tasks"
              >
                <div className="flex items-center justify-center">
                  <span>Completed</span>
                  {renderSortIcon('completedCount')}
                </div>
              </TableHead>
              <TableHead className="py-2 sm:py-2.5 px-4 sm:px-5 text-[11px] sm:text-[11px] text-center w-[10%]">
                <div className="flex items-center justify-center">
                  <span>Add Task</span>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {paginatedProjects.map((project) => {
              const { isBlocked, yetToStartCount, inProgressCount, completedCount, totalTasks, progressPercent } = project;

          return (
            <TableRow key={project.id} className={cn("group hover:bg-slate-50/70 transition-colors", isBlocked ? "bg-rose-50/20" : "")}>
              {/* Column 1: Project Boards */}
              <TableCell 
                className="py-2 sm:py-2.5 px-2.5 sm:px-3 text-left cursor-pointer group/cell select-none"
                onClick={() => handleViewTasks(project, 'all', 'all')}
                title="Click to open board (all tasks & team)"
              >
                <div className="flex flex-col items-start text-left w-full">
                  <div className="font-semibold text-sm text-slate-900 group-hover/cell:text-blue-600 transition-colors">
                    {project.name}
                  </div>
                  <div className="text-[11px] text-slate-500 group-hover/cell:text-slate-600 font-medium mt-0.5 transition-colors">
                    {project.tech_stack || 'Standard Pipeline'}
                  </div>
                </div>
              </TableCell>

              {/* Column 2: Client */}
              <TableCell className="py-2 sm:py-2.5 px-4 sm:px-5 text-center">
                <div className="flex justify-center">
                  {project.client_name ? (
                    <span 
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 truncate max-w-[140px]" 
                      title={project.client_name}
                    >
                      {project.client_name}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Internal</span>
                  )}
                </div>
              </TableCell>

              {/* Column 3: Status (Active / Blocked) */}
              <TableCell className="py-2 sm:py-2.5 px-4 sm:px-5 text-center">
                <div className="flex justify-center">
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
                </div>
              </TableCell>

              {/* Column 4: Live Progress (No Points) */}
              <TableCell className="py-2 sm:py-2.5 px-4 sm:px-5 text-center">
                <div className="flex flex-col gap-1 w-full max-w-[240px] mx-auto">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-800">{progressPercent}%</span>
                    <span className="text-slate-400 font-medium">{completedCount}/{totalTasks}</span>
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

              {/* Column 5: Yet to Start Count */}
              <TableCell className="py-2 sm:py-2.5 px-4 sm:px-5 text-center">
                <div className="flex justify-center">
                  {yetToStartCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => handleViewTasks(project, 'Yet to Start', 'me')}
                      className="min-w-[48px] h-7 px-3.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 hover:border-amber-300 border border-amber-200/80 rounded-full inline-flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-xs"
                      title={`Click to view your yet to start tasks (${yetToStartCount} in project)`}
                    >
                      {yetToStartCount}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleViewTasks(project, 'Yet to Start', 'me')}
                      className="min-w-[48px] h-7 px-3.5 text-xs font-semibold text-slate-400 bg-slate-50/70 hover:bg-slate-100 hover:text-slate-600 border border-slate-200/60 rounded-full inline-flex items-center justify-center cursor-pointer transition-colors"
                      title="View your yet to start tasks (0 in project)"
                    >
                      0
                    </button>
                  )}
                </div>
              </TableCell>

              {/* Column 6: In Progress Count */}
              <TableCell className="py-2 sm:py-2.5 px-4 sm:px-5 text-center">
                <div className="flex justify-center">
                  {inProgressCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => handleViewTasks(project, 'In Progress', 'me')}
                      className="min-w-[48px] h-7 px-3.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 border border-blue-200/80 rounded-full inline-flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-xs"
                      title={`Click to view your in-progress tasks (${inProgressCount} in project)`}
                    >
                      {inProgressCount}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleViewTasks(project, 'In Progress', 'me')}
                      className="min-w-[48px] h-7 px-3.5 text-xs font-semibold text-slate-400 bg-slate-50/70 hover:bg-slate-100 hover:text-slate-600 border border-slate-200/60 rounded-full inline-flex items-center justify-center cursor-pointer transition-colors"
                      title="View your in-progress tasks (0 in project)"
                    >
                      0
                    </button>
                  )}
                </div>
              </TableCell>

              {/* Column 7: Completed Count */}
              <TableCell className="py-2 sm:py-2.5 px-4 sm:px-5 text-center">
                <div className="flex justify-center">
                  {completedCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => handleViewTasks(project, 'Completed', 'me')}
                      className="min-w-[48px] h-7 px-3.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 border border-emerald-200/80 rounded-full inline-flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-xs"
                      title={`Click to view your completed tasks (${completedCount} in project)`}
                    >
                      {completedCount}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleViewTasks(project, 'Completed', 'me')}
                      className="min-w-[48px] h-7 px-3.5 text-xs font-semibold text-slate-400 bg-slate-50/70 hover:bg-slate-100 hover:text-slate-600 border border-slate-200/60 rounded-full inline-flex items-center justify-center cursor-pointer transition-colors"
                      title="View your completed tasks (0 in project)"
                    >
                      0
                    </button>
                  )}
                </div>
              </TableCell>

              {/* Column 8: Add Task */}
              <TableCell className="py-2 sm:py-2.5 px-4 sm:px-5 text-center">
                <div className="flex justify-center">
                  {canCreate && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className={cn(
                        "h-7 text-xs font-semibold px-2.5 border-blue-200 text-blue-600 hover:bg-blue-50 whitespace-nowrap",
                        isBlocked ? "text-rose-500 border-rose-200 hover:bg-rose-50 cursor-not-allowed" : ""
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
            <TableCell colSpan={8} className="p-12 text-center text-slate-400 text-xs">
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
      hideRecordsText
      className="border-t border-slate-100 bg-white"
    />
  )}
</div>
);
};

export default GlobalBoardsTab;
