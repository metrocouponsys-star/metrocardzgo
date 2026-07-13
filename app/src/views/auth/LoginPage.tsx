'use client';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { supabase } from '../../lib/supabaseClient';

const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  // Handle the OAuth callback — Supabase redirects back here with a session
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.access_token) {
        setLoading(true);
        setError('');
        try {
          // Exchange Supabase token for our app JWT + user profile
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
          // Store refresh token
          if (data.refresh_token) {
            localStorage.setItem('metro-cardz-refresh', data.refresh_token);
          }
          setAuth(data.user, data.access_token);
          addToast('success', `Welcome, ${data.user.name}! 👋`);

          if (data.user.role === 'super_admin') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Login failed';
          setError(msg === 'User not found'
            ? 'Your Google account is not registered on Metro Cardz. Contact support to get onboarded.'
            : msg
          );
          // Sign out from Supabase so user can try again
          await supabase.auth.signOut();
        } finally {
          setLoading(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [setAuth, addToast, navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin + '/login' : undefined,
      },
    });
    if (oauthError) {
      setError('Google login failed. Please try again.');
      setLoading(false);
    }
    // If no error, browser redirects to Google — loading stays true
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-primary-fixed opacity-20 blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-secondary-fixed opacity-20 blur-[120px]" />
      </div>

      <div className="w-full max-w-[400px] animate-slide-up">
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
          <div className="mb-7 text-center">
            <h2 className="text-headline-lg-mobile font-headline-lg-mobile text-on-surface mb-1">
              Welcome Back
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Sign in to your Metro Cardz merchant account.
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-error-container rounded-xl p-3 border border-error/20 flex items-start gap-2">
              <span className="material-symbols-outlined text-error text-[18px] mt-0.5">error</span>
              <p className="text-body-sm text-error">{error}</p>
            </div>
          )}

          <button
            id="google-login-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-14 rounded-xl border border-outline-variant flex items-center justify-center gap-3 font-medium text-body-lg text-on-surface bg-surface-container hover:bg-surface-container-high transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
            ) : (
              <>
                {/* Google icon SVG */}
                <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
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
