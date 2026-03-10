import React from 'react';
import { Navigate } from 'react-router-dom';

export default function AdminProtectedRoute({ children }) {
  const adminToken = localStorage.getItem('adminToken');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  // If not authenticated as admin, redirect to admin login
  if (!adminToken || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
