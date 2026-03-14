import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const resetToken = location.state?.resetToken || '';
  const email = location.state?.email || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const getErrorMessage = async (response) => {
    try {
      const errorData = await response.json();
      return errorData.error || 'Request failed';
    } catch {
      return 'Request failed';
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!resetToken) {
      setErrorMessage('Reset session missing. Start again from Forgot Password.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Password and confirm password do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reset_token: resetToken,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      setSuccessMessage('Password changed successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1400);
    } catch (error) {
      setErrorMessage(error.message || 'Unable to change password right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-xl bg-white rounded-[36px] border border-slate-100 shadow-xl p-8 md:p-10">
        <button
          onClick={() => navigate('/forgot-password')}
          className="mb-5 flex items-center gap-2 text-slate-500 font-bold hover:text-red-600 transition-all"
        >
          <ArrowLeft size={18} /> Back
        </button>

        <h1 className="text-3xl font-black text-slate-900">Change Password</h1>
        <p className="text-slate-500 font-medium text-sm mt-1 mb-6">
          {email ? `Reset password for ${email}` : 'Enter your new password below.'}
        </p>

        {errorMessage && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm font-semibold text-red-600">{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-sm font-semibold text-green-600">{successMessage}</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              minLength={8}
              className="w-full pl-12 pr-12 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              minLength={8}
              className="w-full pl-12 pr-12 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || successMessage}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-black transition-all disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : null}
            {isSubmitting ? 'Updating Password...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
