import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

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

  const getErrorMessage = async (response) => {
    try {
      const errorData = await response.json();
      return errorData.error || 'Authentication failed';
    } catch {
      return 'Authentication failed';
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const loginResponse = await fetch(`${API_BASE_URL}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        if (!loginResponse.ok) {
          throw new Error(await getErrorMessage(loginResponse));
        }

        const loginData = await loginResponse.json();
        login(loginData.user, loginData.token);
        navigate('/');
        return;
      }

      const registerResponse = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: 'user',
        }),
      });

      if (!registerResponse.ok) {
        throw new Error(await getErrorMessage(registerResponse));
      }

      // Show success message instead of auto-login
      setSuccessMessage(`Account created successfully! You can now login with ${formData.email}`);
      
      // Switch to login mode after 2 seconds
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

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-5xl w-full bg-white rounded-[50px] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-100">
        
        {/* Left Side: Branding & Visuals */}
        <div className="md:w-[45%] bg-red-600 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-black italic mb-10 cursor-pointer" onClick={() => navigate('/')}>LifeLink</h1>
            <h2 className="text-5xl font-black leading-tight mb-6">
              {isLogin ? "Welcome Back, Hero." : "Start Saving Lives."}
            </h2>
            <p className="text-red-100 font-medium text-lg opacity-90">
              {isLogin 
                ? "Your presence makes the community stronger. Log in to check active requests." 
                : "Join the largest network of blood and organ donors in Nepal."}
            </p>
          </div>
          
          {/* Subtle Decorative Circle */}
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* Right Side: The Form */}
        <div className="md:w-[55%] p-12 md:p-16">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-3xl font-black text-slate-900">{isLogin ? "Login" : "Sign Up"}</h3>
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-red-600 font-black text-sm uppercase tracking-widest hover:underline"
            >
              {isLogin ? "Create Account" : "I have an account"}
            </button>
          </div>

          {/* Social Login Section */}
          <div className="grid grid-cols-1 gap-4 mb-8">
            <button className="flex items-center justify-center gap-3 w-full border-2 border-slate-100 py-4 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-all">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" alt="Google" className="w-5 h-5"/>
              Continue with Google
            </button>
          </div>

          <div className="relative flex py-5 items-center mb-4">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs font-black uppercase tracking-widest">Or use Email/Phone</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input 
                  type="text" placeholder="Full Name" required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-14 pr-5 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-red-500 focus:bg-white transition-all outline-none font-bold text-slate-700"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
              <input 
                type="email" placeholder="Email" required
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-14 pr-5 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-red-500 focus:bg-white transition-all outline-none font-bold text-slate-700"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Strong Password" required
                name="password"
                value={formData.password}
                onChange={handleChange}
                minLength={8}
                className="w-full pl-14 pr-14 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-red-500 focus:bg-white transition-all outline-none font-bold text-slate-700"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>

            {/* Password Strength Indicator (Visual Only) */}
            {!isLogin && (
              <div className="flex gap-1 px-2">
                <div className="h-1 flex-1 bg-green-500 rounded-full"></div>
                <div className="h-1 flex-1 bg-green-500 rounded-full"></div>
                <div className="h-1 flex-1 bg-slate-200 rounded-full"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase ml-2">Strength: Good</p>
              </div>
            )}

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-sm font-semibold text-red-600">{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <p className="text-sm font-semibold text-green-600">{successMessage}</p>
              </div>
            )}

            <button disabled={isSubmitting || successMessage} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed">
              {isSubmitting ? 'Please wait...' : isLogin ? "Login to LifeLink" : "Create My Account"} <ArrowRight size={20}/>
            </button>

            <p className="text-center text-sm text-slate-500 font-semibold">
              Prefer full donor form?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-red-600 hover:underline"
              >
                Register here
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}