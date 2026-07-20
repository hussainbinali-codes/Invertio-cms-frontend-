import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-blue-50/50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Outer bezel shell */}
      <div className="bg-slate-200/40 p-1.5 rounded-[2.5rem] border border-slate-200/20 w-full max-w-md">
        {/* Inner bezel card face */}
        <div className="bg-white p-10 rounded-[calc(2.5rem-0.375rem)] border border-slate-200/25 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_12px_40px_-20px_rgba(0,0,0,0.06)] flex flex-col">
          <div className="flex flex-col items-center">
            {/* Logo container */}
            <div className="bg-slate-200/40 p-1 rounded-2xl border border-slate-200/20 mb-6">
              <div className="bg-white px-5 py-4 rounded-[calc(1rem)] border border-slate-100/60 shadow-sm">
                <img src="/invertio_logo.png" alt="Invertio Logo" className="h-12 w-auto object-contain" />
              </div>
            </div>
            
            <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 mt-4">
              Welcome Back
            </h2>
            <p className="mt-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Unified CMS Governance
            </p>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
