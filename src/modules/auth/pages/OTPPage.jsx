import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../../../api/axios';
import { KeyRound, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const OTPPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const [code, setCode] = useState(location.state?.debugOtp || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!email) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post('/auth/verify-otp', {
        email,
        code,
        type: 'Login'
      });
      
      const { token, user } = response.data.data;
      
      localStorage.setItem('token', token);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      toast.success('Login Successful!');
      
      // Dynamic Redirect based on permissions
      if (user.permissions?.all || user.permissions?.dashboard) {
        navigate('/dashboard');
      } else {
        navigate('/leaves');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid OTP code.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-center space-x-2 text-sm text-slate-500">
        <button onClick={() => navigate('/login')} className="flex items-center hover:text-primary-600 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to login
        </button>
      </div>

      <div className="text-center mb-6">
        <p className="text-sm text-slate-600">
          We've sent a 6-digit code to <br />
          <span className="font-semibold text-slate-900">{email}</span>
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="code">Security Code</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <KeyRound className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="code"
              name="code"
              type="text"
              required
              maxLength={6}
              className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 text-center tracking-[0.5em] text-lg font-mono font-bold"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading || code.length < 6}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Secure Code'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OTPPage;
