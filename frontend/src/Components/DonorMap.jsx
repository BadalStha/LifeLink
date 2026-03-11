import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2 } from 'lucide-react';
import ProfileModal from './ProfileModal';
import { donorsAPI } from '../services/api';

// Standard Leaflet Icon Fix
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function DonorMap() {
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [donors, setDonors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDonors = async () => {
      try {
        const data = await donorsAPI.getLocations({ limit: 100 });
        setDonors(data.donors || []);
      } catch (error) {
        console.error('Failed to load donors:', error);
        setDonors([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDonors();
  }, []);

  const handleViewProfile = (donor) => {
    setSelectedDonor(donor);
    setIsProfileOpen(true); // This triggers the modal
  };

  if (isLoading) {
    return (
      <div className="w-full h-[600px] rounded-3xl overflow-hidden relative shadow-2xl border-4 border-white bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-red-600" size={40} />
          <p className="font-bold text-slate-600">Loading donor map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] rounded-3xl overflow-hidden relative shadow-2xl border-4 border-white">
      <MapContainer center={[27.700769, 85.300140]} zoom={7} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {donors.map((donor) => (
          <Marker key={donor.id} position={donor.coordinates}>
            <Popup>
              <div className="text-center p-1">
                <h4 className="font-bold">{donor.name}</h4>
                {donor.blood_type && <p className="text-xs text-red-600 font-semibold">{donor.blood_type}</p>}
                <p className="text-xs text-slate-500">{donor.city}</p>
                <button 
                  onClick={() => handleViewProfile(donor)}
                  className="mt-2 bg-slate-900 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold"
                >
                  View Profile
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* This MUST stay here, outside the MapContainer but inside the relative div */}
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        donor={selectedDonor} 
      />
    </div>
  );
}