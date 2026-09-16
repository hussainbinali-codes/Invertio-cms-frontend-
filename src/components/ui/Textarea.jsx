import React, { useRef, useImperativeHandle } from 'react';
import { cn } from '../../utils/cn';

const Textarea = React.forwardRef(({ className, label, error, onInput, rows = 1, ...props }, ref) => {
  const innerRef = useRef(null);
  useImperativeHandle(ref, () => innerRef.current);

  const handleInput = (e) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
    if (onInput) onInput(e);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-slate-800 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={innerRef}
        rows={rows}
        onInput={handleInput}
        className={cn(
          'flex min-h-[42px] max-h-[200px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50 transition-[border-color,box-shadow] shadow-sm resize-none overflow-y-auto',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/10',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
