import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Zap,
  Building2,
  Calendar,
  Droplets,
  Target,
  MessageCircle,
  Loader2,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';
import { campaignsAPI } from '../services/api';
import { useChatContext } from '../context/ChatContext';

export default function CampaignDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openChat } = useChatContext();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCampaignDetails();
  }, [id]);

  const fetchCampaignDetails = async () => {
    try {
      setLoading(true);
      const data = await campaignsAPI.getById(id);
      setCampaign(data.campaign);
    } catch (err) {
      console.error('Failed to fetch campaign:', err);
      setError(err.message || 'Failed to load campaign details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading campaign details...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Campaign</h2>
          <p className="text-slate-600 mb-6">{error || 'Campaign not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-red-600" fill="currentColor" />
            <span className="font-bold text-slate-900">Campaign Details</span>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full uppercase tracking-wider">
                  {campaign.status}
                </span>
                <span className="text-slate-400 text-sm italic">
                  Created on {new Date(campaign.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <h1 className="text-3xl font-black text-slate-900 mb-4">{campaign.title}</h1>
              <p className="text-slate-600 leading-relaxed text-lg mb-8">
                {campaign.description}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 text-red-600 mb-1">
                    <Droplets size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">Blood Type</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900">{campaign.blood_type || 'All Types'}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 text-blue-600 mb-1">
                    <Target size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">Target Units</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900">{campaign.target_units || 'N/A'}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                  <Calendar size={18} className="text-slate-400" />
                  <span>Start: {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : 'TBD'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                  <Calendar size={18} className="text-slate-400" />
                  <span>End: {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'TBD'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Hospital Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Building2 size={16} /> Organized By
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{campaign.hospital_name}</h3>
                  <p className="text-slate-500 text-sm mt-1">{campaign.hospital_city}</p>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  {campaign.hospital_address && (
                    <div className="flex items-start gap-3 text-sm text-slate-600">
                      <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                      <span>{campaign.hospital_address}</span>
                    </div>
                  )}
                  {campaign.hospital_phone && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Phone size={16} className="text-slate-400 shrink-0" />
                      <a href={`tel:${campaign.hospital_phone}`} className="hover:text-red-600">{campaign.hospital_phone}</a>
                    </div>
                  )}
                  {campaign.hospital_email && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Mail size={16} className="text-slate-400 shrink-0" />
                      <a href={`mailto:${campaign.hospital_email}`} className="hover:text-red-600 truncate">{campaign.hospital_email}</a>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => openChat(String(campaign.hospital_id))}
                  className="w-full mt-6 flex items-center justify-center gap-2 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                  <MessageCircle size={20} />
                  Contact Hospital
                </button>
              </div>
            </div>

            <div className="bg-red-600 rounded-3xl p-6 text-white shadow-xl shadow-red-100">
              <h4 className="font-black text-lg mb-2">Interested in donating?</h4>
              <p className="text-red-100 text-sm leading-relaxed mb-4">
                Contact the hospital directly or visit their location during the campaign hours.
              </p>
              <div className="p-3 bg-white/10 rounded-xl border border-white/20 text-xs font-medium">
                Please bring a valid ID and ensure you meet the donation criteria.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
