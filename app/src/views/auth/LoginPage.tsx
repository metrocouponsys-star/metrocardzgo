'use client';
import React, { useState, useEffect } from 'react';
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
  const [mounted, setMounted] = useState(false);

  const { setAuth } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ═══════════════════════════════════════════════════════════════════════
          Left Panel — Brand Showcase (desktop only)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-sidebar overflow-hidden items-center justify-center">
        {/* Gradient mesh background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[60%] h-[60%] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #FF6B35 0%, transparent 70%)', filter: 'blur(80px)' }} />
          <div className="absolute bottom-0 left-0 w-[50%] h-[50%] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #00D4AA 0%, transparent 70%)', filter: 'blur(80px)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)', filter: 'blur(60px)' }} />
        </div>

        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        {/* Content */}
        <div className={`relative z-10 max-w-md px-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Logo */}
          <div className="mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center shadow-lg shadow-accent/30 mb-6">
              <span className="material-symbols-outlined text-white text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
            </div>
            <h2 className="text-4xl font-extrabold text-white font-display leading-tight tracking-tight mb-3">
              Metro Cardz
            </h2>
            <p className="text-lg text-white/50 leading-relaxed">
              The complete loyalty & membership platform for modern businesses across India.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4">
            {[
              { icon: 'qr_code_scanner', title: 'Scan & Reward', desc: 'Instant QR-based member verification' },
              { icon: 'trending_up', title: 'Real-time Analytics', desc: 'Track redemptions, growth & engagement' },
              { icon: 'campaign', title: 'Smart Campaigns', desc: 'Birthday, anniversary & custom automations' },
            ].map((f, i) => (
              <div
                key={f.icon}
                className={`flex items-start gap-4 p-4 rounded-xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'}`}
                style={{ transitionDelay: `${300 + i * 100}ms` }}
              >
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-accent text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
                </div>
                <div>
                  <p className="text-[14px] font-bold text-white">{f.title}</p>
                  <p className="text-[13px] text-white/40">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust stats */}
          <div className="mt-10 flex gap-8">
            {[
              { num: '500+', label: 'Businesses' },
              { num: '10K+', label: 'Members' },
              { num: '99.9%', label: 'Uptime' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="font-display font-extrabold text-xl text-accent">{s.num}</p>
                <p className="text-white/30 text-[11px] tracking-wider uppercase mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          Right Panel — Login Form
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col justify-center items-center px-5 py-12 bg-surface relative">
        {/* Mobile gradient background */}
        <div className="lg:hidden fixed top-0 left-0 w-full h-[200px] -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-[40%] -right-[20%] w-[60%] h-[200%] rounded-full bg-accent/[0.06] blur-[60px]" />
          <div className="absolute -top-[30%] -left-[10%] w-[40%] h-[150%] rounded-full bg-secondary/[0.04] blur-[60px]" />
        </div>

        <div className={`w-full max-w-[420px] transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent-hover text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent/20">
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
            </div>
            <h1 className="text-[22px] font-extrabold text-on-surface font-display">Metro Cardz</h1>
            <p className="text-body-sm text-on-surface-variant mt-1">Merchant Loyalty Platform</p>
          </div>

          {/* Welcome text */}
          <div className="mb-8">
            <h1 className="text-headline-lg font-display text-on-surface mb-2">
              Welcome back
            </h1>
            <p className="text-body-lg text-on-surface-variant">
              Sign in to your merchant or staff account to continue.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl p-7 shadow-card border border-outline-variant/40">
            <form onSubmit={handleLogin} noValidate>
              {/* Email field */}
              <div className="mb-4">
                <label htmlFor="login-email" className="form-label">
                  Email or Mobile Number
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px] pointer-events-none">
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
                    className="input-field pl-11 pr-4"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="mb-5">
                <label htmlFor="login-password" className="form-label">
                  Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px] pointer-events-none">
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
                    className="input-field pl-11 pr-12"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface transition-colors p-1 rounded-lg hover:bg-surface-container"
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
                <div className="mb-4 bg-error-container rounded-xl p-3.5 border border-error/15 flex items-start gap-2.5 animate-shake">
                  <span className="material-symbols-outlined text-error text-[18px] mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                  <p className="text-[13px] text-on-error-container font-medium">{error}</p>
                </div>
              )}

              {/* Sign In button */}
              <button
                id="email-login-btn"
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="w-full h-12 rounded-xl btn-primary text-[15px] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                ) : (
                  <>
                    Sign In
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-[13px] text-on-surface-variant mt-5">
              Not a merchant yet?{' '}
              <a href="/#contact" className="text-accent font-semibold hover:underline">Get started →</a>
            </p>
          </div>

          <p className="text-center text-[11px] text-on-surface-variant mt-6 opacity-50">
            © {new Date().getFullYear()} Metro Cardz · Secure Login
          </p>
        </div>
      </div>
    </div>
  );
}
