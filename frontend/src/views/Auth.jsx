import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, Lock, User, Github, Chrome, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', phone: '' });

  const handleAuth = (e) => {
    e.preventDefault();
    // Simulate successful Auth
    console.log("Auth Data:", formData);
    // Set user as logged in
    const userData = { 
      name: formData.name || 'User', 
      email: formData.email 
    };
    const token = 'fake-jwt-token-' + Date.now();
    login(userData, token);
    navigate('/');
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
                  className="w-full pl-14 pr-5 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-red-500 focus:bg-white transition-all outline-none font-bold text-slate-700"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
              <input 
                type="text" placeholder="Email or Phone Number" required
                className="w-full pl-14 pr-5 py-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-red-500 focus:bg-white transition-all outline-none font-bold text-slate-700"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Strong Password" required
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

            <button className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3">
              {isLogin ? "Login to LifeLink" : "Create My Account"} <ArrowRight size={20}/>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}