import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from '../../../api/axios';
import Input from '../../../components/ui/Input';
import { Lock, Loader2, ArrowLeft, KeySquare } from 'lucide-react';
import toast from 'react-hot-toast';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [formData, setFormData] = useState({
    email: state?.email || '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    setIsLoading(true);
    try {
      await axios.post('/auth/reset-password', formData);
      toast.success('Password reset successfully. Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <Link to="/forgot-password" className="text-primary-600 hover:text-primary-700 text-sm font-bold flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Create New Password</h2>
        <p className="text-slate-500 text-sm mt-2 font-medium">Enter the code sent to your email and your new password.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input 
            label="Email Address"
            name="email"
            type="email"
            readOnly
            className="bg-slate-50 text-slate-500"
            value={formData.email}
        />

        <Input 
            label="Reset Code"
            name="code"
            type="text"
            required
            maxLength={6}
            placeholder="6-digit code"
            icon={KeySquare}
            value={formData.code}
            onChange={handleChange}
        />

        <Input 
            label="New Password"
            name="newPassword"
            type="password"
            required
            placeholder="••••••••"
            icon={Lock}
            value={formData.newPassword}
            onChange={handleChange}
        />

        <Input 
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            required
            placeholder="••••••••"
            icon={Lock}
            value={formData.confirmPassword}
            onChange={handleChange}
        />

        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 focus:outline-none transition-all duration-200 shadow-lg shadow-primary-200 disabled:opacity-70"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Security Credentials'}
        </button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
