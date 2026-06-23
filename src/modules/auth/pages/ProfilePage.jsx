import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { User, Mail, Shield, Calendar, Loader2, Briefcase, Building } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../../utils/cn';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/auth/me');
      setProfile(res.data.data);
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Profile...</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Clean Profile Header */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="h-32 bg-slate-50 border-b border-slate-100" />
        <div className="px-8 pb-8">
          <div className="relative flex flex-col md:flex-row md:items-end gap-6 -mt-12">
            <div className="w-32 h-32 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg ring-4 ring-white">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 pb-2">
              <h1 className="text-3xl font-bold text-slate-900">{profile.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-slate-500 text-sm font-medium">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-slate-400" />
                  {profile.role_name}
                </div>
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  {profile.designation || 'Staff'}
                </div>
                <div className="flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-slate-400" />
                  {profile.department || 'General'}
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  {profile.employee_id || 'No Employee ID'}
                </div>
              </div>
            </div>
            <div className="pb-2">
              <Badge variant={profile.status === 'Active' ? 'success' : 'default'}>
                {profile.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm rounded-2xl">
            <CardHeader className="border-b border-slate-100 py-5">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <User className="w-5 h-5 text-primary-600" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                <div className="p-6 space-y-6">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</p>
                    <p className="text-sm font-bold text-slate-700">{profile.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</p>
                    <p className="text-sm font-bold text-slate-700">{profile.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Employee ID</p>
                    <p className="text-sm font-bold text-slate-700">{profile.employee_id || 'N/A'}</p>
                  </div>
                </div>
                <div className="p-6 space-y-6 bg-slate-50/30">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Department</p>
                    <p className="text-sm font-bold text-slate-700">{profile.department || 'Operations'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Designation</p>
                    <p className="text-sm font-bold text-slate-700">{profile.designation || profile.role_name}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>


          <Card className="border-slate-200 shadow-sm rounded-2xl">
            <CardHeader className="border-b border-slate-100 py-5">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                Employment Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        <Calendar className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Created</p>
                        <p className="text-sm font-bold text-slate-700">
                          {new Date(profile.created_at).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Briefcase className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Joining Date</p>
                        <p className="text-sm font-bold text-slate-700">
                          {profile.joining_date ? new Date(profile.joining_date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </p>
                     </div>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Account Status</h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                  <span className="text-xs text-slate-500 font-medium">Role</span>
                  <span className="text-xs font-bold text-slate-700">{profile.role_name}</span>
               </div>
               <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                  <span className="text-xs text-slate-500 font-medium">System ID</span>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{profile.id.split('-')[0]}...</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-medium">Clearance</span>
                  <Badge variant="success">Active</Badge>
               </div>
            </div>
          </Card>

          <div className="bg-primary-600 rounded-2xl p-6 text-white">
             <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-primary-200" />
                <h4 className="text-sm font-bold">Privacy Notice</h4>
             </div>
             <p className="text-[11px] text-primary-100 leading-relaxed font-medium">
                Confidential data such as detailed permissions and financial records are restricted from this personal view for security purposes.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const Badge = ({ children, variant = 'default', className }) => {
  const variants = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    default: 'bg-slate-100 text-slate-600 border-slate-200'
  };
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border", variants[variant], className)}>
      {children}
    </span>
  );
};

export default ProfilePage;
