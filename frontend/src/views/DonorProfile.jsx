import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Droplet, MapPin, Mail, Phone, Calendar, AlertCircle, Loader2, MessageCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function DonorProfile() {
  const navigate = useNavigate();
  const { donorId } = useParams();
  const [donor, setDonor] = useState(null);
  const [donationHistory, setDonationHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDonor = async () => {
      try {
        const profileRes = await fetch(`${API_BASE_URL}/api/users/${donorId}`);
        if (!profileRes.ok) {
          throw new Error('Donor not found');
        }

        const profileData = await profileRes.json();
        setDonor(profileData.user);

        try {
          const historyRes = await fetch(`${API_BASE_URL}/api/users/${donorId}/donation-history?limit=8`);
          if (historyRes.ok) {
            const historyData = await historyRes.json();
            setDonationHistory(Array.isArray(historyData.history) ? historyData.history : []);
          } else {
            setDonationHistory([]);
          }
        } catch {
          setDonationHistory([]);
        } finally {
          setHistoryLoading(false);
        }
      } catch (err) {
        setError(err.message || 'Failed to load donor profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDonor();
  }, [donorId]);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-red-600" size={36} />
          <p className="text-slate-500 font-semibold">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !donor) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        <button
          onClick={() => navigate('/find-donors')}
          className="mb-6 flex items-center gap-2 text-slate-600 hover:text-red-600 font-bold transition-all"
        >
          <ArrowLeft size={20} /> Back
        </button>
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Profile Not Found</h2>
          <p className="text-slate-500 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  const availabilityColor = donor.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500';
  const availabilityLabel = donor.is_active ? 'Available' : 'Unavailable';
  const formatDate = (dateValue) => {
    if (!dateValue) return 'Unknown date';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
        <button
          onClick={() => navigate('/find-donors')}
          className="flex items-center gap-2 text-slate-600 hover:text-red-600 font-bold transition-all"
        >
          <ArrowLeft size={20} /> Back
        </button>
      </nav>

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-900 px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-end gap-4">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-red-600 font-black text-3xl border-4 border-red-200">
              {getInitials(donor.name)}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-4xl font-black text-white">{donor.name || 'Anonymous Donor'}</h1>
                <button
                  onClick={() => navigate(`/chat?to=${donor.id}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-red-700 font-black rounded-xl hover:bg-red-50 transition-all"
                >
                  <MessageCircle size={18} /> Send Message
                </button>
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${availabilityColor}`}>
                {availabilityLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Donation Type */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider mb-4">Donation Information</h3>
          <div className="space-y-3">
            {donor.donation_type === 'blood' && donor.blood_type && (
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                <Droplet size={20} className="text-red-600" />
                <div>
                  <p className="text-sm text-slate-500 font-semibold">Blood Type</p>
                  <p className="text-lg font-black text-red-700">{donor.blood_type}</p>
                </div>
              </div>
            )}
            {donor.donation_type && (
              <p className="text-sm text-slate-600 mt-3 p-3 bg-slate-50 rounded-xl">
                Ready to donate: <span className="font-bold capitalize">
                  {donor.donation_type}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider mb-4">Contact Information</h3>
          <div className="space-y-3">
            {donor.city && (
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500 font-semibold">Location</p>
                  <p className="text-slate-800 font-semibold">{donor.city}</p>
                </div>
              </div>
            )}
            {donor.email && (
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500 font-semibold">Email</p>
                  <p className="text-slate-800 font-semibold truncate">{donor.email}</p>
                </div>
              </div>
            )}
            {donor.phone && (
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500 font-semibold">Phone</p>
                  <p className="text-slate-800 font-semibold">{donor.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider mb-4">Personal Information</h3>
          <div className="space-y-3">
            {donor.age && (
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500 font-semibold">Age</p>
                  <p className="text-slate-800 font-semibold">{donor.age} years</p>
                </div>
              </div>
            )}
            {donor.created_at && (
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">Member Since</p>
                <p className="text-slate-800 font-semibold">{new Date(donor.created_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Donation History */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider mb-4">Donation History</h3>

          {historyLoading ? (
            <p className="text-sm text-slate-500">Loading donation history...</p>
          ) : donationHistory.length > 0 ? (
            <div className="space-y-3">
              {donationHistory.map((item) => (
                <div key={`${item.donation_type}-${item.id}-${item.donation_date}`} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-800">
                      {item.donation_type} Donation
                    </p>
                    <span className="text-xs font-semibold text-slate-500">
                      {formatDate(item.donation_date)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 capitalize">
                    Status: {item.status || 'completed'}
                    {item.hospital_name ? ` • ${item.hospital_name}` : ''}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No donation history available.</p>
          )}
        </div>

      </div>
    </div>
  );
}
