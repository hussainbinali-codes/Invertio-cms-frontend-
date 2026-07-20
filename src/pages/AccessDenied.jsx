import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

const AccessDenied = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <ShieldAlert className="w-10 h-10 text-rose-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Access Denied</h1>
            <p className="text-slate-500 max-w-md mb-8">
                You don't have the required permissions to access this section. 
                Please contact your administrator if you believe this is an error.
            </p>
            <Button 
                onClick={() => navigate('/leaves')} 
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go back to My Time Off
            </Button>
        </div>
    );
};

export default AccessDenied;
