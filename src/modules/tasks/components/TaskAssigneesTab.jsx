import React, { useState, useMemo, useEffect } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import PaginationControls from '../../../components/ui/PaginationControls';
import { CheckCircle2, Calendar, CheckSquare, User, Clock } from 'lucide-react';

const getDynamicPageLimit = () => {
  if (typeof window === 'undefined') return 5;
  const h = window.innerHeight;
  if (h < 750) return 4;
  if (h < 850) return 5;
  if (h < 950) return 6;
  return 7;
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const TaskAssigneesTab = ({ tasks, setSelectedTaskDetail }) => {
  const [pageLimit, setPageLimit] = useState(getDynamicPageLimit);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterAssignedTo, setFilterAssignedTo] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateOperator, setFilterDateOperator] = useState('='); // '=', '<', '>'
  const [filterDueDate, setFilterDueDate] = useState('');

  useEffect(() => {
    const handleResize = () => setPageLimit(getDynamicPageLimit());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterAssignedTo, filterClient, filterPriority, filterStatus, filterDueDate, filterDateOperator]);

  // Extract unique values for filters
  const uniqueAssignees = useMemo(() => {
    return [...new Set(tasks.map(t => t.assigned_to_name).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const uniqueClients = useMemo(() => {
    return [...new Set(tasks.map(t => t.client_name).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const uniquePriorities = useMemo(() => {
    return [...new Set(tasks.map(t => t.priority).filter(Boolean))];
  }, [tasks]);

  const uniqueStatuses = useMemo(() => {
    return [...new Set(tasks.map(t => t.status).filter(Boolean))];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const result = tasks.filter(task => {
      if (filterAssignedTo && task.assigned_to_name !== filterAssignedTo) return false;
      if (filterClient && task.client_name !== filterClient) return false;
      if (filterPriority && task.priority !== filterPriority) return false;
      if (filterStatus && task.status !== filterStatus) return false;

      if (filterDueDate) {
        if (!task.due_date) return false;
        const taskDateStr = new Date(task.due_date).toISOString().split('T')[0];
        if (filterDateOperator === '=' && taskDateStr !== filterDueDate) return false;
        if (filterDateOperator === '<' && taskDateStr >= filterDueDate) return false;
        if (filterDateOperator === '>' && taskDateStr <= filterDueDate) return false;
      }
      return true;
    });

    return result;
  }, [tasks, filterAssignedTo, filterPriority, filterStatus, filterDueDate, filterDateOperator]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredTasks.length / pageLimit) || 1;
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageLimit;
    return filteredTasks.slice(start, start + pageLimit);
  }, [filteredTasks, currentPage, pageLimit]);

  const paginationData = {
    page: currentPage,
    total: filteredTasks.length,
    totalPages,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages
  };

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col justify-between overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm">
      {/* Top Filter Bar */}
      <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          {/* Assignee Filter */}
          <select
            value={filterAssignedTo}
            onChange={(e) => setFilterAssignedTo(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-slate-700 shadow-sm"
          >
            <option value="">All Assignees</option>
            {uniqueAssignees.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          {/* Client Filter */}
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-slate-700 shadow-sm"
          >
            <option value="">All Clients</option>
            {uniqueClients.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-slate-700 shadow-sm"
          >
            <option value="">All Priorities</option>
            {uniquePriorities.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-slate-700 shadow-sm"
          >
            <option value="">All Statuses</option>
            {uniqueStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Due Date Filter */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 border border-slate-200 rounded-lg text-xs shadow-sm">
            <span className="text-slate-400 font-semibold text-[11px]">Due:</span>
            <select
              value={filterDateOperator}
              onChange={(e) => setFilterDateOperator(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="=">=</option>
              <option value="<">&lt;</option>
              <option value=">">&gt;</option>
            </select>
            <input
              type="date"
              value={filterDueDate}
              onChange={(e) => setFilterDueDate(e.target.value)}
              className="text-xs text-slate-700 focus:outline-none bg-transparent"
            />
            {filterDueDate && (
              <button
                onClick={() => setFilterDueDate("")}
                className="text-rose-500 font-bold hover:bg-rose-50 px-1 rounded text-xs"
              >
                ×
              </button>
            )}
          </div>

          {(filterAssignedTo || filterClient || filterPriority || filterStatus || filterDueDate) && (
            <button
              onClick={() => {
                setFilterAssignedTo("");
                setFilterClient("");
                setFilterPriority("");
                setFilterStatus("");
                setFilterDueDate("");
              }}
              className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
          Showing <strong>{filteredTasks.length}</strong> of <strong>{tasks.length}</strong> tasks
        </span>
      </div>

      {/* Table Section - Clean Column Headers Layout */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <Table className="w-full table-fixed border-collapse">
        <TableHeader>
          <TableRow className="bg-slate-50/50 border-b border-slate-200">
            <TableHead className="px-3 py-3 font-bold text-[11px] text-slate-700 uppercase tracking-tight w-[23%]">
              TASK DETAILS
            </TableHead>
            <TableHead className="px-2 py-3 font-bold text-[11px] text-slate-700 uppercase tracking-tight w-[11%]">
              CLIENT
            </TableHead>
            <TableHead className="px-2 py-3 font-bold text-[11px] text-slate-700 uppercase tracking-tight w-[11%]">
              PROJECT
            </TableHead>
            <TableHead className="px-2 py-3 font-bold text-[11px] text-slate-700 uppercase tracking-tight w-[13%]">
              ASSIGNEE
            </TableHead>
            <TableHead className="px-2 py-3 font-bold text-[11px] text-slate-700 uppercase tracking-tight w-[10%]">
              PRIORITY
            </TableHead>
            <TableHead className="px-2 py-3 font-bold text-[11px] text-slate-700 uppercase tracking-tight w-[11%]">
              STATUS
            </TableHead>
            <TableHead className="px-2 py-3 font-bold text-[11px] text-slate-700 uppercase tracking-tight w-[11%]">
              DUE DATE
            </TableHead>
            <TableHead className="px-2 py-3 font-bold text-[11px] text-slate-700 uppercase tracking-tight w-[10%]">
              UPDATED
            </TableHead>
          </TableRow>
        </TableHeader>
        <tbody>
          {paginatedTasks.map((task) => (
            <TableRow key={task.id} className="group hover:bg-slate-50/50">
              {/* Task Details - Receives largest space */}
              <TableCell 
                className="px-3 py-3 cursor-pointer hover:bg-slate-50 transition-colors whitespace-normal"
                onClick={() => setSelectedTaskDetail?.(task)}
              >
                <div className="font-bold text-xs text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1">{task.title}</div>
                <div className="text-[10px] text-slate-400 line-clamp-1 font-medium italic">{task.description || 'No description'}</div>
              </TableCell>
              <TableCell className="px-2 py-3 truncate">
                {task.client_name ? (
                  <span 
                    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 max-w-full truncate"
                    title={task.client_name}
                  >
                    {task.client_name}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Internal</span>
                )}
              </TableCell>
              <TableCell className="px-2 py-3 truncate">
                <Badge variant="secondary" className="text-[10px] font-bold truncate max-w-full block" title={task.project_name}>{task.project_name}</Badge>
              </TableCell>
              <TableCell className="px-1.5 py-3 truncate">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <User className="w-2.5 h-2.5 text-slate-500" />
                  </div>
                  <div className="text-[10px] font-bold text-slate-700 truncate">
                    {task.assigned_to_name || 'Unassigned'}
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-1.5 py-3">
                <Badge 
                  variant={
                    task.priority === 'Urgent' ? 'default' : 
                    task.priority === 'High' ? 'warning' : 
                    task.priority === 'Medium' ? 'primary' : 
                    'secondary'
                  }
                  className={
                    task.priority === 'Urgent'
                      ? 'text-[9px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5'
                      : 'text-[9px] font-bold px-1.5 py-0.5'
                  }
                >
                  {task.priority || 'Medium'}
                </Badge>
              </TableCell>
              <TableCell className="px-1.5 py-3">
                <Badge 
                  variant={
                    task.status === 'Completed' ? 'success' : 
                    task.status === 'In Progress' ? 'primary' : 
                    'secondary'
                  } 
                  className="text-[10px] font-semibold text-slate-600 px-1.5 py-0.5 truncate"
                >
                  {task.status || 'Pending'}
                </Badge>
              </TableCell>
              <TableCell className="px-1.5 py-3">
                <div className="flex items-center gap-1 text-slate-500 min-w-0">
                  <Calendar className="w-3 h-3 shrink-0" />
                  <span className="text-[10px] font-semibold text-slate-600 tracking-tight truncate">
                    {task.due_date ? new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Flexible'}
                  </span>
                </div>
              </TableCell>
              <TableCell className="px-2 py-3">
                <div className="flex items-center gap-1 text-slate-500 min-w-0">
                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-[10px] font-medium text-slate-600 tracking-tight truncate">
                    {formatDateTime(task.updated_at || task.created_at)}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {filteredTasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="p-10 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center">
                    <CheckSquare className="w-5 h-5 text-slate-300" />
                  </div>
                  <h3 className="text-xs font-semibold text-slate-900">No tasks found!</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Try adjusting your filters.</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </tbody>
      </Table>
    </div>

      {/* Pagination Footer Controls */}
      {filteredTasks.length > 0 && (
        <PaginationControls
          pagination={paginationData}
          itemCount={paginatedTasks.length}
          onPrevious={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          onNext={() => setCurrentPage(prev => Math.min(paginationData.totalPages, prev + 1))}
        />
      )}
    </div>
  );
};

export default TaskAssigneesTab;
