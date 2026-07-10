import React, { useState, useMemo } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import { TrendingUp, CheckCircle2, Calendar, CheckSquare, Filter, User } from 'lucide-react';

const TaskAssigneesTab = ({ tasks, setSelectedTaskDetail }) => {
  const [filterAssignedTo, setFilterAssignedTo] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterPoints, setFilterPoints] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDueDate, setFilterDueDate] = useState('');

  // Extract unique values for filters
  const uniqueAssignees = [...new Set(tasks.map(t => t.assigned_to_name).filter(Boolean))];
  const uniquePriorities = [...new Set(tasks.map(t => t.priority).filter(Boolean))];
  const uniquePoints = [...new Set(tasks.map(t => t.story_points?.toString()).filter(Boolean))].sort((a, b) => Number(a) - Number(b));
  const uniqueStatuses = [...new Set(tasks.map(t => t.status).filter(Boolean))];

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filterAssignedTo && task.assigned_to_name !== filterAssignedTo) return false;
      if (filterPriority && task.priority !== filterPriority) return false;
      if (filterPoints && task.story_points?.toString() !== filterPoints) return false;
      if (filterStatus && task.status !== filterStatus) return false;
      if (filterDueDate) {
        if (!task.due_date) return false;
        const taskDate = new Date(task.due_date).toISOString().split('T')[0];
        if (taskDate !== filterDueDate) return false;
      }
      return true;
    });
  }, [tasks, filterAssignedTo, filterPriority, filterPoints, filterStatus, filterDueDate]);

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <div className="flex flex-wrap gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100 items-center">
        <div className="flex items-center gap-2 text-slate-500 font-medium text-xs uppercase tracking-wider mr-2">
          <Filter className="w-4 h-4" /> Filters
        </div>

        <select 
          className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          value={filterAssignedTo}
          onChange={(e) => setFilterAssignedTo(e.target.value)}
        >
          <option value="">All Assignees</option>
          {uniqueAssignees.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <select 
          className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
        >
          <option value="">All Priorities</option>
          {uniquePriorities.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select 
          className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          value={filterPoints}
          onChange={(e) => setFilterPoints(e.target.value)}
        >
          <option value="">All Points</option>
          {uniquePoints.map(p => <option key={p} value={p}>{p} pts</option>)}
        </select>

        <select 
          className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <div className="flex items-center gap-2">
          <input 
            type="date" 
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            value={filterDueDate}
            onChange={(e) => setFilterDueDate(e.target.value)}
          />
          {filterDueDate && (
            <button 
              onClick={() => setFilterDueDate('')}
              className="text-[10px] text-rose-500 font-bold hover:underline"
            >
              Clear Date
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="py-4">Task Details</TableHead>
            <TableHead className="py-4">Project</TableHead>
            <TableHead className="py-4">Assigned To</TableHead>
            <TableHead className="py-4">Priority</TableHead>
            <TableHead className="py-4">Story Points</TableHead>
            <TableHead className="py-4">Status</TableHead>
            <TableHead className="py-4">Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <tbody>
          {filteredTasks.map((task) => (
            <TableRow key={task.id} className="group">
              <TableCell 
                  className="py-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => setSelectedTaskDetail?.(task)}
              >
                <div className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{task.title}</div>
                <div className="text-[10px] text-slate-400 line-clamp-1 max-w-[200px] font-medium italic">{task.description || 'No description'}</div>
              </TableCell>
              <TableCell className="py-4">
                <Badge variant="secondary" className="text-[10px] font-bold">{task.project_name}</Badge>
              </TableCell>
              <TableCell className="py-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <User className="w-3 h-3 text-slate-500" />
                  </div>
                  <div className="text-[10px] font-bold text-slate-700">
                    {task.assigned_to_name || 'Unassigned'}
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-4">
                <Badge 
                  variant={
                    task.priority === 'Urgent' ? 'default' : 
                    task.priority === 'High' ? 'warning' : 
                    task.priority === 'Medium' ? 'primary' : 
                    'secondary'
                  }
                  className={
                    task.priority === 'Urgent'
                      ? 'text-[10px] font-bold bg-rose-100 text-rose-700'
                      : 'text-[10px] font-bold'
                  }
                >
                  {task.priority || 'Medium'}
                </Badge>
              </TableCell>
              <TableCell className="py-4">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-slate-400" />
                  <span className="text-[10px] font-black text-slate-700">{task.story_points || 0} pts</span>
                </div>
              </TableCell>
              <TableCell className="py-4">
                <Badge 
                  variant={
                    task.status === 'Completed' ? 'success' : 
                    task.status === 'In Progress' ? 'primary' : 
                    'secondary'
                  } 
                  className="text-[10px] font-bold uppercase tracking-wider"
                >
                  {task.status || 'Pending'}
                </Badge>
              </TableCell>
              <TableCell className="py-4">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-tight">
                    {task.due_date ? new Date(task.due_date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Flexible'}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {filteredTasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="p-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                          <CheckSquare className="w-6 h-6 text-slate-200" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">No tasks found!</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Try adjusting your filters.</p>
                  </div>
              </TableCell>
            </TableRow>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default TaskAssigneesTab;

