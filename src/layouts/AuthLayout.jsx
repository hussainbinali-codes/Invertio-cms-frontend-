import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-primary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-xl p-10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/20">
        <div className="flex flex-col items-center">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-50 mb-6">
            <img src="/invertio_logo.png" alt="Invertio Logo" className="h-16 w-auto object-contain" />
          </div>
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-xs font-medium text-slate-400 uppercase tracking-widest">
            Unified Management Portal
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
