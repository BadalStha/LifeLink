import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Heart,
  Loader2,
  LogOut,
  Megaphone,
  Menu,
  Search,
  Settings,
  Shield,
  UserCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import DonorMap from '../components/DonorMap';
import { adminAPI } from '../services/api';
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
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'campaigns', label: 'Campaigns', icon: Megaphone },
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

function TemplateEditor({ template, onSave }) {
  const [form, setForm] = useState(template);
  useEffect(() => { setForm(template); }, [template]);

  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <p className="text-sm font-semibold text-slate-800 mb-3">{form.template_key}</p>
      <div className="grid md:grid-cols-3 gap-3">
        <input value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} className="md:col-span-2 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all" />
        <select value={form.channel} onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value }))} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none">
          <option value="email">Email</option>
          <option value="sms">SMS</option>
        </select>
        <textarea value={form.body} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} className="md:col-span-3 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none min-h-[90px] transition-all" />
      </div>
      <button onClick={() => onSave(form)} className="mt-3 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors">
        Save Template
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
  const [templates, setTemplates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [settingsData, setSettingsData] = useState({ settings: {}, admin_accounts: [] });

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState('open');

  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [broadcastForm, setBroadcastForm] = useState({
    subject: 'Emergency Alert',
    message: '',
    urgency: 'high',
    channel: 'email',
    target_audience: 'all_users',
  });

  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    image_url: '',
    is_published: true,
  });

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

      const [overviewData, usersData, requestsData, hospitalsData, templatesData, logsData, announcementsData, settingsResp] = await Promise.all([
        adminAPI.getOverview(),
        adminAPI.getUsers({ search: searchQuery, role: roleFilter, status: statusFilter, limit: 100 }),
        adminAPI.getRequests({ status: requestStatusFilter, limit: 100 }),
        adminAPI.getHospitals(),
        adminAPI.getTemplates(),
        adminAPI.getNotificationLogs(),
        adminAPI.getAnnouncements(),
        adminAPI.getSettings(),
      ]);

      setOverview(overviewData);
      setUsers(usersData.users || []);
      setRequests(requestsData.requests || []);
      setHospitals(hospitalsData.hospitals || []);
      setTemplates(templatesData.templates || []);
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

  useEffect(() => { loadAll(); }, [searchQuery, roleFilter, statusFilter, requestStatusFilter]);

  /* ---------- handlers ---------- */

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminEmail');
    navigate('/admin/login');
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

  const verifyUser = async (id) => {
    try {
      await adminAPI.updateUserVerification(id, { status: 'approved', review_note: '' });
      await loadAll();
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

  const matchRequest = async (requestId) => {
    const donorId = window.prompt('Enter donor ID to match:');
    if (!donorId) return;
    try {
      await adminAPI.matchDonor(requestId, Number(donorId));
      alert('Donor matched and alert logged.');
      await loadAll();
    } catch (err) {
      alert(err.message || 'Failed to match donor');
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
    try {
      await adminAPI.sendBroadcast(broadcastForm);
      setBroadcastForm((prev) => ({ ...prev, message: '' }));
      await loadAll();
      alert('Emergency broadcast sent.');
    } catch (err) {
      alert(err.message || 'Failed to send broadcast');
    }
  };

  const saveTemplate = async (template) => {
    try {
      await adminAPI.saveTemplate(template.template_key, {
        subject: template.subject,
        body: template.body,
        channel: template.channel,
      });
      await loadAll();
    } catch (err) {
      alert(err.message || 'Failed to save template');
    }
  };

  const createAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.content) {
      alert('Title and content are required.');
      return;
    }
    try {
      await adminAPI.createAnnouncement(announcementForm);
      setAnnouncementForm({ title: '', content: '', image_url: '', is_published: true });
      await loadAll();
    } catch (err) {
      alert(err.message || 'Failed to create campaign');
    }
  };

  const removeAnnouncement = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
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
          <div className="grid sm:grid-cols-3 gap-3">
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
                            <button onClick={() => verifyUser(u.id)} className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors">Verify</button>
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
                  <button onClick={() => updateRequestStatus(r.id, 'fulfilled')} className="px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md transition-colors">Fulfill</button>
                  <button onClick={() => updateRequestStatus(r.id, 'open')} className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors">Reopen</button>
                  <button onClick={() => updateRequestStatus(r.id, 'cancelled')} className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md transition-colors">Close</button>
                  <button onClick={() => matchRequest(r.id)} className="px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md transition-colors">Match Donor</button>
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

    // ---- NOTIFICATIONS ----
    if (activeTab === 'notifications') {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Emergency Broadcast</h3>
            <form onSubmit={sendBroadcast} className="grid sm:grid-cols-2 gap-3">
              <input value={broadcastForm.subject} onChange={(e) => setBroadcastForm((p) => ({ ...p, subject: e.target.value }))} className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none" placeholder="Subject" />
              <select value={broadcastForm.channel} onChange={(e) => setBroadcastForm((p) => ({ ...p, channel: e.target.value }))} className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none">
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
              <select value={broadcastForm.urgency} onChange={(e) => setBroadcastForm((p) => ({ ...p, urgency: e.target.value }))} className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none">
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select value={broadcastForm.target_audience} onChange={(e) => setBroadcastForm((p) => ({ ...p, target_audience: e.target.value }))} className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none">
                <option value="all_users">All Users</option>
                <option value="donors">Donors</option>
                <option value="patients">Recipients</option>
              </select>
              <textarea value={broadcastForm.message} onChange={(e) => setBroadcastForm((p) => ({ ...p, message: e.target.value }))} className="sm:col-span-2 px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none min-h-[120px] transition-all" placeholder="Type your emergency message..." />
              <button className="sm:col-span-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors">Send Broadcast</button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Templates</h3>
            <div className="space-y-3">
              {templates.map((t) => (
                <TemplateEditor key={t.id} template={t} onSave={saveTemplate} />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">Delivery Logs</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Channel</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Audience</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 text-slate-600">{formatDate(log.created_at)}</td>
                      <td className="px-4 py-2.5"><Badge>{log.channel}</Badge></td>
                      <td className="px-4 py-2.5 text-slate-600">{log.target_audience || '-'}</td>
                      <td className="px-4 py-2.5 text-slate-600">{log.subject || '-'}</td>
                      <td className="px-4 py-2.5"><Badge variant="green">{log.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // ---- CAMPAIGNS ----
    if (activeTab === 'campaigns') {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">New Campaign</h3>
            <form onSubmit={createAnnouncement} className="space-y-3">
              <input value={announcementForm.title} onChange={(e) => setAnnouncementForm((p) => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all" placeholder="Campaign title" />
              <textarea value={announcementForm.content} onChange={(e) => setAnnouncementForm((p) => ({ ...p, content: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none min-h-[120px] transition-all" placeholder="Campaign content" />
              <input value={announcementForm.image_url} onChange={(e) => setAnnouncementForm((p) => ({ ...p, image_url: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all" placeholder="Image URL (optional)" />
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={announcementForm.is_published} onChange={(e) => setAnnouncementForm((p) => ({ ...p, is_published: e.target.checked }))} className="rounded border-slate-300" />
                  Publish immediately
                </label>
                <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors">Publish</button>
              </div>
            </form>
          </div>

          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{a.title}</p>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{a.content}</p>
                  <p className="text-xs text-slate-400 mt-2">{formatDate(a.created_at)}</p>
                </div>
                <button onClick={() => removeAnnouncement(a.id)} className="shrink-0 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-md text-xs font-medium transition-colors">Delete</button>
              </div>
            ))}
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
  }, [activeTab, users, requests, hospitals, templates, logs, announcements, overview, settingsData, searchQuery, roleFilter, statusFilter, requestStatusFilter, broadcastForm, announcementForm, hospitalEdit]);

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
