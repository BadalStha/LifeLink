import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, HandHeart, Heart, Loader2,
  Droplets, Info, Activity, Eye, Zap, AlertCircle,
  CheckCircle, Shield, Wind, Layers
} from 'lucide-react';
import { authAPI } from '../services/api';

const ORGAN_OPTIONS = [
  {
    value: 'kidney',
    label: 'Kidney',
    icon: <Shield size={18} />,
    note: 'One kidney can be donated while living. Donors lead a normal, healthy life.',
  },
  {
    value: 'liver',
    label: 'Liver',
    icon: <Activity size={18} />,
    note: 'A portion can be donated while living — the liver regenerates over time.',
  },
  {
    value: 'heart',
    label: 'Heart',
    icon: <Heart size={18} />,
    note: 'Donated posthumously. A healthy heart can give someone a second chance at life.',
  },
  {
    value: 'lung',
    label: 'Lung',
    icon: <Wind size={18} />,
    note: 'A lobe may be donated by a living donor to someone with severe respiratory failure.',
  },
  {
    value: 'cornea',
    label: 'Cornea',
    icon: <Eye size={18} />,
    note: 'Donated after death. Can restore vision in two recipients with no age limit.',
  },
  {
    value: 'pancreas',
    label: 'Pancreas',
    icon: <Zap size={18} />,
    note: 'Helps those with severe diabetes or pancreatic failure. Usually posthumous.',
  },
  {
    value: 'intestine',
    label: 'Intestine',
    icon: <Layers size={18} />,
    note: 'Rare transplant for patients unable to absorb nutrients normally.',
  },
];

const BLOOD_ELIGIBILITY = [
  'Age 18–65 years; those aged 16–17 may donate with parental or guardian consent',
  'Weight at least 50 kg (110 lbs)',
  'Hemoglobin ≥ 12.5 g/dL for females and ≥ 13.0 g/dL for males',
  'Normal blood pressure (systolic 100–180 mmHg, diastolic 60–100 mmHg)',
  'Regular pulse between 60–100 bpm on the day of donation',
  'No active infection, fever, cold, or illness at the time of donation',
  'At least 56 days (8 weeks) since your last whole blood donation',
  'No tattooing, body piercing, or acupuncture within the past 12 months',
  'Not currently pregnant or breastfeeding',
  'No high-risk behaviour or intravenous drug use in the past 12 months',
];

