import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ChevronDown, AlertTriangle, Send, X, Heart, HandHeart } from 'lucide-react';
import DonorMap from '../Components/DonorMap';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchType, setSearchType] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const bloodGroups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
  const organs = ["Kidney", "Liver", "Cornea", "Heart", "Bone Marrow"];

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* --- NAVBAR --- */}
      <nav className="flex justify-between items-center px-10 py-6 bg-white sticky top-0 z-[1000] border-b border-slate-50">
        <h1 className="text-2xl font-black text-red-600 italic cursor-pointer" onClick={() => navigate('/')}>LifeLink</h1>
        <div className="flex items-center gap-4 font-bold text-slate-600">
          <button 
            onClick={() => navigate('/register?type=donor')} 
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 hover:bg-green-100 transition-all border border-green-200"
          >
            <Heart size={18}/> Become a Donor
          </button>
          <button 
            onClick={() => setShowEmergencyModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-200"
          >
            <HandHeart size={18}/> Request Help
          </button>
          {isAuthenticated ? (
            <button onClick={() => navigate('/profile')} className="hover:text-red-600 transition-all">My Profile</button>
          ) : (
            <button onClick={() => navigate('/login')} className="hover:text-red-600 transition-all">Login</button>
          )}
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="pt-20 pb-10 text-center px-6">
        <h2 className="text-7xl font-black text-slate-900 mb-2 tracking-tight">Every Drop Counts.</h2>
        <h2 className="text-7xl font-black text-red-600 mb-12 tracking-tight">Every Organ Saves.</h2>
        
        {/* ENHANCED SEARCH BAR */}
        <div className="max-w-5xl mx-auto bg-white p-3 rounded-[35px] shadow-2xl border border-slate-100 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-red-500" size={20}/>
            <select 
              className="w-full pl-14 pr-10 py-5 bg-slate-50 rounded-3xl font-bold text-slate-700 appearance-none outline-none focus:ring-2 focus:ring-red-500/20 transition-all cursor-pointer"
              onChange={(e) => setSearchType(e.target.value)}
            >
              <option value="">Select Blood/Organ Type</option>
              <optgroup label="Blood Groups">{bloodGroups.map(g => <option key={g} value={g}>{g}</option>)}</optgroup>
              <optgroup label="Body Organs">{organs.map(o => <option key={o} value={o}>{o}</option>)}</optgroup>
            </select>
            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
          </div>

          <div className="flex-1 relative">
            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
            <input 
              type="text"
              placeholder="Search Location (e.g. Kathmandu, Dharan)"
              className="w-full pl-14 pr-5 py-5 bg-slate-50 rounded-3xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
              onChange={(e) => setSearchLocation(e.target.value)}
            />
          </div>

          <button className="bg-slate-900 text-white px-12 py-5 rounded-3xl font-black hover:bg-black transition-all shadow-lg active:scale-95">
            Find Donors
          </button>
        </div>
      </header>

      {/* --- MAP SECTION --- */}
      <section className="px-10 pb-20 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-6 px-4">
          <div>
            <h3 className="text-2xl font-black text-slate-900">Available Donors Nearby</h3>
            <p className="text-slate-500 font-medium">Real-time locations of verified LifeLink heroes.</p>
          </div>
          <div className="flex gap-2">
             <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">● 14 Online</span>
          </div>
        </div>
        {/* This calls the DonorMap component we built previously */}
        <DonorMap /> 
      </section>

      {/* --- EMERGENCY MODAL --- */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl animate-in zoom-in duration-300 relative">
            <button onClick={() => setShowEmergencyModal(false)} className="absolute right-8 top-8 text-slate-400 hover:text-slate-600"><X/></button>
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mb-6"><AlertTriangle size={32}/></div>
            <h3 className="text-3xl font-black text-slate-900 mb-2">
              {isAuthenticated ? "Broadcast Alert" : "Request Help"}
            </h3>
            <p className="text-slate-500 font-medium mb-8">
              {isAuthenticated 
                ? "Notify all matching donors within your area immediately." 
                : "Create an account to submit your emergency request and notify nearby donors instantly."}
            </p>
            {isAuthenticated ? (
              <button 
                onClick={() => { alert("Broadcast Sent!"); setShowEmergencyModal(false); }}
                className="w-full bg-red-600 text-white p-5 rounded-2xl font-black text-lg hover:bg-red-700 transition-all flex items-center justify-center gap-3"
              >
                <Send size={20}/> Send Alert Now
              </button>
            ) : (
              <button 
                onClick={() => navigate('/register?type=receiver')}
                className="w-full bg-red-600 text-white p-5 rounded-2xl font-black text-lg hover:bg-red-700 transition-all flex items-center justify-center gap-3"
              >
                <HandHeart size={20}/> Register & Request Help
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}