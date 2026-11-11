import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { X, Loader2, CheckSquare, Paperclip, Image as ImageIcon } from 'lucide-react';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';

const AddTaskModal = ({
  isOpen,
  onClose,
  selectedProject,
  projects = [],
  initialDueDate,
  onProjectChange,
  onSubmit,
  isSubmitting,
  projectTeam = [],
  isAdmin,
  currentUser,
  taskReferences: propTaskReferences,
  setTaskReferences: propSetTaskReferences,
  selectedFiles: propSelectedFiles,
  setSelectedFiles: propSetSelectedFiles
}) => {
  useLockBodyScroll(isOpen);

  const [activeProject, setActiveProject] = useState(selectedProject);
  const [internalTaskReferences, setInternalTaskReferences] = useState('');
  const [internalSelectedFiles, setInternalSelectedFiles] = useState([]);

  const taskReferences = propTaskReferences !== undefined ? propTaskReferences : internalTaskReferences;
  const setTaskReferences = propSetTaskReferences || setInternalTaskReferences;

  const selectedFiles = propSelectedFiles !== undefined ? propSelectedFiles : internalSelectedFiles;
  const setSelectedFiles = propSetSelectedFiles || setInternalSelectedFiles;

  useEffect(() => {
    if (isOpen) {
      setActiveProject(selectedProject || projects[0] || null);
      setInternalSelectedFiles([]);
      setInternalTaskReferences('');
    }
  }, [isOpen, selectedProject, projects]);

  const currentProj = activeProject || selectedProject || projects[0];

  const todayStr = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();
  const safeDueDate = initialDueDate && initialDueDate >= todayStr ? initialDueDate : todayStr;

  if (!isOpen || !currentProj) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 text-slate-900 animate-in fade-in duration-150 font-sans">
      <Card className="w-full max-w-xl shadow-2xl rounded-3xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 tracking-tight">
                Create New Task
              </CardTitle>
              <p className="text-xs text-slate-400 font-medium">
                Adding to project: <span className="text-blue-600 font-semibold">{currentProj.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        {/* Form Body */}
        <CardContent className="p-6 overflow-y-auto flex-1 bg-white custom-scrollbar">
          <form onSubmit={onSubmit} id="add-task-form" className="space-y-4">

            {/* Hidden fields for backend compatibility */}
            <input type="hidden" name="module" value="General" />
            <input type="hidden" name="task_type" value="Feature" />
            <input type="hidden" name="user_story_id" value="" />
            <input type="hidden" name="project_id" value={currentProj.id} />

            {/* Project Selection (if opened with multiple projects available) */}
            {projects && projects.length > 1 && (
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Project <span className="text-rose-500">*</span>
                </label>
                <select
                  value={currentProj.id}
                  onChange={(e) => {
                    const p = projects.find(proj => String(proj.id) === String(e.target.value));
                    if (p) {
                      setActiveProject(p);
                      if (onProjectChange) onProjectChange(p);
                    }
                  }}
                  className="w-full h-10 px-3.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white transition-all cursor-pointer"
                >
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 1. Task Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Task Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                placeholder="e.g. Meeting with rajesh @ 7 pm or Implement OAuth login"
                className="w-full h-11 px-4 text-sm font-medium rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                required
                autoFocus
              />
            </div>

            {/* 2. Priority, Due Date, and Assignee in a clean row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Priority
                </label>
                <select
                  name="priority"
                  defaultValue="Medium"
                  className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white transition-all cursor-pointer"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Urgent / Critical</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Due Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="due_date"
                  min={todayStr}
                  defaultValue={safeDueDate}
                  key={safeDueDate}
                  className="w-full h-10 px-3 text-xs font-medium rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white transition-all"
                  required
                />
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Assign To
                </label>
                {(isAdmin || (currentUser?.role_name || '').toLowerCase().includes('admin') || (currentUser?.role_name || '').toLowerCase().includes('pm')) ? (
                  <select
                    name="assigned_to"
                    defaultValue={currentUser?.id || ''}
                    className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white transition-all cursor-pointer"
                  >
                    <option value={currentUser?.id || ''}>
                      {currentUser?.name || 'Self-Assigned'}
                    </option>
                    {projectTeam
                      .filter(u => u.id !== currentUser?.id)
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                  </select>
                ) : (
                  <select
                    name="assigned_to"
                    defaultValue={currentUser?.id || ''}
                    className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 bg-slate-50 cursor-not-allowed"
                  >
                    <option value={currentUser?.id}>
                      {currentUser?.name || 'You'} (Self-Assigned)
                    </option>
                  </select>
                )}
              </div>
            </div>

            {/* 3. Description / Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Description & Notes <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Briefly describe the task, action items, or meeting details..."
                className="w-full p-3.5 text-xs font-normal rounded-xl border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none leading-relaxed"
              />
            </div>

            {/* 4. Meeting Links & Task References */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Meeting Link / References <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="Paste Zoom, Google Meet, Figma, or document URL..."
                value={taskReferences}
                onChange={(e) => setTaskReferences(e.target.value)}
                className="w-full h-10 px-3.5 text-xs font-medium rounded-xl border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* 5. Attachments Preview & File Input */}
            <div className="pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800">
                  Attachments <span className="text-slate-400 font-normal">({selectedFiles.length})</span>
                </label>
                <label
                  htmlFor="task-modal-file-upload"
                  className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Attach File</span>
                </label>
                <input
                  id="task-modal-file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      setSelectedFiles([...selectedFiles, ...Array.from(e.target.files)]);
                    }
                  }}
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200/60 max-h-24 overflow-y-auto">
                  {selectedFiles.map((file, i) => {
                    const isImg = file.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
                    return (
                      <div
                        key={i}
                        className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-lg text-[11px] font-medium text-slate-700 shadow-2xs"
                      >
                        {isImg ? <ImageIcon className="w-3 h-3 text-blue-500" /> : <Paperclip className="w-3 h-3 text-slate-400" />}
                        <span className="truncate max-w-[120px]">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedFiles(selectedFiles.filter((_, idx) => idx !== i))}
                          className="text-slate-400 hover:text-rose-500 p-0.5 rounded cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </form>
        </CardContent>

        {/* Footer */}
        <div className="py-3 px-6 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-task-form"
            disabled={isSubmitting}
            className="rounded-xl px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isSubmitting ? 'Creating...' : 'Create Task'}</span>
          </Button>
        </div>

      </Card>
    </div>
  );
};

export default AddTaskModal;
