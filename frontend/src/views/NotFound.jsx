import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Droplets, Heart } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 shadow-sm px-5 md:px-12 py-4 flex items-center gap-3">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <Droplets size={16} className="text-white"/>
          </div>
          <span className="text-lg font-black text-slate-900">LifeLink</span>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Heart className="text-red-500" size={36}/>
          </div>

          {/* 404 */}
          <h1 className="text-8xl font-black text-slate-900 leading-none">404</h1>
          <div className="w-16 h-1.5 bg-red-600 rounded-full mx-auto my-5"/>
          <h2 className="text-2xl font-black text-slate-800 mb-3">Page Not Found</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            The page you're looking for doesn't exist or has been moved. Let's get you back to saving lives.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-sm"
            >
              <Home size={18}/> Go to Homepage
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all"
            >
              <ArrowLeft size={18}/> Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
