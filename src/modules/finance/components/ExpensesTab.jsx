import React from 'react';
import PremiumCard from '../../../components/ui/PremiumCard';
import Table, { TableHeader, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import { Search, TrendingDown } from 'lucide-react';

const ExpensesTab = ({
  expenses,
  expenseSearch,
  setExpenseSearch,
  expenseCategoryFilter,
  setExpenseCategoryFilter,
  currencies
}) => {
  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.description?.toLowerCase().includes(expenseSearch.toLowerCase()) || 
                        exp.project_name?.toLowerCase().includes(expenseSearch.toLowerCase()) ||
                        exp.category?.toLowerCase().includes(expenseSearch.toLowerCase());
    const matchesCategory = expenseCategoryFilter === 'All' || exp.category === expenseCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
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
              className="pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:ring-primary-500 w-full sm:w-64"
            />
          </div>
          <select 
            value={expenseCategoryFilter}
            onChange={(e) => setExpenseCategoryFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 py-2 focus:ring-primary-500"
          >
            <option value="All">All Categories</option>
            <option value="Marketing">Marketing</option>
            <option value="Software">Software</option>
            <option value="Hardware">Hardware</option>
            <option value="Office">Office</option>
            <option value="Marketing">Marketing</option>
            <option value="Travel">Travel</option>
            <option value="Vendor">Vendor</option>
            <option value="Utilities">Utilities</option>
            <option value="Other">Other</option>
          </select>
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
  );
};

export default ExpensesTab;
