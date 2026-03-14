import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Settings, MapPin, ArrowLeft, LogOut, Loader2, HandHeart, ToggleLeft, ToggleRight, AlertTriangle, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI, usersAPI, requestsAPI } from '../services/api';

export default function Profile() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [donationHistory, setDonationHistory] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('history');
  const [isToggling, setIsToggling] = useState(false);
  const [cancellingRequestId, setCancellingRequestId] = useState(null);

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
        const [statsData, historyData, requestsData] = await Promise.all([
          usersAPI.getStats().catch(() => ({ stats: { lives_saved: 0, status: 'New Member' } })),
          usersAPI.getDonationHistory().catch(() => ({ history: [] })),
          requestsAPI.getMyRequests().catch(() => ({ requests: [] }))
        ]);

        setUserStats(statsData.stats);
        setDonationHistory(historyData.history);
        setMyRequests(requestsData.requests || []);
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
    window.location.replace('/');
  };

  const toggleAvailability = async () => {
    setIsToggling(true);
    try {
      await authAPI.updateProfile({ is_active: !profileData.is_active });
      setProfileData(prev => ({ ...prev, is_active: !prev.is_active }));
    } catch (err) {
      console.error('Failed to update availability:', err);
    } finally {
      setIsToggling(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const cancelRequest = async (requestId) => {
    const confirmed = window.confirm('Cancel this request? This will mark it as cancelled.');
    if (!confirmed) return;

    setCancellingRequestId(requestId);
    try {
      const result = await requestsAPI.update(requestId, { status: 'cancelled' });
      const updatedRequest = result?.request;

      setMyRequests((prev) => prev.map((req) => (
        req.id === requestId
          ? {
              ...req,
              status: updatedRequest?.status || 'cancelled',
              updated_at: updatedRequest?.updated_at || req.updated_at,
            }
          : req
      )));
    } catch (err) {
      console.error('Failed to cancel request:', err);
      alert(err?.message || 'Could not cancel request. Please try again.');
    } finally {
      setCancellingRequestId(null);
    }
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

        {/* Availability Toggle */}
        <div className="bg-white rounded-2xl border border-slate-100 px-6 py-4 mb-6 flex items-center justify-between">
          <div>
            <p className="font-black text-slate-800">Availability Status</p>
            <p className="text-sm text-slate-500">
              {profileData?.is_active
                ? 'You are visible to recipients and hospitals'
                : 'You are currently hidden from search results'}
            </p>
          </div>
          <button
            onClick={toggleAvailability}
            disabled={isToggling}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              profileData?.is_active
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            } disabled:opacity-50`}
          >
            {profileData?.is_active
              ? <><ToggleRight size={20} /> Active</>
              : <><ToggleLeft size={20} /> Inactive</>}
          </button>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => navigate('/donation-preferences')}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-700 font-bold rounded-2xl hover:bg-blue-100 transition-all border border-blue-200 text-sm"
          >
            <HandHeart size={18} /> I Want to Donate
          </button>
          <button
            onClick={() => navigate('/request-help')}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-all border border-red-200 text-sm"
          >
            <Heart size={18} /> Request Help
          </button>
        </div>

        {/* Stats Section */}
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

        {/* Tabbed Content: History / My Requests */}
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
          {/* Tab Header */}
          <div className="flex border-b border-slate-100">
            {[
              { key: 'history', label: 'Donation History', icon: <History size={16}/> },
              { key: 'requests', label: 'My Requests', icon: <AlertTriangle size={16}/> },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold text-sm transition-all ${
                  activeTab === tab.key
                    ? 'text-red-600 border-b-2 border-red-600 bg-red-50/40'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Donation History Tab */}
            {activeTab === 'history' && (
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
            )}

            {/* My Requests Tab */}
            {activeTab === 'requests' && (
              <div className="space-y-4">
                {myRequests.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <p className="font-bold">No requests submitted yet</p>
                    <p className="text-sm mt-1">Your help requests will appear here</p>
                    <button
                      onClick={() => navigate('/request-help')}
                      className="mt-4 px-5 py-2 bg-red-600 text-white font-bold rounded-xl text-sm hover:bg-red-700 transition-all"
                    >
                      Submit a Request
                    </button>
                  </div>
                ) : (
                  myRequests.map(req => {
                    const urgencyColors = {
                      critical: 'bg-red-100 text-red-700',
                      high: 'bg-orange-100 text-orange-700',
                      medium: 'bg-yellow-100 text-yellow-700',
                      low: 'bg-green-100 text-green-700',
                    };
                    return (
                      <div key={req.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-black text-slate-900 capitalize">
                              {req.request_type} {req.blood_type || req.organ_type || 'Donation'}
                            </p>
                            <p className="text-xs text-slate-400">{formatDate(req.created_at)} — {req.location}</p>
                          </div>
                          <div className="flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${urgencyColors[req.urgency] || urgencyColors.medium}`}>
                              {req.urgency}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                              req.status === 'open' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {req.status}
                            </span>
                          </div>
                        </div>
                        {req.reason && <p className="text-sm text-slate-500 mt-1">{req.reason}</p>}
                        {req.status === 'open' && (
                          <div className="mt-4 flex justify-end">
                            <button
                              onClick={() => cancelRequest(req.id)}
                              disabled={cancellingRequestId === req.id}
                              className="px-4 py-2 rounded-xl bg-red-100 text-red-700 text-xs font-black hover:bg-red-200 transition-all disabled:opacity-50"
                            >
                              {cancellingRequestId === req.id ? 'Cancelling...' : 'Cancel Request'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}