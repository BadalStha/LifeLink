import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
        <div className="mb-6">
          <h1 className="text-8xl font-black text-red-600">404</h1>
          <h2 className="text-2xl font-black text-slate-900 mt-4">Page Not Found</h2>
          <p className="text-slate-600 mt-3">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-full bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2"
          >
            <Home size={20} />
            Go to Homepage
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={20} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
