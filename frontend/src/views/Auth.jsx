import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Lock, User, Eye, EyeOff, ArrowRight, Droplets,
  ShieldCheck, MapPin, Clock3, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export default function Auth() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const loginData = await authAPI.login(formData.email, formData.password);
        login(loginData.user, loginData.token);
        navigate('/');
        return;
      }

      await authAPI.register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: 'user',
      });

      setSuccessMessage(`Account created! You can now sign in with ${formData.email}`);
      setTimeout(() => {
        setIsLogin(true);
        setSuccessMessage('');
        setFormData({ email: formData.email, password: '', name: '' });
      }, 2000);
    } catch (error) {
      setErrorMessage(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const trustBadges = [
    { icon: <ShieldCheck size={15} />, label: 'Verified donor network' },
    { icon: <MapPin size={15} />, label: 'All 77 districts of Nepal' },
    { icon: <Clock3 size={15} />, label: '24/7 emergency support' },
  ];

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Devanagari', sans-serif" }}
    >
      {/* ── LEFT PANEL ── */}
      <div className="hidden md:flex md:w-[44%] relative flex-col shrink-0">
        <img
          src="https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=900&q=80"
          alt="Blood donation"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/90 via-red-900/80 to-slate-950/95" />

        <div className="relative z-10 flex flex-col h-full p-10 lg:p-12">
          {/* Logo */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 w-fit">
            <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              <Droplets size={18} className="text-white" />
            </div>
            <span className="text-xl font-black text-white">LifeLink</span>
          </button>

          {/* Main copy */}
          <div className="my-auto py-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-bold tracking-widest uppercase mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-red-300 animate-pulse" />
              Nepal Donation Network
            </div>
            <h2 className="text-4xl lg:text-[2.6rem] font-black text-white leading-[1.1] mb-4 whitespace-pre-line">
              {isLogin ? 'Welcome\nback.' : 'Start saving\nlives today.'}
            </h2>
            <p className="text-red-200/80 text-sm leading-relaxed mb-10 max-w-xs">
              {isLogin
                ? 'Your presence strengthens the community. Check active requests and connect with those who need help.'
                : 'Join thousands of verified donors and recipients across all 77 districts of Nepal.'}
            </p>

            <div className="space-y-3">
              {trustBadges.map((badge) => (
                <div key={badge.label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300 shrink-0">
                    {badge.icon}
                  </div>
                  <p className="text-sm font-semibold text-white/70">{badge.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-white/10">
            <p className="text-white/30 text-xs">© 2025 LifeLink Nepal. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
        {/* Mobile-only top bar */}
        <div className="md:hidden flex items-center justify-between px-5 py-4 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Droplets size={15} className="text-white" />
            </div>
            <span className="font-black text-slate-900">LifeLink</span>
          </button>
          <button
            onClick={() => (isLogin ? navigate('/register') : setIsLogin(true))}
            className="text-sm font-bold text-red-600"
          >
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-10 lg:p-14">
          <div className="w-full max-w-md">
            {/* Heading */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <h3 className="text-3xl font-black text-slate-900">
                  {isLogin ? 'Sign in' : 'Create account'}
                </h3>
                <p className="text-slate-500 text-sm mt-1 font-medium">
                  {isLogin
                    ? 'Welcome back — enter your credentials.'
                    : 'Fill in your details to get started.'}
                </p>
              </div>
              <button
                onClick={() => (isLogin ? navigate('/register') : setIsLogin(true))}
                className="hidden md:block text-xs font-black text-red-600 uppercase tracking-widest hover:underline shrink-0 mt-1"
              >
                {isLogin ? 'Sign up →' : '← Sign in'}
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                    <input
                      type="text"
                      placeholder="Your full name"
                      required
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-4 bg-white rounded-2xl border border-slate-200 focus:border-red-400 focus:ring-4 focus:ring-red-50 transition-all outline-none font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal shadow-sm"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-4 bg-white rounded-2xl border border-slate-200 focus:border-red-400 focus:ring-4 focus:ring-red-50 transition-all outline-none font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal shadow-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Password
                  </label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="text-xs font-bold text-red-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    minLength={8}
                    className="w-full pl-11 pr-12 py-4 bg-white rounded-2xl border border-slate-200 focus:border-red-400 focus:ring-4 focus:ring-red-50 transition-all outline-none font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-red-700">{errorMessage}</p>
                </div>
              )}

              {successMessage && (
                <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
                  <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-green-700">{successMessage}</p>
                </div>
              )}

              <button
                disabled={isSubmitting || !!successMessage}
                className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-base hover:bg-red-700 active:scale-[0.99] transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting
                  ? 'Please wait...'
                  : isLogin
                  ? 'Sign in to LifeLink'
                  : 'Create my account'}
                {!isSubmitting && <ArrowRight size={18} />}
              </button>
            </form>

            {/* Mobile bottom link */}
            <p className="mt-8 text-center text-sm text-slate-500 md:hidden">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => (isLogin ? navigate('/register') : setIsLogin(true))}
                className="font-bold text-red-600 hover:underline"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
