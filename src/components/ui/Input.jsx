import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { Eye, EyeOff } from 'lucide-react';

const Input = React.forwardRef(({ className, label, error, icon: Icon, type, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full group/input">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
            <Icon className="h-4 w-4 text-slate-400 cursor-pointer group-focus-within/input:text-primary-500 transition-colors" />
          </div>
        )}
        <input
          ref={ref}
          type={inputType}
          onKeyPress={(e) => {
            if (type === 'tel') {
              if (!/[0-9+]/.test(e.key)) {
                e.preventDefault();
              }
            }
            if (props.onKeyPress) props.onKeyPress(e);
          }}
          onInput={(e) => {
            if (type === 'tel') {
              let val = e.target.value;
              val = val.replace(/[^0-9+]/g, '');
              if (val.includes('+')) {
                const parts = val.split('+');
                val = '+' + parts.join('');
              }
              if (val.length > 14) val = val.slice(0, 14);
              e.target.value = val;
            }
            if (props.onInput) props.onInput(e);
          }}
          className={cn(
            'flex w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm',
            Icon && 'pl-10',
            isPassword && 'pr-12',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/10',
            className
          )}
          {...props}
        />
        {isPassword && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-1 z-20">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowPassword(!showPassword);
              }}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-primary-600 transition-all cursor-pointer flex items-center justify-center mr-1"
              title={showPassword ? "Hide password" : "Show password"}
              style={{ minWidth: '40px', minHeight: '40px' }}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" strokeWidth={2.5} />
              ) : (
                <Eye className="h-5 w-5" strokeWidth={2.5} />
              )}
            </button>
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-bold text-red-500">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
