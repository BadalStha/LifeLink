import React, { useState } from 'react'; // Added useState to the import
import { Users, Activity, CheckCircle, AlertTriangle, Search } from 'lucide-react';
import ContactModal from '../Components/ContactModal'; // Ensure lowercase 'c' if that's your folder name

export default function Admin() {
  // CORRECTED: State must be INSIDE the function component
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState("");

  // Function to handle the button click
  const handleContact = (name) => {
    setSelectedDonor(name);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Admin Command Center</h2>
            <p className="text-slate-500">Monitoring LifeLink Network Statistics</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border flex items-center gap-2">
              <Activity size={18} className="text-red-600" />
              <span className="font-bold">System Status: Live</span>
            </div>
          </div>
        </header>

        {/* Quick Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard title="Total Donors" count="1,284" icon={<Users className="text-blue-600" />} />
          <StatCard title="Verified Hospitals" count="42" icon={<CheckCircle className="text-green-600" />} />
          <StatCard title="Pending Requests" count="18" icon={<AlertTriangle className="text-orange-600" />} />
        </div>

        {/* Donor Management Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-lg text-slate-800">Recent Registrations</h3>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input type="text" placeholder="Search donors..." className="pl-10 pr-4 py-2 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-red-500 text-sm" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-400 text-sm uppercase tracking-wider">
                  <th className="p-6 font-bold">Name</th>
                  <th className="p-6 font-bold">Type</th>
                  <th className="p-6 font-bold">Category</th>
                  <th className="p-6 font-bold">Location</th>
                  <th className="p-6 font-bold">Status</th>
                  <th className="p-6 font-bold">Contact</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-slate-100">
                {/* CORRECTED: Added 'onContact' prop to each row */}
                <AdminRow name="Badal Shrestha" type="O+" category="Blood" loc="Kathmandu" status="Verified" onContact={handleContact} />
                <AdminRow name="Dilasha Gautam" type="AB-" category="Blood" loc="Bhaktapur" status="Verified" onContact={handleContact} />
                <AdminRow name="Saugat Panta" type="Kidney" category="Organ" loc="Lalitpur" status="Pending" onContact={handleContact} />
                <AdminRow name="Muskan Mishra" type="Eyes" category="Organ" loc="Dharan" status="Verified" onContact={handleContact} />
                <AdminRow name="Saurav Rai" type="Liver" category="Organ" loc="Pokhara" status="Verified" onContact={handleContact} />
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal remains at the bottom of the main div */}
      <ContactModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        donorName={selectedDonor} 
      />
    </div>
  );
}

// --- SUB-COMPONENTS ---

function StatCard({ title, count, icon }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <h4 className="text-3xl font-black text-slate-800 mt-1">{count}</h4>
      </div>
      <div className="p-4 bg-slate-50 rounded-2xl">{icon}</div>
    </div>
  );
}

function AdminRow({ name, type, category, loc, status, onContact }) {
  return (
    <tr className="hover:bg-slate-50 transition-colors border-b border-slate-50">
      <td className="p-6 font-bold text-slate-700">{name}</td>
      <td className="p-6">
        <span className={`px-3 py-1 rounded-lg font-bold text-xs ${category === 'Blood' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
          {type}
        </span>
      </td>
      <td className="p-6 text-sm text-slate-600">{category}</td>
      <td className="p-6 text-slate-500 text-sm">{loc}</td>
      <td className="p-6">
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${status === 'Verified' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
          {status}
        </span>
      </td>
      <td className="p-6">
        <button 
          onClick={() => onContact(name)} 
          className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm"
        >
          Message
        </button>
      </td>
    </tr>
  );
}