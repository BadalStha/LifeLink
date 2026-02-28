import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(false);
  const navigate = useNavigate();

  const handleAuth = (e) => {
    e.preventDefault();
    // After login/signup logic, always go to the Profile
    navigate('/profile'); 
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-10 rounded-[40px] shadow-xl border border-slate-100 w-full max-w-md">
        <h2 className="text-3xl font-black text-slate-900 mb-2">
          {isLogin ? "Welcome Back" : "Join LifeLink"}
        </h2>
        <p className="text-slate-500 mb-8 font-medium">
          {isLogin ? "Log in to manage your donations" : "Start your journey as a life saver"}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <input type="text" placeholder="Full Name" className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500" required />
          )}
          <input type="email" placeholder="Email Address" className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500" required />
          <input type="password" placeholder="Password" className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500" required />
          
          <button className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-lg hover:bg-red-700 transition-all shadow-lg shadow-red-200">
            {isLogin ? "Log In" : "Create Account"}
          </button>
        </form>

        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="w-full mt-6 text-slate-400 font-bold hover:text-red-600 transition-all"
        >
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
        </button>
      </div>
    </div>
  );
}