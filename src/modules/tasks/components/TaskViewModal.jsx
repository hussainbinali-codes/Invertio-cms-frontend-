import React, { useEffect, useState, useMemo } from 'react';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import { X, Loader2, Calendar, User, ClipboardList, FolderOpen, CheckCircle2 } from 'lucide-react';
import ProjectResourcesModal from '../../projects/components/ProjectResourcesModal';
import TaskDetailModal from './TaskDetailModal';
import Button from '../../../components/ui/Button';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';
import { cn } from '../../../utils/cn';

const TaskViewModal = ({ project, onClose, initialStatusFilter = 'all' }) => {
  useLockBodyScroll(true);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResources, setShowResources] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter || 'all');

  useEffect(() => {
    setStatusFilter(initialStatusFilter || 'all');
  }, [initialStatusFilter, project]);

  useEffect(() => {
    if (project) {
      fetchTasks();
    }
  }, [project]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/projects/${project.id}/tasks`);
      setTasks(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = (updatedTask) => {
    if (!updatedTask?.id) return;

    setTasks((prevTasks) => prevTasks.map((task) => (
      task.id === updatedTask.id ? { ...task, ...updatedTask } : task
    )));
    setSelectedTask((prevTask) => (
      prevTask?.id === updatedTask.id ? { ...prevTask, ...updatedTask } : prevTask
    ));
  };

  const yetToStartTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'In Progress' && t.status !== 'Completed'),
    [tasks]
  );
  const inProgressTasks = useMemo(() => tasks.filter((t) => t.status === 'In Progress'), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.status === 'Completed'), [tasks]);

  const filteredTasks = useMemo(() => {
    if (statusFilter === 'Yet to Start' || statusFilter === 'Pending') return yetToStartTasks;
    if (statusFilter === 'In Progress') return inProgressTasks;
    if (statusFilter === 'Completed') return completedTasks;
    return tasks;
  }, [tasks, statusFilter, yetToStartTasks, inProgressTasks, completedTasks]);

  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900">
      <Card className="w-full max-w-6xl shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden max-h-[95vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between bg-slate-50 border-b border-slate-100 py-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary-600" />
                <CardTitle>Project Tasks</CardTitle>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Current lifecycle of <span className="font-semibold text-slate-700">{project.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 text-xs font-semibold text-slate-500 text-primary-600 hover:bg-primary-50"
              onClick={() => setShowResources(true)}
            >
              <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
              Project Resources
            </Button>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>

        {/* Status Filter Selector */}
        {!loading && tasks.length > 0 && (
          <div className="flex items-center justify-between px-6 py-2.5 bg-slate-50/70 border-b border-slate-200/80 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                  statusFilter === 'all'
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                )}
              >
                <span>All Tasks</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                  statusFilter === 'all' ? "bg-slate-100 text-slate-700" : "bg-slate-200/60 text-slate-500"
                )}>
                  {tasks.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('Yet to Start')}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                  statusFilter === 'Yet to Start' || statusFilter === 'Pending'
                    ? "bg-amber-50 text-amber-700 shadow-sm border border-amber-200"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                )}
              >
                <span>Yet to Start</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                  statusFilter === 'Yet to Start' || statusFilter === 'Pending' ? "bg-amber-100 text-amber-700" : "bg-slate-200/60 text-slate-500"
                )}>
                  {yetToStartTasks.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('In Progress')}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                  statusFilter === 'In Progress'
                    ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-200"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                )}
              >
                <span>In Progress</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                  statusFilter === 'In Progress' ? "bg-blue-100 text-blue-700" : "bg-slate-200/60 text-slate-500"
                )}>
                  {inProgressTasks.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('Completed')}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                  statusFilter === 'Completed'
                    ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                )}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Completed</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                  statusFilter === 'Completed' ? "bg-emerald-100 text-emerald-700" : "bg-slate-200/60 text-slate-500"
                )}>
                  {completedTasks.length}
                </span>
              </button>
            </div>

            <span className="text-xs text-slate-400 font-medium">
              Showing <strong>{filteredTasks.length}</strong> of <strong>{tasks.length}</strong> tasks
            </span>
          </div>
        )}

        <CardContent className="p-0 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              <p className="text-sm text-slate-500 animate-pulse">Retrieving project data...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No tasks found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-xs">
                This project doesn't have any tasks documented yet. Click "Add Task" to start work.
              </p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No {statusFilter} tasks found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-xs">
                There are no tasks with status &quot;{statusFilter}&quot; in this project.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4 text-xs font-semibold"
                onClick={() => setStatusFilter('all')}
              >
                View All Project Tasks
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="w-[28%] text-[11px] sm:text-[11px]">Task Title</TableHead>
                  <TableHead className="text-[11px] sm:text-[11px]">Client</TableHead>
                  <TableHead className="text-[11px] sm:text-[11px]">Assigned To</TableHead>
                  <TableHead className="text-[11px] sm:text-[11px]">Priority</TableHead>
                  <TableHead className="text-[11px] sm:text-[11px]">Points</TableHead>
                  <TableHead className="text-[11px] sm:text-[11px]">Status</TableHead>
                  <TableHead className="text-[11px] sm:text-[11px]">Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {filteredTasks.map((task) => (
                  <TableRow 
                    key={task.id} 
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => setSelectedTask(task)}
                  >
                    <TableCell className="py-4 max-w-[280px]">
                      <div className="flex flex-col gap-1 overflow-hidden">
                        <span 
                          className="font-semibold text-slate-900 leading-none truncate group-hover:text-primary-600 transition-colors" 
                          title={task.title}
                        >
                          {task.title}
                        </span>
                        {task.description && (
                          <span 
                            className="text-xs text-slate-500 line-clamp-1 break-all italic" 
                            title={task.description}
                          >
                            {task.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.client_name ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 truncate max-w-[120px]" title={task.client_name}>
                          {task.client_name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Internal</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <div className="w-7 h-7 bg-primary-50 rounded-full flex items-center justify-center text-primary-700 text-[10px] font-bold">
                          {(task.assigned_to_name || 'NA').substring(0, 2).toUpperCase()}
                        </div>
                        <span>{task.assigned_to_name || "Unassigned"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          task.priority === 'Urgent' ? 'default' : 
                          task.priority === 'High' ? 'warning' : 
                          task.priority === 'Medium' ? 'primary' : 
                          'secondary'
                        } 
                        className={
                          task.priority === 'Urgent'
                            ? 'text-[10px] bg-rose-100 text-rose-700'
                            : 'text-[10px]'
                        }
                      >
                        {task.priority || 'Medium'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-bold text-slate-600">{task.story_points || 0} pts</span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          task.status === 'Completed' ? 'success' : 
                          task.status === 'In Progress' ? 'primary' : 
                          'default'
                        }
                      >
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No date"}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          )}
        </CardContent>
        <div className="bg-slate-50 border-t border-slate-100 p-4 flex justify-between items-center">
            <span className="text-xs text-slate-400 font-medium">Total: {tasks.length} tasks</span>
            <button 
                onClick={onClose}
                className="text-sm font-normal text-primary-600 hover:text-primary-700 underline underline-offset-4"
            >
                Close View
            </button>
        </div>
      </Card>

      {showResources && (
        <ProjectResourcesModal 
          project={project} 
          onClose={() => setShowResources(false)} 
          onUpdate={fetchTasks}
        />
      )}

      {selectedTask && (
        <TaskDetailModal 
          task={{...selectedTask, project_name: project.name}} 
          onClose={() => setSelectedTask(null)} 
          onUpdate={handleTaskUpdate}
        />
      )}
    </div>
  );
};

export default TaskViewModal;

