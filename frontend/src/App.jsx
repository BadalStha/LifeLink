import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';

// Ensure these match your sidebar names exactly
import Home from './views/Home';
import Auth from './views/Auth';
import Profile from './views/Profile';
import Settings from './views/Settings';
import Admin from './views/Admin';
import AdminLogin from './views/AdminLogin';
import HospitalLogin from './views/HospitalLogin';
import Hospital from './views/Hospital';
import Register from './views/Register';
import RequestHelp from './views/RequestHelp';
import Privacy from './views/Privacy';
import NotFound from './views/NotFound';
import About from './views/About';
import FindDonors from './views/FindDonors';
import DonorProfile from './views/DonorProfile';
import DonationPreferences from './views/DonationPreferences';
import ForgotPassword from './views/ForgotPassword';
import ResetPassword from './views/ResetPassword';
import HelpRequestDetail from './views/HelpRequestDetail';
import ChatbotWidget from './Components/ChatbotWidget';
import { ChatProvider } from './context/ChatContext';
import GlobalChat from './components/GlobalChat';
import ChatView from './views/ChatView';

export default function App() {
  return (
    <ChatProvider>
      <Routes>
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <ChatView />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/request-help" element={<RequestHelp />} />
        <Route path="/request/:id" element={<HelpRequestDetail />} />
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
          path="/donor/:id" 
          element={
              <DonorProfile />
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
        <Route path="/hospital/login" element={<HospitalLogin />} />
        <Route path="/hospital" element={<Hospital />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ChatbotWidget />
      <GlobalChat />
    </ChatProvider>
  );
}