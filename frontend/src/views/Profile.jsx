import React from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Settings, MapPin, ArrowLeft, Heart, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const history = [
    { id: 1, hospital: "Dharan BPKIHS", date: "Feb 10, 2026", type: "O+ Blood" },
    { id: 2, hospital: "Biratnagar Red Cross", date: "Nov 15, 2025", type: "O+ Blood" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6">
      <div className="max-w-3xl mx-auto">
        {/* Back Navigation */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-red-600 transition-all">
            <ArrowLeft size={20}/> Back to Home
          </button>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 font-bold px-4 py-2 rounded-full transition-all"
          >
            <LogOut size={18}/> Logout
          </button>
        </div>

        {/* Profile Header (The missing details) */}
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-lg">B</div>
          
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-black text-slate-900">Tirion Lanister</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
              <p className="flex items-center gap-1 text-slate-400 font-bold"><MapPin size={16}/> Westminster, Scotland</p>
              <span className="bg-red-50 text-red-600 px-4 py-1 rounded-full text-xs font-black uppercase">O+ Blood Group</span>
            </div>
          </div>

          {/* Settings Shortcut Button */}
          <button 
            onClick={() => navigate('/settings')} 
            className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-100"
            title="Go to Settings"
          >
            <Settings size={28}/>
          </button>
        </div>

        {/* Stats Section (Adding value to the Profile) */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-6 rounded-[30px] border border-slate-100 text-center">
            <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">Lives Saved</p>
            <p className="text-2xl font-black text-red-600">02</p>
          </div>
          <div className="bg-white p-6 rounded-[30px] border border-slate-100 text-center">
            <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">Status</p>
            <p className="text-2xl font-black text-green-600">Active Hero</p>
          </div>
        </div>

        {/* Donation History (Keep this part) */}
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
          <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
            <History className="text-red-600"/> Donation History
          </h3>
          <div className="space-y-4">
            {history.map(item => (
              <div key={item.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex justify-between items-center hover:bg-white transition-all">
                <div>
                  <p className="font-black text-slate-900">{item.hospital}</p>
                  <p className="text-xs font-bold text-slate-400">{item.date}</p>
                </div>
                <span className="bg-white text-red-600 border border-red-100 px-4 py-1 rounded-full text-xs font-black uppercase">
                  {item.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}