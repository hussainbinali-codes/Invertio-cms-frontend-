import React from 'react';
import { cn } from '../../utils/cn';

export const KpiCard = ({ title, value, icon: Icon, subtext, trend, valueClassName, iconClassName, className }) => {
  return (
    <div className={cn("bg-slate-200/40 p-0.5 rounded-xl border border-slate-200/20 hover:bg-slate-200/60 active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group hover:-translate-y-0.5 flex-1 min-w-0", className)}>
      <div className="bg-white px-3 py-2 rounded-[10px] border border-slate-200/25 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_8px_-4px_rgba(0,0,0,0.03)] h-full flex flex-col justify-between text-left">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-none">
              {title}
            </span>
            {Icon && (
              <div className={cn("p-1 bg-slate-50 border border-slate-100/60 rounded-md group-hover:scale-105 transition-transform duration-300", iconClassName)}>
                <Icon className="w-3.5 h-3.5 text-slate-500" />
              </div>
            )}
          </div>
          
          <div className="mt-1.5 min-w-0">
            <span 
              className={cn("text-base sm:text-lg font-medium text-slate-800 tracking-tight font-sans block truncate", valueClassName)} 
              title={typeof value === 'string' || typeof value === 'number' ? value : ''}
            >
              {value}
            </span>
          </div>
        </div>

        {(trend || subtext) && (
          <div className="mt-1.5 flex items-center gap-1.5">
            {trend && (
              <span className={cn(
                "text-[10px] font-medium px-1.5 py-0.5 rounded font-mono",
                trend.startsWith('+') ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
              )}>
                {trend}
              </span>
            )}
            {subtext && (
              <span className="text-[10.5px] text-slate-400 font-normal">
                {subtext}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KpiCard;
