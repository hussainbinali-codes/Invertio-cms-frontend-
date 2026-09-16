import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';
import Button from '../../../components/ui/Button';
import { X, Loader2, CheckSquare, UploadCloud, Plus, Trash2, Paperclip, Image as ImageIcon } from 'lucide-react';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';

const AddTaskModal = ({
  isOpen,
  onClose,
  selectedProject,
  onSubmit,
  isSubmitting,
  projectTeam = [],
  isAdmin,
  currentUser,
  initialStoryId,
  taskReferences: propTaskReferences,
  setTaskReferences: propSetTaskReferences,
  selectedFiles: propSelectedFiles,
  setSelectedFiles: propSetSelectedFiles
}) => {
  useLockBodyScroll(isOpen);

  const [internalTaskReferences, setInternalTaskReferences] = useState('');
  const [internalSelectedFiles, setInternalSelectedFiles] = useState([]);

  const taskReferences = propTaskReferences !== undefined ? propTaskReferences : internalTaskReferences;
  const setTaskReferences = propSetTaskReferences || setInternalTaskReferences;

  const selectedFiles = propSelectedFiles !== undefined ? propSelectedFiles : internalSelectedFiles;
  const setSelectedFiles = propSetSelectedFiles || setInternalSelectedFiles;

  const [requirements, setRequirements] = useState(['']);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState(['']);
  const [userStories, setUserStories] = useState([]);
  const [selectedStoryId, setSelectedStoryId] = useState('');
  const [loadingStories, setLoadingStories] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRequirements(['']);
      setAcceptanceCriteria(['']);
      setSelectedStoryId(initialStoryId || '');
      setInternalSelectedFiles([]);
      setInternalTaskReferences('');

      if (selectedProject?.id) {
        setLoadingStories(true);
        axios.get(`/projects/${selectedProject.id}/stories`)
          .then(res => setUserStories(res.data.data || []))
          .catch(() => setUserStories([]))
          .finally(() => setLoadingStories(false));
      }
    }
  }, [isOpen, selectedProject]);

  if (!isOpen || !selectedProject) return null;

  const addRequirement = () => setRequirements([...requirements, '']);
  const removeRequirement = (idx) => {
    if (requirements.length > 1) {
      setRequirements(requirements.filter((_, i) => i !== idx));
    } else {
      setRequirements(['']);
    }
  };
  const handleRequirementChange = (idx, val) => {
    const updated = [...requirements];
    updated[idx] = val;
    setRequirements(updated);
  };

  const addAcceptanceCriteria = () => setAcceptanceCriteria([...acceptanceCriteria, '']);
  const removeAcceptanceCriteria = (idx) => {
    if (acceptanceCriteria.length > 1) {
      setAcceptanceCriteria(acceptanceCriteria.filter((_, i) => i !== idx));
    } else {
      setAcceptanceCriteria(['']);
    }
  };
  const handleCriteriaChange = (idx, val) => {
    const updated = [...acceptanceCriteria];
    updated[idx] = val;
    setAcceptanceCriteria(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-3 sm:p-5 text-slate-900">
      <Card className="w-[95%] max-w-[95vw] shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh] border border-slate-100/80">

        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between py-2.5 px-4 sm:px-5 shrink-0 border-b border-slate-100 bg-white gap-4">
          <div className="flex flex-1 items-center justify-between gap-4">
            <CardTitle className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
              <span className="w-2 h-5 bg-primary-600 rounded-full"></span>
              Create New Engineering Task
            </CardTitle>
            <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
              {selectedProject.client_name && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Client:</span>
                  <span className="text-indigo-600 font-bold">{selectedProject.client_name}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Project:</span>
                <span className="text-primary-600 font-bold">{selectedProject.name}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 duration-200 rounded-lg hover:bg-slate-50 shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        {/* Scrollable Form Content */}
        <CardContent className="p-3 sm:p-4 overflow-y-auto flex-1 bg-slate-50/40 custom-scrollbar">
          <form onSubmit={onSubmit} id="add-task-form" className="space-y-3">

            {/* SECTION 1: Basic Information */}
            <section className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-100 shadow-xs space-y-3">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="text-primary-600 font-bold">01.</span> Basic Information
              </h2>
              {/* Row 1: Title & User Story */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Input
                    label="Task Title"
                    name="title"
                    placeholder="e.g. Implement OAuth2 Login Integration"
                    className="font-semibold text-slate-900 placeholder:font-normal"
                    required
                  />
                </div>

                {/* User Story Selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span>Link to User Story (Feature)</span>
                    {loadingStories && <span className="text-xs text-blue-600 animate-pulse font-normal">Loading stories...</span>}
                  </label>
                  <select
                    name="user_story_id"
                    value={selectedStoryId}
                    onChange={(e) => setSelectedStoryId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 bg-white shadow-sm transition-all"
                  >
                    <option value="">-- No User Story (Standalone Task) --</option>
                    {userStories.map(story => (
                      <option key={story.id} value={story.id}>
                        {story.story_key ? `[${story.story_key}] ` : ''}{story.title} {story.sprint_name ? `(${story.sprint_name})` : ''}
                      </option>
                    ))}
                  </select>
                  {selectedStoryId && (
                    <input
                      type="hidden"
                      name="sprint_id"
                      value={userStories.find(s => s.id === selectedStoryId)?.sprint_id || ''}
                    />
                  )}
                </div>
              </div>

              {/* Row 2: 5 Inputs in a single row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <Input label="Module" name="module" placeholder="e.g. CMS Payroll" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">Task Type</label>
                  <select name="task_type" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 bg-white shadow-sm transition-all" required>
                    <option value="Feature">Feature</option>
                    <option value="Enhancement">Enhancement</option>
                    <option value="Bug">Bug</option>
                    <option value="Research">Research</option>
                    <option value="Refactor">Refactor</option>
                    <option value="DevOps">DevOps</option>
                    <option value="AI/ML">AI/ML</option>
                    <option value="Data Engineering">Data Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">Priority Level</label>
                  <select name="priority" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 bg-white shadow-sm transition-all" defaultValue="Medium" required>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <Input label="Due Date" name="due_date" type="date" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">Assign To</label>
                  {(isAdmin || (currentUser?.role_name || '').toLowerCase().includes('admin') || (currentUser?.role_name || '').toLowerCase().includes('pm') || (currentUser?.role_name || '').toLowerCase().includes('project manager')) ? (
                    <select name="assigned_to" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 bg-white shadow-sm transition-all" required>
                      <option value="">Select member...</option>
                      {projectTeam.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role_name || u.email})</option>
                      ))}
                    </select>
                  ) : (
                    <select name="assigned_to" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 bg-slate-50 font-medium text-slate-700 cursor-not-allowed shadow-sm transition-all" defaultValue={currentUser?.id || ''} required>
                      <option value={currentUser?.id}>{currentUser?.name || 'You'} (Self-Assigned)</option>
                    </select>
                  )}
                </div>
              </div>
            </section>

            {/* SECTION 2: Business Objective & Problem Statement (2 Balanced Rows) */}
            <section className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-100 shadow-xs space-y-3">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="text-primary-600 font-bold">02.</span> Business Objective & Problem Statement
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Textarea label="Business Objective (Why are we doing this?)" name="business_objective" placeholder="e.g. To create a structured and professional framework for scaling engineering practices." required />
                <Textarea label="Current Issue" name="current_issue" placeholder="e.g. Engineering tasks lack a consistent structure..." required />
                <Textarea label="Expected Improvement" name="expected_improvement" placeholder="e.g. Standardized template will provide visibility..." required />
                <Textarea label="Business Impact" name="business_impact" placeholder="e.g. Improved project predictability and team alignment." required />
              </div>
            </section>

            {/* SECTION 3 & 4: Functional Requirements & Acceptance Criteria (Single Row) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* SECTION 3: Functional Requirements */}
              <section className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-100 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="text-primary-600 font-bold">03.</span> Functional Requirements
                  </h2>
                  <button type="button" onClick={addRequirement} className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add Requirement
                  </button>
                </div>
                <div className="space-y-2">
                  {requirements.map((req, idx) => (
                    <div key={idx} className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                      <span className="text-xs font-bold text-slate-500 shrink-0">FR-{idx + 1}:</span>
                      <input
                        type="text"
                        name="functional_requirements"
                        value={req}
                        onChange={(e) => handleRequirementChange(idx, e.target.value)}
                        placeholder="Requirement description..."
                        className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white font-medium"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeRequirement(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1 hover:bg-rose-50 rounded-lg shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 4: Acceptance Criteria */}
              <section className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-100 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="text-primary-600 font-bold">04.</span> Acceptance Criteria
                  </h2>
                  <button type="button" onClick={addAcceptanceCriteria} className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add Criteria
                  </button>
                </div>
                <div className="space-y-2">
                  {acceptanceCriteria.map((ac, idx) => (
                    <div key={idx} className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                      <span className="text-xs font-bold text-slate-500 shrink-0">AC-{idx + 1}:</span>
                      <input
                        type="text"
                        name="acceptance_criteria"
                        value={ac}
                        onChange={(e) => handleCriteriaChange(idx, e.target.value)}
                        placeholder="e.g. Successful login redirects to CRM dashboard"
                        className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white font-medium"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeAcceptanceCriteria(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1 hover:bg-rose-50 rounded-lg shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* SECTION 5: Resources & Task Media (Single Dual-Feature Input) */}
            <section className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-100 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="text-primary-600 font-bold">05.</span> Resources & Media
                </h2>
                <span className="text-[11px] font-medium text-slate-400">Optional: links, instructions & file attachments</span>
              </div>

              {/* Unified Dual-Feature Input Container */}
              <div className="rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all shadow-2xs overflow-hidden flex flex-col">
                {/* Textarea for Notes, Figma, Links */}
                <textarea
                  placeholder="Add links (e.g. Figma), reference docs, or specific instructions for this task..."
                  className="w-full px-3.5 pt-2.5 pb-1.5 text-sm text-slate-800 placeholder:text-slate-400 bg-transparent border-none resize-none focus:outline-none focus:ring-0 leading-relaxed min-h-[44px] max-h-[180px] overflow-y-auto"
                  value={taskReferences}
                  onChange={(e) => setTaskReferences(e.target.value)}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
                  }}
                  rows={1}
                />

                {/* Attached Files/Images Preview Chips inside the component */}
                {selectedFiles.length > 0 && (
                  <div className="px-3 pb-2 pt-1 flex flex-wrap gap-1.5 border-t border-slate-100 bg-slate-50/50">
                    {selectedFiles.map((file, i) => {
                      const isImg = file.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 bg-white border border-slate-200 pl-2 pr-1 py-0.5 rounded-lg text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 transition-all"
                        >
                          <span className="w-4 h-4 rounded text-primary-600 flex items-center justify-center shrink-0">
                            {isImg ? <ImageIcon className="w-3.5 h-3.5" /> : <Paperclip className="w-3.5 h-3.5" />}
                          </span>
                          <span className="truncate max-w-[140px] sm:max-w-[200px]" title={file.name}>
                            {file.name}
                          </span>
                          {file.size ? (
                            <span className="text-[10px] text-slate-400">
                              ({(file.size / 1024).toFixed(0)}KB)
                            </span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setSelectedFiles(selectedFiles.filter((_, idx) => idx !== i))}
                            className="p-0.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors ml-0.5"
                            title="Remove file"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Bottom Integrated Toolbar */}
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50/70 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      multiple
                      id="task-file-input"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.length) {
                          setSelectedFiles([...selectedFiles, ...Array.from(e.target.files)]);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('task-file-input').click()}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50/50 shadow-2xs transition-all active:scale-95"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                      <span>Attach Images / Media</span>
                    </button>
                    {selectedFiles.length > 0 && (
                      <span className="text-xs text-slate-500 font-medium">
                        {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} attached
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 hidden sm:inline italic">
                    Supports Figma URLs, text notes & file uploads
                  </span>
                </div>
              </div>
            </section>

          </form>
        </CardContent>

        {/* Clean Pinned Footer (Never overlaps content or dropdowns) */}
        <div className="flex gap-2.5 justify-end px-4 sm:px-5 py-2.5 bg-white border-t border-slate-100 shrink-0">
          <Button type="button" variant="secondary" onClick={onClose} className="h-9 px-4 text-xs font-semibold">
            Cancel
          </Button>
          <Button type="submit" form="add-task-form" disabled={isSubmitting} className="h-9 px-5 text-xs font-semibold bg-primary-600 hover:bg-primary-700 shadow-sm">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <><CheckSquare className="w-4 h-4 mr-1.5" /> {isAdmin ? 'Create & Assign' : 'Create Task'}</>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AddTaskModal;
