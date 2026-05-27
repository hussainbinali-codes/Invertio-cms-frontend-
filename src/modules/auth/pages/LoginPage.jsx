import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../../api/axios';
import Input from '../../../components/ui/Input';
import { Mail, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await axios.post('/auth/login', formData);
      navigate('/verify-otp', { state: { email: formData.email } });
      toast.success('OTP sent successfully');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to login. Please check your credentials.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="w-full">
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <Input 
            label="Email Address"
            name="email"
            type="email"
            required
            placeholder="you@company.com"
            icon={Mail}
            value={formData.email}
            onChange={handleChange}
          />
          <Input 
            label="Password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            icon={Lock}
            value={formData.password}
            onChange={handleChange}
          />
        </div>

        <div className="flex items-center justify-end">
          <Link to="/forgot-password" size="sm" className="text-[11px] font-bold text-primary-600 hover:text-primary-700 uppercase tracking-widest transition-colors">
            Forgot password?
          </Link>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 shadow-lg shadow-primary-200 disabled:opacity-70 disabled:shadow-none"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in to Dashboard'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
