import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Ensure these match your sidebar names exactly
import Home from './views/Home';
import Auth from './views/Auth';
import Profile from './views/Profile';
import Settings from './views/Settings';
import Admin from './views/Admin';
import Register from './views/Register'; // Added this

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/register" element={<Register />} /> 
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}