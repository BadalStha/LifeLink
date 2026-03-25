import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  BadgeCheck,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Heart,
  Loader2,
  LogOut,
  Menu,
  Radio,
  Search,
  Send,
  Settings,
  Shield,
  UserCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import DonorMap from '../components/DonorMap';
import { adminAPI, API_BASE_URL } from '../services/api';
import { NEPAL_HOSPITALS } from '../data/constants';

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const TABS = [
  { key: 'users', label: 'Users & Donors', icon: Users },
  { key: 'requests', label: 'Requests', icon: FileText },
  { key: 'hospitals', label: 'Hospitals', icon: Building2 },
  { key: 'broadcast', label: 'Broadcast', icon: Radio },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'reports', label: 'Reports', icon: Download },
  { key: 'settings', label: 'Settings', icon: Settings },
];

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const downloadCsv = (filename, csvContent) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/* ------------------------------------------------------------------ */
/*  Small UI primitives                                               */
/* ------------------------------------------------------------------ */

function Badge({ children, variant = 'default' }) {
  const styles = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    red: 'bg-red-50 text-red-700 ring-red-600/20',
    amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    default: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[variant] || styles.default}`}>
      {children}
    </span>
  );
}

function Metric({ title, value, icon, trend }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center">{icon}</div>
      </div>
      <p className="text-3xl font-bold text-slate-900 mt-3 tracking-tight">{value}</p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-0.5">{value || '-'}</p>
    </div>
  );
}

function DataTable({ title, rows = [], columns = [] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-700 mb-2">{title}</h4>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">No data found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                {columns.map((c) => (
                  <th key={c} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c.replace(/_/g, ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, idx) => (
                <tr key={row.id || idx} className="hover:bg-slate-50/50">
                  {columns.map((c) => (
                    <td key={c} className="px-3 py-2 text-slate-700">{String(row[c] ?? '-')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SettingToggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${value ? 'bg-emerald-500' : 'bg-slate-200'}`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 translate-y-0.5 ${value ? 'translate-x-5.5 ml-0.5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

function SimpleListCard({ title, items, itemKey }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h4 className="text-sm font-semibold text-slate-700 mb-3">{title}</h4>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">No data.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-slate-600">{item[itemKey] || 'Unknown'}</span>
              <span className="text-sm font-semibold text-slate-900">{item.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

function HospitalNameCombobox({ value, onChange, onCityChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const filtered = value.trim().length === 0
    ? NEPAL_HOSPITALS
    : NEPAL_HOSPITALS.filter((h) =>
        h.name.toLowerCase().includes(value.toLowerCase())
      );

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative sm:col-span-2">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Hospital Name"
          required
          className="w-full px-3 py-2.5 pr-9 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all"
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          tabIndex={-1}
        >
          <ChevronDown size={15} />
        </button>
      </div>

      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg text-sm">
          {filtered.slice(0, 10).map((h) => (
            <li key={h.name}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(h.name);
                  onCityChange(h.city);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors"
              >
                <span className="font-medium text-slate-900">{h.name}</span>
                <span className="text-slate-400 text-xs ml-2">{h.city}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('users');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [logs, setLogs] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [settingsData, setSettingsData] = useState({ settings: {}, admin_accounts: [] });

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState('open');

  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', expires_at: '', channels: ['notification', 'email'] });
  const [broadcastPreview, setBroadcastPreview] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState(null); // { type: 'success'|'error', text: '' }

  const [hospitalEdit, setHospitalEdit] = useState(null);
  const [showCreateHospital, setShowCreateHospital] = useState(false);
  const [createHospitalForm, setCreateHospitalForm] = useState({ name: '', email: '', password: '', phone: '', city: '' });
  const [createHospitalError, setCreateHospitalError] = useState('');
  const [createHospitalSuccess, setCreateHospitalSuccess] = useState('');

  /* ---------- data loading ---------- */

  /* ---------- data loading ---------- */

  const loadAll = async () => {
    try {
      setIsRefreshing(true);
      setError('');

      const [overviewData, usersData, requestsData, hospitalsData, logsData, announcementsData, settingsResp] = await Promise.all([
        adminAPI.getOverview(),
        adminAPI.getUsers({ search: searchQuery, role: roleFilter, status: statusFilter, verification: verificationFilter, limit: 100 }),
        adminAPI.getRequests({ status: requestStatusFilter, limit: 100 }),
        adminAPI.getHospitals(),
        adminAPI.getNotificationLogs(),
        adminAPI.getAnnouncements(),
        adminAPI.getSettings(),
      ]);

      setOverview(overviewData);
      setUsers(usersData.users || []);
      setRequests(requestsData.requests || []);
      setHospitals(hospitalsData.hospitals || []);
      setLogs(logsData.logs || []);
      setAnnouncements(announcementsData.announcements || []);
      setSettingsData(settingsResp || { settings: {}, admin_accounts: [] });
    } catch (err) {
      setError(err.message || 'Failed to load admin data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { loadAll(); }, [searchQuery, roleFilter, statusFilter, verificationFilter, requestStatusFilter]);

  /* ---------- handlers ---------- */

  const handleAdminLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminEmail');
    navigate('/login');
  };

  const openUserProfile = async (id) => {
    try {
      setProfileLoading(true);
      const data = await adminAPI.getUserProfile(id);
      setSelectedUserProfile(data);
    } catch (err) {
      alert(err.message || 'Failed to load user profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUserVerification = async (id, status, review_note = '') => {
    try {
      await adminAPI.updateUserVerification(id, { status, review_note });
      await loadAll();
      if (selectedUserProfile && selectedUserProfile.user.id === id) {
        const data = await adminAPI.getUserProfile(id);
        setSelectedUserProfile(data);
      }
    } catch (err) {
      alert(err.message || 'Failed to update verification');
    }
  };

  const toggleUserActive = async (user) => {
    try {
      await adminAPI.updateUserAccountStatus(user.id, !user.is_active);
      await loadAll();
    } catch (err) {
      alert(err.message || 'Failed to update account status');
    }
  };

  const updateRequestStatus = async (id, status) => {
    try {
      await adminAPI.updateRequestStatus(id, status);
      await loadAll();
    } catch (err) {
      alert(err.message || 'Failed to update request status');
    }
  };

  const toggleHospital = async (hospital) => {
    try {
      await adminAPI.updateHospitalStatus(hospital.id, !hospital.is_active);
      await loadAll();
    } catch (err) {
      alert(err.message || 'Failed to update hospital status');
    }
  };

  const saveHospitalEdit = async () => {
    if (!hospitalEdit) return;
    try {
      await adminAPI.updateHospital(hospitalEdit.id, hospitalEdit);
      setHospitalEdit(null);
      await loadAll();
    } catch (err) {
      alert(err.message || 'Failed to update hospital profile');
    }
  };

  const submitCreateHospital = async (e) => {
    e.preventDefault();
    setCreateHospitalError('');
    setCreateHospitalSuccess('');
    try {
      await adminAPI.createHospital(createHospitalForm);
      setCreateHospitalSuccess('Hospital account created successfully.');
      setCreateHospitalForm({ name: '', email: '', password: '', phone: '', city: '' });
      await loadAll();
    } catch (err) {
      setCreateHospitalError(err.message || 'Failed to create hospital account');
    }
  };

  const sendBroadcast = async (e) => {
    e.preventDefault();
    setBroadcastStatus(null);
    const { channels } = broadcastForm;
    const channelLabels = { notification: 'notification', announcement: 'homepage announcement', email: 'email' };
    try {
      await adminAPI.sendBroadcast(broadcastForm);
      setBroadcastForm({ title: '', message: '', expires_at: '', channels: ['notification', 'email'] });
      setBroadcastPreview(false);
      const sent = channels.map((c) => channelLabels[c] || c).join(', ');
      setBroadcastStatus({ type: 'success', text: `Broadcast sent via: ${sent}.` });
      await loadAll();
    } catch (err) {
      setBroadcastPreview(false);
      setBroadcastStatus({ type: 'error', text: err.message || 'Failed to send broadcast' });
    }
  };

  const clearBroadcastHistory = async () => {
    if (!window.confirm('Delete all broadcast history? This cannot be undone.')) return;
    try {
      await adminAPI.clearNotificationLogs();
      await loadAll();
    } catch (err) {
      alert(err.message || 'Failed to clear broadcast history');
    }
  };

  const deleteAnnouncement = async (id) => {
    if (!window.confirm('Remove this announcement from the home page?')) return;
    try {
      await adminAPI.deleteAnnouncement(id);
      await loadAll();
    } catch (err) {
      alert(err.message || 'Failed to delete announcement');
    }
  };

  const exportReport = async (type) => {
    try {
      const csv = await adminAPI.exportReport(type);
      downloadCsv(`${type}_report.csv`, csv);
    } catch (err) {
      alert(err.message || 'Failed to export report');
    }
  };

  const updateSetting = async (key, value) => {
    try {
      await adminAPI.updateSettings({ ...settingsData.settings, [key]: String(value) });
      await loadAll();
    } catch (err) {
      alert(err.message || 'Failed to update settings');
    }
  };

  /* ---------- active tab info ---------- */

  const activeTabInfo = TABS.find((t) => t.key === activeTab) || TABS[0];

  /* ---------- tab content ---------- */

  const tabContent = useMemo(() => {
    // ---- USERS ----
    if (activeTab === 'users') {
      return (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-4 gap-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
              <option value="">All Roles</option>
              <option value="user">Donors</option>
              <option value="patient">Recipients</option>
              <option value="hospital">Hospitals</option>
              <option value="admin">Admins</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select value={verificationFilter} onChange={(e) => setVerificationFilter(e.target.value)} className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
              <option value="">All KYC States</option>
              <option value="pending">KYC Pending Review</option>
              <option value="approved">KYC Approved</option>
              <option value="rejected">KYC Rejected</option>
              <option value="awaiting_submission">Awaiting KYC Submission</option>
            </select>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Blood</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">City</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Verification</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <button className="inline-flex items-center gap-1 font-semibold text-slate-900 hover:text-blue-700 transition-colors" onClick={() => openUserProfile(u.id)}>
                          {u.name || 'Unnamed'}
                          {u.verification_status === 'approved' && (
                            <BadgeCheck size={15} className="text-blue-500 shrink-0" />
                          )}
                        </button>
                        <p className="text-xs text-slate-400 mt-0.5">{u.email}</p>
                      </td>
                      <td className="px-4 py-3"><Badge>{u.role}</Badge></td>
                      <td className="px-4 py-3 text-slate-600">{u.blood_type || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{u.city || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={u.verification_status === 'approved' ? 'green' : u.verification_status === 'rejected' ? 'red' : 'amber'}>
                          {u.verification_status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.is_active ? 'green' : 'default'}>
                          {u.is_active ? 'Active' : 'Suspended'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          {u.verification_status !== 'approved' && (
                            <button
                              onClick={() => u.has_kyc && openUserProfile(u.id)}
                              disabled={!u.has_kyc}
                              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${u.has_kyc ? 'text-blue-700 bg-blue-50 hover:bg-blue-100' : 'text-slate-400 bg-slate-100 cursor-not-allowed'}`}
                            >
                              {u.has_kyc ? 'Review KYC' : 'Awaiting KYC'}
                            </button>
                          )}
                          {u.is_active ? (
                            <button onClick={() => toggleUserActive(u)} className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors">Deactivate</button>
                          ) : (
                            <button onClick={() => toggleUserActive(u)} className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors">Reactivate</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // ---- REQUESTS ----
    if (activeTab === 'requests') {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            {['open', 'fulfilled', 'cancelled', ''].map((val) => (
              <button
                key={val}
                onClick={() => setRequestStatusFilter(val)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  requestStatusFilter === val ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {val || 'All'}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {requests.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 capitalize">{r.request_type} {r.blood_type || r.organ_type || ''}</p>
                    <p className="text-xs text-slate-400 mt-1">Requester: {r.requester_name || r.requester_email || '-'}</p>
                    <p className="text-xs text-slate-400">Location: {r.location || '-'}</p>
                  </div>
                  <Badge variant={r.urgency === 'critical' || r.urgency === 'high' ? 'red' : 'amber'}>{r.urgency}</Badge>
                </div>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">{r.reason || 'No reason provided.'}</p>
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                  {r.status !== 'fulfilled' && (
                    <button onClick={() => updateRequestStatus(r.id, 'fulfilled')} className="px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md transition-colors">Fulfill</button>
                  )}
                  {r.status !== 'open' && (
                    <button onClick={() => updateRequestStatus(r.id, 'open')} className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors">Reopen</button>
                  )}
                  {r.status !== 'cancelled' && (
                    <button onClick={() => updateRequestStatus(r.id, 'cancelled')} className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md transition-colors">Close</button>
                  )}
                </div>
              </div>
            ))}
            {requests.length === 0 && (
              <p className="col-span-2 text-center py-12 text-slate-400 text-sm">No requests found.</p>
            )}
          </div>
        </div>
      );
    }

    // ---- HOSPITALS ----
    if (activeTab === 'hospitals') {
      return (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => { setShowCreateHospital(!showCreateHospital); setCreateHospitalError(''); setCreateHospitalSuccess(''); }}
              className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
            >
              {showCreateHospital ? 'Cancel' : 'Create Hospital Account'}
            </button>
          </div>

          {showCreateHospital && (
            <form onSubmit={submitCreateHospital} className="bg-white rounded-xl border-2 border-blue-200 p-5">
              <p className="font-semibold text-slate-900 mb-4">New Hospital Account</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <HospitalNameCombobox
                  value={createHospitalForm.name}
                  onChange={(val) => setCreateHospitalForm((p) => ({ ...p, name: val }))}
                  onCityChange={(city) => setCreateHospitalForm((p) => ({ ...p, city: p.city || city }))}
                />
                {[
                  { key: 'email', label: 'Email', type: 'email', required: true },
                  { key: 'password', label: 'Password', type: 'password', required: true },
                  { key: 'phone', label: 'Phone', type: 'text', required: false },
                  { key: 'city', label: 'City', type: 'text', required: false },
                ].map(({ key, label, type, required }) => (
                  <input
                    key={key}
                    type={type}
                    value={createHospitalForm[key]}
                    onChange={(e) => setCreateHospitalForm({ ...createHospitalForm, [key]: e.target.value })}
                    placeholder={label}
                    required={required}
                    className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all"
                  />
                ))}
              </div>
              {createHospitalError && (
                <p className="mt-3 text-sm text-red-600 font-medium">{createHospitalError}</p>
              )}
              {createHospitalSuccess && (
                <p className="mt-3 text-sm text-green-600 font-medium">{createHospitalSuccess}</p>
              )}
              <div className="flex gap-2 mt-4">
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors">
                  Create Account
                </button>
                <button type="button" onClick={() => setShowCreateHospital(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {hospitals.map((h) => (
            <div key={h.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{h.name}</p>
                  <p className="text-sm text-slate-400 mt-0.5">{[h.city, h.phone, h.email].filter(Boolean).join(' / ') || '-'}</p>
                </div>
                <Badge variant={h.is_active ? 'green' : 'default'}>{h.is_active ? 'Active' : 'Inactive'}</Badge>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100">
                <button onClick={() => toggleHospital(h)} className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md transition-colors">
                  {h.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => setHospitalEdit(h)} className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors">Edit</button>
              </div>
            </div>
          ))}

          {hospitalEdit && (
            <div className="bg-white rounded-xl border-2 border-blue-200 p-5">
              <p className="font-semibold text-slate-900 mb-4">Editing: {hospitalEdit.name}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {['name', 'phone', 'email', 'city', 'location', 'address'].map((field) => (
                  <input
                    key={field}
                    value={hospitalEdit[field] || ''}
                    onChange={(e) => setHospitalEdit({ ...hospitalEdit, [field]: e.target.value })}
                    className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all capitalize"
                    placeholder={field}
                  />
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={saveHospitalEdit} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors">Save</button>
                <button onClick={() => setHospitalEdit(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors">Cancel</button>
              </div>
            </div>
          )}

          {hospitals.length === 0 && (
            <p className="text-center py-12 text-slate-400 text-sm">No hospitals found.</p>
          )}
        </div>
      );
    }

    // ---- BROADCAST ----
    if (activeTab === 'broadcast') {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
                <Send size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Send Broadcast</h3>
                <p className="text-xs text-slate-500 mt-0.5">Send an in-app notification, homepage announcement, or email to all users</p>
              </div>
            </div>

            {broadcastStatus && (
              <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${broadcastStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {broadcastStatus.text}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); setBroadcastPreview(true); }} className="space-y-3">
              <input
                value={broadcastForm.title}
                onChange={(e) => setBroadcastForm((p) => ({ ...p, title: e.target.value }))}
                required
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all"
                placeholder="Broadcast title"
              />
              <textarea
                value={broadcastForm.message}
                onChange={(e) => setBroadcastForm((p) => ({ ...p, message: e.target.value }))}
                required
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none min-h-[140px] transition-all"
                placeholder="Write your message to all users..."
              />
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Expires at <span className="text-slate-400 font-normal">(leave blank for no expiry)</span></label>
                <input
                  type="datetime-local"
                  value={broadcastForm.expires_at}
                  onChange={(e) => setBroadcastForm((p) => ({ ...p, expires_at: e.target.value }))}
                  min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Send via</label>
                <div className="flex flex-wrap gap-4">
                  {[
                    { key: 'notification', label: 'Notification', desc: 'In-app alert for all users' },
                    { key: 'announcement', label: 'Announcement', desc: 'Shown on the homepage' },
                    { key: 'email', label: 'Email', desc: 'Sent to all active users' },
                  ].map(({ key, label, desc }) => (
                    <label key={key} className="flex items-start gap-2.5 cursor-pointer select-none group">
                      <input
                        type="checkbox"
                        checked={broadcastForm.channels.includes(key)}
                        onChange={(e) => {
                          setBroadcastForm((p) => ({
                            ...p,
                            channels: e.target.checked
                              ? [...p.channels, key]
                              : p.channels.filter((c) => c !== key),
                          }));
                        }}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 accent-slate-900 cursor-pointer"
                      />
                      <span>
                        <span className="text-sm font-medium text-slate-800 group-hover:text-slate-900">{label}</span>
                        <span className="block text-xs text-slate-400">{desc}</span>
                      </span>
                    </label>
                  ))}
                </div>
                {broadcastForm.channels.length === 0 && (
                  <p className="text-xs text-red-500 mt-1.5">Select at least one channel.</p>
                )}
              </div>
              <button
                type="submit"
                disabled={broadcastForm.channels.length === 0}
                className="w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <ChevronRight size={15} />
                Preview Broadcast
              </button>
            </form>

            {broadcastPreview && (
              <div className="mt-4 rounded-xl border-2 border-red-200 bg-red-50 p-5">
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-3">Preview — this is what users will see</p>
                <p className="font-semibold text-slate-900 text-sm">{broadcastForm.title}</p>
                <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap leading-relaxed">{broadcastForm.message}</p>
                {broadcastForm.expires_at && (
                  <p className="text-xs text-slate-500 mt-2">
                    Expires: {new Date(broadcastForm.expires_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                )}
                {!broadcastForm.expires_at && (
                  <p className="text-xs text-slate-400 mt-2">No expiry — permanent broadcast</p>
                )}
                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  <span className="text-xs text-slate-500 font-medium">Sending via:</span>
                  {broadcastForm.channels.map((ch) => (
                    <span key={ch} className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-900 text-white capitalize">{ch}</span>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={sendBroadcast} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                    <Send size={14} />
                    Send to All Users
                  </button>
                  <button onClick={() => setBroadcastPreview(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-semibold transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Active Announcements</h3>
                <p className="text-xs text-slate-400 mt-0.5">Showing on the home page — remove to hide from public</p>
              </div>
            </div>
            {announcements.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-sm">No announcements currently on the home page.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {announcements.map((ann) => (
                  <div key={ann.id} className="px-5 py-4 flex items-start justify-between gap-4 hover:bg-slate-50/60">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{ann.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{ann.content}</p>
                      <p className="text-xs text-slate-400 mt-1">{ann.author_name || 'Unknown'} · {formatDate(ann.created_at)}</p>
                    </div>
                    <button
                      onClick={() => deleteAnnouncement(ann.id)}
                      className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700 px-2.5 py-1 rounded-md hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Broadcast History</h3>
              {logs.length > 0 && (
                <button
                  onClick={clearBroadcastHistory}
                  className="text-xs font-medium text-red-600 hover:text-red-700 px-2.5 py-1 rounded-md hover:bg-red-50 transition-colors"
                >
                  Clear History
                </button>
              )}
            </div>
            {logs.length === 0 ? (
              <p className="text-center py-10 text-slate-400 text-sm">No broadcasts sent yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Via</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expires</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{formatDate(log.created_at)}</td>
                        <td className="px-4 py-2.5 text-slate-800 font-medium">{log.subject || '-'}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {(log.channel || 'email').split(',').map((ch) => (
                              <span key={ch} className="text-xs font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 capitalize">{ch.trim()}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {log.expires_at ? (
                            <span className={`text-xs font-medium ${new Date(log.expires_at) < new Date() ? 'text-slate-400' : 'text-amber-600'}`}>
                              {new Date(log.expires_at) < new Date() ? 'Expired ' : ''}{formatDate(log.expires_at)}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Never</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5"><Badge variant="green">{log.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      );
    }

    // ---- ANALYTICS ----
    if (activeTab === 'analytics') {
      return (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Metric title="Total Donors" value={overview?.stats?.total_donors || 0} icon={<Users size={18} className="text-blue-600" />} />
            <Metric title="Total Recipients" value={overview?.stats?.total_recipients || 0} icon={<Shield size={18} className="text-indigo-600" />} />
            <Metric title="Pending Requests" value={overview?.stats?.requests_pending || 0} icon={<XCircle size={18} className="text-amber-600" />} />
            <Metric title="Fulfilled" value={overview?.stats?.requests_fulfilled || 0} icon={<CheckCircle2 size={18} className="text-emerald-600" />} />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <SimpleListCard title="Blood Group Distribution" items={overview?.blood_group_distribution || []} itemKey="blood_type" />
            <SimpleListCard title="Organ Type Distribution" items={overview?.organ_type_distribution || []} itemKey="organ_type" />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Donor Distribution Map</h4>
            <DonorMap />
          </div>
        </div>
      );
    }

    // ---- REPORTS ----
    if (activeTab === 'reports') {
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900">Export Reports</h3>
          <p className="text-sm text-slate-500 mt-1">Download donor, recipient, and request data in CSV format.</p>
          <div className="flex flex-wrap gap-3 mt-6">
            {[
              { type: 'donors', label: 'Donor Report', variant: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
              { type: 'recipients', label: 'Recipient Report', variant: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
              { type: 'requests', label: 'Request History', variant: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
            ].map(({ type, label, variant }) => (
              <button key={type} onClick={() => exportReport(type)} className={`px-4 py-2.5 ${variant} rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition-colors`}>
                <Download size={16} /> {label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // ---- SETTINGS ----
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">System Settings</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <SettingToggle label="Require donor verification" value={settingsData.settings.require_donor_verification === 'true'} onChange={(v) => updateSetting('require_donor_verification', v)} />
            <SettingToggle label="Require hospital verification" value={settingsData.settings.require_hospital_verification === 'true'} onChange={(v) => updateSetting('require_hospital_verification', v)} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">Admin Accounts</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settingsData.admin_accounts?.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{a.name || 'Admin'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{a.email}</td>
                    <td className="px-4 py-2.5"><Badge variant={a.is_active ? 'green' : 'default'}>{a.is_active ? 'Active' : 'Inactive'}</Badge></td>
                    <td className="px-4 py-2.5 text-slate-500">{formatDate(a.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }, [activeTab, users, requests, hospitals, logs, announcements, overview, settingsData, searchQuery, roleFilter, statusFilter, verificationFilter, requestStatusFilter, broadcastForm, broadcastStatus, broadcastPreview, hospitalEdit, showCreateHospital, createHospitalForm, createHospitalError, createHospitalSuccess]);

  /* ---------- loading state ---------- */

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm font-medium">Loading admin panel...</span>
        </div>
      </div>
    );
  }

  /* ---------- render ---------- */

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ---- Sidebar (desktop) ---- */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-slate-200 fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-100">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <Heart size={16} className="text-white" fill="white" />
          </div>
          <span className="text-base font-bold text-slate-900 tracking-tight">LifeLink</span>
          <Badge variant="default">Admin</Badge>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon size={18} className={active ? 'text-white' : 'text-slate-400'} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={handleAdminLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ---- Mobile sidebar overlay ---- */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 max-w-[80vw] h-full bg-white flex flex-col shadow-xl">
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <Heart size={16} className="text-white" fill="white" />
                </div>
                <span className="text-base font-bold text-slate-900">LifeLink</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-3">
              <div className="space-y-0.5">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => { setActiveTab(tab.key); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={18} className={active ? 'text-white' : 'text-slate-400'} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </nav>
            <div className="p-3 border-t border-slate-100">
              <button onClick={handleAdminLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                <LogOut size={18} /> Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ---- Main content ---- */}
      <div className="flex-1 lg:pl-64">

        {/* Top bar */}
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-700">
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{activeTabInfo.label}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAll}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors disabled:opacity-50"
            >
              {isRefreshing ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
              Refresh
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {error && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              <XCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {tabContent}
        </main>
      </div>

      {/* ---- User profile modal ---- */}
      {selectedUserProfile && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-3xl bg-white rounded-xl border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-xl">
              <h3 className="text-base font-semibold text-slate-900">User Profile</h3>
              <button onClick={() => setSelectedUserProfile(null)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {profileLoading ? (
                <div className="py-10 flex items-center justify-center gap-3 text-slate-400">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">Loading profile...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Info label="Name" value={selectedUserProfile.user.name} />
                    <Info label="Email" value={selectedUserProfile.user.email} />
                    <Info label="Role" value={selectedUserProfile.user.role} />
                    <Info label="Phone" value={selectedUserProfile.user.phone} />
                    <Info label="Blood Type" value={selectedUserProfile.user.blood_type} />
                    <Info label="City" value={selectedUserProfile.user.city} />
                    <Info label="Address" value={selectedUserProfile.user.address} />
                    <Info label="Medical History" value={selectedUserProfile.user.medical_history} />
                  </div>

                  {/* KYC Section */}
                  {selectedUserProfile.kyc ? (
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Shield size={18} className="text-red-600" />
                          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">KYC Verification Documents</h4>
                        </div>
                        <Badge variant={selectedUserProfile.kyc.verification_status === 'approved' ? 'green' : selectedUserProfile.kyc.verification_status === 'rejected' ? 'red' : 'amber'}>
                          {selectedUserProfile.kyc.verification_status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Type</p>
                          <p className="text-sm font-bold text-slate-900">{selectedUserProfile.kyc.document_type}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Number</p>
                          <p className="text-sm font-bold text-slate-900">{selectedUserProfile.kyc.document_number}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Issued Date/District</p>
                          <p className="text-sm font-bold text-slate-900">
                            {formatDate(selectedUserProfile.kyc.issued_date)} / {selectedUserProfile.kyc.issued_district || '-'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender</p>
                          <p className="text-sm font-bold text-slate-900">{selectedUserProfile.kyc.gender || '-'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Occupation</p>
                          <p className="text-sm font-bold text-slate-900">{selectedUserProfile.kyc.occupation || '-'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marital Status</p>
                          <p className="text-sm font-bold text-slate-900">{selectedUserProfile.kyc.marital_status || '-'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Father's Name</p>
                          <p className="text-sm font-bold text-slate-900">{selectedUserProfile.kyc.father_name || '-'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grandfather's Name</p>
                          <p className="text-sm font-bold text-slate-900">{selectedUserProfile.kyc.grandfather_name || '-'}</p>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-100">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Permanent Address</p>
                          <p className="text-sm font-semibold text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-100 italic">
                            {selectedUserProfile.kyc.permanent_address || 'Not Provided'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Address</p>
                          <p className="text-sm font-semibold text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-100 italic">
                            {selectedUserProfile.kyc.current_address || 'Not Provided'}
                          </p>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-4 mt-6">
                        {[
                          { label: 'Front Image', path: selectedUserProfile.kyc.front_image },
                          { label: 'Back Image', path: selectedUserProfile.kyc.back_image },
                          { label: 'Selfie with ID', path: selectedUserProfile.kyc.selfie_image },
                        ].map((img, i) => img.path && (
                          <div key={i} className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{img.label}</p>
                            <a href={`${API_BASE_URL}${img.path}`} target="_blank" rel="noreferrer" className="block relative aspect-video rounded-lg overflow-hidden border border-slate-200 hover:ring-2 hover:ring-red-500 transition-all group">
                              <img src={`${API_BASE_URL}${img.path}`} alt={img.label} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">View Full Size</span>
                              </div>
                            </a>
                          </div>
                        ))}
                      </div>

                      {selectedUserProfile.kyc.verification_status !== 'approved' && (
                        <div className="mt-6 pt-6 border-t border-slate-200">
                          <p className="text-xs font-bold text-slate-800 mb-3 uppercase">Actions</p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleUserVerification(selectedUserProfile.user.id, 'approved')}
                              className="flex-1 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <CheckCircle2 size={14} /> Validate User
                            </button>
                            <button
                              onClick={() => {
                                const note = window.prompt('Reason for rejection?');
                                if (note !== null) handleUserVerification(selectedUserProfile.user.id, 'rejected', note);
                              }}
                              className="flex-1 py-2.5 bg-red-50 text-red-600 border border-red-100 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                            >
                              <XCircle size={14} /> Reject KYC
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                      This user has not submitted KYC documents yet.
                    </div>
                  )}

                  <DataTable title="Donation Requests" rows={selectedUserProfile.requests} columns={['request_type', 'blood_type', 'organ_type', 'urgency', 'status', 'location']} />
                  <DataTable title="Blood Donations" rows={selectedUserProfile.blood_donations} columns={['blood_type', 'units', 'location', 'status', 'donation_date']} />
                  <DataTable title="Organ Donations" rows={selectedUserProfile.organ_donations} columns={['organ_type', 'blood_type', 'status', 'donation_date']} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
