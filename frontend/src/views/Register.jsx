import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Heart, Mail, Phone, CheckCircle, Lock, Droplets,
  ShieldCheck, MapPin, Clock3, AlertCircle, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const provinceData = {
  'Province 1': ['Bhojpur', 'Dhankuta', 'Ilam', 'Jhapa', 'Khotang', 'Morang', 'Okhaldhunga', 'Panchthar', 'Sankhuwasabha', 'Solukhumbu', 'Sunsari', 'Taplejung', 'Terhathum', 'Udayapur'],
  'Madhesh': ['Bara', 'Dhanusa', 'Mahottari', 'Parsa', 'Rautahat', 'Saptari', 'Sarlahi', 'Siraha'],
  'Bagmati': ['Bhaktapur', 'Chitwan', 'Dhading', 'Dolakha', 'Kathmandu', 'Kavrepalanchok', 'Lalitpur', 'Makwanpur', 'Nuwakot', 'Ramechhap', 'Rasuwa', 'Sindhuli', 'Sindhupalchok'],
  'Gandaki': ['Baglung', 'Gorkha', 'Kaski', 'Lamjung', 'Manang', 'Mustang', 'Myagdi', 'Nawalpur', 'Parbat', 'Syangja', 'Tanahun'],
  'Lumbini': ['Arghakhanchi', 'Banke', 'Bardiya', 'Dang', 'Gulmi', 'Kapilvastu', 'Nawalparasi West', 'Palpa', 'Pyuthan', 'Rolpa', 'Rupandehi'],
  'Karnali': ['Dailekh', 'Dolpa', 'Humla', 'Jajarkot', 'Jumla', 'Kalikot', 'Mugu', 'Salyan', 'Surkhet', 'Western Rukum'],
  'Sudurpashchim': ['Achham', 'Baitadi', 'Bajhang', 'Bajura', 'Dadeldhura', 'Darchula', 'Doti', 'Kailali', 'Kanchanpur'],
};

const districtMunicipalityData = {
  Morang: ['Biratnagar Metropolitan City', 'Sundarharaicha Municipality', 'Belbari Municipality', 'Pathari Shanishchare Municipality', 'Rangeli Municipality', 'Letang Municipality', 'Ratuwamai Municipality', 'Sunwarshi Municipality'],
  Kathmandu: ['Kathmandu Metropolitan City', 'Kageshwori Manohara Municipality', 'Gokarneshwor Municipality', 'Tokha Municipality', 'Tarakeshwar Municipality', 'Nagarjun Municipality', 'Budhanilkantha Municipality', 'Kirtipur Municipality'],
  Lalitpur: ['Lalitpur Metropolitan City', 'Mahalaxmi Municipality', 'Godawari Municipality'],
  Bhaktapur: ['Bhaktapur Municipality', 'Madhyapur Thimi Municipality', 'Suryabinayak Municipality', 'Changunarayan Municipality'],
};

const inputClass =
  'w-full px-4 py-3.5 bg-white rounded-2xl border border-slate-200 focus:border-red-400 focus:ring-4 focus:ring-red-50 transition-all outline-none font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal shadow-sm';
const iconInputClass =
  'w-full pl-11 pr-4 py-3.5 bg-white rounded-2xl border border-slate-200 focus:border-red-400 focus:ring-4 focus:ring-red-50 transition-all outline-none font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal shadow-sm';
