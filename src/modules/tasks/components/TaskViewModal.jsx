import React, { useEffect, useState } from 'react';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import { X, Loader2, Calendar, User, ClipboardList, FolderOpen } from 'lucide-react';
import ProjectResourcesModal from '../../projects/components/ProjectResourcesModal';
import TaskDetailModal from './TaskDetailModal';
import Button from '../../../components/ui/Button';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';

const TaskViewModal = ({ project, onClose }) => {
  useLockBodyScroll(true);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResources, setShowResources] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

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
              className="h-9 text-[10px] font-bold uppercase text-primary-600 hover:bg-primary-50"
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
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="w-[30%]">Task Title</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {tasks.map((task) => (
                  <TableRow 
                    key={task.id} 
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => setSelectedTask(task)}
                  >
                    <TableCell className="py-4 max-w-[300px]">
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
                          task.priority === 'Urgent' ? 'destructive' : 
                          task.priority === 'High' ? 'warning' : 
                          task.priority === 'Medium' ? 'primary' : 
                          'secondary'
                        } 
                        className="text-[10px]"
                      >
                        {task.priority || 'Medium'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-black text-slate-600">{task.story_points || 0} pts</span>
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
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 underline underline-offset-4"
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
