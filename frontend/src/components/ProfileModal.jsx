import React from 'react';
import { X, MapPin, Phone } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, donor }) {
  // CRITICAL: If this line is missing, the box will never show up
  if (!isOpen || !donor) return null;

  return (
    <div className="absolute top-4 right-4 z-[1000] w-72 animate-in slide-in-from-right-5 duration-300">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="bg-red-600 p-4 text-white relative">
          <button onClick={onClose} className="absolute top-2 right-2 p-1 hover:bg-red-700 rounded-full">
            <X size={16} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center font-bold">
              {donor.name[0]}
            </div>
            <div>
              <h3 className="text-sm font-black">{donor.name}</h3>
              <p className="text-[10px] flex items-center gap-1"><MapPin size={10}/> {donor.loc}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white">
          <div className="bg-slate-50 p-3 rounded-xl mb-4">
             <p className="text-[8px] font-bold text-slate-400 uppercase">Blood/Organ Type</p>
             <p className="text-red-600 font-black text-sm">{donor.type}</p>
          </div>
          <button className="w-full bg-slate-900 text-white py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
            <Phone size={14}/> Contact Donor
          </button>
        </div>
      </div>
    </div>
  );
}