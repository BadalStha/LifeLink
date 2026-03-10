import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Droplet, Heart, Filter, Loader2,
  ArrowLeft, MessageCircle, Map, List, Phone, User
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const BLOOD_TYPES = ['', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const ORGAN_TYPES = ['', 'Kidney', 'Liver', 'Heart', 'Lung', 'Cornea', 'Pancreas'];
const DISTRICTS = [
  '', 'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Chitwan',
  'Jhapa', 'Morang', 'Sunsari', 'Dhanusha', 'Bara', 'Parsa',
  'Rupandehi', 'Kaski', 'Banke', 'Kailali', 'Surkhet'
];

function DonorCard({ donor, onContact }) {
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const availabilityColor = donor.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500';
  const availabilityLabel = donor.is_active ? 'Available' : 'Unavailable';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-white font-black text-lg shrink-0">
          {getInitials(donor.name)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-black text-slate-800 truncate">{donor.name || 'Anonymous Donor'}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${availabilityColor}`}>
              {availabilityLabel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2">
            {donor.blood_type && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-black">
                <Droplet size={12} /> {donor.blood_type}
              </span>
            )}
            {donor.city && (
              <span className="flex items-center gap-1 text-slate-500 text-xs font-semibold">
                <MapPin size={12} /> {donor.city}
              </span>
            )}
          </div>

          {donor.medical_history && (
            <p className="text-slate-500 text-xs mt-2 line-clamp-2">{donor.medical_history}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
        <button
          onClick={() => onContact(donor)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white font-bold rounded-xl text-sm hover:bg-red-700 transition-all"
        >
          <MessageCircle size={16} /> Contact Donor
        </button>
        <button
          onClick={() => onContact(donor)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition-all"
        >
          <Phone size={16} /> Request
        </button>
      </div>
    </div>
  );
}

function ContactModal({ donor, onClose, isAuthenticated, onLogin }) {
  if (!donor) return null;

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white font-black text-xl mx-auto mb-3">
            {getInitials(donor.name)}
          </div>
          <h3 className="text-xl font-black text-slate-900">{donor.name || 'Donor'}</h3>
          {donor.blood_type && (
            <span className="inline-block mt-1 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-bold">
              {donor.blood_type} Blood Group
            </span>
          )}
        </div>

        {isAuthenticated ? (
          <div className="space-y-4">
            <p className="text-slate-600 text-center text-sm">
              You can send a message to coordinate with this donor. Be respectful and include your medical details.
            </p>
            <button
              onClick={() => {
                onClose();
                window.location.href = `/chat?to=${donor.id}`;
              }}
              className="w-full py-3 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all"
            >
              Open Chat with {donor.name?.split(' ')[0] || 'Donor'}
            </button>
            <button onClick={onClose} className="w-full py-2 text-slate-500 font-semibold hover:text-slate-700">
              Cancel
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-slate-600 text-center text-sm">
              Please log in to contact donors and submit help requests.
            </p>
            <button
              onClick={onLogin}
              className="w-full py-3 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all"
            >
              Login to Contact
            </button>
            <button onClick={onClose} className="w-full py-2 text-slate-500 font-semibold hover:text-slate-700">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FindDonors() {
  const navigate = useNavigate();
  const [donors, setDonors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ blood_type: '', organ_type: '', city: '', name: '' });
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const isAuthenticated = !!localStorage.getItem('authToken');

  const fetchDonors = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.blood_type) params.set('blood_type', filters.blood_type);
      if (filters.city) params.set('city', filters.city);
      if (filters.name) params.set('search', filters.name);
      params.set('limit', '50');

      const res = await fetch(`${API_BASE_URL}/api/search?${params}`);
      const data = await res.json();
      setDonors(data.users || []);
    } catch (err) {
      console.error('Failed to fetch donors:', err);
      setDonors([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDonors();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ blood_type: '', organ_type: '', city: '', name: '' });
    setTimeout(() => fetchDonors(), 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-red-600 font-bold transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-black text-red-700">Find Donors</h1>
        </div>
        <div className="flex gap-3">
          {!isAuthenticated && (
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl text-sm hover:bg-red-700 transition-all"
            >
              Login
            </button>
          )}
          <button
            onClick={() => navigate('/request-help')}
            className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-black transition-all"
          >
            Request Help
          </button>
        </div>
      </nav>

      {/* Search Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-900 px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-white mb-2">Find a Donor Near You</h2>
          <p className="text-red-200 mb-6">Search by blood type, organ, or location across Nepal</p>

          <form onSubmit={handleSearch} className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-48 relative">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by name..."
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-5 py-3 bg-red-800 text-white font-bold rounded-2xl hover:bg-red-900 border border-red-600 transition-all"
            >
              <Filter size={18} /> Filters
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-white text-red-700 font-black rounded-2xl hover:bg-red-50 transition-all"
            >
              Search
            </button>
          </form>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white rounded-2xl p-5 mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Blood Type</label>
                <select
                  value={filters.blood_type}
                  onChange={(e) => handleFilterChange('blood_type', e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Any Blood Type</option>
                  {BLOOD_TYPES.filter(Boolean).map(bt => (
                    <option key={bt} value={bt}>{bt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">District / City</label>
                <select
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Any Location</option>
                  {DISTRICTS.filter(Boolean).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Organ Type</label>
                <select
                  value={filters.organ_type}
                  onChange={(e) => handleFilterChange('organ_type', e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Any Organ</option>
                  {ORGAN_TYPES.filter(Boolean).map(ot => (
                    <option key={ot} value={ot}>{ot}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <button onClick={clearFilters} className="text-sm text-slate-500 hover:text-red-600 font-semibold">
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-600 font-semibold">
            {isLoading ? 'Searching...' : `${donors.length} donor${donors.length !== 1 ? 's' : ''} found`}
          </p>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div> Available
            <div className="w-3 h-3 bg-slate-300 rounded-full ml-2"></div> Unavailable
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-red-600" size={36} />
              <p className="text-slate-500 font-semibold">Searching for donors...</p>
            </div>
          </div>
        ) : donors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <User size={32} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-black text-slate-700 mb-2">No donors found</h3>
            <p className="text-slate-500 mb-6">Try adjusting your filters or search in a different district.</p>
            <button onClick={clearFilters} className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {donors.map((donor) => (
              <DonorCard key={donor.id} donor={donor} onContact={setSelectedDonor} />
            ))}
          </div>
        )}

        {/* Map hint */}
        {!isLoading && donors.length > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-center gap-4">
            <Map className="text-blue-600 shrink-0" size={24} />
            <div>
              <p className="font-bold text-blue-800 text-sm">View donors on map</p>
              <p className="text-blue-600 text-xs mt-0.5">See all donor locations displayed on an interactive Nepal map from the Home page.</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="ml-auto px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-all shrink-0"
            >
              View Map
            </button>
          </div>
        )}
      </div>

      {/* Contact Modal */}
      {selectedDonor && (
        <ContactModal
          donor={selectedDonor}
          onClose={() => setSelectedDonor(null)}
          isAuthenticated={isAuthenticated}
          onLogin={() => navigate('/login')}
        />
      )}
    </div>
  );
}
