import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Settings, MapPin, ArrowLeft, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI, usersAPI } from '../services/api';

export default function Profile() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [donationHistory, setDonationHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAllData = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const data = await authAPI.getProfile();
        setProfileData(data.user);

        // Fetch user stats and donation history in parallel
        const [statsData, historyData] = await Promise.all([
          usersAPI.getStats().catch(() => ({ stats: { lives_saved: 0, status: 'New Member' } })),
          usersAPI.getDonationHistory().catch(() => ({ history: [] }))
        ]);

        setUserStats(statsData.stats);
        setDonationHistory(historyData.history);
      } catch (err) {
        const message = err.message || 'Unable to load profile';
        if (/401|403|token|expired|invalid/i.test(message)) {
          logout();
          navigate('/login');
          return;
        }
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [navigate, logout]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-red-600" size={40} />
          <p className="font-bold text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans p-6 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 max-w-md">
          <p className="text-red-600 font-bold mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

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

        {/* Profile Header */}
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-lg">
            {getInitials(profileData?.name)}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-black text-slate-900">{profileData?.name || 'User'}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
              {profileData?.city && (
                <p className="flex items-center gap-1 text-slate-400 font-bold">
                  <MapPin size={16}/> {profileData.city}
                </p>
              )}
              {profileData?.blood_type && (
                <span className="bg-red-50 text-red-600 px-4 py-1 rounded-full text-xs font-black uppercase">
                  {profileData.blood_type} Blood Group
                </span>
              )}
              {!profileData?.blood_type && (
                <span className="bg-slate-50 text-slate-500 px-4 py-1 rounded-full text-xs font-black uppercase">
                  No Blood Type Set
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 font-medium mt-1">{profileData?.email}</p>
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
            <p className="text-2xl font-black text-red-600">{userStats?.lives_saved?.toString().padStart(2, '0') || '00'}</p>
          </div>
          <div className="bg-white p-6 rounded-[30px] border border-slate-100 text-center">
            <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">Status</p>
            <p className="text-2xl font-black text-green-600">{userStats?.status || 'New Member'}</p>
          </div>
        </div>

        {/* Donation History */}
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
          <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
            <History className="text-red-600"/> Donation History
          </h3>
          <div className="space-y-4">
            {donationHistory.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <p className="font-bold">No donation history yet</p>
                <p className="text-sm mt-1">Your donations will appear here once recorded</p>
              </div>
            ) : (
              donationHistory.map(item => (
                <div key={item.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex justify-between items-center hover:bg-white transition-all">
                  <div>
                    <p className="font-black text-slate-900">{item.hospital_name || 'Hospital'}</p>
                    <p className="text-xs font-bold text-slate-400">{formatDate(item.donation_date)}</p>
                  </div>
                  <span className="bg-white text-red-600 border border-red-100 px-4 py-1 rounded-full text-xs font-black uppercase">
                    {item.donation_type === 'Blood' ? (item.blood_type || 'Blood') : (item.organ_type || 'Organ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}