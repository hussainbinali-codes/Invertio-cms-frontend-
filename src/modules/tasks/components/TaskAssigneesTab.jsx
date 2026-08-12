import React, { useState, useMemo, useEffect } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import PaginationControls from '../../../components/ui/PaginationControls';
import { CheckCircle2, Calendar, CheckSquare, User, Clock } from 'lucide-react';

const PAGE_LIMIT = 20;

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
  const [currentPage, setCurrentPage] = useState(1);
  const [filterAssignedTo, setFilterAssignedTo] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateOperator, setFilterDateOperator] = useState('='); // '=', '<', '>'
  const [filterDueDate, setFilterDueDate] = useState('');

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterAssignedTo, filterPriority, filterStatus, filterDueDate, filterDateOperator]);

  // Extract unique values for filters
  const uniqueAssignees = useMemo(() => {
    return [...new Set(tasks.map(t => t.assigned_to_name).filter(Boolean))].sort((a, b) => a.localeCompare(b));
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

    // Group users together (alphabetically by assignee name), then sort by project name
    return result.sort((a, b) => {
      const userA = (a.assigned_to_name || 'Unassigned').toLowerCase();
      const userB = (b.assigned_to_name || 'Unassigned').toLowerCase();
      if (userA !== userB) return userA.localeCompare(userB);

      const projA = (a.project_name || '').toLowerCase();
      const projB = (b.project_name || '').toLowerCase();
      return projA.localeCompare(projB);
    });
  }, [tasks, filterAssignedTo, filterPriority, filterStatus, filterDueDate, filterDateOperator]);

  // Paginated tasks slice for limit 20
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_LIMIT;
    return filteredTasks.slice(start, start + PAGE_LIMIT);
  }, [filteredTasks, currentPage]);

  const paginationData = useMemo(() => {
    const total = filteredTasks.length;
    const totalPages = Math.ceil(total / PAGE_LIMIT) || 1;
    return {
      page: currentPage,
      limit: PAGE_LIMIT,
      total,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
    };
  }, [filteredTasks.length, currentPage]);

  return (
    <div className="w-full overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm">
      {/* Top Filter Bar */}
      <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

          {(filterAssignedTo || filterPriority || filterStatus || filterDueDate) && (
            <button
              onClick={() => {
                setFilterAssignedTo("");
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
      <Table className="w-full table-fixed border-collapse">
        <TableHeader>
          <TableRow className="bg-slate-50/50 border-b border-slate-200">
            <TableHead className="px-3 py-3 font-bold text-[11px] text-slate-700 uppercase tracking-tight w-[28%]">
              TASK DETAILS
            </TableHead>
            <TableHead className="px-2 py-3 font-bold text-[11px] text-slate-700 uppercase tracking-tight w-[12%]">
              PROJECT
            </TableHead>
            <TableHead className="px-2 py-3 font-bold text-[11px] text-slate-700 uppercase tracking-tight w-[15%]">
              ASSIGNEE
            </TableHead>
            <TableHead className="px-2 py-3 font-bold text-[11px] text-slate-700 uppercase tracking-tight w-[12%]">
              PRIORITY
            </TableHead>
            <TableHead className="px-2 py-3 font-bold text-[11px] text-slate-700 uppercase tracking-tight w-[12%]">
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
                <Badge variant="secondary" className="text-[10px] font-bold truncate max-w-full block">{task.project_name}</Badge>
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
              <TableCell colSpan={7} className="p-10 text-center">
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
