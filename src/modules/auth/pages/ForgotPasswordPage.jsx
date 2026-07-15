import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../../api/axios';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post('/auth/forgot-password', { email });
      toast.success('Reset OTP sent to your email');
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <Link to="/login" className="text-primary-600 hover:text-primary-700 text-sm font-bold flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Forgot Password?</h2>
        <p className="text-slate-500 text-sm mt-2">Enter your email to receive a password reset code.</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="email"
              type="email"
              required
              className="appearance-none rounded-lg relative block w-full px-3 py-2 pl-10 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 focus:outline-none transition-all duration-200 shadow-lg shadow-primary-200 disabled:opacity-70"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Code'}
        </button>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
