import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ProfileModal from './ProfileModal';

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

  const donors = [
    { id: 1, name: "Tirion Lanster", type: "O+ (Blood)", pos: [27.7172, 85.3240], loc: "Scotland" },
    { id: 2, name: "Steven Strange", type: "Kidney", pos: [27.6710, 85.3123], loc: "NewYork" }
  ];

  const handleViewProfile = (donor) => {
    setSelectedDonor(donor);
    setIsProfileOpen(true); // This triggers the modal
  };

  return (
    <div className="w-full h-[600px] rounded-3xl overflow-hidden relative shadow-2xl border-4 border-white">
      <MapContainer center={[27.700769, 85.300140]} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {donors.map((donor) => (
          <Marker key={donor.id} position={donor.pos}>
            <Popup>
              <div className="text-center p-1">
                <h4 className="font-bold">{donor.name}</h4>
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