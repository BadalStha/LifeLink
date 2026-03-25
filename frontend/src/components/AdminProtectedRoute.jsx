import React from 'react';
import { Navigate } from 'react-router-dom';

export default function AdminProtectedRoute({ children }) {
  const adminToken = localStorage.getItem('adminToken');
  const authToken = localStorage.getItem('authToken');
  const isAdminFlag = localStorage.getItem('isAdmin') === 'true';
  const userDataRaw = localStorage.getItem('userData');

  let isAdminFromUserData = false;
  try {
    const parsed = userDataRaw ? JSON.parse(userDataRaw) : null;
    isAdminFromUserData = parsed?.role === 'admin';
  } catch {
    isAdminFromUserData = false;
  }

  const hasAdminSession = (adminToken && isAdminFlag) || (authToken && isAdminFromUserData);

  // If not authenticated as admin, redirect to normal login
  if (!hasAdminSession) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
