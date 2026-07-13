import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import * as api from '../../api/client';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const { setAuth } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const startCountdown = () => {
    setCountdown(30);
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const sendOtp = async () => {
    if (phone.length < 10) { setError('Please enter a valid 10-digit mobile number'); return; }
    setLoading(true);
    setError('');
    try {
      await new Promise(r => setTimeout(r, 800));
      setOtpSent(true);
      startCountdown();
      addToast('success', `OTP sent to +91 ${phone}`);
    } catch {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) { setError('Please enter a 6-digit OTP'); return; }
    setLoading(true);
    setError('');
    try {
      const result = await api.verifyOtp(phone, otp);
      setAuth(result.user, result.token);
      addToast('success', `Welcome back, ${result.user.name}!`);
      if (result.user.role === 'super_admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (e: any) {
      setError(e.message === 'Invalid OTP' ? 'Invalid OTP. Please try again.' : 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background decorations */}
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
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/30 shadow-tonal">
          <div className="mb-6">
            <h2 className="text-headline-lg-mobile font-headline-lg-mobile text-on-surface mb-1">
              {otpSent ? 'Verify OTP' : 'Login to Metro Cardz'}
            </h2>
            <p className="text-body-md text-on-surface-variant">
              {otpSent
                ? `Enter the 6-digit OTP sent to +91 ${phone}`
                : 'Enter your registered mobile number to continue.'
              }
            </p>
          </div>

          {!otpSent ? (
            <div className="space-y-4">
              <div>
                <label className="form-label" htmlFor="phone">Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-body-lg border-r border-outline-variant pr-3">+91</span>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                    className="input-field pl-[72px]"
                    placeholder="98765 43210"
                    maxLength={10}
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && sendOtp()}
                  />
                </div>
              </div>
              {error && (
                <p className="text-error text-body-md flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  {error}
                </p>
              )}
              <button
                onClick={sendOtp}
                disabled={loading || phone.length < 10}
                className="btn-primary w-full h-12 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <>Send OTP<span className="material-symbols-outlined text-[18px]">arrow_forward</span></>
                )}
              </button>
              <p className="text-center text-body-md text-on-surface-variant">
                New merchant?{' '}
                <a href="#" className="text-primary font-bold hover:underline">Contact support to get onboarded</a>
              </p>
              {/* Demo Hint */}
              <div className="bg-surface-container rounded-xl p-3 border border-outline-variant/20">
                <p className="text-label-sm text-on-surface-variant font-medium mb-1">🧪 Demo Credentials</p>
                <p className="text-label-sm text-on-surface-variant">Owner: any number (OTP: 123456)</p>
                <p className="text-label-sm text-on-surface-variant">Super Admin: 9000000000</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="form-label">6-Digit OTP</label>
                <OtpInput value={otp} onChange={setOtp} />
              </div>
              {error && (
                <p className="text-error text-body-md flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  {error}
                </p>
              )}
              <button
                onClick={verifyOtp}
                disabled={loading || otp.length < 6}
                className="btn-primary w-full h-12 flex items-center justify-center gap-2"
              >
                {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : 'Verify & Login'}
              </button>
              <div className="flex items-center justify-between text-body-md">
                <button
                  onClick={() => { setOtpSent(false); setOtp(''); setError(''); }}
                  className="text-on-surface-variant hover:text-on-surface"
                >
                  ← Change number
                </button>
                <button
                  onClick={sendOtp}
                  disabled={countdown > 0}
                  className={`text-primary font-bold hover:underline ${countdown > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const handleInput = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = d;
    onChange(next.join(''));
    if (d && i < 5) {
      const el = document.getElementById(`otp-${i + 1}`);
      el?.focus();
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus();
    }
  };

  return (
    <div className="flex gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleInput(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          autoFocus={i === 0}
          className="w-full h-12 text-center text-headline-md font-headline-md bg-surface border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      ))}
    </div>
  );
}
