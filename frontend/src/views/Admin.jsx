import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Building2,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  LogOut,
  Megaphone,
  Search,
  Settings,
  Shield,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import DonorMap from '../Components/DonorMap';
import { adminAPI } from '../services/api';

const TABS = [
  { key: 'users', label: 'User & Donor' },
  { key: 'requests', label: 'Requests' },
  { key: 'hospitals', label: 'Hospitals' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'campaigns', label: 'Campaigns' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'reports', label: 'Reports' },
  { key: 'settings', label: 'Settings' },
];

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString();
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

export default function Admin() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('users');
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

  const loadAll = async () => {
    try {
      setIsRefreshing(true);
      setError('');

      const [
        overviewData,
        usersData,
        requestsData,
        hospitalsData,
        templatesData,
        logsData,
        announcementsData,
        settingsResp,
      ] = await Promise.all([
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

  useEffect(() => {
    loadAll();
  }, [searchQuery, roleFilter, statusFilter, requestStatusFilter]);

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

  const verifyUser = async (id, status) => {
    const note = window.prompt('Review note (optional):', '') || '';
    try {
      await adminAPI.updateUserVerification(id, { status, review_note: note });
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

  const tabContent = useMemo(() => {
    if (activeTab === 'users') {
      return (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 grid md:grid-cols-3 gap-3">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user by name/email"
              className="px-3 py-2 border border-slate-300 rounded-xl"
            />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-xl">
              <option value="">All Roles</option>
              <option value="user">Donors</option>
              <option value="patient">Recipients</option>
              <option value="hospital">Hospitals</option>
              <option value="admin">Admins</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-xl">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Blood</th>
                  <th className="text-left p-3">City</th>
                  <th className="text-left p-3">Verification</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="p-3">
                      <button className="font-semibold text-blue-700 hover:underline" onClick={() => openUserProfile(u.id)}>
                        {u.name || 'Unnamed'}
                      </button>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="p-3 uppercase text-xs font-semibold">{u.role}</td>
                    <td className="p-3">{u.blood_type || 'N/A'}</td>
                    <td className="p-3">{u.city || 'N/A'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        u.verification_status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : u.verification_status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                      }`}>
                        {u.verification_status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => verifyUser(u.id, 'approved')} className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded-lg">
                          Approve
                        </button>
                        <button onClick={() => verifyUser(u.id, 'rejected')} className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded-lg">
                          Reject
                        </button>
                        <button onClick={() => toggleUserActive(u)} className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-lg">
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeTab === 'requests') {
      return (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <label className="text-sm font-semibold text-slate-600">Filter requests</label>
            <select
              value={requestStatusFilter}
              onChange={(e) => setRequestStatusFilter(e.target.value)}
              className="mt-2 px-3 py-2 border border-slate-300 rounded-xl"
            >
              <option value="open">Open</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="cancelled">Cancelled</option>
              <option value="">All</option>
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {requests.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-bold text-slate-900 capitalize">
                      {r.request_type} {r.blood_type || r.organ_type || ''}
                    </p>
                    <p className="text-xs text-slate-500">Requester: {r.requester_name || r.requester_email || 'N/A'}</p>
                    <p className="text-xs text-slate-500">Location: {r.location || 'N/A'}</p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700">{r.urgency}</span>
                </div>
                <p className="text-sm text-slate-600 mt-3">{r.reason || 'No reason provided.'}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button onClick={() => updateRequestStatus(r.id, 'fulfilled')} className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded-lg">
                    Mark Fulfilled
                  </button>
                  <button onClick={() => updateRequestStatus(r.id, 'open')} className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg">
                    Reopen
                  </button>
                  <button onClick={() => updateRequestStatus(r.id, 'cancelled')} className="px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded-lg">
                    Close
                  </button>
                  <button onClick={() => matchRequest(r.id)} className="px-3 py-1 text-xs bg-amber-50 text-amber-700 rounded-lg">
                    Match Donor
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'hospitals') {
      return (
        <div className="grid gap-4">
          {hospitals.map((h) => (
            <div key={h.id} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{h.name}</p>
                  <p className="text-sm text-slate-500">{h.city || 'N/A'} • {h.phone || 'N/A'} • {h.email || 'N/A'}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${h.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                  {h.is_active ? 'Verified/Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <button onClick={() => toggleHospital(h)} className="px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded-lg">
                  {h.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => setHospitalEdit(h)} className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg">
                  Edit Profile
                </button>
              </div>
            </div>
          ))}

          {hospitalEdit && (
            <div className="bg-white rounded-2xl border border-blue-200 p-4">
              <p className="font-bold mb-3">Edit Hospital: {hospitalEdit.name}</p>
              <div className="grid md:grid-cols-2 gap-3">
                <input value={hospitalEdit.name || ''} onChange={(e) => setHospitalEdit({ ...hospitalEdit, name: e.target.value })} className="px-3 py-2 border rounded-xl" placeholder="Name" />
                <input value={hospitalEdit.phone || ''} onChange={(e) => setHospitalEdit({ ...hospitalEdit, phone: e.target.value })} className="px-3 py-2 border rounded-xl" placeholder="Phone" />
                <input value={hospitalEdit.email || ''} onChange={(e) => setHospitalEdit({ ...hospitalEdit, email: e.target.value })} className="px-3 py-2 border rounded-xl" placeholder="Email" />
                <input value={hospitalEdit.city || ''} onChange={(e) => setHospitalEdit({ ...hospitalEdit, city: e.target.value })} className="px-3 py-2 border rounded-xl" placeholder="City" />
                <input value={hospitalEdit.location || ''} onChange={(e) => setHospitalEdit({ ...hospitalEdit, location: e.target.value })} className="px-3 py-2 border rounded-xl" placeholder="Location" />
                <input value={hospitalEdit.address || ''} onChange={(e) => setHospitalEdit({ ...hospitalEdit, address: e.target.value })} className="px-3 py-2 border rounded-xl" placeholder="Address" />
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={saveHospitalEdit} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold">Save</button>
                <button onClick={() => setHospitalEdit(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold">Cancel</button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'notifications') {
      return (
        <div className="space-y-5">
          <form onSubmit={sendBroadcast} className="bg-white rounded-2xl border border-slate-200 p-4 grid md:grid-cols-2 gap-3">
            <input
              value={broadcastForm.subject}
              onChange={(e) => setBroadcastForm((prev) => ({ ...prev, subject: e.target.value }))}
              className="px-3 py-2 border rounded-xl"
              placeholder="Subject"
            />
            <select
              value={broadcastForm.channel}
              onChange={(e) => setBroadcastForm((prev) => ({ ...prev, channel: e.target.value }))}
              className="px-3 py-2 border rounded-xl"
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
            <select
              value={broadcastForm.urgency}
              onChange={(e) => setBroadcastForm((prev) => ({ ...prev, urgency: e.target.value }))}
              className="px-3 py-2 border rounded-xl"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={broadcastForm.target_audience}
              onChange={(e) => setBroadcastForm((prev) => ({ ...prev, target_audience: e.target.value }))}
              className="px-3 py-2 border rounded-xl"
            >
              <option value="all_users">All Users</option>
              <option value="donors">Donors</option>
              <option value="patients">Recipients</option>
            </select>
            <textarea
              value={broadcastForm.message}
              onChange={(e) => setBroadcastForm((prev) => ({ ...prev, message: e.target.value }))}
              className="md:col-span-2 px-3 py-2 border rounded-xl min-h-[120px]"
              placeholder="Emergency message"
            />
            <button className="md:col-span-2 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold">Send Emergency Broadcast</button>
          </form>

          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <h4 className="font-bold mb-3">Notification Templates</h4>
            <div className="space-y-3">
              {templates.map((t) => (
                <TemplateEditor key={t.id} template={t} onSave={saveTemplate} />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 overflow-x-auto">
            <h4 className="font-bold mb-3">Delivery Logs</h4>
            <table className="w-full text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="text-left p-2">Time</th>
                  <th className="text-left p-2">Channel</th>
                  <th className="text-left p-2">Audience</th>
                  <th className="text-left p-2">Subject</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-slate-100">
                    <td className="p-2">{formatDate(log.created_at)}</td>
                    <td className="p-2 uppercase">{log.channel}</td>
                    <td className="p-2">{log.target_audience || 'N/A'}</td>
                    <td className="p-2">{log.subject || 'N/A'}</td>
                    <td className="p-2">{log.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeTab === 'campaigns') {
      return (
        <div className="space-y-5">
          <form onSubmit={createAnnouncement} className="bg-white rounded-2xl border border-slate-200 p-4 grid gap-3">
            <input
              value={announcementForm.title}
              onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, title: e.target.value }))}
              className="px-3 py-2 border rounded-xl"
              placeholder="Campaign title"
            />
            <textarea
              value={announcementForm.content}
              onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, content: e.target.value }))}
              className="px-3 py-2 border rounded-xl min-h-[120px]"
              placeholder="Campaign content"
            />
            <input
              value={announcementForm.image_url}
              onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, image_url: e.target.value }))}
              className="px-3 py-2 border rounded-xl"
              placeholder="Image URL (optional)"
            />
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={announcementForm.is_published}
                onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, is_published: e.target.checked }))}
              />
              Publish now
            </label>
            <button className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold w-fit">Post Campaign</button>
          </form>

          <div className="grid gap-3">
            {announcements.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{a.title}</p>
                  <p className="text-sm text-slate-600 mt-1">{a.content}</p>
                  <p className="text-xs text-slate-400 mt-2">{formatDate(a.created_at)}</p>
                </div>
                <button onClick={() => removeAnnouncement(a.id)} className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-xs">Delete</button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'analytics') {
      return (
        <div className="space-y-5">
          <div className="grid md:grid-cols-4 gap-4">
            <Metric title="Total Donors" value={overview?.stats?.total_donors || 0} icon={<Users size={18} className="text-blue-600" />} />
            <Metric title="Total Recipients" value={overview?.stats?.total_recipients || 0} icon={<Shield size={18} className="text-indigo-600" />} />
            <Metric title="Requests Pending" value={overview?.stats?.requests_pending || 0} icon={<XCircle size={18} className="text-amber-600" />} />
            <Metric title="Requests Fulfilled" value={overview?.stats?.requests_fulfilled || 0} icon={<CheckCircle2 size={18} className="text-green-600" />} />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <SimpleListCard title="Blood Group Distribution" items={overview?.blood_group_distribution || []} itemKey="blood_type" />
            <SimpleListCard title="Organ Type Distribution" items={overview?.organ_type_distribution || []} itemKey="organ_type" />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <h4 className="font-bold mb-3">Donor Distribution Map</h4>
            <DonorMap />
          </div>
        </div>
      );
    }

    if (activeTab === 'reports') {
      return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h4 className="font-bold text-lg">Export Reports</h4>
          <p className="text-sm text-slate-500 mt-1">Download donor/recipient/request data in CSV format.</p>
          <div className="flex flex-wrap gap-3 mt-5">
            <button onClick={() => exportReport('donors')} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
              <Download size={16} /> Donor Report
            </button>
            <button onClick={() => exportReport('recipients')} className="px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
              <Download size={16} /> Recipient Report
            </button>
            <button onClick={() => exportReport('requests')} className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
              <Download size={16} /> Request History
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <h4 className="font-bold">System Settings</h4>
          <div className="grid md:grid-cols-2 gap-3 mt-3">
            <SettingToggle
              label="Require donor verification"
              value={settingsData.settings.require_donor_verification === 'true'}
              onChange={(value) => updateSetting('require_donor_verification', value)}
            />
            <SettingToggle
              label="Require hospital verification"
              value={settingsData.settings.require_hospital_verification === 'true'}
              onChange={(value) => updateSetting('require_hospital_verification', value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 overflow-x-auto">
          <h4 className="font-bold mb-3">Admin Accounts</h4>
          <table className="w-full text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {settingsData.admin_accounts?.map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="p-2">{a.name || 'Admin'}</td>
                  <td className="p-2">{a.email}</td>
                  <td className="p-2">{a.is_active ? 'Active' : 'Inactive'}</td>
                  <td className="p-2">{formatDate(a.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }, [
    activeTab,
    users,
    requests,
    hospitals,
    templates,
    logs,
    announcements,
    overview,
    settingsData,
    searchQuery,
    roleFilter,
    statusFilter,
    requestStatusFilter,
    broadcastForm,
    announcementForm,
    hospitalEdit,
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-700 font-semibold">
          <Loader2 size={22} className="animate-spin" />
          Loading Admin Control Center...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900">LifeLink Admin Panel</h1>
              <p className="text-slate-500 text-sm mt-1">Moderation, operations, campaigns, analytics, and system controls.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={loadAll}
                disabled={isRefreshing}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
              >
                {isRefreshing ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                Refresh
              </button>
              <button
                onClick={handleAdminLogout}
                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-5">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab.key ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {tabContent}
      </div>

      {selectedUserProfile && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-3xl bg-white rounded-2xl border border-slate-200 p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black">User Profile Detail</h3>
              <button onClick={() => setSelectedUserProfile(null)} className="text-slate-500 hover:text-slate-900">Close</button>
            </div>

            {profileLoading ? (
              <div className="py-10 text-center text-slate-500">Loading profile...</div>
            ) : (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-3 text-sm">
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
      )}
    </div>
  );
}

function Metric({ title, value, icon }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 font-semibold">{title}</p>
        {icon}
      </div>
      <p className="text-2xl font-black text-slate-900 mt-2">{value}</p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold text-slate-800 mt-1">{value || 'N/A'}</p>
    </div>
  );
}

function DataTable({ title, rows = [], columns = [] }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 overflow-x-auto">
      <h4 className="font-bold text-slate-800 mb-2">{title}</h4>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">No data found.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500">
              {columns.map((c) => (
                <th key={c} className="text-left p-2 uppercase text-xs">{c.replace('_', ' ')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id || idx} className="border-t border-slate-200">
                {columns.map((c) => (
                  <td key={c} className="p-2">{String(row[c] ?? 'N/A')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SettingToggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between border border-slate-200 rounded-xl p-3">
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <button
        onClick={() => onChange(!value)}
        className={`px-3 py-1 rounded-lg text-xs font-bold ${value ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}
      >
        {value ? 'Enabled' : 'Disabled'}
      </button>
    </div>
  );
}

function TemplateEditor({ template, onSave }) {
  const [form, setForm] = useState(template);

  useEffect(() => {
    setForm(template);
  }, [template]);

  return (
    <div className="border border-slate-200 rounded-xl p-3">
      <p className="font-semibold text-sm text-slate-800 mb-2">{form.template_key}</p>
      <div className="grid md:grid-cols-3 gap-2">
        <input
          value={form.subject}
          onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
          className="md:col-span-2 px-3 py-2 border rounded-lg text-sm"
          placeholder="Subject"
        />
        <select
          value={form.channel}
          onChange={(e) => setForm((prev) => ({ ...prev, channel: e.target.value }))}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="email">Email</option>
          <option value="sms">SMS</option>
        </select>
        <textarea
          value={form.body}
          onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
          className="md:col-span-3 px-3 py-2 border rounded-lg text-sm min-h-[90px]"
          placeholder="Template body"
        />
      </div>
      <button onClick={() => onSave(form)} className="mt-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1">
        <FileText size={14} /> Save Template
      </button>
    </div>
  );
}
