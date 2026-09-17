import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import PaginationControls from '../../../components/ui/PaginationControls';
import { TrendingUp, CheckCircle2, Calendar, CheckSquare, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
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

const MyPipelineTab = ({
  tasks = [],
  handleUpdateTask,
  updatingTaskId,
  setSelectedTaskDetail
}) => {
  const [pageLimit, setPageLimit] = useState(getDynamicPageLimit);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('due_date');
  const [sortDirection, setSortDirection] = useState('asc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterBtnRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownCoords, setDropdownCoords] = useState(null);

  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isPriorityFilterOpen, setIsPriorityFilterOpen] = useState(false);
  const priorityFilterBtnRef = useRef(null);
  const priorityDropdownRef = useRef(null);
  const [priorityDropdownCoords, setPriorityDropdownCoords] = useState(null);

  const [projectFilter, setProjectFilter] = useState('all');
  const [isProjectFilterOpen, setIsProjectFilterOpen] = useState(false);
  const projectFilterBtnRef = useRef(null);
  const projectDropdownRef = useRef(null);
  const [projectDropdownCoords, setProjectDropdownCoords] = useState(null);

  useEffect(() => {
    if (!isFilterOpen) return;

    const updatePosition = () => {
      if (!filterBtnRef.current) return;
      const rect = filterBtnRef.current.getBoundingClientRect();
      const menuWidth = 180;
      let left = rect.left + rect.width / 2 - menuWidth / 2;
      if (left + menuWidth > window.innerWidth - 12) {
        left = window.innerWidth - menuWidth - 12;
      }
      if (left < 12) {
        left = 12;
      }

      setDropdownCoords({
        top: rect.bottom + 6,
        left: left,
      });
    };

    updatePosition();

    const handleOutsideClick = (e) => {
      if (
        (filterBtnRef.current && filterBtnRef.current.contains(e.target)) ||
        (dropdownRef.current && dropdownRef.current.contains(e.target))
      ) {
        return;
      }
      setIsFilterOpen(false);
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isFilterOpen]);

  useEffect(() => {
    if (!isPriorityFilterOpen) return;

    const updatePosition = () => {
      if (!priorityFilterBtnRef.current) return;
      const rect = priorityFilterBtnRef.current.getBoundingClientRect();
      const menuWidth = 180;
      let left = rect.left + rect.width / 2 - menuWidth / 2;
      if (left + menuWidth > window.innerWidth - 12) {
        left = window.innerWidth - menuWidth - 12;
      }
      if (left < 12) {
        left = 12;
      }

      setPriorityDropdownCoords({
        top: rect.bottom + 6,
        left: left,
      });
    };

    updatePosition();

    const handleOutsideClick = (e) => {
      if (
        (priorityFilterBtnRef.current && priorityFilterBtnRef.current.contains(e.target)) ||
        (priorityDropdownRef.current && priorityDropdownRef.current.contains(e.target))
      ) {
        return;
      }
      setIsPriorityFilterOpen(false);
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isPriorityFilterOpen]);

  useEffect(() => {
    if (!isProjectFilterOpen) return;

    const updatePosition = () => {
      if (!projectFilterBtnRef.current) return;
      const rect = projectFilterBtnRef.current.getBoundingClientRect();
      const menuWidth = 200;
      let left = rect.left + rect.width / 2 - menuWidth / 2;
      if (left + menuWidth > window.innerWidth - 12) {
        left = window.innerWidth - menuWidth - 12;
      }
      if (left < 12) {
        left = 12;
      }

      setProjectDropdownCoords({
        top: rect.bottom + 6,
        left: left,
      });
    };

    updatePosition();

    const handleOutsideClick = (e) => {
      if (
        (projectFilterBtnRef.current && projectFilterBtnRef.current.contains(e.target)) ||
        (projectDropdownRef.current && projectDropdownRef.current.contains(e.target))
      ) {
        return;
      }
      setIsProjectFilterOpen(false);
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isProjectFilterOpen]);

  useEffect(() => {
    const handleResize = () => setPageLimit(getDynamicPageLimit());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset to page 1 if tasks count changes
  useEffect(() => {
    setCurrentPage(1);
  }, [tasks.length]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover/th:text-slate-500 transition-colors inline ml-1.5 shrink-0" />
      );
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-600 inline ml-1.5 shrink-0" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600 inline ml-1.5 shrink-0" />
    );
  };

  const statusCounts = useMemo(() => {
    return {
      all: tasks.length,
      in_progress: tasks.filter((t) => t.status === 'In Progress').length,
      pending: tasks.filter((t) => t.status === 'Pending' || t.status === 'Yet to Start' || t.status === 'To Do').length,
      completed: tasks.filter((t) => t.status === 'Completed').length,
      cancelled: tasks.filter((t) => t.status === 'Cancelled').length,
    };
  }, [tasks]);

  const statusOptions = [
    { label: 'All Statuses', value: 'all', count: statusCounts.all, dotColor: 'bg-slate-400' },
    { label: 'In Progress', value: 'In Progress', count: statusCounts.in_progress, dotColor: 'bg-blue-500' },
    { label: 'Pending', value: 'Pending', count: statusCounts.pending, dotColor: 'bg-amber-500' },
    { label: 'Completed', value: 'Completed', count: statusCounts.completed, dotColor: 'bg-emerald-500' },
    { label: 'Cancelled', value: 'Cancelled', count: statusCounts.cancelled, dotColor: 'bg-rose-500' },
  ];

  const priorityCounts = useMemo(() => {
    return {
      all: tasks.length,
      urgent: tasks.filter((t) => t.priority === 'Urgent').length,
      high: tasks.filter((t) => t.priority === 'High').length,
      medium: tasks.filter((t) => (t.priority === 'Medium' || !t.priority)).length,
      low: tasks.filter((t) => t.priority === 'Low').length,
    };
  }, [tasks]);

  const priorityOptions = [
    { label: 'All Priorities', value: 'all', count: priorityCounts.all, dotColor: 'bg-slate-400' },
    { label: 'Urgent', value: 'Urgent', count: priorityCounts.urgent, dotColor: 'bg-rose-500' },
    { label: 'High', value: 'High', count: priorityCounts.high, dotColor: 'bg-amber-500' },
    { label: 'Medium', value: 'Medium', count: priorityCounts.medium, dotColor: 'bg-blue-500' },
    { label: 'Low', value: 'Low', count: priorityCounts.low, dotColor: 'bg-slate-400' },
  ];

  const projectOptions = useMemo(() => {
    const map = new Map();
    tasks.forEach((t) => {
      const name = t.project_name || 'Internal';
      map.set(name, (map.get(name) || 0) + 1);
    });

    const projectList = Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({
        label: name,
        value: name,
        count,
        dotColor: 'bg-indigo-500',
      }));

    return [
      { label: 'All Projects', value: 'all', count: tasks.length, dotColor: 'bg-slate-400' },
      ...projectList,
    ];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Project filter
      if (projectFilter !== 'all') {
        const pName = task.project_name || 'Internal';
        if (pName !== projectFilter) return false;
      }

      // Priority filter
      if (priorityFilter !== 'all') {
        const p = task.priority || 'Medium';
        if (p !== priorityFilter) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'Pending') {
          const isPending = task.status === 'Pending' || task.status === 'Yet to Start' || task.status === 'To Do';
          if (!isPending) return false;
        } else if (task.status !== statusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, projectFilter, priorityFilter, statusFilter]);

  const sortedTasks = useMemo(() => {
    if (!sortField) return filteredTasks;

    return [...filteredTasks].sort((a, b) => {
      if (sortField === 'due_date') {
        const timeA = a.due_date ? new Date(a.due_date).getTime() : null;
        const timeB = b.due_date ? new Date(b.due_date).getTime() : null;

        // Keep tasks without dates at the bottom
        if (timeA === null && timeB === null) return 0;
        if (timeA === null) return 1;
        if (timeB === null) return -1;

        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      }
      return 0;
    });
  }, [filteredTasks, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedTasks.length / pageLimit) || 1;
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageLimit;
    return sortedTasks.slice(start, start + pageLimit);
  }, [sortedTasks, currentPage, pageLimit]);

  const paginationData = {
    page: currentPage,
    total: sortedTasks.length,
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
              <TableHead className="py-2 sm:py-2.5 px-4 text-[11px] sm:text-[11px] w-[35%] max-w-[240px] sm:max-w-[300px] md:max-w-[360px]">Task Details</TableHead>
              <TableHead className="py-2 sm:py-2.5 px-4 text-[11px] sm:text-[11px] text-center w-[12%]">Client</TableHead>
              <TableHead className="py-2 sm:py-2.5 px-4 text-[11px] sm:text-[11px] text-center w-[15%] select-none">
                <div className="flex items-center justify-center gap-1.5">
                  <span>Project</span>
                  <button
                    ref={projectFilterBtnRef}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsProjectFilterOpen((prev) => !prev);
                      setIsPriorityFilterOpen(false);
                      setIsFilterOpen(false);
                    }}
                    className={cn(
                      "p-1 rounded-md transition-all flex items-center gap-1 cursor-pointer",
                      projectFilter !== 'all'
                        ? "bg-blue-50 text-blue-600 ring-1 ring-blue-300"
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    )}
                    title={projectFilter !== 'all' ? `Filtered by ${projectFilter} (Click to change)` : "Filter tasks by project"}
                  >
                    <Filter className="w-3 h-3" />
                    {projectFilter !== 'all' && (
                      <span className="text-[10px] font-bold max-w-[55px] truncate">
                        {projectFilter}
                      </span>
                    )}
                  </button>
                </div>
              </TableHead>
              <TableHead className="py-2 sm:py-2.5 px-4 text-[11px] sm:text-[11px] text-center w-[13%] select-none">
                <div className="flex items-center justify-center gap-1.5">
                  <span>Priority</span>
                  <button
                    ref={priorityFilterBtnRef}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPriorityFilterOpen((prev) => !prev);
                      setIsProjectFilterOpen(false);
                      setIsFilterOpen(false);
                    }}
                    className={cn(
                      "p-1 rounded-md transition-all flex items-center gap-1 cursor-pointer",
                      priorityFilter !== 'all'
                        ? "bg-blue-50 text-blue-600 ring-1 ring-blue-300"
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    )}
                    title={priorityFilter !== 'all' ? `Filtered by ${priorityFilter} (Click to change)` : "Filter tasks by priority"}
                  >
                    <Filter className="w-3 h-3" />
                    {priorityFilter !== 'all' && (
                      <span className="text-[10px] font-bold max-w-[55px] truncate">
                        {priorityFilter}
                      </span>
                    )}
                  </button>
                </div>
              </TableHead>
              <TableHead className="py-2 sm:py-2.5 px-4 text-[11px] sm:text-[11px] text-center w-[13%] select-none">
                <div className="flex items-center justify-center gap-1.5">
                  <span>Status</span>
                  <button
                    ref={filterBtnRef}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFilterOpen((prev) => !prev);
                      setIsPriorityFilterOpen(false);
                      setIsProjectFilterOpen(false);
                    }}
                    className={cn(
                      "p-1 rounded-md transition-all flex items-center gap-1 cursor-pointer",
                      statusFilter !== 'all'
                        ? "bg-blue-50 text-blue-600 ring-1 ring-blue-300"
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    )}
                    title={statusFilter !== 'all' ? `Filtered by ${statusFilter} (Click to change)` : "Filter tasks by status"}
                  >
                    <Filter className="w-3 h-3" />
                    {statusFilter !== 'all' && (
                      <span className="text-[10px] font-bold max-w-[55px] truncate">
                        {statusFilter}
                      </span>
                    )}
                  </button>
                </div>
              </TableHead>
              <TableHead 
                className="py-2 sm:py-2.5 px-4 text-[11px] sm:text-[11px] text-center w-[12%] cursor-pointer select-none hover:bg-slate-100/70 transition-colors group/th"
                onClick={() => handleSort('due_date')}
                title="Sort by Due Date"
              >
                <div className="flex items-center justify-center">
                  <span>Due Date</span>
                  {renderSortIcon('due_date')}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {paginatedTasks.map((task) => (
              <TableRow key={task.id} className="group hover:bg-slate-50/60 transition-colors">
                {/* Column 1: Task Details (Title & Description Truncated) */}
                <TableCell
                  className="py-2.5 sm:py-3 px-4 max-w-[200px] sm:max-w-[280px] md:max-w-[340px] lg:max-w-[420px] overflow-hidden cursor-pointer hover:bg-slate-50/80 transition-colors"
                  onClick={() => setSelectedTaskDetail(task)}
                  title="Click to view full task details"
                >
                  <div className="font-semibold text-sm text-slate-800 group-hover:text-blue-600 transition-colors truncate" title={task.title}>
                    {task.title}
                  </div>
                  <div className="text-xs text-slate-400 truncate mt-0.5" title={task.description || 'No description'}>
                    {task.description || 'No description'}
                  </div>
                </TableCell>

                {/* Column 2: Client */}
                <TableCell className="py-2.5 sm:py-3 px-4 text-center">
                  <div className="flex justify-center">
                    {task.client_name ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 truncate max-w-[130px]" title={task.client_name}>
                        {task.client_name}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Internal</span>
                    )}
                  </div>
                </TableCell>

                {/* Column 3: Project */}
                <TableCell className="py-2.5 sm:py-3 px-4 text-center">
                  <div className="flex justify-center">
                    <Badge variant="secondary" className="text-xs font-medium truncate max-w-[140px]" title={task.project_name}>
                      {task.project_name}
                    </Badge>
                  </div>
                </TableCell>

                {/* Column 4: Priority */}
                <TableCell className="py-2.5 sm:py-3 px-4 text-center">
                  <div className="flex justify-center">
                    <Badge
                      variant={
                        task.priority === 'Urgent' ? 'default' :
                          task.priority === 'High' ? 'warning' :
                            task.priority === 'Medium' ? 'primary' :
                              'secondary'
                      }
                      className={
                        task.priority === 'Urgent'
                          ? 'text-xs font-medium bg-rose-100 text-rose-700 border-none'
                          : 'text-xs font-medium border-none'
                      }
                    >
                      {task.priority || 'Medium'}
                    </Badge>
                  </div>
                </TableCell>

                {/* Column 5: Status & Action Button */}
                <TableCell className="py-2.5 sm:py-3 px-4 text-center">
                  <div className="flex justify-center">
                    {(task.status === 'Pending' || task.status === 'Yet to Start' || task.status === 'To Do') && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs font-medium text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => handleUpdateTask(task.id, { status: 'In Progress' })}
                        disabled={updatingTaskId === task.id}
                      >
                        <TrendingUp className="w-3 h-3 mr-1" /> Start Progress
                      </Button>
                    )}
                    {task.status === 'In Progress' && (
                      <Button
                        size="sm"
                        className="h-7 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleUpdateTask(task.id, { status: 'Completed' })}
                        disabled={updatingTaskId === task.id}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Mark as Complete
                      </Button>
                    )}
                    {task.status === 'Completed' && (
                      <Badge variant="success" className="text-xs font-medium flex items-center gap-1 w-fit border-none">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </Badge>
                    )}
                    {task.status === 'Cancelled' && (
                      <Badge variant="danger" className="text-xs font-medium flex items-center gap-1 w-fit border-none">
                        Cancelled
                      </Badge>
                    )}
                  </div>
                </TableCell>

                {/* Column 6: Due Date */}
                <TableCell className="py-2.5 sm:py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-xs font-normal">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Flexible'}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {tasks.length > 0 && filteredTasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="p-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                      <CheckSquare className="w-6 h-6 text-slate-200" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800">No matching tasks found</h3>
                    <p className="text-xs text-slate-400 font-normal">
                      No tasks matched your active filter criteria.
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
                      {projectFilter !== 'all' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs font-semibold cursor-pointer"
                          onClick={() => {
                            setProjectFilter('all');
                            setCurrentPage(1);
                          }}
                        >
                          Clear Project ({projectFilter})
                        </Button>
                      )}
                      {priorityFilter !== 'all' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs font-semibold cursor-pointer"
                          onClick={() => {
                            setPriorityFilter('all');
                            setCurrentPage(1);
                          }}
                        >
                          Clear Priority ({priorityFilter})
                        </Button>
                      )}
                      {statusFilter !== 'all' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs font-semibold cursor-pointer"
                          onClick={() => {
                            setStatusFilter('all');
                            setCurrentPage(1);
                          }}
                        >
                          Clear Status ({statusFilter})
                        </Button>
                      )}
                      {(statusFilter !== 'all' || priorityFilter !== 'all' || projectFilter !== 'all') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                          onClick={() => {
                            setStatusFilter('all');
                            setPriorityFilter('all');
                            setProjectFilter('all');
                            setCurrentPage(1);
                          }}
                        >
                          Reset All
                        </Button>
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {tasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="p-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                      <CheckSquare className="w-6 h-6 text-slate-200" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800">All caught up!</h3>
                    <p className="text-xs text-slate-400 font-normal">No tasks are currently assigned to you.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </tbody>
        </Table>
      </div>

  {/* Pagination Footer Controls */}
  {tasks.length > 0 && (
    <PaginationControls
      pagination={paginationData}
      itemCount={paginatedTasks.length}
      onPrevious={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
      onNext={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
      hideRecordsText
      className="border-t border-slate-100 bg-white"
    />
  )}

  {/* Portal Dropdown for Status Filter: completely outside scroll containers, zero clipping */}
  {isFilterOpen && dropdownCoords && createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: `${dropdownCoords.top}px`,
        left: `${dropdownCoords.left}px`,
        width: '184px',
        zIndex: 9999,
      }}
      className="bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 text-left animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1 flex items-center justify-between">
        <span>Filter Status</span>
        {statusFilter !== 'all' && (
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setIsFilterOpen(false);
              setCurrentPage(1);
            }}
            className="text-blue-600 hover:text-blue-700 hover:underline capitalize text-[11px] font-semibold cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>
      {statusOptions.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => {
            setStatusFilter(opt.value);
            setIsFilterOpen(false);
            setCurrentPage(1);
          }}
          className={cn(
            "w-full px-3 py-1.5 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer",
            statusFilter === opt.value
              ? "bg-blue-50 text-blue-700 font-bold"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <div className="flex items-center gap-2">
            <span className={cn("w-1.5 h-1.5 rounded-full", opt.dotColor)} />
            <span>{opt.label}</span>
          </div>
          <span className={cn(
            "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
            statusFilter === opt.value ? "bg-blue-200/60 text-blue-800" : "bg-slate-100 text-slate-500"
          )}>
            {opt.count}
          </span>
        </button>
      ))}
    </div>,
    document.body
  )}

  {/* Portal Dropdown for Priority Filter: completely outside scroll containers, zero clipping */}
  {isPriorityFilterOpen && priorityDropdownCoords && createPortal(
    <div
      ref={priorityDropdownRef}
      style={{
        position: 'fixed',
        top: `${priorityDropdownCoords.top}px`,
        left: `${priorityDropdownCoords.left}px`,
        width: '184px',
        zIndex: 9999,
      }}
      className="bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 text-left animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1 flex items-center justify-between">
        <span>Filter Priority</span>
        {priorityFilter !== 'all' && (
          <button
            type="button"
            onClick={() => {
              setPriorityFilter('all');
              setIsPriorityFilterOpen(false);
              setCurrentPage(1);
            }}
            className="text-blue-600 hover:text-blue-700 hover:underline capitalize text-[11px] font-semibold cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>
      {priorityOptions.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => {
            setPriorityFilter(opt.value);
            setIsPriorityFilterOpen(false);
            setCurrentPage(1);
          }}
          className={cn(
            "w-full px-3 py-1.5 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer",
            priorityFilter === opt.value
              ? "bg-blue-50 text-blue-700 font-bold"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <div className="flex items-center gap-2">
            <span className={cn("w-1.5 h-1.5 rounded-full", opt.dotColor)} />
            <span>{opt.label}</span>
          </div>
          <span className={cn(
            "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
            priorityFilter === opt.value ? "bg-blue-200/60 text-blue-800" : "bg-slate-100 text-slate-500"
          )}>
            {opt.count}
          </span>
        </button>
      ))}
    </div>,
    document.body
  )}

  {/* Portal Dropdown for Project Filter: completely outside scroll containers, zero clipping */}
  {isProjectFilterOpen && projectDropdownCoords && createPortal(
    <div
      ref={projectDropdownRef}
      style={{
        position: 'fixed',
        top: `${projectDropdownCoords.top}px`,
        left: `${projectDropdownCoords.left}px`,
        width: '210px',
        zIndex: 9999,
      }}
      className="bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 text-left animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1 flex items-center justify-between">
        <span>Filter Project</span>
        {projectFilter !== 'all' && (
          <button
            type="button"
            onClick={() => {
              setProjectFilter('all');
              setIsProjectFilterOpen(false);
              setCurrentPage(1);
            }}
            className="text-blue-600 hover:text-blue-700 hover:underline capitalize text-[11px] font-semibold cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>
      <div className="max-h-56 overflow-y-auto custom-scrollbar">
        {projectOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              setProjectFilter(opt.value);
              setIsProjectFilterOpen(false);
              setCurrentPage(1);
            }}
            className={cn(
              "w-full px-3 py-1.5 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer",
              projectFilter === opt.value
                ? "bg-blue-50 text-blue-700 font-bold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <div className="flex items-center gap-2 truncate pr-2">
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", opt.dotColor)} />
              <span className="truncate" title={opt.label}>{opt.label}</span>
            </div>
            <span className={cn(
              "text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0",
              projectFilter === opt.value ? "bg-blue-200/60 text-blue-800" : "bg-slate-100 text-slate-500"
            )}>
              {opt.count}
            </span>
          </button>
        ))}
      </div>
    </div>,
    document.body
  )}
</div>
);
};

export default MyPipelineTab;
