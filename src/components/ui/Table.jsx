import React from 'react';
import { cn } from '../../utils/cn';

export const Table = ({ className, children, ...props }) => {
  return (
    <div className="overflow-x-auto w-full custom-scrollbar">
      <table className={cn('w-full text-sm text-left text-slate-600 border-collapse', className)} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader = ({ className, children, ...props }) => (
  <thead className={cn('bg-slate-50/50 border-b border-slate-200/65', className)} {...props}>
    {children}
  </thead>
);

export const TableRow = ({ className, children, ...props }) => (
  <tr className={cn('bg-white border-b border-slate-100 hover:bg-slate-50/40 transition-colors duration-150', className)} {...props}>
    {children}
  </tr>
);

export const TableHead = ({ className, children, ...props }) => (
  <th scope="col" className={cn('px-6 py-3.5 text-sm font-normal uppercase text-slate-500 tracking-wider', className)} {...props}>
    {children}
  </th>
);

export const TableCell = ({ className, children, ...props }) => (
  <td className={cn('px-6 py-4 whitespace-nowrap text-sm font-normal text-slate-600', className)} {...props}>
    {children}
  </td>
);

export default Table;
