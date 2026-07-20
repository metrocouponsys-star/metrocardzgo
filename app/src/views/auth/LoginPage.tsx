'use client';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { supabase } from '../../lib/supabaseClient';
import * as api from '../../api';

const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

export default function LoginPage() {
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [googleError, setGoogleError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { setAuth } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  // ── Handle Google OAuth callback ──────────────────────────────────────────
  useEffect(() => {
    // Clear any stale Supabase sessions on mount to prevent ghost redirects
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // There's a stale session — sign out silently so it doesn't interfere
        supabase.auth.signOut();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.access_token) {
        setGoogleLoading(true);
        setGoogleError('');
        try {
          const res = await fetch(`${BASE_URL}/api/v1/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ supabase_token: session.access_token }),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: 'Authentication failed' }));
            throw new Error(err.detail || 'Authentication failed');
          }

          const data = await res.json();
          if (data.refresh_token) {
            localStorage.setItem('metro-cardz-refresh', data.refresh_token);
          }
          setAuth(data.user, data.access_token);
          addToast('success', `Welcome, ${data.user.name}! 👋`);
          navigate(data.user.role === 'super_admin' ? '/admin' : '/dashboard');
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Login failed';
          setGoogleError(
            msg.toLowerCase().includes('not found')
              ? 'Your Google account is not registered on Metro Cardz. Contact support to get onboarded.'
              : msg
          );
          await supabase.auth.signOut();
        } finally {
          setGoogleLoading(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [setAuth, addToast, navigate]);

  // ── Email / Phone + Password login ─────────────────────────────────────────
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = email.trim();
    if (!val || !password) return;

    setEmailLoading(true);
    setEmailError('');
    const isEmail = val.includes('@');

    try {
      let authResult: { user: any; token: string };
      if (isEmail) {
        const res = await fetch(`${BASE_URL}/api/v1/auth/login-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: val.toLowerCase(), password }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: 'Login failed' }));
          throw new Error(err.detail || 'Invalid email or password');
        }

        const data = await res.json();
        if (data.refresh_token) {
          localStorage.setItem('metro-cardz-refresh', data.refresh_token);
        }
        authResult = { user: data.user, token: data.access_token };
      } else {
        // Use unified api.login — handles both mock and real backend transparently
        authResult = await api.login(val, password);
      }

      setAuth(authResult.user, authResult.token);
      addToast('success', `Welcome, ${authResult.user.name}! 👋`);
      navigate(authResult.user.role === 'super_admin' ? '/admin' : '/dashboard');
    } catch (e: unknown) {
      setEmailError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setEmailLoading(false);
    }
  };

  // ── Google login ──────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setGoogleError('');
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin + '/login' : undefined,
      },
    });
    if (oauthError) {
      setGoogleError('Google login failed. Please try again.');
      setGoogleLoading(false);
    }
    // If no error, browser redirects to Google — loading stays true
  };

  const isAnyLoading = emailLoading || googleLoading;

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-primary-fixed opacity-20 blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-secondary-fixed opacity-20 blur-[120px]" />
      </div>

      <div className="w-full max-w-[420px] animate-slide-up">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-primary rounded-2xl mb-3 shadow-elevated">
            <span className="material-symbols-outlined text-on-primary text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
          </div>
          <h1 className="text-headline-md font-headline-md font-bold text-primary">Metro Cardz</h1>
          <p className="text-label-sm text-on-surface-variant mt-1">Loyalty Platform for Indian SMBs</p>
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

          {/* ── Email/Phone + Password Form ── */}
          <form onSubmit={handleEmailLogin} noValidate>
            {/* Email / Phone field */}
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
                  disabled={isAnyLoading}
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
                  disabled={isAnyLoading}
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

            {/* Email login error */}
            {emailError && (
              <div className="mb-4 bg-error-container rounded-xl p-3 border border-error/20 flex items-start gap-2">
                <span className="material-symbols-outlined text-error text-[18px] mt-0.5">error</span>
                <p className="text-body-sm text-error">{emailError}</p>
              </div>
            )}

            {/* Sign In button */}
            <button
              id="email-login-btn"
              type="submit"
              disabled={isAnyLoading || !email.trim() || !password}
              className="w-full h-12 rounded-xl bg-primary text-on-primary font-semibold text-body-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {emailLoading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-outline-variant/40" />
            <span className="text-label-sm text-on-surface-variant font-medium">or</span>
            <div className="flex-1 h-px bg-outline-variant/40" />
          </div>

          {/* Google error */}
          {googleError && (
            <div className="mb-4 bg-error-container rounded-xl p-3 border border-error/20 flex items-start gap-2">
              <span className="material-symbols-outlined text-error text-[18px] mt-0.5">error</span>
              <p className="text-body-sm text-error">{googleError}</p>
            </div>
          )}

          {/* ── Google button ── */}
          <button
            id="google-login-btn"
            onClick={handleGoogleLogin}
            disabled={isAnyLoading}
            className="w-full h-12 rounded-xl border border-outline-variant flex items-center justify-center gap-3 font-medium text-body-md text-on-surface bg-surface-container hover:bg-surface-container-high transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
          >
            {googleLoading ? (
              <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
            ) : (
              <>
                {/* Google icon SVG */}
                <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                  <path d="M47.5 24.6c0-1.6-.1-3.2-.4-4.7H24v9h13.1c-.6 3-2.4 5.6-5 7.3v6h8c4.7-4.3 7.4-10.7 7.4-17.6z" fill="#4285F4"/>
                  <path d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-8-6c-2.1 1.4-4.8 2.3-7.9 2.3-6.1 0-11.2-4.1-13-9.6H2.8v6.2C6.8 42.6 14.9 48 24 48z" fill="#34A853"/>
                  <path d="M11 28.9c-.5-1.4-.7-2.9-.7-4.9s.3-3.5.7-4.9v-6.2H2.8C1 16.6 0 20.2 0 24s1 7.4 2.8 10.1L11 28.9z" fill="#FBBC05"/>
                  <path d="M24 9.5c3.4 0 6.5 1.2 8.9 3.5l6.7-6.7C35.9 2.4 30.5 0 24 0 14.9 0 6.8 5.4 2.8 13.9l8.2 6.2C12.8 13.6 17.9 9.5 24 9.5z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <p className="text-center text-body-sm text-on-surface-variant mt-5">
            Not a merchant yet?{' '}
            <a href="#" className="text-primary font-semibold hover:underline">Contact support to get onboarded</a>
          </p>
        </div>

        <p className="text-center text-label-sm text-on-surface-variant mt-6 opacity-60">
          Secure login powered by Google · Metro Cardz
        </p>
      </div>
    </div>
  );
}