const labelClass = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();

  const [userRole, setUserRole] = useState(
    searchParams.get('type') === 'recipient' ? 'recipient' : 'donor',
  );

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dobDay: '',
    dobMonth: '',
    dobYear: '',
    gender: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    province: '',
    district: '',
    municipality: '',
    ward: '',
    agreedToPrivacy: false,
  });

  const [districts, setDistricts] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const getErrorMessage = async (response) => {
    try {
      const errorData = await response.json();
      return errorData.error || 'Registration failed';
    } catch {
      return 'Registration failed';
    }
  };

  const calculateAge = (year, month, day) => {
    const birthDate = new Date(Number(year), Number(month) - 1, Number(day));
    if (Number.isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }
    return age > 0 ? age : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (formData.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Password and confirm password do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const fullName = [formData.firstName, formData.middleName, formData.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      const age = calculateAge(formData.dobYear, formData.dobMonth, formData.dobDay);
      const address = `${formData.municipality}, Ward ${formData.ward}, ${formData.district}, ${formData.province}`;

      const registerResponse = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: userRole === 'recipient' ? 'patient' : 'user',
          name: fullName,
          phone: formData.mobile,
          city: formData.district,
          address,
          age,
          blood_type: null,
          medical_history: null,
        }),
      });

      if (!registerResponse.ok) throw new Error(await getErrorMessage(registerResponse));

      setSuccessMessage(`Welcome to LifeLink, ${formData.firstName}! Your account is ready.`);
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      setErrorMessage(error.message || 'Unable to complete registration right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    if (name === 'province') {
      setDistricts(provinceData[value] || []);
      setMunicipalities([]);
      setFormData((prev) => ({ ...prev, province: value, district: '', municipality: '' }));
    }
    if (name === 'district') {
      const mapped = districtMunicipalityData[value] || [
        `${value} Municipality`,
        `${value} Rural Municipality`,
      ];
      setMunicipalities(mapped);
      setFormData((prev) => ({ ...prev, district: value, municipality: '' }));
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const currentYear = new Date().getFullYear();

  const registrationSteps = [
    { num: '01', title: 'About You', desc: 'Personal details & identity' },
    { num: '02', title: 'Contact Details', desc: 'Email, password & phone' },
    { num: '03', title: 'Address', desc: 'Province, district & ward' },
  ];

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans Devanagari', sans-serif" }}
    >
      {/* ── LEFT PANEL (desktop only, sticky) ── */}
      <div className="hidden md:flex md:w-[380px] lg:w-[420px] sticky top-0 h-screen flex-col shrink-0">
        <img
          src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80"
          alt="Medical care and donation"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/85 via-slate-900/75 to-red-950/90" />

        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 w-fit">
            <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              <Droplets size={18} className="text-white" />
            </div>
            <span className="text-xl font-black text-white">LifeLink</span>
          </button>

          {/* Main copy */}
          <div className="my-auto py-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-bold tracking-widest uppercase mb-5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-300 animate-pulse" />
              Nepal Donor Network
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight mb-3">
              Join Nepal's largest<br />donor network.
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-8 max-w-xs">
              Register as a verified blood or organ donor and help save lives across all 77 districts.
            </p>

            {/* Step indicators */}
            <div className="space-y-4 mb-8">
              {registrationSteps.map((step) => (
                <div key={step.num} className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-red-600/60 border border-red-400/40 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-white">{step.num}</span>
                  </div>
                  <div className="pt-0.5">
                    <p className="text-sm font-bold text-white">{step.title}</p>
                    <p className="text-xs text-white/50">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust row */}
            <div className="flex flex-col gap-2.5">
              {[
                { icon: <ShieldCheck size={13} />, text: 'Verified profiles only' },
                { icon: <MapPin size={13} />, text: '77 districts covered' },
                { icon: <Clock3 size={13} />, text: '24/7 emergency alerts' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2 text-white/50">
                  <span className="text-emerald-400">{item.icon}</span>
                  <span className="text-xs font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-white/10">
            <p className="text-white/30 text-xs">© 2025 LifeLink Nepal. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (scrollable form) ── */}
      <div className="flex-1 bg-slate-50 min-h-screen">
        {/* Mobile-only header */}
        <div className="md:hidden bg-white border-b border-slate-100 shadow-sm px-5 py-4 sticky top-0 z-50 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Droplets size={15} className="text-white" />
            </div>
            <span className="font-black text-slate-900">LifeLink</span>
          </button>
          <button onClick={() => navigate('/login')} className="text-sm font-bold text-red-600">
            Sign in
          </button>
        </div>

        <div className="max-w-2xl mx-auto px-5 md:px-10 py-8 md:py-12">
          {/* Page intro */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900">Create your account</h1>
            <p className="text-slate-500 mt-1.5 font-medium text-sm">
              Blood &amp; Organ Donation Network of Nepal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">

            {/* ─── SECTION 1: ABOUT YOU ─── */}
            <div>
              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                  01
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-none">About You</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Personal details &amp; identity</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
                {/* Name */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Sita"
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Middle Name</label>
                    <input
                      type="text"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleChange}
                      placeholder="Kumari"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Shrestha"
                      className={inputClass}
                      required
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className={labelClass}>Date of Birth *</label>
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="number"
                      name="dobDay"
                      value={formData.dobDay}
                      onChange={handleChange}
                      placeholder="Day"
                      min="1"
                      max="31"
                      className={inputClass}
                      required
                    />
                    <select
                      name="dobMonth"
                      value={formData.dobMonth}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    >
                      <option value="">Month</option>
                      {months.map((month, idx) => (
                        <option key={month} value={idx + 1}>{month}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      name="dobYear"
                      value={formData.dobYear}
                      onChange={handleChange}
                      placeholder="Year"
                      min="1900"
                      max={currentYear}
                      className={inputClass}
                      required
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className={labelClass}>Gender *</label>
                  <div className="flex gap-4">
                    {['Female', 'Male'].map((g) => (
                      <label
                        key={g}
                        className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl border-2 cursor-pointer transition-all font-semibold text-sm ${
                          formData.gender === g
                            ? 'bg-red-50 border-red-400 text-red-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="gender"
                          value={g}
                          checked={formData.gender === g}
                          onChange={handleChange}
                          className="sr-only"
                          required
                        />
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                            formData.gender === g ? 'border-red-500 bg-red-500' : 'border-slate-300'
                          }`}
                        >
                          {formData.gender === g && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </span>
                        {g}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ─── SECTION 2: CONTACT DETAILS ─── */}
            <div>
              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                  02
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-none">Contact Details</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Used only for donation-related communications</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
                {/* Email */}
                <div>
                  <label className={labelClass}>Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="sita.shrestha@example.com"
                      className={iconInputClass}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className={labelClass}>Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      minLength={8}
                      placeholder="Minimum 8 characters"
                      className={iconInputClass}
                      required
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className={labelClass}>Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      minLength={8}
                      placeholder="Re-enter password"
                      className={iconInputClass}
                      required
                    />
                  </div>
                </div>

                {/* Mobile */}
                <div>
                  <label className={labelClass}>Mobile Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="+977-98XXXXXXXX"
                      className={iconInputClass}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ─── SECTION 3: ADDRESS ─── */}
            <div>
              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                  03
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-none">Address</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Used for local donor matching</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
                {/* Province */}
                <div>
                  <label className={labelClass}>Province *</label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="">Select Province</option>
                    {Object.keys(provinceData).map((province) => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div>
                  <label className={labelClass}>District *</label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className={`${inputClass} ${!formData.province ? 'opacity-50' : ''}`}
                    disabled={!formData.province}
                    required
                  >
                    <option value="">Select District</option>
                    {districts.map((district) => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>

                {/* Municipality */}
                <div>
                  <label className={labelClass}>Municipality / Rural Municipality *</label>
                  <select
                    name="municipality"
                    value={formData.municipality}
                    onChange={handleChange}
                    className={`${inputClass} ${!formData.district ? 'opacity-50' : ''}`}
                    disabled={!formData.district}
                    required
                  >
                    <option value="">Select Municipality / Rural Municipality</option>
                    {municipalities.map((municipality) => (
                      <option key={municipality} value={municipality}>{municipality}</option>
                    ))}
                  </select>
                </div>

                {/* Ward */}
                <div>
                  <label className={labelClass}>Ward Number *</label>
                  <input
                    type="number"
                    name="ward"
                    value={formData.ward}
                    onChange={handleChange}
                    placeholder="1 – 32"
                    min="1"
                    max="32"
                    className={inputClass}
                    required
                  />
                </div>
              </div>
            </div>

            {/* ─── PRIVACY AGREEMENT ─── */}
            <label className="flex items-start gap-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 transition-colors">
              <div className="mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  name="agreedToPrivacy"
                  checked={formData.agreedToPrivacy}
                  onChange={handleChange}
                  className="sr-only"
                  required
                />
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    formData.agreedToPrivacy
                      ? 'bg-red-600 border-red-600'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {formData.agreedToPrivacy && (
                    <CheckCircle size={12} className="text-white" strokeWidth={3} />
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-600">
                I have read and agree to the{' '}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-red-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Privacy Statement
                </a>
                {' '}and confirm that all information provided is accurate and truthful.
              </p>
            </label>

            {/* Error / success messages */}
            {errorMessage && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-red-700">{errorMessage}</p>
              </div>
            )}
            {successMessage && (
              <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
                <Heart size={16} className="text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-700">{successMessage}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Redirecting to login page...</p>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!formData.agreedToPrivacy || isSubmitting || !!successMessage}
              className={`w-full py-4 px-6 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2.5 ${
                formData.agreedToPrivacy && !isSubmitting && !successMessage
                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-100 active:scale-[0.99] cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting
                ? 'Creating account...'
                : successMessage
                ? 'Registration complete!'
                : (
                  <>
                    <CheckCircle size={18} />
                    Complete Registration
                    <ArrowRight size={18} />
                  </>
                )}
            </button>

            <p className="text-center text-sm text-slate-500 pb-4">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-bold text-red-600 hover:underline"
              >
                Sign in here
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
