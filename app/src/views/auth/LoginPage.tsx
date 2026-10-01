'use client';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import * as api from '../../api';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { setAuth } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  // ── Email / Password login ────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = email.trim();
    if (!val || !password) return;
    setLoading(true);
    setError('');
    try {
      // api.login() routes through Next.js API routes → Prisma → Hostinger MySQL
      const authResult = await api.login(val, password);
      setAuth(authResult.user, authResult.token);
      addToast('success', `Welcome, ${authResult.user.name}! 👋`);
      const targetRoute =
        authResult.user.role === 'super_admin'
          ? '/admin'
          : authResult.user.role === 'staff'
          ? '/members/search?tab=qr'
          : '/dashboard';
      navigate(targetRoute);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-primary-fixed opacity-20 blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-secondary-fixed opacity-20 blur-[120px]" />
      </div>

      <div className="w-full max-w-[420px] animate-slide-up">
        {/* Login Header */}
        <div className="mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center mx-auto mb-3 shadow-md">
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
          </div>
          <h1 className="text-headline-md font-headline-md font-bold text-primary">Member &amp; Partner Login</h1>
          <p className="text-label-sm text-on-surface-variant mt-1">Merchant Loyalty &amp; Rewards Platform</p>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/30 shadow-tonal">
          <div className="mb-6 text-center">
            <h2 className="text-headline-lg-mobile font-headline-lg-mobile text-on-surface mb-1">
              Welcome Back
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Sign in to your merchant or staff account.
            </p>
          </div>

          {/* ── Email + Password Form ── */}
          <form onSubmit={handleLogin} noValidate>
            {/* Email field */}
            <div className="mb-3">
              <label htmlFor="login-email" className="block text-label-sm text-on-surface-variant mb-1.5 font-medium">
                Email or Mobile Number
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">
                  person
                </span>
                <input
                  id="login-email"
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. 9876543210 or email@domain.com"
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-outline-variant bg-surface-container text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="mb-4">
              <label htmlFor="login-password" className="block text-label-sm text-on-surface-variant mb-1.5 font-medium">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">
                  lock
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Enter your password"
                  className="w-full h-12 pl-10 pr-11 rounded-xl border border-outline-variant bg-surface-container text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 disabled:opacity-60"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 bg-error-container rounded-xl p-3 border border-error/20 flex items-start gap-2">
                <span className="material-symbols-outlined text-error text-[18px] mt-0.5">error</span>
                <p className="text-body-sm text-error">{error}</p>
              </div>
            )}

            {/* Sign In button */}
            <button
              id="email-login-btn"
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full h-12 rounded-xl bg-primary text-on-primary font-semibold text-body-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  Sign In
                </>
              )}
            </button>
          </form>

          <p className="text-center text-body-sm text-on-surface-variant mt-5">
            Not a merchant yet?{' '}
            <a href="#" className="text-primary font-semibold hover:underline">Contact support to get onboarded</a>
          </p>
        </div>

        <p className="text-center text-label-sm text-on-surface-variant mt-6 opacity-60">
          Metro Cardz · Powered by Hostinger
        </p>
      </div>
    </div>
  );
}
