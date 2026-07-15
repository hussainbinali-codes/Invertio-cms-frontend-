import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { TrendingUp, CheckCircle2, Calendar, CheckSquare } from 'lucide-react';

const MyPipelineTab = ({
  tasks,
  handleUpdateTask,
  updatingTaskId,
  setSelectedTaskDetail
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="py-4">Task Details</TableHead>
          <TableHead className="py-4">Project</TableHead>
          <TableHead className="py-4">Priority</TableHead>
          <TableHead className="py-4">Story Points</TableHead>
          <TableHead className="py-4">Status</TableHead>
          <TableHead className="py-4">Due Date</TableHead>
        </TableRow>
      </TableHeader>
      <tbody>
        {tasks.map((task) => (
          <TableRow key={task.id} className="group">
            <TableCell 
              className="py-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
              onClick={() => setSelectedTaskDetail(task)}
            >
              <div className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{task.title}</div>
              <div className="text-xs text-slate-400 line-clamp-1 max-w-[200px] mt-0.5">{task.description || 'No description'}</div>
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
            <TableCell className="py-4">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-600">{task.story_points || 0} pts</span>
              </div>
            </TableCell>
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
  );
};

export default MyPipelineTab;
