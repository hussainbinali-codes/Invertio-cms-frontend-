import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../../../api/axios";
import Input from "../../../components/ui/Input";
import { Mail, Lock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password) => {
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      password,
    );
    return hasMinLength && hasUppercase && hasLowercase && hasSpecialChar;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(formData.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!validatePassword(formData.password)) {
      toast.error(
        "Use at least 8 characters, including 1 uppercase letter, 1 lowercase letter, and 1 special character.",
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await axios.post("/auth/login", formData);
      navigate("/verify-otp", { state: { email: formData.email } });
      toast.success("OTP sent successfully");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Failed to login. Please check your credentials.";
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
    <div className="w-full mt-6">
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && (
          <div className="p-3 text-xs font-semibold text-slate-500 text-rose-600 bg-rose-50 border border-rose-100 rounded-xl animate-in fade-in slide-in-from-top-1 font-mono">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <Input
            label="Email Address"
            name="email"
            required
            placeholder="you@company.com"
            icon={Mail}
            value={formData.email}
            onChange={handleChange}
            className="rounded-xl border-slate-200 text-sm font-normal focus:ring-2 focus:ring-blue-500 font-mono"
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
            className="rounded-xl border-slate-200 text-sm font-normal focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-end">
          <Link
            to="/forgot-password"
            className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors font-mono"
          >
            Forgot password?
          </Link>
        </div>

        <div className="bg-slate-200/30 p-0.5 rounded-xl border border-slate-200/20 active:scale-[0.98] transition-all duration-300">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 text-xs font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm disabled:opacity-75 uppercase tracking-wider"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              "Sign in to Dashboard"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
