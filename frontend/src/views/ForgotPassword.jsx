import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, User, ShieldCheck, Loader2 } from 'lucide-react';
import { authAPI } from '../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('request');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const requestCode = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const data = await authAPI.requestResetCode(name, email);
      setStep('verify');
      setSuccessMessage(data.message || 'Verification code sent to your email.');
      setResendCooldown(30);
    } catch (error) {
      setErrorMessage(error.message || 'Unable to send verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendCode = async () => {
    if (isSubmitting || resendCooldown > 0) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const data = await authAPI.requestResetCode(name, email);
      setSuccessMessage(data.message || 'A new verification code has been sent.');
      setResendCooldown(30);
    } catch (error) {
      setErrorMessage(error.message || 'Unable to resend verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const data = await authAPI.verifyResetCode(email, code);
      navigate('/reset-password', { state: { resetToken: data.reset_token, email } });
    } catch (error) {
      setErrorMessage(error.message || 'Unable to verify code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-xl bg-white rounded-[36px] border border-slate-100 shadow-xl p-8 md:p-10">
        <button
          onClick={() => navigate('/login')}
          className="mb-5 flex items-center gap-2 text-slate-500 font-bold hover:text-red-600 transition-all"
        >
          <ArrowLeft size={18} /> Back to Login
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900">Forgot Password</h1>
            <p className="text-slate-500 font-medium text-sm">
              {step === 'request'
                ? 'Verify your account details to receive a reset code.'
                : 'Enter the verification code sent to your email.'}
            </p>
          </div>
        </div>

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

        {step === 'request' ? (
          <form onSubmit={requestCode} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Account Name"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-black transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : null}
              {isSubmitting ? 'Sending Code...' : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent tracking-[0.3em] text-center text-lg font-black"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-black transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : null}
              {isSubmitting ? 'Verifying...' : 'Verify Code'}
            </button>

            <button
              type="button"
              onClick={resendCode}
              disabled={isSubmitting || resendCooldown > 0}
              className="w-full text-sm font-bold text-slate-700 hover:text-red-600 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('request');
                setCode('');
                setErrorMessage('');
                setSuccessMessage('');
                setResendCooldown(0);
              }}
              className="w-full text-sm font-bold text-red-600 hover:underline"
            >
              Use different account details
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
