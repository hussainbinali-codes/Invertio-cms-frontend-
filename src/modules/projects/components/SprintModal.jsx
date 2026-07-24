import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';
import { Loader2, X, Flag, Calendar, Layers, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';

/**
 * SprintModal: Modal component for creating and editing Sprints.
 */
const SprintModal = ({ projectId, sprint = null, onClose, onSuccess }) => {
  useLockBodyScroll(true);

  const isEdit = Boolean(sprint);

  const [formData, setFormData] = useState({
    name: '',
    goal: '',
    description: '',
    status: 'Planning',
    start_date: '',
    end_date: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sprint) {
      setFormData({
        name: sprint.name || '',
        goal: sprint.goal || '',
        description: sprint.description || '',
        status: sprint.status || 'Planning',
        start_date: sprint.start_date ? sprint.start_date.split('T')[0] : '',
        end_date: sprint.end_date ? sprint.end_date.split('T')[0] : ''
      });
    }
  }, [sprint]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Sprint Name is required.');
      return;
    }

    if (formData.start_date && formData.end_date) {
      if (new Date(formData.end_date) < new Date(formData.start_date)) {
        setError('End Date cannot be before Start Date.');
        return;
      }
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (isEdit) {
        await axios.put(`/sprints/${sprint.id}`, formData);
        toast.success('Sprint updated successfully!');
      } else {
        await axios.post(`/projects/${projectId}/sprints`, formData);
        toast.success('Sprint created successfully!');
      }
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save sprint details.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-200/40 p-1.5 rounded-[2.25rem] border border-slate-200/20 max-w-xl w-full shadow-2xl">
        <Card className="rounded-[calc(2.25rem-0.375rem)] border-none shadow-none overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4 px-6 pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 tracking-tight">
                  {isEdit ? 'Edit Sprint' : 'Create New Sprint'}
                </CardTitle>
                <p className="text-xs text-slate-500 font-normal mt-0.5">
                  {isEdit ? 'Update sprint iteration parameters' : 'Define an agile iteration cycle for this project'}
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

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-700">
                  {error}
                </div>
              )}

              {/* Sprint Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sprint Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Sprint 1 - Core MVP Authentication"
                  required
                  className="rounded-xl border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sprint Goal */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sprint Goal
                </label>
                <Input
                  name="goal"
                  value={formData.goal}
                  onChange={handleChange}
                  placeholder="e.g. Complete User Login & Dashboard Layouts"
                  className="rounded-xl border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status & Dates Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Planning">Planning</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    className="rounded-xl border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    End Date
                  </label>
                  <Input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    className="rounded-xl border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Sprint Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Optional iteration scope and notes..."
                  className="rounded-xl border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
                      {isEdit ? 'Update Sprint' : 'Create Sprint'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SprintModal;
