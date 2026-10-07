import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Calendar as CalendarIcon, X } from 'lucide-react';
import { cn } from '../../utils/cn';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

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
  startDate,
  endDate,
  onChange,
  className,
  placeholder = "Select date range"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Month currently displayed in calendar view
  const [viewDate, setViewDate] = useState(() => {
    if (endDate) {
      const parts = endDate.split('-').map(Number);
      return new Date(parts[0], parts[1] - 1, 1);
    }
    if (startDate) {
      const parts = startDate.split('-').map(Number);
      return new Date(parts[0], parts[1] - 1, 1);
    }
    return new Date();
  });

  // Range selection temporary state while selecting
  const [tempStart, setTempStart] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);

  // Sync viewDate when popover opens
  useEffect(() => {
    if (isOpen) {
      if (endDate) {
        const parts = endDate.split('-').map(Number);
        setViewDate(new Date(parts[0], parts[1] - 1, 1));
      } else if (startDate) {
        const parts = startDate.split('-').map(Number);
        setViewDate(new Date(parts[0], parts[1] - 1, 1));
      }
      setTempStart(null);
      setHoveredDate(null);
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setTempStart(null);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  // Build grid of days
  const calendarDays = React.useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days = [];

    // Preceding month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(viewYear, viewMonth - 1, d);
      days.push({
        day: d,
        dateStr: toDateString(prevDate.getFullYear(), prevDate.getMonth(), d),
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      days.push({
        day: d,
        dateStr: toDateString(viewYear, viewMonth, d),
        isCurrentMonth: true
      });
    }

    // Trailing next month days (fill up to total multiple of 7)
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remaining = totalSlots - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(viewYear, viewMonth + 1, d);
      days.push({
        day: d,
        dateStr: toDateString(nextDate.getFullYear(), nextDate.getMonth(), d),
        isCurrentMonth: false
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  const handleDateClick = (dateStr) => {
    if (!tempStart) {
      // First click: sets start date
      setTempStart(dateStr);
    } else {
      // Second click: completes range
      let finalStart = tempStart;
      let finalEnd = dateStr;
      if (finalStart > finalEnd) {
        [finalStart, finalEnd] = [finalEnd, finalStart];
      }
      onChange({ startDate: finalStart, endDate: finalEnd });
      setTempStart(null);
      setIsOpen(false);
    }
  };

  // Effective bounds for display
  const effectiveStart = tempStart || startDate;
  const effectiveEnd = tempStart ? (hoveredDate || tempStart) : endDate;

  const actualStart = effectiveStart && effectiveEnd && effectiveStart > effectiveEnd ? effectiveEnd : effectiveStart;
  const actualEnd = effectiveStart && effectiveEnd && effectiveStart > effectiveEnd ? effectiveStart : effectiveEnd;

  // Preset helpers
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
      setTempStart(null);
    }
    setIsOpen(false);
  };

  const displayText = startDate && endDate
    ? `${formatDateDisplay(startDate)} - ${formatDateDisplay(endDate)}`
    : startDate
      ? `${formatDateDisplay(startDate)} - ...`
      : placeholder;

  return (
    <div className={cn("relative inline-block text-left", className)} ref={containerRef}>
      {/* Trigger Button styled exactly as the screenshot */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={cn(
          "bg-white border border-slate-200/80 rounded-md sm:rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs hover:bg-slate-50 transition-all flex items-center justify-between gap-3 cursor-pointer min-w-[200px]",
          isOpen && "ring-2 ring-blue-500/20 border-blue-500"
        )}
      >
        <span className="whitespace-nowrap font-medium text-slate-800">
          {displayText}
        </span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ml-auto", isOpen && "rotate-180")} />
      </button>

      {/* Popover Calendar Modal */}
      {isOpen && (
        <div className="absolute right-0 mt-2 z-50 bg-white border border-slate-200/90 rounded-2xl shadow-xl p-4 w-[290px] animate-in fade-in zoom-in-95 duration-150 select-none">
          {/* Calendar Header with Navigation */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-semibold text-slate-900">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h3>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Labels (Su, Mo, Tu, We, Th, Fr, Sa) */}
          <div className="grid grid-cols-7 gap-0 text-center mb-1">
            {WEEK_DAYS.map((wd) => (
              <span key={wd} className="text-[11px] font-medium text-slate-400 py-1">
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {calendarDays.map((item, idx) => {
              const { day, dateStr, isCurrentMonth } = item;

              const isStart = actualStart === dateStr;
              const isEnd = actualEnd === dateStr;
              const isBetween = actualStart && actualEnd && dateStr > actualStart && dateStr < actualEnd;

              const colIndex = idx % 7;
              const isRowStart = colIndex === 0;
              const isRowEnd = colIndex === 6;

              return (
                <div
                  key={`${dateStr}-${idx}`}
                  className={cn(
                    "relative py-0.5 flex items-center justify-center",
                    // Continuous grey background bar connecting the range
                    isBetween && "bg-slate-100",
                    isStart && actualEnd && actualStart !== actualEnd && (colIndex !== 6 ? "bg-gradient-to-r from-transparent 50% to-slate-100 50%" : ""),
                    isEnd && actualStart && actualStart !== actualEnd && (colIndex !== 0 ? "bg-gradient-to-l from-transparent 50% to-slate-100 50%" : ""),
                    // Rounded ends on row boundaries
                    isBetween && isRowStart && "rounded-l-full",
                    isBetween && isRowEnd && "rounded-r-full"
                  )}
                  onMouseEnter={() => tempStart && setHoveredDate(dateStr)}
                >
                  <button
                    type="button"
                    onClick={() => handleDateClick(dateStr)}
                    className={cn(
                      "w-8 h-8 rounded-full text-xs transition-all flex items-center justify-center font-medium cursor-pointer relative z-10",
                      // Selected Start / End circular badge (matches dark badge in screenshot)
                      (isStart || isEnd) && "bg-slate-900 text-white font-semibold shadow-sm hover:bg-slate-800",
                      // In-between days
                      isBetween && "text-slate-800 hover:bg-slate-200/80 rounded-full",
                      // Normal unselected day
                      !isStart && !isEnd && !isBetween && (
                        isCurrentMonth
                          ? "text-slate-700 hover:bg-slate-100"
                          : "text-slate-300 hover:bg-slate-50"
                      )
                    )}
                  >
                    {day}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Presets and Clear Footer */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset('month')}
                className="px-2 py-1 rounded-md text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => applyPreset('year')}
                className="px-2 py-1 rounded-md text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                This Year
              </button>
            </div>

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => applyPreset('clear')}
                className="text-[11px] font-medium text-rose-600 hover:text-rose-700 hover:underline px-1 py-0.5"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
