import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, Shield, ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';

const UserDropdown = ({ user, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const menuItems = [
        { label: 'View Profile', icon: User, path: '/profile', color: 'text-slate-600' },
        { label: 'Account Settings', icon: Settings, path: '/settings', color: 'text-slate-600' },
    ];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100/60"
            >
                <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="flex flex-col items-start hidden sm:flex text-left">
                    <span className="text-xs font-bold text-slate-800 leading-tight">{user?.name || 'Admin'}</span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest font-mono mt-0.5">{user?.role_name || 'Staff'}</span>
                </div>
                <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-slate-200/50 p-1.5 rounded-[1.75rem] border border-slate-200/20 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="bg-white rounded-[calc(1.75rem-0.375rem)] border border-slate-200/20 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 bg-slate-50/50 border-b border-slate-100 text-left">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest font-mono">Signed in as</span>
                            <p className="text-xs font-bold text-slate-900 truncate mt-1">{user?.email}</p>
                        </div>
                        <div className="p-2 space-y-1">
                            {menuItems.map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() => {
                                        navigate(item.path);
                                        setIsOpen(false);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all group text-left"
                                >
                                    <item.icon className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        <div className="p-2 border-t border-slate-100 bg-slate-50/20">
                            <button
                                onClick={() => {
                                    onLogout();
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50/60 rounded-xl transition-all group text-left"
                            >
                                <LogOut className="w-4 h-4 text-rose-400 group-hover:text-rose-600 transition-colors" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDropdown;
