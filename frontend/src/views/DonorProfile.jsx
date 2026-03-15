import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Droplet, Heart, MapPin, Phone, Mail, FileText,
  Calendar, Loader2, AlertCircle, Droplets, MessageCircle, Shield, Clock, User
} from 'lucide-react';
import { usersAPI, API_BASE_URL } from '../services/api';

export default function DonorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAuthenticated = !!localStorage.getItem('authToken');

  useEffect(() => {
    const fetchDonor = async () => {
      setLoading(true);
      try {
        const data = await usersAPI.getById(id);
        setDonor(data.user);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load donor profile');
        console.error('Error fetching donor:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDonor();
  }, [id]);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getProfilePicUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}${path}`;
  };

  const memberSince = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-red-600" size={36} />
          <p className="text-slate-500 font-semibold">Loading donor profile...</p>
        </div>
      </div>
    );
  }

  if (error || !donor) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <nav className="bg-white border-b border-slate-100 shadow-sm px-5 md:px-12 py-4 flex items-center gap-3 sticky top-0 z-40">
          <button onClick={() => navigate('/find-donors')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-red-600 transition-all">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-7 h-7 bg-red-600 rounded-md flex items-center justify-center">
              <Droplets size={14} className="text-white" />
            </div>
            <span className="font-black text-slate-900">LifeLink</span>
          </div>
        </nav>
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-5">
            <AlertCircle size={36} className="text-red-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">Profile Not Found</h3>
          <p className="text-slate-500 mb-8">{error || 'The donor profile could not be loaded or may no longer be available.'}</p>
          <button
            onClick={() => navigate('/find-donors')}
            className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all"
          >
            Back to Donors
          </button>
        </div>
      </div>
    );
  }

  const profilePic = getProfilePicUrl(donor.profile_picture);
  const donationType = donor.donation_type;
  const organType = donor.donation_organ;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 shadow-sm px-5 md:px-12 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/find-donors')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-red-600 transition-all">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-7 h-7 bg-red-600 rounded-md flex items-center justify-center">
              <Droplets size={14} className="text-white" />
            </div>
            <span className="font-black text-slate-900">LifeLink</span>
          </div>
          <span className="text-slate-300 mx-1">|</span>
          <span className="font-bold text-slate-700 text-sm">Donor Profile</span>
        </div>
        {isAuthenticated && (
          <button
            onClick={() => navigate(`/chat?to=${donor.id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold rounded-lg text-sm hover:bg-red-700 transition-all"
          >
            <MessageCircle size={16} /> Message
          </button>
        )}
      </nav>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-10 w-40 h-40 rounded-full border-2 border-white/30" />
          <div className="absolute bottom-0 left-20 w-24 h-24 rounded-full border-2 border-white/20" />
        </div>
        <div className="max-w-3xl mx-auto px-6 py-10 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
            {profilePic ? (
              <img
                src={profilePic}
                alt={donor.name}
                className="w-28 h-28 rounded-2xl object-cover border-4 border-white/90 shadow-lg"
              />
            ) : (
              <div className="w-28 h-28 bg-white rounded-2xl flex items-center justify-center text-3xl font-black text-red-600 shadow-lg border-4 border-white/90">
                {getInitials(donor.name)}
              </div>
            )}
            <div className="text-center sm:text-left pb-1">
              <h1 className="text-3xl md:text-4xl font-black text-white mb-3">{donor.name || 'Anonymous Donor'}</h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                    donor.is_active
                      ? 'bg-green-400/90 text-green-950'
                      : 'bg-white/20 text-white/80'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${donor.is_active ? 'bg-green-800' : 'bg-white/50'}`} />
                  {donor.is_active ? 'Available to Donate' : 'Currently Unavailable'}
                </span>
                {donor.city && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 text-white/90">
                    <MapPin size={12} /> {donor.city}
                  </span>
                )}
                {donor.created_at && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 text-white/90">
                    <Clock size={12} /> Since {memberSince(donor.created_at)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 -mt-14 relative z-10">
          {donationType === 'blood' && donor.blood_type && (
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
              <Droplet className="text-red-500 mx-auto mb-2" size={22} />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Blood Type</p>
              <p className="text-2xl font-black text-red-600">{donor.blood_type}</p>
            </div>
          )}
          {donationType === 'organ' && organType && (
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
              <Heart className="text-purple-500 mx-auto mb-2" size={22} />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Organ</p>
              <p className="text-xl font-black text-purple-600 capitalize">{organType}</p>
            </div>
          )}
          {donor.age && (
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
              <Calendar className="text-blue-500 mx-auto mb-2" size={22} />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Age</p>
              <p className="text-2xl font-black text-slate-800">{donor.age}</p>
            </div>
          )}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
            <Shield className="text-green-500 mx-auto mb-2" size={22} />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Donation</p>
            <p className="text-lg font-black text-slate-800 capitalize">{donationType || 'N/A'}</p>
          </div>
        </div>

        {/* Location */}
        {(donor.city || donor.state || donor.country) && (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
                <MapPin className="text-slate-600" size={18} />
              </div>
              <h2 className="text-base font-black text-slate-900">Location</h2>
            </div>
            <p className="text-slate-700 font-semibold text-lg">
              {[donor.city, donor.state, donor.country].filter(Boolean).join(', ')}
            </p>
            {donor.address && (
              <p className="text-slate-500 text-sm mt-1">{donor.address}</p>
            )}
          </div>
        )}

        {/* Contact Information */}
        {(donor.phone || donor.email) && (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                <User className="text-red-600" size={18} />
              </div>
              <h2 className="text-base font-black text-slate-900">Contact Information</h2>
            </div>
            <div className="space-y-3">
              {donor.phone && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Phone className="text-red-500 shrink-0" size={18} />
                  <span className="text-slate-700 font-semibold">{donor.phone}</span>
                </div>
              )}
              {donor.email && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Mail className="text-red-500 shrink-0" size={18} />
                  <span className="text-slate-700 font-semibold">{donor.email}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Medical History */}
        {donor.medical_history && (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                <FileText className="text-blue-600" size={18} />
              </div>
              <h2 className="text-base font-black text-slate-900">Medical History</h2>
            </div>
            <p className="text-slate-600 font-medium leading-relaxed">{donor.medical_history}</p>
          </div>
        )}

        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 mt-6 mb-8 text-white">
          <h3 className="text-lg font-black mb-2">Interested in connecting?</h3>
          <p className="text-red-100 text-sm mb-5">
            {isAuthenticated
              ? 'Send a message to coordinate with this donor. Please be respectful and include relevant medical details.'
              : 'Log in to contact donors and submit help requests.'}
          </p>
          <div className="flex flex-wrap gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => navigate(`/chat?to=${donor.id}`)}
                className="flex items-center gap-2 px-5 py-3 bg-white text-red-700 font-black rounded-xl hover:bg-red-50 transition-all"
              >
                <MessageCircle size={18} /> Send Message
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-5 py-3 bg-white text-red-700 font-black rounded-xl hover:bg-red-50 transition-all"
              >
                Login to Contact
              </button>
            )}
            <button
              onClick={() => navigate('/find-donors')}
              className="flex items-center gap-2 px-5 py-3 bg-red-800 text-white font-bold rounded-xl hover:bg-red-900 transition-all"
            >
              <ArrowLeft size={18} /> Back to Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
