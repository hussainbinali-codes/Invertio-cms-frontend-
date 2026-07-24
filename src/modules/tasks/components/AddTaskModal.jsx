import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';
import Button from '../../../components/ui/Button';
import { X, Loader2, CheckSquare, UploadCloud, Plus, Trash2 } from 'lucide-react';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';

const AddTaskModal = ({
  isOpen,
  onClose,
  selectedProject,
  onSubmit,
  isSubmitting,
  projectTeam,
  isAdmin,
  currentUser,
  taskReferences,
  setTaskReferences,
  selectedFiles,
  setSelectedFiles
}) => {
  useLockBodyScroll(isOpen);

  const [requirements, setRequirements] = useState(['']);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState(['']);
  const [userStories, setUserStories] = useState([]);
  const [selectedStoryId, setSelectedStoryId] = useState('');
  const [loadingStories, setLoadingStories] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRequirements(['']);
      setAcceptanceCriteria(['']);
      setSelectedStoryId('');

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900">
      <Card className="w-full max-w-4xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh] border border-slate-100">
        
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between py-5 shrink-0 border-b border-slate-100 bg-white">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-6 bg-primary-600 rounded-full"></span>
              Create New Engineering Task
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1 font-medium">Project: <span className="text-primary-600 font-semibold">{selectedProject.name}</span></p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        {/* Scrollable Form Content */}
        <CardContent className="p-8 overflow-y-auto flex-1 bg-slate-50/30">
          <form onSubmit={onSubmit} id="add-task-form" className="space-y-8">
            
            {/* SECTION 1: Basic Information */}
            <section className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="text-primary-600 font-bold">01.</span> Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <Input label="Task Title" name="title" placeholder="e.g. Implement OAuth2 Login Integration" required />
                </div>
                
                {/* User Story Selection */}
                <div className="col-span-1 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                    <span>Link to User Story (Feature)</span>
                    {loadingStories && <span className="text-xs text-blue-600 animate-pulse">Loading stories...</span>}
                  </label>
                  <select
                    name="user_story_id"
                    value={selectedStoryId}
                    onChange={(e) => setSelectedStoryId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 bg-white mt-1.5"
                  >
                    <option value="">-- No User Story (Standalone Project Task) --</option>
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

                <div>
                  <Input label="Module" name="module" placeholder="e.g. CMS Payroll / CRM Interface" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Task Type</label>
                  <select name="task_type" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 bg-white" required>
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
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Priority Level</label>
                  <select name="priority" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 bg-white" defaultValue="Medium" required>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Story Points (Fibonacci)</label>
                  <select name="story_points" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 bg-white" defaultValue="3" required>
                    <option value="1">1 (Tiny change, 30m - 2h)</option>
                    <option value="2">2 (Very small, up to 4h)</option>
                    <option value="3">3 (Small, ~1 day)</option>
                    <option value="5">5 (Medium, 2-3 days)</option>
                    <option value="8">8 (Large, up to 1 week)</option>
                    <option value="13">13 (Very large, &gt;1 week)</option>
                    <option value="21">21 (Epic, must break down)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Assign To (Project Team)</label>
                  <select name="assigned_to" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 bg-white" required>
                    <option value="">Select team member...</option>
                    {projectTeam.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role_name || u.email})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Reporter</label>
                  <select name="reporter_id" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 bg-white" defaultValue={currentUser?.id || ''} required>
                    <option value="">Select reporter...</option>
                    {projectTeam.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role_name || u.email})</option>
                    ))}
                    {currentUser && !projectTeam.some(u => u.id === currentUser.id) && (
                      <option value={currentUser.id}>{currentUser.name} (You / Reporter)</option>
                    )}
                  </select>
                </div>
              </div>
            </section>

            {/* SECTION 2 & 3: Business Objective & Problem Statement */}
            <section className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="text-primary-600 font-bold">02.</span> Business Objective & Problem Statement
              </h2>
              <div className="space-y-4">
                <Textarea label="Business Objective (Why are we doing this?)" name="business_objective" placeholder="e.g. To create a structured and professional framework for scaling engineering practices." required />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Textarea label="Current Issue" name="current_issue" placeholder="e.g. Engineering tasks lack a consistent structure..." required />
                  <Textarea label="Expected Improvement" name="expected_improvement" placeholder="e.g. Standardized template will provide visibility..." required />
                  <Textarea label="Business Impact" name="business_impact" placeholder="e.g. Improved project predictability and team alignment." required />
                </div>
              </div>
            </section>

            {/* SECTION 4: Functional Requirements */}
            <section className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="text-primary-600 font-bold">03.</span> Functional Requirements
                </h2>
                <button type="button" onClick={addRequirement} className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add Requirement
                </button>
              </div>
              <div className="space-y-3">
                {requirements.map((req, idx) => (
                  <div key={idx} className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-150">
                    <span className="text-xs font-bold text-slate-400 shrink-0">FR-{idx + 1}:</span>
                    <input
                      type="text"
                      name="functional_requirements"
                      value={req}
                      onChange={(e) => handleRequirementChange(idx, e.target.value)}
                      placeholder="Requirement description..."
                      className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 bg-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeRequirement(idx)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 hover:bg-rose-50 rounded-lg shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 5: Technical Notes */}
            <section className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="text-primary-600 font-bold">04.</span> Technical Notes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Textarea label="Architecture / Flow Notes" name="tech_architecture" placeholder="Architecture notes..." />
                <Textarea label="Libraries / Packages" name="tech_libraries" placeholder="List libraries..." />
                <Textarea label="API Changes & Endpoints Affected" name="tech_api_changes" placeholder="Describe API alterations..." />
                <Textarea label="Database Changes / Enums Needed" name="tech_db_changes" placeholder="Define DDL changes..." />
                <Textarea label="Configurations / Env Variables" name="tech_configurations" placeholder="Define environment variables..." />
                <Textarea label="System / Cross-team Dependencies" name="tech_dependencies" placeholder="List dependencies..." />
              </div>
            </section>

            {/* SECTION 6: Acceptance Criteria */}
            <section className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="text-primary-600 font-bold">05.</span> Acceptance Criteria
                </h2>
                <button type="button" onClick={addAcceptanceCriteria} className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add Criteria
                </button>
              </div>
              <div className="space-y-3">
                {acceptanceCriteria.map((ac, idx) => (
                  <div key={idx} className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-150">
                    <span className="text-xs font-bold text-slate-400 shrink-0">AC-{idx + 1}:</span>
                    <input
                      type="text"
                      name="acceptance_criteria"
                      value={ac}
                      onChange={(e) => handleCriteriaChange(idx, e.target.value)}
                      placeholder="e.g. Successful login redirects to CRM dashboard"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 bg-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeAcceptanceCriteria(idx)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 hover:bg-rose-50 rounded-lg shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 7 & 12 & 13: Checklists & Deliverables */}
            <section className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="text-primary-600 font-bold">06.</span> Checklists & Deliverables
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Testing Required */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase">Required Testing</h3>
                  <div className="space-y-2">
                    {['Unit Tests', 'Integration Tests', 'Manual Testing', 'Regression Testing', 'Performance Testing'].map(t => (
                      <label key={t} className="flex items-center gap-3 text-sm text-slate-600 hover:text-slate-900 cursor-pointer">
                        <input type="checkbox" name="testing_required" value={t} defaultChecked={t === 'Integration Tests' || t === 'Manual Testing'} className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500" />
                        <span>{t}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* DoD */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase">Definition of Done (DoD)</h3>
                  <div className="space-y-2">
                    {['Code completed', 'Code reviewed', 'Tests passed', 'Documentation updated', 'No critical bugs', 'Product Owner approved', 'Ready for deployment'].map(d => (
                      <label key={d} className="flex items-center gap-3 text-sm text-slate-600 hover:text-slate-900 cursor-pointer">
                        <input type="checkbox" name="definition_of_done" value={d} defaultChecked={d === 'Code completed' || d === 'Code reviewed' || d === 'Tests passed'} className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500" />
                        <span>{d}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Deliverables */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase">Deliverables</h3>
                  <div className="space-y-2">
                    {['Source Code', 'Unit / Integration Tests', 'Documentation / Swagger Docs', 'Deployment & Config Notes'].map(dl => (
                      <label key={dl} className="flex items-center gap-3 text-sm text-slate-600 hover:text-slate-900 cursor-pointer">
                        <input type="checkbox" name="deliverables" value={dl} defaultChecked={dl === 'Source Code' || dl === 'Unit / Integration Tests'} className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500" />
                        <span>{dl}</span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>
            </section>

            {/* SECTION 8: Estimation & Timeline */}
            <section className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
              <h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="text-primary-600 font-bold">07.</span> Estimation & Timeline
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input label="Estimated Start Date" name="estimated_start_date" type="date" required />
                <Input label="Estimated End Date" name="estimated_end_date" type="date" required />
                <Input label="Estimated Hours" name="estimated_hours" type="number" min="0" step="0.5" placeholder="e.g. 16" required />
              </div>
            </section>

            {/* SECTION 9 & 10: Progress Updates & Blockers */}
            <section className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="text-primary-600 font-bold">08.</span> Progress Updates & Blockers (Optional Initialization)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <Input label="Active Blocker Description" name="blocker_status" placeholder="Why is this task blocked (if applicable)?" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Waiting For</label>
                  <select name="blocker_waiting_for" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 bg-white">
                    <option value="">Select teammate...</option>
                    {projectTeam.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <Input label="Expected Resolution" name="blocker_expected_resolution" type="date" />
                <div className="col-span-1 md:col-span-4">
                  <Input label="Next Mandated Update Date" name="next_update_date" type="date" required />
                </div>
              </div>
            </section>

            {/* SECTION 11: Risks */}
            <section className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="text-primary-600 font-bold">09.</span> Risks Assessment
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Textarea label="Performance Impact" name="risk_performance" placeholder="Performance concerns..." />
                <Textarea label="Security Considerations" name="risk_security" placeholder="Security concerns..." />
                <Textarea label="Compatibility / Integrations" name="risk_compatibility" placeholder="Compatibility concerns..." />
                <Textarea label="Rollback Concerns & Steps" name="risk_rollback" placeholder="Rollback strategy..." />
              </div>
            </section>

            {/* SECTION 14: Initial Comments */}
            <section className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="text-primary-600 font-bold">10.</span> Initial Notes & Comments
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Textarea label="Developer Comments" name="comment_developer" placeholder="Initial developer notes..." />
                <Textarea label="QA Comments" name="comment_qa" placeholder="Initial QA notes..." />
                <Textarea label="Product Comments" name="comment_product" placeholder="Initial product notes..." />
              </div>
            </section>

            {/* Resources & Media Section */}
            <section className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="text-primary-600 font-bold">11.</span> Resources & Task Media
              </h2>
              <div className="space-y-4">
                <div class="space-y-2">
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
                
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Task Media (Files)</label>
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
                            <X className="w-3.5 h-3.5 hover:text-rose-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Form Footer Actions */}
            <footer className="flex gap-3 justify-end pt-6 sticky bottom-0 bg-white border-t border-slate-50 mt-4">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary-600 hover:bg-primary-700">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <><CheckSquare className="w-4 h-4 mr-2" /> {isAdmin ? 'Create & Assign' : 'Create Task'}</>
                )}
              </Button>
            </footer>

          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddTaskModal;
