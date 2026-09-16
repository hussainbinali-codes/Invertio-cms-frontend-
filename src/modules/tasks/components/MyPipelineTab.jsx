import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import PaginationControls from '../../../components/ui/PaginationControls';
import { TrendingUp, CheckCircle2, Calendar, CheckSquare } from 'lucide-react';

const getDynamicPageLimit = () => {
  if (typeof window === 'undefined') return 6;
  const h = window.innerHeight;
  if (h < 720) return 5;
  if (h < 820) return 6;
  if (h < 920) return 7;
  return 8;
};

const MyPipelineTab = ({
  tasks = [],
  handleUpdateTask,
  updatingTaskId,
  setSelectedTaskDetail
}) => {
  const [pageLimit, setPageLimit] = useState(getDynamicPageLimit);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const handleResize = () => setPageLimit(getDynamicPageLimit());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset to page 1 if tasks count changes
  useEffect(() => {
    setCurrentPage(1);
  }, [tasks.length]);

  const totalPages = Math.ceil(tasks.length / pageLimit) || 1;
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageLimit;
    return tasks.slice(start, start + pageLimit);
  }, [tasks, currentPage, pageLimit]);

  const paginationData = {
    page: currentPage,
    total: tasks.length,
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
              <TableHead className="py-2.5 px-4 text-xs">Task Details</TableHead>
              <TableHead className="py-2.5 px-4 text-xs">Project</TableHead>
              <TableHead className="py-2.5 px-4 text-xs">Priority</TableHead>
              <TableHead className="py-2.5 px-4 text-xs">Status</TableHead>
              <TableHead className="py-2.5 px-4 text-xs">Due Date</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {paginatedTasks.map((task) => (
          <TableRow key={task.id} className="group">
            <TableCell
              className="py-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
              onClick={() => setSelectedTaskDetail(task)}
            >
              <div className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors max-w-xl overflow-hidden truncate" title={task.title}>{task.title}</div>
              <div className="text-xs text-slate-400 line-clamp-1 max-w-lg mt-0.5">{task.description || 'No description'}</div>
            </TableCell>
            <TableCell className="py-4">
              <Badge variant="secondary" className="text-xs font-medium">{task.project_name}</Badge>
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
                    ? 'text-xs font-medium bg-rose-100 text-rose-700 border-none'
                    : 'text-xs font-medium border-none'
                }
              >
                {task.priority || 'Medium'}
              </Badge>
            </TableCell>
            {/* <TableCell className="py-4">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-600">{task.story_points || 0} pts</span>
              </div>
            </TableCell> */}
            <TableCell className="py-4">
              {task.status === 'Pending' && (
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
            </TableCell>
            <TableCell className="py-4">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs font-normal">
                  {task.due_date ? new Date(task.due_date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Flexible'}
                </span>
              </div>
            </TableCell>
          </TableRow>
        ))}
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
      className="border-t border-slate-100 bg-white"
    />
  )}
</div>
);
};

export default MyPipelineTab;
