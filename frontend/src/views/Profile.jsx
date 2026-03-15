import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History, Settings, MapPin, LogOut, Loader2,
  HandHeart, ToggleLeft, ToggleRight, AlertTriangle, Heart,
  Droplets, Mail, Shield, Award, ChevronRight, Pencil
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI, usersAPI, requestsAPI, API_BASE_URL } from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

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
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchAllData = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) { navigate('/login'); return; }

      try {
        const data = await authAPI.getProfile();
        setProfileData(data.user);

        const [statsData, historyData, requestsData] = await Promise.all([
          usersAPI.getStats().catch(() => ({ stats: { lives_saved: 0, status: 'New Member' } })),
          usersAPI.getDonationHistory().catch(() => ({ history: [] })),
          requestsAPI.getMyRequests().catch(() => ({ requests: [] })),
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const cancelRequest = async (requestId) => {
    const confirmed = window.confirm('Cancel this request? This will mark it as cancelled.');
    if (!confirmed) return;

    setCancellingRequestId(requestId);
    try {
      const result = await requestsAPI.update(requestId, { status: 'cancelled' });
      const updated = result?.request;
      setMyRequests(prev => prev.map(req =>
        req.id === requestId
          ? { ...req, status: updated?.status || 'cancelled', updated_at: updated?.updated_at || req.updated_at }
          : req
      ));
    } catch (err) {
      alert(err?.message || 'Could not cancel request. Please try again.');
    } finally {
      setCancellingRequestId(null);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const result = await authAPI.uploadAvatar(file);
      setProfileData(prev => ({ ...prev, profile_picture: result.profile_picture }));
    } catch (err) {
      console.error('Failed to upload avatar:', err);
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-red-600" size={40} />
          <p className="font-bold text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans p-6">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 max-w-md text-center">
          <p className="text-red-600 font-bold mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const urgencyColors = {
    critical: 'bg-red-100 text-red-700 border-red-100',
    high: 'bg-orange-100 text-orange-700 border-orange-100',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-100',
    low: 'bg-green-100 text-green-700 border-green-100',
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">

      {/* ── Navbar ── */}
      <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="bg-red-600 rounded-lg p-1.5">
            <Droplets size={16} className="text-white" />
          </div>
          <span className="text-lg font-black text-slate-900">LifeLink</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-sm font-semibold text-slate-500 hover:text-red-600 transition-colors hidden md:block"
          >
            Home
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-red-600 transition-colors"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </nav>

      {/* ── Cover Photo ── */}
      <div className="relative h-44 md:h-56 w-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1400&q=80"
          alt="Profile cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/80 via-red-800/60 to-slate-900/90" />
        <button
          onClick={() => navigate('/settings')}
          className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
        >
          <Settings size={13} /> Settings
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6">

        {/* ── Profile Card (overlaps cover) ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 px-6 md:px-8 pb-6 -mt-10 relative z-10">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-end">

            {/* Avatar with hover-to-edit */}
            <div
              className="relative w-20 h-20 md:w-24 md:h-24 -mt-10 shrink-0 group cursor-pointer"
              onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
              title="Click to change profile picture"
            >
              {profileData?.profile_picture ? (
                <img
                  src={`${API_BASE_URL}${profileData.profile_picture}`}
                  alt={profileData?.name}
                  className="w-full h-full rounded-2xl object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center text-white text-2xl md:text-3xl font-black shadow-lg border-4 border-white">
                  {getInitials(profileData?.name)}
                </div>
              )}
              {/* Overlay */}
              <div className={`absolute inset-0 rounded-2xl flex items-center justify-center transition-opacity border-4 border-white ${
                isUploadingAvatar ? 'bg-black/50 opacity-100' : 'bg-black/40 opacity-0 group-hover:opacity-100'
              }`}>
                {isUploadingAvatar
                  ? <Loader2 size={22} className="text-white animate-spin" />
                  : <Pencil size={18} className="text-white" />
                }
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-center md:text-left pt-2 md:pt-0 pb-1">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 truncate">
                {profileData?.name || 'User'}
              </h1>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mt-2">
                {profileData?.blood_type && (
                  <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-100 px-2.5 py-0.5 rounded-full text-xs font-black">
                    <Droplets size={10} /> {profileData.blood_type} Blood
                  </span>
                )}
                {profileData?.donation_type && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-full text-xs font-bold capitalize">
                    <HandHeart size={10} /> {profileData.donation_type} Donor
                  </span>
                )}
                {profileData?.city && (
                  <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-medium">
                    <MapPin size={11} /> {profileData.city}
                  </span>
                )}
                {profileData?.email && (
                  <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-medium">
                    <Mail size={11} /> {profileData.email}
                  </span>
                )}
              </div>
            </div>

            {/* Availability badge */}
            <div className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold border ${
              profileData?.is_active
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${profileData?.is_active ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
              {profileData?.is_active ? 'Available' : 'Unavailable'}
            </div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mt-4">
          {[
            {
              label: 'Lives Saved',
              value: userStats?.lives_saved?.toString().padStart(2, '0') || '00',
              color: 'text-red-600',
              bg: 'bg-red-50',
              icon: <Heart size={20} className="text-red-500" />,
            },
            {
              label: 'Donor Status',
              value: userStats?.status || 'New Member',
              color: 'text-green-600',
              bg: 'bg-green-50',
              icon: <Award size={20} className="text-green-500" />,
            },
            {
              label: 'Donation Type',
              value: profileData?.donation_type
                ? profileData.donation_type.charAt(0).toUpperCase() + profileData.donation_type.slice(1)
                : 'Not Set',
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              icon: <HandHeart size={20} className="text-blue-500" />,
            },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5 text-center">
              <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                {stat.icon}
              </div>
              <p className={`text-base md:text-xl font-black ${stat.color} leading-tight`}>{stat.value}</p>
              <p className="text-xs text-slate-400 font-semibold mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Availability + Donation Preferences ── */}
        <div className="grid md:grid-cols-2 gap-4 mt-4">

          {/* Availability */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={15} className="text-slate-400" />
              <p className="font-black text-slate-800">Availability Status</p>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed mb-5">
              {profileData?.is_active
                ? 'You are currently visible to recipients and hospitals searching for donors.'
                : 'You are currently hidden from all search results and recipient queries.'}
            </p>
            <button
              onClick={toggleAvailability}
              disabled={isToggling}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${
                profileData?.is_active
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isToggling
                ? <Loader2 size={16} className="animate-spin" />
                : profileData?.is_active
                  ? <><ToggleRight size={18} /> Mark as Unavailable</>
                  : <><ToggleLeft size={18} /> Mark as Available</>}
            </button>
          </div>

          {/* Donation Preferences */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1">
              <HandHeart size={15} className="text-slate-400" />
              <p className="font-black text-slate-800">Donation Preferences</p>
            </div>
            {profileData?.donation_type ? (
              <div className="space-y-2 mb-5">
                <p className="text-sm text-slate-500">Your current donation preferences:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-full text-xs font-bold capitalize">
                    {profileData.donation_type} Donation
                  </span>
                  {profileData?.donation_organ && (
                    <span className="bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1 rounded-full text-xs font-bold capitalize">
                      {profileData.donation_organ}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 leading-relaxed mb-5">
                You have not set your donation preferences yet. Let recipients know what you are willing to donate.
              </p>
            )}
            <button
              onClick={() => navigate('/donation-preferences')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all"
            >
              <HandHeart size={15} />
              {profileData?.donation_type ? 'Update Preferences' : 'Set Preferences'}
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          <button
            onClick={() => navigate('/request-help')}
            className="flex items-center justify-center gap-2 py-3.5 px-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all text-sm shadow-sm"
          >
            <Heart size={15} /> Request Help
          </button>
          <button
            onClick={() => navigate('/find-donors')}
            className="flex items-center justify-center gap-2 py-3.5 px-4 bg-white text-slate-700 font-bold rounded-2xl hover:bg-slate-50 border border-slate-200 transition-all text-sm shadow-sm"
          >
            <Droplets size={15} /> Find Donors
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center justify-center gap-2 py-3.5 px-4 bg-white text-slate-700 font-bold rounded-2xl hover:bg-slate-50 border border-slate-200 transition-all text-sm shadow-sm col-span-2 md:col-span-1"
          >
            <Settings size={15} /> Account Settings
          </button>
        </div>

        {/* ── Tabbed Activity ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mt-4 mb-10">
          <div className="flex border-b border-slate-100">
            {[
              { key: 'history', label: 'Donation History', icon: <History size={15} /> },
              { key: 'requests', label: 'My Requests', icon: <AlertTriangle size={15} /> },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold text-sm transition-all ${
                  activeTab === tab.key
                    ? 'text-red-600 border-b-2 border-red-600 bg-red-50/30'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">

            {/* Donation History */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                {donationHistory.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <History size={22} className="text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-600">No donations recorded yet</p>
                    <p className="text-sm text-slate-400 mt-1">Your donation history will appear here once recorded.</p>
                  </div>
                ) : (
                  donationHistory.map(item => (
                    <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center hover:bg-white hover:shadow-sm transition-all">
                      <div>
                        <p className="font-black text-slate-900 text-sm">{item.hospital_name || 'Hospital'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatDate(item.donation_date)}</p>
                      </div>
                      <span className="bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-full text-xs font-black uppercase">
                        {item.donation_type === 'Blood' ? (item.blood_type || 'Blood') : (item.organ_type || 'Organ')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* My Requests */}
            {activeTab === 'requests' && (
              <div className="space-y-3">
                {myRequests.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle size={22} className="text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-600">No requests submitted yet</p>
                    <p className="text-sm text-slate-400 mt-1">Your help requests will appear here.</p>
                    <button
                      onClick={() => navigate('/request-help')}
                      className="mt-5 px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl text-sm hover:bg-red-700 transition-all"
                    >
                      Submit a Request
                    </button>
                  </div>
                ) : (
                  myRequests.map(req => (
                    <div key={req.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-start gap-3 flex-wrap mb-2">
                        <div>
                          <p className="font-black text-slate-900 text-sm capitalize">
                            {req.request_type} — {req.blood_type || req.organ_type || 'Donation'}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {formatDate(req.created_at)} · {req.location}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize border ${urgencyColors[req.urgency] || urgencyColors.medium}`}>
                            {req.urgency}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize border ${
                            req.status === 'open'
                              ? 'bg-blue-50 text-blue-700 border-blue-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                      </div>
                      {req.reason && (
                        <p className="text-xs text-slate-500 leading-relaxed">{req.reason}</p>
                      )}
                      {req.status === 'open' && (
                        <div className="mt-3 flex justify-end">
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
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
