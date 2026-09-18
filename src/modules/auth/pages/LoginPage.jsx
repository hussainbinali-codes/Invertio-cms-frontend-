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
      const res = await axios.post("/auth/login", formData);
      const debugOtp = res.data?.data?.debugOtp;
      navigate("/verify-otp", { state: { email: formData.email, debugOtp } });
      if (debugOtp) {
        toast.success(`Dev OTP: ${debugOtp}`, { duration: 8000 });
      } else {
        toast.success("OTP sent successfully");
      }
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
    <div className="w-full">
      {/* Form Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-black tracking-tight text-slate-900">
          Welcome Back
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Sign in to your Invertio workspace to manage projects, clients, and pipelines.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}
        <div className="space-y-3.5">
          <Input
            label="Email Address"
            name="email"
            type="email"
            required
            placeholder="name@company.com"
            icon={Mail}
            value={formData.email}
            onChange={handleChange}
            className="rounded-xl border-slate-200 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500"
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
            className="rounded-xl border-slate-200 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500"
          />
        </div>

        <div className="flex items-center justify-end pt-0.5">
          <Link
            to="/forgot-password"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center py-2.5 px-4 text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-500/20 transition-all duration-150 shadow-md shadow-primary-500/20 disabled:opacity-75 uppercase tracking-wider active:scale-[0.99] cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            "Sign in to Dashboard"
          )}
        </button>

        {/* Security badge */}
        <div className="pt-2 text-center">
          <p className="text-[11px] text-slate-400 font-medium">
            Protected by enterprise multi-factor authentication
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
