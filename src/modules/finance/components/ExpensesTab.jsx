import React, { useState } from 'react';
import PremiumCard from '../../../components/ui/PremiumCard';
import Table, { TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import { Search, TrendingDown, Tag } from 'lucide-react';
import CategoryManagerModal from './CategoryManagerModal';

const ExpensesTab = ({
  expenses,
  expenseSearch,
  setExpenseSearch,
  expenseCategoryFilter,
  setExpenseCategoryFilter,
  currencies,
  categories = [],
  onCategoriesChange
}) => {
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // Derive unique categories from categories prop or expenses list
  const categoryOptions = React.useMemo(() => {
    const list = new Set();
    categories.forEach(c => list.add(c.name));
    expenses.forEach(e => { if (e.category) list.add(e.category); });
    return Array.from(list).sort();
  }, [categories, expenses]);

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.description?.toLowerCase().includes(expenseSearch.toLowerCase()) || 
                        exp.project_name?.toLowerCase().includes(expenseSearch.toLowerCase()) ||
                        exp.category?.toLowerCase().includes(expenseSearch.toLowerCase());
    const matchesCategory = expenseCategoryFilter === 'All' || exp.category === expenseCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <PremiumCard 
        title="General Expenses" 
        subtitle="Tracking operational and project-specific spend." 
        icon={TrendingDown}
        className="animate-in fade-in slide-in-from-bottom-2 duration-300"
        headerRight={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search expenses..." 
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:ring-primary-500 w-full sm:w-64 bg-white"
              />
            </div>
            <select 
              value={expenseCategoryFilter}
              onChange={(e) => setExpenseCategoryFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 py-2 px-3 focus:ring-primary-500 bg-white font-medium"
            >
              <option value="All">All Categories</option>
              {categoryOptions.map(catName => (
                <option key={catName} value={catName}>{catName}</option>
              ))}
            </select>
            <button
              onClick={() => setShowCategoryManager(true)}
              className="px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
              title="Manage Categories"
            >
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              Categories
            </button>
          </div>
        }
      >
        <div className="flex-grow">
           <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-4">Category</TableHead>
                  <TableHead className="py-4">Project</TableHead>
                  <TableHead className="py-4">Description</TableHead>
                  <TableHead className="py-4">Amount</TableHead>
                  <TableHead className="py-4">Date</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-slate-500">No expenses found.</TableCell></TableRow>
                ) : (
                  filteredExpenses.map(exp => (
                    <TableRow key={exp.id}>
                      <TableCell className="py-5"><Badge variant="outline" className="text-xs font-semibold text-slate-500">{exp.category}</Badge></TableCell>
                      <TableCell className="py-5 font-bold text-slate-800 text-sm">{exp.project_name || 'General'}</TableCell>
                      <TableCell className="py-5 text-xs text-slate-600 max-w-xs truncate">{exp.description}</TableCell>
                      <TableCell className="py-5 font-bold text-rose-600 font-mono">
                        -{currencies.find(c => c.code === exp.currency)?.symbol || '$'}
                        {exp.amount?.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-5 text-sm font-normal text-slate-500 font-mono">{new Date(exp.date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </tbody>
           </Table>
        </div>
      </PremiumCard>

      <CategoryManagerModal
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        onCategoriesChange={onCategoriesChange}
      />
    </>
  );
};

export default ExpensesTab;

