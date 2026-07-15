import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';
import Button from '../../../components/ui/Button';
import { X, Loader2, CheckSquare, UploadCloud } from 'lucide-react';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';

const AddTaskModal = ({
  isOpen,
  onClose,
  selectedProject,
  onSubmit,
  isSubmitting,
  projectTeam,
  isAdmin,
  taskReferences,
  setTaskReferences,
  selectedFiles,
  setSelectedFiles
}) => {
  useLockBodyScroll(isOpen);
  if (!isOpen || !selectedProject) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900">
      <Card className="w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[95vh]">
        <CardHeader className="flex flex-row items-center justify-between py-6 shrink-0 border-b border-slate-50">
          <div>
            <CardTitle className="text-xl font-bold">Add New Task</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Project: {selectedProject.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto flex-1">
          <form onSubmit={onSubmit} id="add-task-form" className="space-y-4">
            <Input label="Task Title" name="title" placeholder="Develop API endpoint..." required />
            <Textarea label="Description" name="description" placeholder="Technical details, acceptance criteria..." required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Priority Level</label>
                <select name="priority" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" defaultValue="Medium" required>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
                <Input 
                  type="number" 
                  name="story_points" 
                  min="0" 
                  label="Story Points (Complexity)"
                  placeholder="e.g. 5" 
                  defaultValue="0"
                  required
                />
            </div>

            <div className={`grid grid-cols-1 ${isAdmin ? 'sm:grid-cols-2' : ''} gap-4`}>
              {isAdmin && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Assign To (Project Team)</label>
                  <select name="assigned_to" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" required>
                    <option value="">Select team member...</option>
                    {projectTeam.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role_name || u.email})</option>
                    ))}
                    {projectTeam.length === 0 && (
                      <option disabled>No members assigned to this project team yet</option>
                    )}
                  </select>
                </div>
              )}
              <Input label="Due Date" name="due_date" type="date" className="h-10" required />
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resources & Instructions</label>
              <Textarea 
                placeholder="Add links, examples, or specific instructions for this task..." 
                className="min-h-[100px] text-xs"
                value={taskReferences}
                onChange={(e) => setTaskReferences(e.target.value)}
                required
              />
              <p className="text-[10px] text-slate-400 italic">Example: Link to Figma or "Follow the naming convention in the Auth module"</p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Task Media (Files)</label>
              </div>
              <div className="flex flex-col gap-2">
                <input 
                  type="file" 
                  multiple 
                  id="task-file-input"
                  className="hidden" 
                  onChange={(e) => setSelectedFiles([...selectedFiles, ...Array.from(e.target.files)])}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-10 border-dashed border-2"
                  onClick={() => document.getElementById('task-file-input').click()}
                >
                  <UploadCloud className="w-4 h-4 mr-2" />
                  {selectedFiles.length > 0 ? `${selectedFiles.length} files selected` : "Upload Task Media"}
                </Button>
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-[10px] font-medium text-slate-600">
                      <span className="truncate max-w-[100px]">{file.name}</span>
                      <button type="button" onClick={() => setSelectedFiles(selectedFiles.filter((_, idx) => idx !== i))}>
                        <X className="w-3 h-3 hover:text-rose-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-6 sticky bottom-0 bg-white border-t border-slate-50 mt-4">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" form="add-task-form" disabled={isSubmitting} className="bg-primary-600 hover:bg-primary-700">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <><CheckSquare className="w-4 h-4 mr-2" /> {isAdmin ? 'Create & Assign' : 'Create Task'}</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddTaskModal;

