import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';
import { Loader2, X, Bookmark, CheckCircle2, Tag, Layers, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';

/**
 * UserStoryModal: Modal component for creating and editing User Stories.
 */
const UserStoryModal = ({ projectId, sprintId, sprints = [], story = null, onClose, onSuccess }) => {
  useLockBodyScroll(true);

  const isEdit = Boolean(story);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    acceptance_criteria: '',
    priority: 'Medium',
    story_points: 0,
    status: 'Draft',
    labelsInput: '',
    selectedSprintId: sprintId || (story?.sprint_id || '')
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (story) {
      const labels = Array.isArray(story.labels)
        ? story.labels.join(', ')
        : (typeof story.labels === 'string' ? story.labels : '');

      setFormData({
        title: story.title || '',
        description: story.description || '',
        acceptance_criteria: story.acceptance_criteria || '',
        priority: story.priority || 'Medium',
        story_points: story.story_points !== undefined ? story.story_points : 0,
        status: story.status || 'Draft',
        labelsInput: labels,
        selectedSprintId: story.sprint_id || sprintId || ''
      });
    }
  }, [story]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('Story Title is required.');
      return;
    }

    if (formData.story_points < 0) {
      setError('Story Points cannot be negative.');
      return;
    }

    const labelsArray = formData.labelsInput
      ? formData.labelsInput.split(',').map(l => l.trim()).filter(Boolean)
      : [];

    const payload = {
      title: formData.title.trim(),
      description: formData.description || '',
      acceptance_criteria: formData.acceptance_criteria || '',
      priority: formData.priority,
      story_points: Number(formData.story_points) || 0,
      status: formData.status,
      labels: labelsArray
    };

    // Use explicitly selected sprint (from dropdown) or the pre-provided sprintId
    const targetSprintId = formData.selectedSprintId || sprintId;

    setIsSubmitting(true);
    setError('');

    try {
      if (isEdit) {
        await axios.put(`/stories/${story.id}`, payload);
        if (targetSprintId !== (story.sprint_id || '')) {
          await axios.patch(`/stories/${story.id}/sprint`, { sprint_id: targetSprintId || null });
        }
        toast.success('User Story updated successfully!');
      } else {
        if (targetSprintId) {
          await axios.post(`/projects/${projectId}/sprints/${targetSprintId}/stories`, payload);
        } else {
          await axios.post(`/projects/${projectId}/stories`, payload);
        }
        toast.success('User Story created successfully!');
      }
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save user story details.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-200/40 p-1.5 rounded-[2.25rem] border border-slate-200/20 max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col">
        <Card className="rounded-[calc(2.25rem-0.375rem)] border-none shadow-none overflow-hidden bg-white flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4 px-6 pt-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                <Bookmark className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 tracking-tight">
                  {isEdit ? `Edit ${story.story_key || 'Story'}` : 'Create User Story'}
                </CardTitle>
                <p className="text-xs text-slate-500 font-normal mt-0.5">
                  {isEdit ? 'Update requirements and sprint story details' : 'Define agile user requirements and acceptance criteria'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </CardHeader>

          <CardContent className="p-6 overflow-y-auto space-y-4 flex-1">
            <form id="user-story-form" onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-700">
                  {error}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Story Title <span className="text-rose-500">*</span>
                </label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. As a user, I want to filter projects by client status"
                  required
                  className="rounded-xl border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sprint Selector — shown when multiple sprints available (create flow only) */}
              {!isEdit && sprints.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Assign to Sprint <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="selectedSprintId"
                    value={formData.selectedSprintId}
                    onChange={handleChange}
                    className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- Select a sprint --</option>
                    {sprints.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}{s.status ? ` (${s.status})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Priority, Story Points, Status Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Priority <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Story Points
                  </label>
                  <Input
                    type="number"
                    min="0"
                    name="story_points"
                    value={formData.story_points}
                    onChange={handleChange}
                    className="rounded-xl border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Ready">Ready</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Sprint Assignment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  Sprint Assignment
                </label>
                <select
                  name="selectedSprintId"
                  value={formData.selectedSprintId}
                  onChange={handleChange}
                  className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">-- Product Backlog (Unassigned) --</option>
                  {sprints.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.status || 'Planning'})</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Provide background, user persona, or business context..."
                  className="rounded-xl border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Acceptance Criteria */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Acceptance Criteria
                </label>
                <Textarea
                  name="acceptance_criteria"
                  value={formData.acceptance_criteria}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Given [context], When [action], Then [expected outcome]..."
                  className="rounded-xl border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Labels */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Labels (Comma separated)
                </label>
                <Input
                  name="labelsInput"
                  value={formData.labelsInput}
                  onChange={handleChange}
                  placeholder="e.g. Frontend, Auth, Security"
                  className="rounded-xl border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </form>
          </CardContent>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 p-4 px-6 border-t border-slate-100 shrink-0 bg-slate-50/50">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold py-2.5 px-4"
            >
              Cancel
            </Button>
            <Button
              form="user-story-form"
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold py-2.5 px-5 flex items-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {isEdit ? 'Update Story' : 'Create Story'}
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserStoryModal;