const ORGAN_ELIGIBILITY = [
  'Anyone can register as an organ donor — age and current health are not barriers to registering',
  'Medical suitability is assessed by doctors at the time of living or posthumous donation',
  'Living donors may donate one kidney, a portion of the liver, or a single lung lobe',
  'Posthumous donors can give the heart, both kidneys, liver, lungs, corneas, and pancreas',
  'In Nepal, living donation is governed by the Human Body Organ Transplantation Act and is typically restricted to blood relatives or spouses',
  'Your family and medical team are always consulted and informed before any donation proceeds',
  'Registering as a donor has no effect on the quality of medical care you receive',
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
      setError('Please select what you want to donate.');
      return;
    }
    if (donationType === 'organ' && !organType) {
      setError('Please select which organ you want to donate.');
      return;
    }

    setIsSaving(true);
    try {
      await authAPI.updateProfile({
        donation_type: donationType,
        donation_organ: donationType === 'organ' ? organType : null,
      });
      setMessage('Your donation preferences have been saved.');
      setTimeout(() => navigate('/profile'), 1500);
    } catch (err) {
      setError(err.message || 'Unable to save donation preferences');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-red-600" size={36} />
          <p className="font-bold text-slate-600">Loading your preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-red-600 rounded-lg p-1.5">
            <Droplets size={16} className="text-white" />
          </div>
          <span className="text-lg font-black text-slate-900">LifeLink</span>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-1.5 text-slate-600 hover:text-red-600 font-semibold text-sm transition-colors"
        >
          <ArrowLeft size={15} /> Back to Profile
        </button>
      </nav>

      {/* Page Header */}
      <header className="bg-gradient-to-br from-red-700 to-red-900 text-white px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-bold mb-4">
            <HandHeart size={15} /> Donation Preferences
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3 leading-tight">
            What Would You Like to Donate?
          </h1>
          <p className="text-red-100 text-base md:text-lg leading-relaxed max-w-xl">
            Your preferences help hospitals and recipients find compatible donors quickly.
            All information is kept strictly confidential.
          </p>
        </div>
      </header>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        <form onSubmit={handleSave} className="space-y-6">

          {/* Step 1 — Type */}
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100">
            <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">Step 1</p>
            <h2 className="text-xl font-black text-slate-900 mb-1">Select Donation Type</h2>
            <p className="text-slate-500 text-sm mb-6">Choose the type of donation you are willing to make.</p>

            <div className="grid md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => { setDonationType('blood'); setOrganType(''); setError(''); }}
                className={`p-6 rounded-2xl border-2 text-left transition-all ${
                  donationType === 'blood'
                    ? 'border-red-500 bg-red-50 shadow-sm'
                    : 'border-slate-200 bg-slate-50 hover:border-red-200 hover:bg-red-50/40'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  donationType === 'blood' ? 'bg-red-600 text-white' : 'bg-white text-red-500 border border-slate-200'
                }`}>
                  <Droplets size={22} />
                </div>
                <p className="font-black text-slate-900 text-base mb-1">Blood Donation</p>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Donate whole blood, platelets, or plasma. A blood donation is needed every 2 seconds worldwide.
                </p>
                {donationType === 'blood' && (
                  <div className="mt-3 flex items-center gap-1.5 text-red-600 text-xs font-bold">
                    <CheckCircle2 size={14} /> Selected
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setDonationType('organ'); setError(''); }}
                className={`p-6 rounded-2xl border-2 text-left transition-all ${
                  donationType === 'organ'
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-blue-50/40'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  donationType === 'organ' ? 'bg-blue-600 text-white' : 'bg-white text-blue-500 border border-slate-200'
                }`}>
                  <HandHeart size={22} />
                </div>
                <p className="font-black text-slate-900 text-base mb-1">Organ Donation</p>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Register to donate organs or tissue. One donor can save up to 8 lives and improve many more.
                </p>
                {donationType === 'organ' && (
                  <div className="mt-3 flex items-center gap-1.5 text-blue-600 text-xs font-bold">
                    <CheckCircle2 size={14} /> Selected
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Blood — Eligibility */}
          {donationType === 'blood' && (
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <Info size={15} className="text-red-600" />
                <p className="text-xs font-bold text-red-600 uppercase tracking-widest">Eligibility Requirements</p>
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2">Blood Donation Eligibility</h2>
              <p className="text-slate-500 text-sm mb-6">
                To donate blood safely, you must meet the following criteria based on Nepal Red Cross Society
                and WHO guidelines for whole blood donation.
              </p>
              <ul className="space-y-3">
                {BLOOD_ELIGIBILITY.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-red-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-slate-700 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800 leading-relaxed">
                  <strong>Please note:</strong> A final health screening is conducted at the donation centre on the day of your appointment. Meeting these criteria does not guarantee eligibility — the attending medical officer makes the final assessment.
                </p>
              </div>
            </div>
          )}

          {/* Organ — Picker */}
          {donationType === 'organ' && (
            <>
              <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Step 2</p>
                <h2 className="text-xl font-black text-slate-900 mb-1">Select Organ</h2>
                <p className="text-slate-500 text-sm mb-6">
                  Select the organ you are willing to donate. You can update this preference at any time.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ORGAN_OPTIONS.map((organ) => (
                    <button
                      key={organ.value}
                      type="button"
                      onClick={() => { setOrganType(organ.value); setError(''); }}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        organType === organ.value
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-blue-50/40'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                        organType === organ.value ? 'bg-blue-600 text-white' : 'bg-white text-blue-500 border border-slate-200'
                      }`}>
                        {organ.icon}
                      </div>
                      <p className="font-bold text-slate-900 text-sm mb-1">{organ.label}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{organ.note}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Organ — Eligibility */}
              <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <Info size={15} className="text-blue-600" />
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Eligibility & What to Expect</p>
                </div>
                <h2 className="text-xl font-black text-slate-900 mb-2">Organ Donation Facts</h2>
                <p className="text-slate-500 text-sm mb-6">
                  Important information about registering as an organ donor in Nepal.
                </p>
                <ul className="space-y-3">
                  {ORGAN_ELIGIBILITY.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 size={16} className="text-blue-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-slate-700 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3">
                  <AlertCircle size={16} className="text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-blue-800 leading-relaxed">
                    <strong>Nepal law:</strong> Organ donation and transplantation is regulated under the <em>Human Body Organ Transplantation (Regulation and Prohibition) Act, 2055 (1998)</em>. Living donation is generally restricted to blood relatives or spouses. Commercial organ trading is strictly prohibited.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Error / Success */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-sm font-semibold text-red-700">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3 text-sm font-semibold text-green-700">
              <CheckCircle size={16} className="shrink-0" />
              {message}
            </div>
          )}

          {/* Submit */}
          {(donationType === 'blood' || (donationType === 'organ' && organType)) && (
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-4 px-6 rounded-2xl bg-red-600 text-white font-black text-base hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
              {isSaving ? 'Saving preferences...' : 'Save Donation Preferences'}
            </button>
          )}
        </form>

        <p className="text-center text-xs text-slate-400 mt-8 leading-relaxed">
          Your donation preferences can be updated at any time from your profile.<br />
          For questions, contact LifeLink support.
        </p>
      </div>
    </div>
  );
}
