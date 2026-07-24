import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { X, Plus, Edit2, Trash2, Check, Loader2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';

/**
 * CategoryManagerModal: Modal for adding, editing, and deleting Expense Categories.
 */
const CategoryManagerModal = ({ isOpen, onClose, onCategoriesChange }) => {
  useLockBodyScroll(isOpen);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/finance/expense-categories');
      const data = res.data.data || [];
      setCategories(data);
      if (onCategoriesChange) onCategoriesChange(data);
    } catch (err) {
      toast.error('Failed to load expense categories');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error('Category name is required.');
      return;
    }

    setIsAdding(true);
    try {
      await axios.post('/finance/expense-categories', {
        name: newCategoryName.trim(),
        description: newCategoryDesc.trim()
      });
      toast.success(`Category "${newCategoryName.trim()}" added successfully!`);
      setNewCategoryName('');
      setNewCategoryDesc('');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add category');
    } finally {
      setIsAdding(false);
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDesc(cat.description || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDesc('');
  };

  const handleSaveEdit = async (id) => {
    if (!editName.trim()) {
      toast.error('Category name cannot be empty.');
      return;
    }

    setIsSavingEdit(true);
    try {
      await axios.put(`/finance/expense-categories/${id}`, {
        name: editName.trim(),
        description: editDesc.trim()
      });
      toast.success('Category updated successfully!');
      cancelEdit();
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update category');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the "${name}" category?`)) {
      return;
    }

    try {
      await axios.delete(`/finance/expense-categories/${id}`);
      toast.success(`Category "${name}" deleted.`);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 text-slate-900 overflow-y-auto">
      <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] border border-slate-100">
        
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-xl text-primary-600">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Manage Expense Categories</CardTitle>
              <p className="text-xs text-slate-500 font-medium">Add, rename, or update category labels.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 duration-200">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/30">
          
          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Add New Category</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Category Name (e.g. Subscriptions)"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <input
                type="text"
                placeholder="Description (Optional)"
                value={newCategoryDesc}
                onChange={(e) => setNewCategoryDesc(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex justify-end pt-1">
              <Button type="submit" disabled={isAdding} size="sm" className="bg-primary-600 hover:bg-primary-700 text-xs font-bold px-4">
                {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                Add Category
              </Button>
            </div>
          </form>

          {/* Categories List */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block px-1">
              Existing Categories ({categories.length})
            </span>

            {loading ? (
              <div className="p-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                Loading categories...
              </div>
            ) : categories.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-100">
                No expense categories found.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <div key={cat.id} className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-sm hover:border-primary-200 transition-colors">
                    {editingId === cat.id ? (
                      /* Edit Mode */
                      <div className="flex-1 flex flex-col sm:flex-row gap-2 items-center w-full">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full sm:w-1/2 text-xs px-2.5 py-1.5 rounded-lg border border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold"
                          autoFocus
                        />
                        <input
                          type="text"
                          value={editDesc}
                          placeholder="Optional note"
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full sm:w-1/2 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-600"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleSaveEdit(cat.id)}
                            disabled={isSavingEdit}
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1.5 bg-slate-50 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode */
                      <>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{cat.name}</p>
                          {cat.description && (
                            <p className="text-[11px] text-slate-500 truncate">{cat.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => startEdit(cat)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </CardContent>

        <div className="bg-slate-50 border-t border-slate-100 p-4 flex justify-end">
          <Button variant="secondary" onClick={onClose} className="text-xs font-bold">
            Done
          </Button>
        </div>

      </Card>
    </div>
  );
};

export default CategoryManagerModal;
