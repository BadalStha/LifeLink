import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, LogOut, Save, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export default function Settings() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    blood_type: '',
    age: '',
    address: '',
    medical_history: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await authAPI.getProfile();
        const user = profile.user || {};
        setFormData({
          name: user.name || '',
          phone: user.phone || '',
          city: user.city || '',
          blood_type: user.blood_type || '',
          age: user.age?.toString() || '',
          address: user.address || '',
          medical_history: user.medical_history || '',
        });
      } catch (err) {
        const errMsg = err.message || 'Failed to load profile settings';
        if (/401|403|token|expired|invalid/i.test(errMsg)) {
          logout();
          navigate('/login');
          return;
        }
        setError(errMsg);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [logout, navigate]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setMessage('');
    setError('');
  };

  const onSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      const payload = {
        ...formData,
        age: formData.age ? Number(formData.age) : null,
      };

      await authAPI.updateProfile(payload);
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const onLogout = () => {
    logout();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-10 font-sans flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-red-600" size={36} />
          <p className="font-bold text-slate-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 md:p-10 font-sans">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/profile')}
          className="mb-8 flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-all"
        >
          <ArrowLeft size={20} /> Back to Profile
        </button>

        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8">Account Settings</h2>

        <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
          <Shield className="text-slate-600 mt-0.5" size={18} />
          <p className="text-sm text-slate-600 font-medium">Keep your profile up to date so matching and emergency outreach work accurately.</p>
        </div>

        {message && <p className="mb-4 text-green-700 bg-green-50 p-3 rounded-xl font-semibold">{message}</p>}
        {error && <p className="mb-4 text-red-700 bg-red-50 p-3 rounded-xl font-semibold">{error}</p>}

        <form onSubmit={onSave} className="space-y-4 bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm">
          <Field label="Full Name" name="name" value={formData.name} onChange={onChange} />
          <Field label="Phone" name="phone" value={formData.phone} onChange={onChange} />
          <Field label="City" name="city" value={formData.city} onChange={onChange} />

          <div>
            <label className="block mb-2 text-sm font-bold text-slate-700">Blood Type</label>
            <select
              name="blood_type"
              value={formData.blood_type}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select blood type</option>
              {BLOOD_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <Field label="Age" name="age" value={formData.age} onChange={onChange} type="number" min="1" max="120" />
          <Field label="Address" name="address" value={formData.address} onChange={onChange} />

          <div>
            <label className="block mb-2 text-sm font-bold text-slate-700">Medical History</label>
            <textarea
              name="medical_history"
              value={formData.medical_history}
              onChange={onChange}
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Optional notes about medical history"
            />
          </div>

          <div className="pt-2 flex flex-col md:flex-row gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-red-600 text-white px-5 py-3 rounded-xl font-black hover:bg-red-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="md:w-auto bg-red-50 text-red-700 px-5 py-3 rounded-xl font-black hover:bg-red-100 transition-all flex items-center justify-center gap-2"
            >
              <LogOut size={18} /> Log Out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, type = 'text', min, max }) {
  return (
    <div>
      <label className="block mb-2 text-sm font-bold text-slate-700">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-red-500"
      />
    </div>
  );
}
