import React, { useState } from 'react';
import axios from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Lock, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error('New passwords do not match');
    }

    setLoading(true);
    try {
      await axios.post('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      toast.success('Password updated successfully');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Security Settings</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Manage your account security and authentication preferences.</p>
      </div>

      <Card className="rounded-[2rem] border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="py-6 border-b border-slate-50 bg-slate-50/50">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary-600" />
            Update Security Credentials
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 bg-primary-50 border border-primary-100 rounded-2xl flex gap-3 items-start">
              <ShieldCheck className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-primary-900 leading-relaxed font-medium">
                Ensure your new password contains at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character.
              </p>
            </div>

            <Input 
                label="Current Password"
                name="currentPassword"
                type="password"
                required
                placeholder="Enter current password"
                icon={Lock}
                value={formData.currentPassword}
                onChange={handleChange}
            />

            <Input 
                label="New Password"
                name="newPassword"
                type="password"
                required
                placeholder="Minimum 8 characters"
                icon={Lock}
                value={formData.newPassword}
                onChange={handleChange}
            />

            <Input 
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                required
                placeholder="Repeat new password"
                icon={Lock}
                value={formData.confirmPassword}
                onChange={handleChange}
            />

            <div className="pt-4 border-t border-slate-50 flex justify-end">
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary-600 hover:bg-primary-700 text-white font-bold h-12 px-10 rounded-xl shadow-lg shadow-primary-100 transition-all active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-slate-50 border-slate-200 rounded-[2rem]">
        <CardContent className="p-6 flex gap-4 items-center">
           <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-slate-400" />
           </div>
           <div>
              <p className="text-sm font-bold text-slate-900">Need help with your account?</p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Contact the IT administration team if you've lost access or suspect unauthorized activity.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
