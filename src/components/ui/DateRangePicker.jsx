import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return dateStr;
  const monthName = SHORT_MONTHS[m - 1] || '';
  const shortYear = String(y).slice(-2);
  return `${monthName} ${d} '${shortYear}`;
};

export const toDateString = (year, month, day) => {
  const y = String(year);
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const DateRangePicker = ({
  startDate = '',
  endDate = '',
  onChange,
  className,
  placeholder = "Date Range"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Quick preset handlers
  const applyPreset = (preset) => {
    const today = new Date();
    const currYear = today.getFullYear();
    const currMonth = today.getMonth();

    if (preset === 'today') {
      const s = toDateString(currYear, currMonth, today.getDate());
      onChange({ startDate: s, endDate: s });
    } else if (preset === 'month') {
      const lastDay = new Date(currYear, currMonth + 1, 0).getDate();
      onChange({
        startDate: toDateString(currYear, currMonth, 1),
        endDate: toDateString(currYear, currMonth, lastDay)
      });
    } else if (preset === 'year') {
      onChange({
        startDate: `${currYear}-01-01`,
        endDate: `${currYear}-12-31`
      });
    } else if (preset === 'clear') {
      onChange({ startDate: '', endDate: '' });
    }
  };

  const displayText = startDate && endDate
    ? `${formatDateDisplay(startDate)} - ${formatDateDisplay(endDate)}`
    : startDate
      ? `From ${formatDateDisplay(startDate)}`
      : placeholder;

  const isCustomRangeActive = Boolean(startDate || endDate);

  return (
    <div className={cn("relative inline-block text-left", className)} ref={containerRef}>
      {/* Trigger Button: 'Date Range' with Down Arrow */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={cn(
          "bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 shadow-2xs hover:bg-slate-50 transition-all flex items-center justify-between gap-2.5 cursor-pointer min-w-[140px]",
          isOpen && "ring-2 ring-blue-500/20 border-blue-500",
          isCustomRangeActive && "border-slate-300 font-semibold"
        )}
      >
        <div className="flex items-center gap-1.5 truncate">
          <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{displayText}</span>
        </div>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ml-1",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Popover with Two Normal From and To Calendars */}
      {isOpen && (
        <div className="absolute right-0 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-4 w-72 animate-in fade-in zoom-in-95 duration-150 select-none">
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-800">Date Range</span>
            {isCustomRangeActive && (
              <button
                type="button"
                onClick={() => applyPreset('clear')}
                className="text-[11px] font-medium text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Two Normal Calendar Inputs: From and To */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onChange({ startDate: e.target.value, endDate })}
                className="w-full text-xs rounded-lg border border-slate-200 py-1.5 px-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => onChange({ startDate, endDate: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-200 py-1.5 px-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-2xs"
              />
            </div>
          </div>

          {/* Quick Presets & Action Buttons */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => applyPreset('month')}
                className="px-2 py-1 rounded-md text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => applyPreset('year')}
                className="px-2 py-1 rounded-md text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                This Year
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-[11px] font-medium transition-colors cursor-pointer shadow-2xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
