import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Bell, Lock, LogOut, ArrowLeft } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white p-10 font-sans">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate('/profile')} className="mb-10 flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-all">
          <ArrowLeft size={20}/> Back to Profile
        </button>
        
        <h2 className="text-5xl font-black text-slate-900 mb-12">Settings</h2>
        
        <div className="space-y-4">
          <SettingOption icon={<Shield />} title="Privacy" desc="Who can see your location on the donor map" />
          <SettingOption icon={<Bell />} title="Notifications" desc="Manage emergency blood alerts" />
          <SettingOption icon={<Lock />} title="Security" desc="Change password and two-factor auth" />
          
          <button 
            onClick={() => navigate('/')} 
            className="w-full mt-10 p-6 bg-red-50 text-red-600 rounded-[30px] font-black flex items-center justify-center gap-3 hover:bg-red-100 transition-all"
          >
            <LogOut size={20}/> Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingOption({ icon, title, desc }) {
  return (
    <div className="flex items-center gap-6 p-8 hover:bg-slate-50 rounded-[35px] cursor-pointer transition-all border border-transparent hover:border-slate-100 group">
      <div className="p-4 bg-slate-100 rounded-2xl group-hover:bg-white transition-all text-slate-600">
        {icon}
      </div>
      <div>
        <h4 className="font-black text-slate-900 text-lg">{title}</h4>
        <p className="text-slate-400 font-medium">{desc}</p>
      </div>
    </div>
  );
}