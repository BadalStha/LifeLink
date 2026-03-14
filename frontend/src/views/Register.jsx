import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, Mail, Phone, CheckCircle, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Nepal address data
const provinceData = {
  'Province 1': ['Bhojpur', 'Dhankuta', 'Ilam', 'Jhapa', 'Khotang', 'Morang', 'Okhaldhunga', 'Panchthar', 'Sankhuwasabha', 'Solukhumbu', 'Sunsari', 'Taplejung', 'Terhathum', 'Udayapur'],
  'Madhesh': ['Bara', 'Dhanusa', 'Mahottari', 'Parsa', 'Rautahat', 'Saptari', 'Sarlahi', 'Siraha'],
  'Bagmati': ['Bhaktapur', 'Chitwan', 'Dhading', 'Dolakha', 'Kathmandu', 'Kavrepalanchok', 'Lalitpur', 'Makwanpur', 'Nuwakot', 'Ramechhap', 'Rasuwa', 'Sindhuli', 'Sindhupalchok'],
  'Gandaki': ['Baglung', 'Gorkha', 'Kaski', 'Lamjung', 'Manang', 'Mustang', 'Myagdi', 'Nawalpur', 'Parbat', 'Syangja', 'Tanahun'],
  'Lumbini': ['Arghakhanchi', 'Banke', 'Bardiya', 'Dang', 'Gulmi', 'Kapilvastu', 'Nawalparasi West', 'Palpa', 'Pyuthan', 'Rolpa', 'Rupandehi'],
  'Karnali': ['Dailekh', 'Dolpa', 'Humla', 'Jajarkot', 'Jumla', 'Kalikot', 'Mugu', 'Salyan', 'Surkhet', 'Western Rukum'],
  'Sudurpashchim': ['Achham', 'Baitadi', 'Bajhang', 'Bajura', 'Dadeldhura', 'Darchula', 'Doti', 'Kailali', 'Kanchanpur']
};

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();

  // 'donor' = blood/organ donor, 'recipient' = someone who needs help
  const [userRole, setUserRole] = useState(
    searchParams.get('type') === 'recipient' ? 'recipient' : 'donor'
  );
  
  const [formData, setFormData] = useState({
    // About You
    firstName: '',
    middleName: '',
    lastName: '',
    dobDay: '',
    dobMonth: '',
    dobYear: '',
    gender: '',
    
    // Contact Details
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    
    // Address
    province: '',
    district: '',
    municipality: '',
    ward: '',
    
    // Confirmation
    agreedToPrivacy: false
  });

  const [districts, setDistricts] = useState([]);
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
    if (Number.isNaN(birthDate.getTime())) {
      return null;
    }

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

      if (!registerResponse.ok) {
        throw new Error(await getErrorMessage(registerResponse));
      }

      // Show success message instead of auto-login
      setSuccessMessage(`Registration successful! Welcome to LifeLink, ${formData.firstName}! You can now login.`);
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setErrorMessage(error.message || 'Unable to complete registration right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
    
    // Update districts when province changes
    if (name === 'province') {
      setDistricts(provinceData[value] || []);
      setFormData(prev => ({ ...prev, province: value, district: '', municipality: '' }));
    }
  };

  // Date constants for DOB controls
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/')} 
          className="mb-6 text-slate-500 font-bold hover:text-red-600 transition-all"
        >
          ← Back to Home
        </button>

        <div className="bg-white rounded-[40px] p-10 shadow-xl border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <Heart className="text-red-600" size={32} />
            <div>
              <h2 className="text-4xl font-black text-slate-900">Join LifeLink</h2>
              <p className="text-slate-500 font-medium">Create your account to get started</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* ===== ABOUT YOU SECTION ===== */}
            <div className="border-l-4 border-red-600 pl-6">
              <h3 className="text-2xl font-black text-slate-900 mb-6">About You</h3>
              
              {/* Name Fields */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Sita"
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Middle Name</label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                    placeholder="Kumari"
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Shrestha"
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Date of Birth *</label>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="number"
                    name="dobDay"
                    value={formData.dobDay}
                    onChange={handleChange}
                    placeholder="Day"
                    min="1"
                    max="31"
                    className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                  
                  <select
                    name="dobMonth"
                    value={formData.dobMonth}
                    onChange={handleChange}
                    className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  >
                    <option value="">Month</option>
                    {months.map((month, idx) => <option key={month} value={idx + 1}>{month}</option>)}
                  </select>
                  
                  <input
                    type="number"
                    name="dobYear"
                    value={formData.dobYear}
                    onChange={handleChange}
                    placeholder="Year"
                    min="1900"
                    max={currentYear}
                    className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Gender *</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="Female"
                      checked={formData.gender === 'Female'}
                      onChange={handleChange}
                      className="w-4 h-4"
                      required
                    />
                    <span className="font-medium text-slate-700">Female</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="Male"
                      checked={formData.gender === 'Male'}
                      onChange={handleChange}
                      className="w-4 h-4"
                      required
                    />
                    <span className="font-medium text-slate-700">Male</span>
                  </label>
                </div>
              </div>
            </div>

            {/* ===== CONTACT DETAILS SECTION ===== */}
            <div className="border-l-4 border-green-600 pl-6">
              <h3 className="text-2xl font-black text-slate-900 mb-2">Contact Details</h3>
              <p className="text-slate-500 text-sm mb-6 font-medium">We need your contact information to reach you when there's an urgent need. Your information will be kept confidential and used only for donation-related communications.</p>
              
              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="sita.shrestha@example.com"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      minLength={8}
                      placeholder="Minimum 8 characters"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      minLength={8}
                      placeholder="Re-enter password"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Mobile Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="+977-98XXXXXXXX"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* ===== ADDRESS SECTION ===== */}
            <div className="border-l-4 border-blue-600 pl-6">
              <h3 className="text-2xl font-black text-slate-900 mb-6">Address</h3>
              
              <div className="space-y-4">
                {/* Province */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Province *</label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Province</option>
                    {Object.keys(provinceData).map(province => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">District *</label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!formData.province}
                    required
                  >
                    <option value="">Select District</option>
                    {districts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>

                {/* Municipality/Rural Municipality */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Municipality / Rural Municipality *</label>
                  <input
                    type="text"
                    name="municipality"
                    value={formData.municipality}
                    onChange={handleChange}
                    placeholder="e.g., Kathmandu Metropolitan City"
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Ward */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Ward Number *</label>
                  <input
                    type="number"
                    name="ward"
                    value={formData.ward}
                    onChange={handleChange}
                    placeholder="1-32"
                    min="1"
                    max="32"
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* ===== CONFIRMATION SECTION ===== */}
            <div className="border-l-4 border-purple-600 pl-6 bg-purple-50 p-6 rounded-2xl">
              <label className="flex items-start gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreedToPrivacy"
                  checked={formData.agreedToPrivacy}
                  onChange={handleChange}
                  className="w-5 h-5 mt-1"
                  required
                />
                <div>
                  <p className="text-sm text-slate-700 font-medium">
                    <span className="font-bold">I have read and agree to the </span>
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-red-600 hover:underline"
                    >
                      Privacy Statement
                    </a>
                    {' '}and understand that my personal information will be used only for blood donation purposes. I confirm that all information provided is accurate and truthful.
                  </p>
                </div>
              </label>
            </div>

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-red-600">{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-green-600">{successMessage}</p>
                <p className="text-xs text-slate-500 mt-1">Redirecting to login page...</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!formData.agreedToPrivacy || isSubmitting || successMessage}
              className={`w-full py-4 px-6 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 ${
                formData.agreedToPrivacy && !isSubmitting && !successMessage
                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200 cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle size={20} /> {isSubmitting ? 'Creating Account...' : successMessage ? 'Registration Complete!' : 'Register'}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-500 font-medium">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-red-600 font-bold hover:underline"
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}