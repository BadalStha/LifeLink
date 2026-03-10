import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Activity, CheckCircle, AlertTriangle, Search, Loader2, RefreshCw, LogOut } from 'lucide-react';
import ContactModal from '../Components/ContactModal';
import { dashboardAPI } from '../services/api';

export default function Admin() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState("");
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      const [statsData, usersData] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getUsers({ limit: 20, search: searchQuery })
      ]);
      setStats(statsData.stats);
      setUsers(usersData.users);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };
const handleAdminLogout = () => {
    // Clear admin authentication
    localStorage.removeItem('adminToken');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminEmail');
    // Redirect to admin login
    navigate('/admin/login');
  };

  
  // Function to handle the button click
  const handleContact = (name) => {
    setSelectedDonor(name);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-red-600" size={40} />
          <p className="font-bold text-slate-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Admin Command Center</h2>
            <p className="text-slate-500">Monitoring LifeLink Network Statistics</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              disabled={isRefreshing}
              className="bg-white px-4 py-2 rounded-xl shadow-sm border flex items-center gap-2 hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <RefreshCw size={18} className={`text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="font-bold">Refresh</span>
            </button>
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border flex items-center gap-2">
              <Activity size={18} className="text-red-600" />
              <span className="font-bold">System Status: Live</span>
            </div>
            <button
              onClick={handleAdminLogout}
              className="bg-red-50 px-4 py-2 rounded-xl shadow-sm border border-red-200 flex items-center gap-2 hover:bg-red-100 transition-all"
            >
              <LogOut size={18} className="text-red-600" />
              <span className="font-bold text-red-600">Admin Logout</span>
            </button>
          </div>
        </header>

        {/* Quick Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard title="Total Users" count={stats?.total_users?.toLocaleString() || '0'} icon={<Users className="text-blue-600" />} />
          <StatCard title="Active Donors" count={stats?.total_donors?.toLocaleString() || '0'} icon={<CheckCircle className="text-green-600" />} />
          <StatCard title="Open Requests" count={stats?.active_requests?.toString() || '0'} icon={<AlertTriangle className="text-orange-600" />} />
        </div>

        {/* User Management Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-lg text-slate-800">Registered Users</h3>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                value={searchQuery}
                onChange={handleSearch}
                className="pl-10 pr-4 py-2 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-red-500 text-sm" 
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-400 text-sm uppercase tracking-wider">
                  <th className="p-6 font-bold">Name</th>
                  <th className="p-6 font-bold">Email</th>
                  <th className="p-6 font-bold">Blood Type</th>
                  <th className="p-6 font-bold">City</th>
                  <th className="p-6 font-bold">Role</th>
                  <th className="p-6 font-bold">Status</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-slate-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-500">
                      No users found. {searchQuery && 'Try a different search.'}
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <AdminRow 
                      key={user.id}
                      name={user.name || 'No name'}
                      email={user.email}
                      bloodType={user.blood_type || 'N/A'}
                      city={user.city || 'N/A'}
                      role={user.role}
                      status={user.is_active ? 'Active' : 'Inactive'}
                      onContact={handleContact}
                    />
                  ))
                )}
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

function AdminRow({ name, email, bloodType, city, role, status, onContact }) {
  return (
    <tr className="hover:bg-slate-50 transition-colors border-b border-slate-50">
      <td className="p-6 font-bold text-slate-700">{name}</td>
      <td className="p-6 text-sm text-slate-600">{email}</td>
      <td className="p-6">
        <span className={`px-3 py-1 rounded-lg font-bold text-xs ${bloodType !== 'N/A' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
          {bloodType}
        </span>
      </td>
      <td className="p-6 text-slate-500 text-sm">{city}</td>
      <td className="p-6">
        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
          role === 'admin' ? 'bg-purple-100 text-purple-700' : 
          role === 'hospital' ? 'bg-blue-100 text-blue-700' : 
          'bg-slate-100 text-slate-600'
        }`}>
          {role}
        </span>
      </td>
      <td className="p-6">
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
          {status}
        </span>
      </td>
    </tr>
  );
}