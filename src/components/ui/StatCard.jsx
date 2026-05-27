import React from 'react';
import { Card, CardContent } from './Card';
import { cn } from '../../utils/cn';

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  subtext,
  className
}) => (
  <Card className={cn(
    "hover:shadow-md transition-shadow border-slate-200",
    className
  )}>
    <CardContent className="p-5">
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider min-h-[2rem]">
          {title}
        </p>

        <div className="flex items-center justify-between mt-1">
          <p className="text-2xl font-bold text-slate-900">
            {value}
          </p>

          {Icon && (
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <Icon className="w-5 h-5 text-slate-600" />
            </div>
          )}
        </div>
      </div>

      {(trend || subtext) && (
        <div className="mt-4 flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded",
                trend.toString().startsWith('+')
                  ? "text-emerald-600 bg-emerald-50"
                  : "text-rose-600 bg-rose-50"
              )}
            >
              {trend}
            </span>
          )}

          {subtext && (
            <span className="text-xs text-slate-400 font-medium">
              {subtext}
            </span>
          )}
        </div>
      )}
    </CardContent>
  </Card>
);

export default StatCard;