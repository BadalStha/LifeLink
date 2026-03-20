import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Droplet,
  Activity,
  MapPin,
  User,
  Mail,
  Phone,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { requestsAPI } from '../services/api';
import { useChatContext } from '../context/ChatContext';

const urgencyConfig = {
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
  high: { label: 'Urgent', color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  medium: { label: 'Moderate', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  low: { label: 'Low', color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
};

const statusConfig = {
  open: { label: 'Open – Needs Help', icon: AlertTriangle, color: 'text-red-600' },
  fulfilled: { label: 'Fulfilled', icon: CheckCircle, color: 'text-green-600' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-slate-500' },
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function HelpRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openChat } = useChatContext();
  const [request, setRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || isNaN(id)) {
      setError('Invalid request ID.');
      setIsLoading(false);
      return;
    }
    let mounted = true;
    setIsLoading(true);
    requestsAPI.getById(id)
      .then((data) => {
        if (!mounted) return;
        setRequest(data.request);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Failed to load request details.');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => { mounted = false; };
  }, [id]);

  const urgency = urgencyConfig[request?.urgency] || urgencyConfig.medium;
  const statusCfg = statusConfig[request?.status] || statusConfig.open;
  const StatusIcon = statusCfg.icon;

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-red-50 via-white to-slate-100"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Devanagari', sans-serif" }}
    >
      {/* Top bar */}
      <div className="bg-slate-900 text-slate-100 text-xs sm:text-sm px-4 py-2 text-center tracking-wide">
        Nepal Emergency Health Support Network | 24/7 Coordinated Donor Matching
      </div>

      {/* Nav */}
      <div className="bg-white/90 backdrop-blur sticky top-0 z-[1000] border-b border-slate-200 px-5 md:px-10 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-red-700 transition-all font-semibold"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <h1
          className="text-xl font-black text-red-700 cursor-pointer"
          onClick={() => navigate('/')}
        >
          LifeLink
        </h1>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-10">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 size={36} className="animate-spin text-red-400" />
            <p className="text-slate-500 font-medium">Loading request details…</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <AlertTriangle className="mx-auto mb-3 text-red-400" size={32} />
            <p className="text-red-700 font-semibold">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-5 py-2 rounded-full bg-red-600 text-white font-bold hover:bg-red-700 transition-all"
            >
              Go Home
            </button>
          </div>
        )}

        {!isLoading && !error && request && (
          <div className="space-y-5">
            {/* Header card */}
            <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-lg">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Help Request #{request.id}
                  </p>
                  <h2 className="text-2xl font-black text-slate-900">
                    {request.request_type === 'blood' ? 'Blood Needed' : 'Organ Needed'}
                  </h2>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${urgency.color}`}>
                  <span className={`w-2 h-2 rounded-full ${urgency.dot}`} />
                  {urgency.label}
                </span>
              </div>

              {/* Status */}
              <div className={`flex items-center gap-2 font-semibold text-sm ${statusCfg.color}`}>
                <StatusIcon size={16} />
                {statusCfg.label}
              </div>
            </div>

            {/* Medical details */}
            <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">
                Medical Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {request.request_type === 'blood' && (
                  <>
                    <Detail
                      icon={<Droplet size={16} className="text-red-500" />}
                      label="Blood Group"
                      value={request.blood_type || '—'}
                    />
                    <Detail
                      icon={<Activity size={16} className="text-blue-500" />}
                      label="Units Needed"
                      value={request.units_needed ? `${request.units_needed} unit(s)` : '—'}
                    />
                  </>
                )}
                {request.request_type === 'organ' && (
                  <Detail
                    icon={<Activity size={16} className="text-purple-500" />}
                    label="Organ Type"
                    value={request.organ_type || '—'}
                  />
                )}
                <Detail
                  icon={<AlertTriangle size={16} className="text-orange-500" />}
                  label="Urgency"
                  value={urgency.label}
                />
                <Detail
                  icon={<Clock size={16} className="text-slate-400" />}
                  label="Submitted"
                  value={formatDate(request.created_at)}
                />
              </div>
              {request.reason && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Reason / Notes</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{request.reason}</p>
                </div>
              )}
            </div>

            {/* Location */}
            {request.location && (
              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-3">
                  Location
                </h3>
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-slate-800 font-semibold">{request.location}</p>
                </div>
                {request.city && (
                  <p className="text-sm text-slate-500 mt-1 ml-7">{request.city}</p>
                )}
              </div>
            )}

            {/* Patient / Contact */}
            <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">
                Patient / Contact
              </h3>
              <div className="space-y-3">
                <Detail
                  icon={<User size={16} className="text-slate-500" />}
                  label="Name"
                  value={request.requester_name || '—'}
                />
                {request.requester_email && (
                  <Detail
                    icon={<Mail size={16} className="text-slate-500" />}
                    label="Email"
                    value={
                      <a
                        href={`mailto:${request.requester_email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {request.requester_email}
                      </a>
                    }
                  />
                )}
                {request.requester_phone && (
                  <Detail
                    icon={<Phone size={16} className="text-slate-500" />}
                    label="Phone"
                    value={
                      <a
                        href={`tel:${request.requester_phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {request.requester_phone}
                      </a>
                    }
                  />
                )}
              </div>
            </div>

            {/* CTA */}
            {request.status === 'open' && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => openChat(String(request.requester_id))}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-md"
                >
                  <MessageCircle size={18} /> Contact via Chat
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function Detail({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
