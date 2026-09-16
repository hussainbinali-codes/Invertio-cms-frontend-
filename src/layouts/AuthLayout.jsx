import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 font-sans">
      
      {/* LEFT HALF: 50% Branded Showcase Panel (Visible on lg+ screens) */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 xl:p-16 bg-gradient-to-br from-slate-950 via-slate-900 to-primary-950 text-white overflow-hidden shrink-0">
        {/* Background ambient glows & architectural grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415518_1px,transparent_1px),linear-gradient(to_bottom,#33415518_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Invertio Logo & CMS Portal side-by-side */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg flex items-center justify-center">
            <img src="/invertio_logo_short.png" alt="Invertio Logo" className="h-10 w-auto object-contain brightness-110" />
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-black tracking-tight text-white">Invertio</span>
              <span className="px-2.5 py-0.5 text-xs font-black uppercase tracking-wider bg-primary-500 text-white rounded-md shadow-xs">
                CMS Portal
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium tracking-wide mt-0.5">
              Unified Enterprise Management System
            </span>
          </div>
        </div>

        {/* Center: Content container ready for user text */}
        <div className="relative z-10 my-auto py-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-400/20 text-primary-300 text-xs font-medium mb-6 backdrop-blur-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
            Centralized Business Operations
          </div>
          <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight">
            Empowering seamless workflows, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-blue-300 to-indigo-200">
              from client briefs to final delivery.
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-4 leading-relaxed font-normal">
            A single unified system for managing projects, pipelines, clients, team performance, and finance.
          </p>
        </div>

        {/* Bottom container */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} Invertio. All rights reserved.</span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            System Operational
          </span>
        </div>
      </div>

      {/* RIGHT HALF: 50% Auth Form Panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center min-h-screen p-6 sm:p-10 xl:p-16 bg-slate-50/70">
        
        {/* Mobile-Only Header (Shows on smaller viewports) */}
        <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
          <div className="p-1.5 rounded-xl bg-white border border-slate-100 shadow-xs">
            <img src="/invertio_logo_short.png" alt="Invertio Logo" className="h-8 w-auto object-contain" />
          </div>
          <div className="h-7 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-slate-900 tracking-tight">Invertio</span>
            <span className="px-2 py-0.5 text-xs font-black uppercase tracking-wider bg-primary-600 text-white rounded-md">
              CMS Portal
            </span>
          </div>
        </div>

        {/* Form Container Card */}
        <div className="w-full max-w-md bg-white p-7 sm:p-9 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/40">
          <Outlet />
        </div>
      </div>

    </div>
  );
};

export default AuthLayout;
