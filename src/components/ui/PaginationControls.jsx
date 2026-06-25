import React from 'react';
import Button from './Button';

const PaginationControls = ({
  pagination,
  itemCount,
  onPrevious,
  onNext,
  className = ''
}) => {
  const page = pagination?.page || 1;
  const total = pagination?.total || 0;
  const totalPages = pagination?.totalPages || 1;
  const hasPreviousPage = Boolean(pagination?.hasPreviousPage);
  const hasNextPage = Boolean(pagination?.hasNextPage);

  if (total === 0) {
    return null;
  }

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 px-6 border-t border-slate-100 bg-slate-50/30 ${className}`.trim()}>
      <div className="space-y-1">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Showing {itemCount} of {total} records
        </div>
        <div className="text-xs font-medium text-slate-400">
          Page {page} of {totalPages}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="text-xs font-medium text-slate-500 mr-2">Total records: {total}</div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs font-bold uppercase tracking-wider"
          disabled={!hasPreviousPage}
          onClick={onPrevious}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs font-bold uppercase tracking-wider"
          disabled={!hasNextPage}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default PaginationControls;
