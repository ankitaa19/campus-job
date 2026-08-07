'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { API_BASE_URL } from '../utils/api';

export default function ResetPassword() {
  const router = useRouter();
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const queryToken = typeof router.query.token === 'string' ? router.query.token : '';
    setResetToken(queryToken || sessionStorage.getItem('campuspe_password_reset_token') || '');
  }, [router.isReady, router.query.token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!resetToken) return setError('This password reset session is missing or expired. Request a new OTP.');
    if (newPassword !== confirmPassword) return setError('Passwords do not match.');
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*]/.test(newPassword)) {
      return setError('Use at least 8 characters with uppercase, lowercase, number, and special character (!@#$%^&*).');
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/reset-password`, { resetToken, newPassword });
      sessionStorage.removeItem('campuspe_password_reset_token');
      setSuccess('Password reset successfully. Redirecting to login…');
      window.setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Password reset failed. Please request another OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">Create new password</h1>
          <p className="mb-6 text-center text-sm text-gray-600">Your verified reset session is valid for 10 minutes.</p>
          {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">{error}</p>}
          {success && <p className="mb-4 rounded-lg bg-green-50 p-3 text-center text-sm text-green-700">{success}</p>}
          {!resetToken && router.isReady && (
            <button onClick={() => router.push('/forgot-password?type=student')} className="mb-5 w-full rounded-lg border border-blue-500 py-2 font-semibold text-blue-600">Request WhatsApp OTP</button>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">New password</label>
              <input type="password" value={newPassword} onChange={event => setNewPassword(event.target.value)} autoComplete="new-password" required className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Confirm new password</label>
              <input type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} autoComplete="new-password" required className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <p className="text-xs text-gray-500">Minimum 8 characters including uppercase, lowercase, number, and special character.</p>
            <button type="submit" disabled={loading || !resetToken} className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
