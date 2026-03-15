import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ArrowRight, Building2, ChevronLeft, Heart, Activity, Users } from 'lucide-react';
import { hospitalAPI } from '../services/api';

export default function HospitalLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await hospitalAPI.login(email, password);

      localStorage.setItem('hospitalToken', data.token);
      localStorage.setItem('hospitalEmail', data.user.email);

      navigate('/hospital');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 opacity-90" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-700 rounded-full opacity-10 -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-800 rounded-full opacity-10 translate-y-1/3 -translate-x-1/3" />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
              <Heart size={20} className="text-white" fill="white" />
            </div>
            <span className="text-white text-xl font-bold tracking-tight">LifeLink</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/30 rounded-full px-4 py-1.5">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            <span className="text-red-300 text-xs font-semibold tracking-widest uppercase">Hospital Portal</span>
          </div>

          <h2 className="text-4xl font-black text-white leading-tight">
            Post Requests &amp;<br />
            Save Lives Together
          </h2>
          <p className="text-slate-400 text-base leading-relaxed max-w-xs">
            Coordinate blood and organ donation needs directly with the LifeLink network.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { icon: Users, label: 'Donors', value: '12,400+' },
              { icon: Activity, label: 'Requests', value: '3,200+' },
              { icon: Building2, label: 'Hospitals', value: '50+' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                <Icon size={16} className="text-red-400" />
                <p className="text-white font-bold text-lg">{value}</p>
                <p className="text-slate-500 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
          <Building2 size={18} className="text-red-400 shrink-0" />
          <p className="text-slate-400 text-xs leading-relaxed">
            This portal is for verified LifeLink partner hospitals only. Access is granted by a LifeLink administrator.
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-8 sm:px-16 lg:px-20 py-12 relative">
        <button
          onClick={() => navigate('/')}
          className="absolute top-8 left-8 inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-700 text-sm font-medium transition-colors"
        >
          <ChevronLeft size={16} />
          Back to site
        </button>

        <div className="max-w-sm w-full mx-auto space-y-8">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center">
              <Heart size={18} className="text-white" fill="white" />
            </div>
            <span className="text-slate-900 text-lg font-bold">LifeLink</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900">Hospital sign in</h1>
            <p className="text-slate-500 text-sm">Access the LifeLink hospital portal.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 shrink-0" />
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating…
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center pt-4 border-t border-slate-100">
            LifeLink Hospital Portal &bull; Restricted Access
          </p>
        </div>
      </div>
    </div>
  );
}
