import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, HandHeart, Heart, Loader2 } from 'lucide-react';
import { authAPI } from '../services/api';

const ORGAN_OPTIONS = [
  { value: 'kidney', label: 'Kidney' },
  { value: 'liver', label: 'Liver' },
  { value: 'heart', label: 'Heart' },
  { value: 'lung', label: 'Lung' },
  { value: 'cornea', label: 'Cornea' },
  { value: 'pancreas', label: 'Pancreas' },
  { value: 'intestine', label: 'Intestine' },
];

export default function DonationPreferences() {
  const navigate = useNavigate();
  const [donationType, setDonationType] = useState('');
  const [organType, setOrganType] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await authAPI.getProfile();
        const user = profile.user || {};
        setDonationType(user.donation_type || '');
        setOrganType(user.donation_organ || '');
      } catch (err) {
        setError(err.message || 'Unable to load donation preferences');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!donationType) {
      setError('Select what you want to donate.');
      return;
    }

    if (donationType === 'organ' && !organType) {
      setError('Select which organ you want to donate.');
      return;
    }

    setIsSaving(true);
    try {
      await authAPI.updateProfile({
        donation_type: donationType,
        donation_organ: donationType === 'organ' ? organType : null,
      });
      setMessage('Donation preferences saved successfully.');
      setTimeout(() => navigate('/profile'), 1200);
    } catch (err) {
      setError(err.message || 'Unable to save donation preferences');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-red-600" size={36} />
          <p className="font-bold text-slate-600">Loading donation form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/profile')}
          className="mb-6 flex items-center gap-2 text-slate-500 font-bold hover:text-red-600 transition-all"
        >
          <ArrowLeft size={20} /> Back to Profile
        </button>

        <div className="bg-white rounded-[36px] p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <HandHeart size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900">Donation Form</h1>
              <p className="text-slate-500 font-medium">Tell LifeLink what you are willing to donate so recipients can find you.</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">What do you want to donate?</label>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setDonationType('blood');
                    setOrganType('');
                    setError('');
                  }}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    donationType === 'blood'
                      ? 'border-red-500 bg-red-50'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${donationType === 'blood' ? 'bg-red-500 text-white' : 'bg-white text-red-500'}`}>
                      <Heart size={18} />
                    </div>
                    <p className="font-black text-slate-900">Blood</p>
                  </div>
                  <p className="text-sm text-slate-500">Choose this if you want to appear as a blood donor.</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDonationType('organ');
                    setError('');
                  }}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    donationType === 'organ'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${donationType === 'organ' ? 'bg-blue-500 text-white' : 'bg-white text-blue-500'}`}>
                      <HandHeart size={18} />
                    </div>
                    <p className="font-black text-slate-900">Organ</p>
                  </div>
                  <p className="text-sm text-slate-500">Choose this if you want to appear as an organ donor.</p>
                </button>
              </div>
            </div>

            {donationType === 'organ' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Which organ do you want to donate?</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ORGAN_OPTIONS.map((organ) => (
                    <button
                      key={organ.value}
                      type="button"
                      onClick={() => {
                        setOrganType(organ.value);
                        setError('');
                      }}
                      className={`px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                        organType === organ.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {organ.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm font-semibold text-red-600">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm font-semibold text-green-600">
                {message}
              </div>
            )}

            {(donationType === 'blood' || (donationType === 'organ' && organType)) && (
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-4 px-6 rounded-2xl bg-red-600 text-white font-black text-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}