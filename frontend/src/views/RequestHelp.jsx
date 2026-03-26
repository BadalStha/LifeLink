import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HandHeart, User, Mail, Phone, MapPin, AlertTriangle, CheckCircle, Droplet, Activity, Loader2, Droplets, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { requestsAPI } from '../services/api';
import { PROVINCE_DISTRICTS as provinceData } from '../data/constants';

const inputAutofillClass = 'autofill:!text-slate-800 autofill:shadow-[inset_0_0_0px_1000px_#f8fafc]';
const inputAutofillWhiteClass = 'autofill:!text-slate-800 autofill:shadow-[inset_0_0_0px_1000px_#ffffff]';

const districtMunicipalityData = {
  Morang: ['Biratnagar Metropolitan City', 'Sundarharaicha Municipality', 'Belbari Municipality', 'Pathari Shanishchare Municipality', 'Rangeli Municipality', 'Letang Municipality', 'Ratuwamai Municipality', 'Sunwarshi Municipality'],
  Kathmandu: ['Kathmandu Metropolitan City', 'Kageshwori Manohara Municipality', 'Gokarneshwor Municipality', 'Tokha Municipality', 'Tarakeshwar Municipality', 'Nagarjun Municipality', 'Budhanilkantha Municipality', 'Kirtipur Municipality'],
  Lalitpur: ['Lalitpur Metropolitan City', 'Mahalaxmi Municipality', 'Godawari Municipality'],
  Bhaktapur: ['Bhaktapur Municipality', 'Madhyapur Thimi Municipality', 'Suryabinayak Municipality', 'Changunarayan Municipality'],
};

const municipalityHospitalData = {
  'Sundarharaicha Municipality': ['Sundarharaicha Municipal Hospital', 'Morang Model Hospital'],
  'Biratnagar Metropolitan City': ['Koshi Hospital', 'Birat Medical College Teaching Hospital', 'Nobel Medical College Teaching Hospital'],
  'Belbari Municipality': ['Belbari Primary Hospital', 'Belbari Community Hospital'],
  'Kathmandu Metropolitan City': ['Tribhuvan University Teaching Hospital', 'Bir Hospital', 'Civil Service Hospital', 'Grande International Hospital'],
  'Lalitpur Metropolitan City': ['Patan Hospital', 'Alka Hospital', 'B and B Hospital'],
  'Bhaktapur Municipality': ['Bhaktapur Hospital', 'Khwopa Hospital'],
};

