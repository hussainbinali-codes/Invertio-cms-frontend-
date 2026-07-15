import React from 'react';
import { cn } from '../../utils/cn';

export const PremiumCard = ({ title, subtitle, icon: Icon, children, className, headerRight }) => {
  return (
    <div className={cn("bg-slate-200/30 p-1.5 rounded-[2rem] border border-slate-200/10", className)}>
      <div className="bg-white rounded-[calc(2rem-0.375rem)] border border-slate-200/20 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_4px_16px_-8px_rgba(0,0,0,0.02)] overflow-hidden h-full flex flex-col text-left">
        {(title || subtitle) && (
          <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <Icon className="w-4 h-4 text-slate-500" />
                </div>
              )}
              <div>
                {title && <h3 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h3>}
                {subtitle && <p className="text-xs text-slate-500 mt-1 font-normal">{subtitle}</p>}
              </div>
            </div>
            {headerRight}
          </div>
        )}
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PremiumCard;
