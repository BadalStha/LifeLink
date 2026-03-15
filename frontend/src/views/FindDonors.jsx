import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Droplet, Heart, Filter, Loader2,
  ArrowLeft, MessageCircle, Map, Phone, User, X, Navigation, Droplets, Eye, BadgeCheck
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { usersAPI, API_BASE_URL } from '../services/api';
import { BLOOD_TYPES, ORGAN_TYPES } from '../data/constants';

// Fix default leaflet icon
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Custom red donor icon
const donorIcon = L.divIcon({
  html: `<div style="background:#dc2626;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  className: '',
});

// Nepal district → lat/lng lookup (all districts from registration form)
const NEPAL_COORDS = {
  // Province 1 (Koshi)
  'bhojpur':        [27.1743, 87.0521],
  'dhankuta':       [26.9833, 87.3500],
  'ilam':           [26.9117, 87.9270],
  'jhapa':          [26.6400, 87.8780],
  'khotang':        [27.0167, 86.8333],
  'morang':         [26.5000, 87.2833],
  'okhaldhunga':    [27.3000, 86.5000],
  'panchthar':      [27.1500, 87.7833],
  'sankhuwasabha':  [27.3667, 87.1167],
  'solukhumbu':     [27.7667, 86.6500],
  'sunsari':        [26.6833, 87.1667],
  'taplejung':      [27.3500, 87.6667],
  'terhathum':      [27.1167, 87.5333],
  'udayapur':       [26.9900, 86.5167],
  // Madhesh Province
  'bara':           [27.0167, 85.0000],
  'dhanusa':        [26.8167, 85.9167],
  'dhanusha':       [26.8167, 85.9167],
  'mahottari':      [26.6333, 85.7833],
  'parsa':          [27.0000, 84.8833],
  'rautahat':       [27.0000, 85.3000],
  'saptari':        [26.5833, 86.7167],
  'sarlahi':        [27.0167, 85.5833],
  'siraha':         [26.6500, 86.2000],
  // Bagmati Province
  'bhaktapur':      [27.6710, 85.4298],
  'chitwan':        [27.5291, 84.3542],
  'dhading':        [27.8667, 84.9167],
  'dolakha':        [27.6833, 86.0833],
  'kathmandu':      [27.7172, 85.3240],
  'kavrepalanchok': [27.5333, 85.6833],
  'lalitpur':       [27.6644, 85.3188],
  'makwanpur':      [27.4333, 85.0333],
  'nuwakot':        [27.9167, 85.1667],
  'ramechhap':      [27.3333, 86.1000],
  'rasuwa':         [28.1000, 85.3667],
  'sindhuli':       [27.2833, 85.9000],
  'sindhupalchok':  [27.9500, 85.6833],
  // Gandaki Province
  'baglung':        [28.2667, 83.5833],
  'gorkha':         [28.0000, 84.6333],
  'kaski':          [28.2667, 84.0167],
  'lamjung':        [28.2667, 84.4167],
  'manang':         [28.6667, 84.0167],
  'mustang':        [28.9667, 83.8667],
  'myagdi':         [28.3667, 83.5833],
  'nawalpur':       [27.7000, 84.0333],
  'parbat':         [28.2333, 83.7167],
  'syangja':        [28.0167, 83.8833],
  'tanahun':        [27.9167, 84.2500],
  // Lumbini Province
  'arghakhanchi':   [27.9167, 83.1167],
  'banke':          [28.0500, 81.6167],
  'bardiya':        [28.3500, 81.5000],
  'dang':           [28.1000, 82.3000],
  'gulmi':          [28.0833, 83.2667],
  'kapilvastu':     [27.5667, 83.0500],
  'nawalparasi west':[27.5333, 83.8333],
  'nawalparasi':    [27.5333, 83.8333],
  'palpa':          [27.8667, 83.5500],
  'pyuthan':        [28.1000, 82.8333],
  'rolpa':          [28.2500, 82.6500],
  'rupandehi':      [27.5000, 83.4500],
  // Karnali Province
  'dailekh':        [28.8500, 81.7167],
  'dolpa':          [29.0000, 82.9667],
  'humla':          [29.9667, 81.9167],
  'jajarkot':       [28.7000, 82.1833],
  'jumla':          [29.2833, 82.1833],
  'kalikot':        [29.1333, 81.6333],
  'mugu':           [29.7167, 82.5167],
  'salyan':         [28.3833, 82.1500],
  'surkhet':        [28.6000, 81.6167],
  'western rukum':  [28.6167, 82.6500],
  // Sudurpashchim Province
  'achham':         [29.0833, 81.1833],
  'baitadi':        [29.5333, 80.4333],
  'bajhang':        [29.5500, 81.1667],
  'bajura':         [29.3500, 81.3833],
  'dadeldhura':     [29.3000, 80.5833],
  'darchula':       [29.8500, 80.4833],
  'doti':           [29.2667, 80.9333],
  'kailali':        [28.7000, 80.5833],
  'kanchanpur':     [28.9167, 80.0833],
  // City fallbacks
  'pokhara':        [28.2096, 83.9856],
  'biratnagar':     [26.4525, 87.2718],
  'birgunj':        [27.0000, 84.8800],
  'hetauda':        [27.4167, 85.0333],
  'butwal':         [27.7000, 83.4500],
  'nepalgunj':      [28.0500, 81.6167],
  'dhangadhi':      [28.6944, 80.5833],
  'janakpur':       [26.7271, 85.9235],
  'itahari':        [26.6611, 87.2778],
};

const getCoords = (city) => {
  if (!city) return null;
  const key = city.toLowerCase().trim();
  const baseCoords = NEPAL_COORDS[key];
  if (!baseCoords) return null;
  
  // Apply a small random geographic jitter so markers in the same city don't perfectly overlap
  // 0.02 degrees is approx 2km
  const jitterLat = (Math.random() - 0.5) * 0.04; 
  const jitterLng = (Math.random() - 0.5) * 0.04;
  
  return [baseCoords[0] + jitterLat, baseCoords[1] + jitterLng];
};

// Nepal bounds
const NEPAL_BOUNDS = [[26.347, 80.058], [30.447, 88.201]];
const NEPAL_CENTER = [28.394, 84.124];

// Sub-component: fly to user location
function FlyToUser({ userPos }) {
  const map = useMap();
  useEffect(() => {
    if (userPos) {
      map.flyTo(userPos, 12, { duration: 1.5 });
    }
  }, [userPos, map]);
  return null;
}

const DISTRICTS = [
  '', 'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Chitwan',
  'Jhapa', 'Morang', 'Sunsari', 'Dhanusha', 'Bara', 'Parsa',
  'Rupandehi', 'Kaski', 'Banke', 'Kailali', 'Surkhet'
];

// ─── Map Modal ──────────────────────────────────────────────────────────────
function MapModal({ donors, onClose }) {
  const [userPos, setUserPos] = useState(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState('');

  const mappedDonors = donors
    .map(d => ({ ...d, coords: getCoords(d.city) }))
    .filter(d => d.coords);

  const locateMe = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => {
        setGeoError('Unable to retrieve your location.');
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.75)' }}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-white shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <Map className="text-red-600" size={22} />
          <div>
            <h2 className="font-black text-slate-900 text-base leading-tight">Donor Map — Nepal</h2>
            <p className="text-xs text-slate-500">
              {mappedDonors.length} donor{mappedDonors.length !== 1 ? 's' : ''} plotted on map
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={locateMe}
            disabled={locating}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-60"
          >
            {locating
              ? <Loader2 size={15} className="animate-spin" />
              : <Navigation size={15} />}
            {locating ? 'Locating…' : 'My Location'}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {geoError && (
        <div className="bg-red-50 border-b border-red-200 text-red-700 text-xs font-semibold px-5 py-2 shrink-0">
          ⚠ {geoError}
        </div>
      )}

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={NEPAL_CENTER}
          zoom={7}
          minZoom={6}
          maxZoom={14}
          maxBounds={NEPAL_BOUNDS}
          maxBoundsViscosity={0.85}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          />

          {/* Fly to user when located */}
          {userPos && <FlyToUser userPos={userPos} />}

          {/* User location marker */}
          {userPos && (
            <>
              <Circle
                center={userPos}
                radius={600}
                pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.25, weight: 2 }}
              />
              <Marker
                position={userPos}
                icon={L.divIcon({
                  html: `<div style="background:#2563eb;width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(37,99,235,0.5)"></div>`,
                  iconSize: [18, 18],
                  iconAnchor: [9, 9],
                  className: '',
                })}
              >
                <Popup>
                  <div className="text-center">
                    <p className="font-bold text-blue-700">📍 You are here</p>
                  </div>
                </Popup>
              </Marker>
            </>
          )}

          {/* Donor markers */}
          {mappedDonors.map(donor => (
            <Marker key={donor.id} position={donor.coords} icon={donorIcon}>
              <Popup>
                <div style={{ minWidth: 140 }} className="text-center py-1">
                  <div
                    style={{ background: '#dc2626', color: '#fff', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontWeight: 900, fontSize: 14 }}
                  >
                    {(donor.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <p style={{ fontWeight: 800, fontSize: 13, marginBottom: 2 }}>{donor.name || 'Donor'}</p>
                  {donor.blood_type && (
                    <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, display: 'inline-block', marginBottom: 3 }}>
                      {donor.blood_type}
                    </span>
                  )}
                  <p style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>📍 {donor.city}</p>
                  <span style={{ fontSize: 10, background: donor.is_active ? '#dcfce7' : '#f1f5f9', color: donor.is_active ? '#16a34a' : '#94a3b8', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>
                    {donor.is_active ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-2xl shadow-lg px-4 py-3 text-xs font-semibold space-y-1.5">
          <div className="flex items-center gap-2">
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#dc2626', border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            <span className="text-slate-700">Donor</span>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#2563eb', border: '2px solid #fff', boxShadow: '0 1px 4px rgba(37,99,235,0.3)' }} />
            <span className="text-slate-700">Your Location</span>
          </div>
          {mappedDonors.length === 0 && (
            <p className="text-slate-400 italic">No donors with known locations</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Donor Card ─────────────────────────────────────────────────────────────
function DonorCard({ donor, navigate }) {
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const picUrl = donor.profile_picture
    ? (donor.profile_picture.startsWith('http') ? donor.profile_picture : `${API_BASE_URL}${donor.profile_picture}`)
    : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        {picUrl ? (
          <img
            src={picUrl}
            alt={donor.name}
            className="w-14 h-14 rounded-full object-cover shrink-0 border-2 border-red-200"
          />
        ) : (
          <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-white font-black text-lg shrink-0">
            {getInitials(donor.name)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1 min-w-0">
              <h3 className="font-black text-slate-800 truncate">{donor.name || 'Anonymous Donor'}</h3>
              {donor.verification_status === 'approved' && (
                <BadgeCheck size={16} className="text-blue-500 shrink-0" />
              )}
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${donor.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
              {donor.is_active ? 'Available' : 'Unavailable'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {donor.donation_type === 'blood' && donor.blood_type && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-black">
                <Droplet size={12} /> {donor.blood_type}
              </span>
            )}
            {donor.donation_type === 'organ' && donor.organ_type && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-black capitalize">
                <Heart size={12} /> {donor.organ_type}
              </span>
            )}
            {donor.city && (
              <span className="flex items-center gap-1 text-slate-500 text-xs font-semibold">
                <MapPin size={12} /> {donor.city}
              </span>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={() => navigate(`/donor/${donor.id}`)}
        className="w-full mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white font-bold rounded-xl text-sm hover:bg-red-700 transition-all"
      >
        <Eye size={16} /> View Profile
      </button>
    </div>
  );
}

// ─── Contact Modal ───────────────────────────────────────────────────────────
function ContactModal({ donor, onClose, isAuthenticated, onLogin, onStartChat }) {
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
              onClick={() => { onClose(); onStartChat(donor.id); }}
              className="w-full py-3 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all"
            >
              Open Chat with {donor.name?.split(' ')[0] || 'Donor'}
            </button>
            <button onClick={onClose} className="w-full py-2 text-slate-500 font-semibold hover:text-slate-700">Cancel</button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-slate-600 text-center text-sm">
              Please log in to contact donors and submit help requests.
            </p>
            <button onClick={onLogin} className="w-full py-3 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all">
              Login to Contact
            </button>
            <button onClick={onClose} className="w-full py-2 text-slate-500 font-semibold hover:text-slate-700">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function FindDonors() {
  const navigate = useNavigate();
  const [donors, setDonors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ blood_type: '', organ_type: '', city: '', name: '' });
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const isAuthenticated = !!localStorage.getItem('authToken');

  const fetchDonors = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (filters.blood_type) params.blood_type = filters.blood_type;
      if (filters.organ_type) params.organ_type = filters.organ_type;
      if (filters.city) params.city = filters.city;
      if (filters.name) params.search = filters.name;
      params.ready_to_donate = 'true';
      params.limit = '50';

      const data = await usersAPI.search(params);
      setDonors(data.users || []);
    } catch (err) {
      console.error('Failed to fetch donors:', err);
      setDonors([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDonors(); }, []);

  const handleSearch = (e) => { e.preventDefault(); fetchDonors(); };
  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const clearFilters = () => {
    setFilters({ blood_type: '', organ_type: '', city: '', name: '' });
    setTimeout(() => fetchDonors(), 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 shadow-sm px-5 md:px-12 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-red-600 transition-all">
            <ArrowLeft size={18}/>
          </button>
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-7 h-7 bg-red-600 rounded-md flex items-center justify-center">
              <Droplets size={14} className="text-white"/>
            </div>
            <span className="font-black text-slate-900">LifeLink</span>
          </div>
          <span className="text-slate-300 mx-1">|</span>
          <span className="font-bold text-slate-700 text-sm">Find Donors</span>
        </div>
        <div className="flex gap-2">
          {!isAuthenticated && (
            <button onClick={() => navigate('/login')} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg text-sm hover:bg-red-700 transition-all">
              Login
            </button>
          )}
          <button onClick={() => navigate('/request-help')} className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg text-sm hover:bg-black transition-all">
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
            <button type="submit" className="px-6 py-3 bg-white text-red-700 font-black rounded-2xl hover:bg-red-50 transition-all">
              Search
            </button>
          </form>

          {showFilters && (
            <div className="bg-white rounded-2xl p-5 mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Blood Type</label>
                <select value={filters.blood_type} onChange={(e) => handleFilterChange('blood_type', e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option value="">Any Blood Type</option>
                  {BLOOD_TYPES.filter(Boolean).map(bt => <option key={bt} value={bt}>{bt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">District / City</label>
                <select value={filters.city} onChange={(e) => handleFilterChange('city', e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option value="">Any Location</option>
                  {DISTRICTS.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Organ Type</label>
                <select value={filters.organ_type} onChange={(e) => handleFilterChange('organ_type', e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option value="">Any Organ</option>
                  {ORGAN_TYPES.filter(Boolean).map(ot => <option key={ot} value={ot}>{ot}</option>)}
                </select>
              </div>
              <div className="md:col-span-3">
                <button onClick={clearFilters} className="text-sm text-slate-500 hover:text-red-600 font-semibold">Clear all filters</button>
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
            <div className="w-3 h-3 bg-green-500 rounded-full" /> Available
            <div className="w-3 h-3 bg-slate-300 rounded-full ml-2" /> Unavailable
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
              <DonorCard key={donor.id} donor={donor} navigate={navigate} />
            ))}
          </div>
        )}

        {/* Map prompt banner */}
        {!isLoading && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-center gap-4">
            <Map className="text-blue-600 shrink-0" size={24} />
            <div>
              <p className="font-bold text-blue-800 text-sm">View donors on map</p>
              <p className="text-blue-600 text-xs mt-0.5">
                See all donor locations displayed on an interactive Nepal map.
              </p>
            </div>
            <button
              onClick={() => setShowMap(true)}
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
          onStartChat={(donorId) => navigate(`/chat?to=${donorId}`)}
        />
      )}

      {/* Map Modal */}
      {showMap && (
        <MapModal donors={donors} onClose={() => setShowMap(false)} />
      )}
    </div>
  );
}
