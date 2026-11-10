import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../../api/axios';
import Input from '../../../components/ui/Input';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateEmail = (emailVal) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await axios.post('/auth/forgot-password', { email });
      toast.success('Reset OTP sent to your email');
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send reset code';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sign In
        </Link>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Forgot Password?</h2>
        <p className="text-xs text-slate-500 font-medium mt-1">Enter your registered work email address and we'll send you an authentication code to securely regain access.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}
        <Input
          label="Registered Work Email"
          name="email"
          type="email"
          required
          placeholder="name@company.com"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border-slate-200 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center py-2.5 px-4 text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-500/20 transition-all duration-150 shadow-md shadow-primary-500/20 disabled:opacity-75 uppercase tracking-wider active:scale-[0.99] cursor-pointer"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'Send Reset Code'}
        </button>

        <div className="pt-2 text-center">
          <p className="text-[11px] text-slate-400 font-medium">
            A 6-digit verification code will be dispatched to your inbox.
          </p>
        </div>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
