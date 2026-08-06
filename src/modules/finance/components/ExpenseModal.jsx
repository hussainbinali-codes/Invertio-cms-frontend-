import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { X, Loader2, Plus, Tag } from 'lucide-react';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';
import CategoryManagerModal from './CategoryManagerModal';

const DEFAULT_CATEGORIES = [
  { id: '1', name: 'Marketing' },
  { id: '2', name: 'Software/SaaS' },
  { id: '3', name: 'Office Supplies' },
  { id: '4', name: 'Travel' },
  { id: '5', name: 'Hardware' },
  { id: '6', name: 'Utilities' },
  { id: '7', name: 'Vendor' },
  { id: '8', name: 'Other' }
];

const ExpenseModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  projects,
  currencies,
  categories: propCategories,
  onCategoriesChange
}) => {
  useLockBodyScroll(isOpen);

  const [categories, setCategories] = useState(propCategories || DEFAULT_CATEGORIES);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (propCategories && propCategories.length > 0) {
      setCategories(propCategories);
    }
  }, [propCategories]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/finance/expense-categories');
      if (res.data.data && res.data.data.length > 0) {
        setCategories(res.data.data);
        if (onCategoriesChange) onCategoriesChange(res.data.data);
      }
    } catch (err) {
      // Fallback to defaults
    }
  };

  const handleCategoriesUpdated = (updatedCats) => {
    setCategories(updatedCats);
    if (onCategoriesChange) onCategoriesChange(updatedCats);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900 overflow-y-auto">
        <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[95vh] flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between py-6">
            <div>
              <CardTitle className="text-xl font-bold">Record Expense</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Log operational or project-related spend.</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 duration-200">
              <X className="w-5 h-5" />
            </button>
          </CardHeader>
          <CardContent className="p-6 overflow-y-auto flex-1">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Category</label>
                    <button
                      type="button"
                      onClick={() => setShowCategoryManager(true)}
                      className="text-[11px] font-bold text-primary-600 hover:text-primary-700 flex items-center gap-0.5 hover:underline"
                    >
                      <Plus className="w-3 h-3" />
                      Add / Edit
                    </button>
                  </div>
                  <select name="category" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" required>
                    {categories.map(cat => (
                      <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <Input label="Date" name="date" type="date" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Amount" name="amount" type="number" min="0" step="0.01" placeholder="150.00" required />
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Currency</label>
                  <select name="currency" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" required>
                    {currencies.map(c => (
                      <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Project</label>
                <select name="project_id" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" required>
                  <option value="none">General (No project)</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea name="description" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 h-20 resize-none" placeholder="Brief description of the expense..." required></textarea>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Proof / Receipt Document <span className="text-xs text-slate-400 font-normal">(Optional)</span></label>
                <input
                  type="file"
                  name="document"
                  accept="image/*,application/pdf"
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer border border-slate-200 rounded-lg p-1"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-primary-600 hover:bg-primary-700">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log Expense"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <CategoryManagerModal
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        onCategoriesChange={handleCategoriesUpdated}
      />
    </>
  );
};

export default ExpenseModal;

