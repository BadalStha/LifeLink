import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, HandHeart, User, Mail, Lock, Phone, MapPin, Droplet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  // Determine initial user type from URL params or default to 'donor'
  const params = new URLSearchParams(location.search);
  const initialType = params.get('type') || 'donor';
  
  const [userType, setUserType] = useState(initialType); // 'donor' or 'receiver'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    location: '',
    bloodGroup: '',
    organType: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Registration Data:', { ...formData, userType });
    
    // Simulate successful registration and login
    const userData = { 
      name: formData.name, 
      email: formData.email,
      type: userType
    };
    const token = 'fake-jwt-token-' + Date.now();
    login(userData, token);
    
    navigate('/profile');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/')} 
          className="mb-6 text-slate-500 font-bold hover:text-red-600 transition-all"
        >
          ← Back to Home
        </button>

        <div className="bg-white rounded-[40px] p-10 shadow-xl border border-slate-100">
          <h2 className="text-4xl font-black text-slate-900 mb-2">Join LifeLink</h2>
          <p className="text-slate-500 mb-8 font-medium">Start your journey of saving lives</p>

          {/* User Type Toggle */}
          <div className="grid grid-cols-2 gap-4 mb-8 p-2 bg-slate-50 rounded-3xl">
            <button
              type="button"
              onClick={() => setUserType('donor')}
              className={`p-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                userType === 'donor'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-white'
              }`}
            >
              <Heart size={20} /> I want to Donate
            </button>
            <button
              type="button"
              onClick={() => setUserType('receiver')}
              className={`p-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                userType === 'receiver'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-white'
              }`}
            >
              <HandHeart size={20} /> I need Help
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500 font-medium"
                required
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500 font-medium"
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500 font-medium"
                required
              />
            </div>

            {/* Phone */}
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500 font-medium"
                required
              />
            </div>

            {/* Location */}
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                name="location"
                placeholder="Location (City, District)"
                value={formData.location}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500 font-medium"
                required
              />
            </div>

            {/* Blood Group - Always show */}
            <div className="relative">
              <Droplet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500 font-medium appearance-none"
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

            {/* Organ Type - Only for receivers requesting organ */}
            {userType === 'receiver' && (
              <div className="relative">
                <select
                  name="organType"
                  value={formData.organType}
                  onChange={handleChange}
                  className="w-full pl-4 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500 font-medium appearance-none"
                >
                  <option value="">Need Organ? (Optional)</option>
                  <option value="Kidney">Kidney</option>
                  <option value="Liver">Liver</option>
                  <option value="Cornea">Cornea</option>
                  <option value="Heart">Heart</option>
                  <option value="Bone Marrow">Bone Marrow</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-4 text-white rounded-2xl font-black text-lg transition-all shadow-lg ${
                userType === 'donor'
                  ? 'bg-green-600 hover:bg-green-700 shadow-green-200'
                  : 'bg-red-600 hover:bg-red-700 shadow-red-200'
              }`}
            >
              {userType === 'donor' ? 'Register as Donor' : 'Register & Request Help'}
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