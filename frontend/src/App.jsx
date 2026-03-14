import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';

// Ensure these match your sidebar names exactly
import Home from './views/Home';
import Auth from './views/Auth';
import Profile from './views/Profile';
import Settings from './views/Settings';
import Admin from './views/Admin';
import AdminLogin from './views/AdminLogin';
import Register from './views/Register';
import RequestHelp from './views/RequestHelp';
import Privacy from './views/Privacy';
import NotFound from './views/NotFound';
import About from './views/About';
import FindDonors from './views/FindDonors';
import DonorProfile from './views/DonorProfile';
import Chat from './views/Chat';
import DonationPreferences from './views/DonationPreferences';
import ForgotPassword from './views/ForgotPassword';
import ResetPassword from './views/ResetPassword';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/register" element={<Register />} />
      <Route path="/request-help" element={<RequestHelp />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/about" element={<About />} />
      <Route
        path="/find-donors"
        element={
          <ProtectedRoute>
            <FindDonors />
          </ProtectedRoute>
        }
      />
      <Route
        path="/donor-profile/:donorId"
        element={
          <ProtectedRoute>
            <DonorProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/donation-preferences"
        element={
          <ProtectedRoute>
            <DonationPreferences />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } 
      />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route 
        path="/admin" 
        element={
          <AdminProtectedRoute>
            <Admin />
          </AdminProtectedRoute>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}