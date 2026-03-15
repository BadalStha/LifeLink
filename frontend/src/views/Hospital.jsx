import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Heart,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Zap,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';
import { hospitalAPI } from '../services/api';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'announcements', label: 'Announcements', icon: Megaphone },
  { key: 'campaigns', label: 'Campaigns', icon: Zap },
];

export default function Hospital() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    image_url: '',
  });

  const [campaignForm, setCampaignForm] = useState({
    title: '',
    description: '',
    blood_type: '',
    target_units: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('hospitalToken');
    if (!token) {
      navigate('/hospital/login');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileData, statsData, announcementsData, campaignsData] = await Promise.all([
        hospitalAPI.getProfile(),
        hospitalAPI.getStats().catch(() => null),
        hospitalAPI.getAnnouncements(10).catch(() => ({ announcements: [] })),
        hospitalAPI.getCampaigns().catch(() => ({ campaigns: [] })),
      ]);

      setProfile(profileData);
      setStats(statsData);
      setAnnouncements(announcementsData.announcements || []);
      setCampaigns(campaignsData.campaigns || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hospitalToken');
    localStorage.removeItem('hospitalEmail');
    navigate('/hospital/login');
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setIsSubmitting(true);

    try {
      await hospitalAPI.createAnnouncement({
        ...announcementForm,
        is_published: true,
      });
      setFormSuccess('Announcement posted successfully!');
      setAnnouncementForm({ title: '', content: '', image_url: '' });
      setTimeout(() => loadData(), 1000);
    } catch (err) {
      setFormError(err.message || 'Failed to post announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await hospitalAPI.deleteAnnouncement(id);
      setAnnouncements(announcements.filter((a) => a.id !== id));
    } catch (err) {
      alert('Failed to delete announcement');
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setIsSubmitting(true);

    try {
      await hospitalAPI.createCampaign(campaignForm);
      setFormSuccess('Campaign created successfully!');
      setCampaignForm({
        title: '',
        description: '',
        blood_type: '',
        target_units: '',
        start_date: '',
        end_date: '',
      });
      setTimeout(() => loadData(), 1000);
    } catch (err) {
      setFormError(err.message || 'Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col shrink-0 border-r border-white/10">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center">
              <Heart size={18} className="text-white" fill="white" />
            </div>
            <span className="text-white text-lg font-bold">LifeLink</span>
          </div>
          <p className="text-slate-400 text-xs mt-2 font-medium uppercase tracking-wider">Hospital Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          {profile && (
            <div className="px-4 py-3 bg-white/5 rounded-lg mb-2">
              <p className="text-white text-sm font-semibold">{profile.name}</p>
              <p className="text-slate-400 text-xs mt-1">{profile.city || 'Location not set'}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin mx-auto" />
              <p className="text-slate-600 mt-4">Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <div className="p-8">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 max-w-6xl">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                  <p className="text-slate-600 mt-1">Welcome back, {profile?.name}</p>
                </div>

                {/* Hospital Info Card */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-slate-500 font-medium">Hospital</p>
                        <p className="text-xl font-bold text-slate-900 mt-1">{profile?.name}</p>
                      </div>
                      <Building2 size={24} className="text-red-600" />
                    </div>
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {profile?.city && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin size={16} className="text-slate-400" />
                          <span className="text-slate-700">{profile.city}</span>
                        </div>
                      )}
                      {profile?.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={16} className="text-slate-400" />
                          <span className="text-slate-700">{profile.phone}</span>
                        </div>
                      )}
                      {profile?.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail size={16} className="text-slate-400" />
                          <span className="text-slate-700">{profile.email}</span>
                        </div>
                      )}
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm text-slate-600">
                        {profile?.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  {stats && (
                    <>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6 flex flex-col justify-between">
                        <div>
                          <p className="text-sm text-blue-700 font-medium">Active Requests</p>
                          <p className="text-3xl font-bold text-blue-900 mt-2">{stats.active_requests || 0}</p>
                        </div>
                        <TrendingUp size={24} className="text-blue-600 mt-4 opacity-30" />
                      </div>

                      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border border-red-200 p-6 flex flex-col justify-between">
                        <div>
                          <p className="text-sm text-red-700 font-medium">Donations Facilitated</p>
                          <p className="text-3xl font-bold text-red-900 mt-2">{stats.donations_facilitated || 0}</p>
                        </div>
                        <Heart size={24} className="text-red-600 mt-4 opacity-30" fill="currentColor" />
                      </div>
                    </>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Announcements</h2>
                  {announcements.length > 0 ? (
                    <div className="space-y-3">
                      {announcements.slice(0, 5).map((ann) => (
                        <div key={ann.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                          <Megaphone size={18} className="text-red-600 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 text-sm">{ann.title}</p>
                            <p className="text-sm text-slate-600 line-clamp-1">{ann.content}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(ann.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No announcements yet</p>
                  )}
                </div>
              </div>
            )}

            {/* Announcements Tab */}
            {activeTab === 'announcements' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Announcements</h1>
                  <p className="text-slate-600 mt-1">Create and manage announcements visible to all LifeLink users</p>
                </div>

                {/* Post Announcement Form */}
                <form onSubmit={handlePostAnnouncement} className="bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-slate-700">Title *</label>
                      <input
                        type="text"
                        value={announcementForm.title}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white transition-all"
                        placeholder="e.g., Urgent Blood Donation"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-slate-700">Image URL</label>
                      <input
                        type="url"
                        value={announcementForm.image_url}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, image_url: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white transition-all"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Content *</label>
                    <textarea
                      value={announcementForm.content}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                      rows={5}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white transition-all resize-none"
                      placeholder="Describe the situation and what donors should do..."
                      required
                    />
                  </div>

                  {formError && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle size={18} className="text-red-600 mt-0.5 shrink-0" />
                      <p className="text-red-700 text-sm font-medium">{formError}</p>
                    </div>
                  )}
                  {formSuccess && (
                    <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle size={18} className="text-green-600 mt-0.5 shrink-0" />
                      <p className="text-green-700 text-sm font-medium">{formSuccess}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        Post Announcement
                      </>
                    )}
                  </button>
                </form>

                {/* Announcements List */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900">Your Announcements</h2>
                  </div>
                  {announcements.length > 0 ? (
                    <div className="divide-y divide-slate-200">
                      {announcements.map((ann) => (
                        <div key={ann.id} className="p-6 hover:bg-slate-50 transition-colors group">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-bold text-slate-900">{ann.title}</h3>
                              <p className="text-sm text-slate-500 mt-1">
                                {new Date(ann.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleDeleteAnnouncement(ann.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete announcement"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                          <p className="text-slate-700 line-clamp-2">{ann.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Megaphone size={32} className="text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500">No announcements posted yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Campaigns Tab */}
            {activeTab === 'campaigns' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Donation Campaigns</h1>
                  <p className="text-slate-600 mt-1">Launch and manage blood/organ donation campaigns</p>
                </div>

                {/* Create Campaign Form */}
                <form onSubmit={handleCreateCampaign} className="bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Campaign Title *</label>
                    <input
                      type="text"
                      value={campaignForm.title}
                      onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white transition-all"
                      placeholder="e.g., March Blood Drive"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-slate-700">Blood Type</label>
                      <select
                        value={campaignForm.blood_type}
                        onChange={(e) => setCampaignForm({ ...campaignForm, blood_type: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white transition-all"
                      >
                        <option value="">Select blood type</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="All">All Types</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-slate-700">Units Needed</label>
                      <input
                        type="number"
                        value={campaignForm.target_units}
                        onChange={(e) => setCampaignForm({ ...campaignForm, target_units: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white transition-all"
                        placeholder="e.g., 50"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Description</label>
                    <textarea
                      value={campaignForm.description}
                      onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white transition-all resize-none"
                      placeholder="Campaign details and objectives..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-slate-700">Start Date</label>
                      <input
                        type="date"
                        value={campaignForm.start_date}
                        onChange={(e) => setCampaignForm({ ...campaignForm, start_date: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-slate-700">End Date</label>
                      <input
                        type="date"
                        value={campaignForm.end_date}
                        onChange={(e) => setCampaignForm({ ...campaignForm, end_date: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {formError && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle size={18} className="text-red-600 mt-0.5 shrink-0" />
                      <p className="text-red-700 text-sm font-medium">{formError}</p>
                    </div>
                  )}
                  {formSuccess && (
                    <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle size={18} className="text-green-600 mt-0.5 shrink-0" />
                      <p className="text-green-700 text-sm font-medium">{formSuccess}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        Create Campaign
                      </>
                    )}
                  </button>
                </form>

                {/* Campaigns List */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900">Active Campaigns</h2>
                  </div>
                  {campaigns.length > 0 ? (
                    <div className="divide-y divide-slate-200">
                      {campaigns.map((campaign) => (
                        <div key={campaign.id} className="p-6 hover:bg-slate-50 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-slate-900">{campaign.title}</h3>
                            <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                              {campaign.status || 'Active'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-3">{campaign.description}</p>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-slate-500 text-xs">Blood Type</p>
                              <p className="font-semibold text-slate-900 mt-0.5">{campaign.blood_type || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs">Target Units</p>
                              <p className="font-semibold text-slate-900 mt-0.5">{campaign.target_units || 0}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs">Created</p>
                              <p className="font-semibold text-slate-900 mt-0.5">
                                {new Date(campaign.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Zap size={32} className="text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500">No campaigns created yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