export default function RequestHelp() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    middleName: '',
    lastName: '',
    dobDay: '',
    dobMonth: '',
    dobYear: '',
    gender: '',
    
    // Contact Details
    email: '',
    mobile: '',
    
    // Address
    province: '',
    district: '',
    municipality: '',
    ward: '',
    
    // Medical Need
    requestType: 'blood', // 'blood' or 'organ'
    bloodGroup: '',
    organType: '',
    urgencyLevel: '',
    hospitalName: '',
    additionalInfo: '',
    
    // Confirmation
    agreedToPrivacy: false
  });

  const [districts, setDistricts] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!isAuthenticated) {
      setErrorMessage('Please login or create an account first.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        request_type: formData.requestType,
        blood_type: formData.requestType === 'blood' ? formData.bloodGroup : null,
        organ_type: formData.requestType === 'organ' ? formData.organType : null,
        units_needed: formData.requestType === 'blood' ? 1 : null,
        urgency: formData.urgencyLevel || 'medium',
        reason: formData.additionalInfo || null,
        location: `${formData.municipality}, ${formData.district}`,
        patient_name: `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`,
        patient_email: formData.email || null,
        patient_phone: formData.mobile || null,
      };

      await requestsAPI.create(requestData);

      setSuccessMessage('Your request has been submitted successfully! Nearby donors will be notified.');
      
      setTimeout(() => {
        navigate('/profile');
      }, 3000);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to submit request. Please try again.');
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
      setMunicipalities([]);
      setHospitals([]);
      setFormData(prev => ({ ...prev, province: value, district: '', municipality: '', hospitalName: '' }));
    }

    if (name === 'district') {
      const mapped = districtMunicipalityData[value] || [
        `${value} Municipality`,
        `${value} Rural Municipality`,
      ];
      setMunicipalities(mapped);
      setHospitals([]);
      setFormData(prev => ({ ...prev, district: value, municipality: '', hospitalName: '' }));
    }

    if (name === 'municipality') {
      const mapped = municipalityHospitalData[value] || [
        `${value} Municipal Hospital`,
        `${value} Community Hospital`,
        `${value} Primary Health Center`,
      ];
      setHospitals(mapped);
      setFormData(prev => ({ ...prev, municipality: value, hospitalName: '' }));
    }
  };

  // Month stays as dropdown for easier selection
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 shadow-sm px-5 md:px-12 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-red-600 transition-all">
            <ArrowLeft size={18}/>
          </button>
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-7 h-7 bg-red-600 rounded-md flex items-center justify-center">
              <Droplets size={14} className="text-white"/>
            </div>
            <span className="font-black text-slate-900">LifeLink</span>
          </div>
        </div>
        {!isAuthenticated && (
          <button onClick={() => navigate('/login')} className="text-sm font-semibold text-red-600 hover:underline">
            Login to submit
          </button>
        )}
      </nav>

      {/* Page header banner */}
      <div className="bg-gradient-to-r from-red-700 to-red-800 text-white py-10 px-5 md:px-12">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <HandHeart className="text-white" size={28}/>
          </div>
          <div>
            <h1 className="text-3xl font-black leading-tight">Request Medical Help</h1>
            <p className="text-red-200 mt-1">Submit an urgent need for blood or organ donation support.</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 md:px-12 py-8">
        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100">

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* ===== PATIENT INFORMATION SECTION ===== */}
            <div className="border-l-4 border-red-600 pl-6">
              <h3 className="text-2xl font-black text-slate-900 mb-6">Patient Information</h3>
              
              {/* Name Fields */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Ramesh"
                    className={`w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent ${inputAutofillClass}`}
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
                    placeholder="Bahadur"
                    className={`w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent ${inputAutofillClass}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Gurung"
                    className={`w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent ${inputAutofillClass}`}
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
                    inputMode="numeric"
                    className={`px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent ${inputAutofillClass}`}
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
                    inputMode="numeric"
                    className={`px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent ${inputAutofillClass}`}
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
            <div className="border-l-4 border-orange-600 pl-6">
              <h3 className="text-2xl font-black text-slate-900 mb-2">Contact Details</h3>
              <p className="text-slate-500 text-sm mb-6 font-medium">We need your contact information to coordinate with donors and keep you updated about potential matches.</p>
              
              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Email Address (Optional)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="ramesh.gurung@example.com"
                      className={`w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent ${inputAutofillClass}`}
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
                      className={`w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent ${inputAutofillClass}`}
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
                  <select
                    name="municipality"
                    value={formData.municipality}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!formData.district}
                    required
                  >
                    <option value="">Select Municipality / Rural Municipality</option>
                    {municipalities.map(municipality => (
                      <option key={municipality} value={municipality}>{municipality}</option>
                    ))}
                  </select>
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
                    className={`w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputAutofillClass}`}
                    required
                  />
                </div>
              </div>
            </div>

            {/* ===== MEDICAL NEED SECTION ===== */}
            <div className="border-l-4 border-purple-600 pl-6 bg-purple-50 p-6 rounded-2xl">
              <h3 className="text-2xl font-black text-slate-900 mb-6">Medical Requirement</h3>
              
              {/* Request Type Toggle */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-3">What do you need? *</label>
                <div className="grid grid-cols-2 gap-4 p-2 bg-white rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, requestType: 'blood', organType: ''})}
                    className={`p-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      formData.requestType === 'blood'
                        ? 'bg-red-600 text-white shadow-lg'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Droplet size={20} /> Blood Donation
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, requestType: 'organ', bloodGroup: ''})}
                    className={`p-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      formData.requestType === 'organ'
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Activity size={20} /> Organ Transplant
                  </button>
                </div>
              </div>

              {/* Blood Group - Show if blood is selected */}
              {formData.requestType === 'blood' && (
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Blood Group Required *</label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Blood Group</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              )}

              {/* Organ Type - Show if organ is selected */}
              {formData.requestType === 'organ' && (
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Organ Required *</label>
                  <select
                    name="organType"
                    value={formData.organType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Organ Type</option>
                    <option value="Kidney">Kidney</option>
                    <option value="Liver">Liver</option>
                    <option value="Cornea">Cornea</option>
                    <option value="Heart">Heart</option>
                    <option value="Lung">Lung</option>
                    <option value="Pancreas">Pancreas</option>
                    <option value="Bone Marrow">Bone Marrow</option>
                  </select>
                </div>
              )}

              {/* Urgency Level */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Urgency Level *</label>
                <select
                  name="urgencyLevel"
                  value={formData.urgencyLevel}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Urgency</option>
                  <option value="critical">🔴 Critical - Immediate Need (Within 24 hours)</option>
                  <option value="high">🟠 Urgent - Within a Week</option>
                  <option value="medium">🟡 Moderate - Within a Month</option>
                </select>
              </div>

              {/* Hospital Name */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Hospital/Medical Center *</label>
                <select
                  name="hospitalName"
                  value={formData.hospitalName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={!formData.municipality}
                  required
                >
                  <option value="">Select Hospital / Medical Center</option>
                  {hospitals.map(hospital => (
                    <option key={hospital} value={hospital}>{hospital}</option>
                  ))}
                </select>
              </div>

              {/* Additional Information */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Additional Medical Information</label>
                <textarea
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleChange}
                  placeholder="Please provide any additional medical details, doctor's name, or special requirements..."
                  rows="4"
                  className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* ===== CONFIRMATION SECTION ===== */}
            <div className="border-l-4 border-slate-600 pl-6 bg-slate-50 p-6 rounded-2xl">
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
                    {' '}and confirm that the information provided is accurate. I understand that this information will be shared with potential donors to facilitate the medical assistance I require.
                  </p>
                </div>
              </label>
            </div>

            {/* Error and Success Messages */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-red-600">{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-green-600">{successMessage}</p>
                <p className="text-xs text-slate-500 mt-1">Redirecting to your profile...</p>
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
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Submitting Request...
                </>
              ) : successMessage ? (
                <>
                  <CheckCircle size={20} /> Request Submitted!
                </>
              ) : (
                <>
                  <AlertTriangle size={20} /> Submit Request for Help
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
