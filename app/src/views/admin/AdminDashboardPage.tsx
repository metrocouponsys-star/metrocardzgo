import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../../components/ui/StatCard';
import { StatCardSkeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import type { AdminDashboardStats } from '../../types';
import * as api from '../../api';
import { useToastStore } from '../../store/toastStore';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Change Password Modal ──────────────────────────────────────────────────
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [pwdSubmitting, setPwdSubmitting] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    api.getAdminStats()
      .then(s => {
        setStats(s);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleChangePwd = async () => {
    if (pwdForm.newPwd.length < 8) {
      addToast('error', 'New password must be at least 8 characters.');
      return;
    }
    if (pwdForm.newPwd !== pwdForm.confirm) {
      addToast('error', 'New password and confirm password do not match.');
      return;
    }
    setPwdSubmitting(true);
    try {
      await api.changeAdminPassword(pwdForm.current, pwdForm.newPwd);
      addToast('success', 'Password changed successfully!');
      setShowChangePwd(false);
      setPwdForm({ current: '', newPwd: '', confirm: '' });
    } catch (e: any) {
      addToast('error', e.message || 'Failed to change password.');
    } finally {
      setPwdSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowChangePwd(false);
    setPwdForm({ current: '', newPwd: '', confirm: '' });
    setShowCurrent(false);
    setShowNew(false);
  };

  return (
    <div className="px-4 md:px-10 py-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* PREMIUM Hero Banner — white + gold left border (matches merchant dashboard Option A) */}
      <div
        className="bg-white rounded-2xl shadow-card p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        style={{ borderLeft: '4px solid #B8941F' }}
      >
        <div>
          <p className="text-[11px] font-bold tracking-widest uppercase text-[#B8941F] mb-2">Super Admin</p>
          <h2 className="text-2xl md:text-3xl font-bold text-[#111111] leading-tight">Platform Overview</h2>
          <p className="text-[#6B7280] text-sm mt-1">Metro Cardz Super Admin Panel</p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-[#FBF7EA] flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[#B8941F] text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
        </div>
      </div>

      {/* Pending Approvals Warning Alert */}
      {!loading && stats && (stats.pending_approvals || 0) > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-800">
              <span className="material-symbols-outlined text-[24px]">pending_actions</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-yellow-900">Merchants Awaiting Review</h4>
              <p className="text-xs text-yellow-800">There are {stats.pending_approvals} new merchant registrations pending approval.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/merchants')}
            className="w-full sm:w-auto bg-yellow-800 hover:bg-yellow-900 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            Review Requests
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      )}

      {/* Stats Cards Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : stats ? (
          <>
            <StatCard
              label="Total Merchants"
              value={stats.total_merchants}
              icon="storefront"
              onClick={() => navigate('/admin/merchants')}
            />
            <StatCard
              label="Pending Approval"
              value={stats.pending_approvals || 0}
              icon="pending_actions"
              iconColor={(stats.pending_approvals || 0) > 0 ? "text-yellow-600" : "text-[#6B7280]"}
              onClick={() => navigate('/admin/merchants')}
            />
            <StatCard
              label="Total Members"
              value={stats.total_members.toLocaleString()}
              icon="groups"
              onClick={() => navigate('/admin/members')}
            />
            <StatCard
              label="Redemptions Today"
              value={stats.redemptions_today}
              icon="receipt_long"
              onClick={() => navigate('/admin/reports')}
            />
            <StatCard
              label="Active Merchants"
              value={`${stats.active_merchants} / ${stats.total_merchants}`}
              icon="check_circle"
              onClick={() => navigate('/admin/merchants')}
            />
          </>
        ) : null}
      </section>

      {/* Quick Action links */}
      <section className="card p-6 space-y-5">
        <h3 className="section-title">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/admin/merchants')}
            className="p-4 bg-[#F9FAFB] border border-[#F3F4F6] hover:border-[#B8941F] rounded-xl text-left transition-all group flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-[#B8941F] group-hover:bg-[#B8941F] group-hover:text-white transition-all">
              <span className="material-symbols-outlined text-[20px]">storefront</span>
            </div>
            <div>
              <p className="font-bold text-sm text-[#111111]">Manage Merchants</p>
              <p className="text-xs text-[#6B7280]">Approve, suspend, or view users.</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/cards')}
            className="p-4 bg-[#F9FAFB] border border-[#F3F4F6] hover:border-[#B8941F] rounded-xl text-left transition-all group flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-[#B8941F] group-hover:bg-[#B8941F] group-hover:text-white transition-all">
              <span className="material-symbols-outlined text-[20px]">credit_card</span>
            </div>
            <div>
              <p className="font-bold text-sm text-[#111111]">Card Inventory</p>
              <p className="text-xs text-[#6B7280]">Batch generate or allocate cards.</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/merchants')}
            className="p-4 bg-[#F9FAFB] border border-[#F3F4F6] hover:border-[#B8941F] rounded-xl text-left transition-all group flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-[#B8941F] group-hover:bg-[#B8941F] group-hover:text-white transition-all">
              <span className="material-symbols-outlined text-[20px]">pending_actions</span>
            </div>
            <div>
              <p className="font-bold text-sm text-[#111111]">Pending Requests</p>
              <p className="text-xs text-[#6B7280]">Onboard and verify registrations.</p>
            </div>
          </button>
        </div>
      </section>

      {/* Account Security */}
      <section className="card p-6">
        <h3 className="section-title mb-4">Account Security</h3>
        <div className="flex items-center justify-between gap-4 p-4 bg-[#F9FAFB] rounded-xl border border-[#F3F4F6]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-[#B8941F]">
              <span className="material-symbols-outlined text-[20px]">lock</span>
            </div>
            <div>
              <p className="font-bold text-sm text-[#111111]">Change Password</p>
              <p className="text-xs text-[#6B7280]">Update your super admin login password securely.</p>
            </div>
          </div>
          <button
            id="change-password-btn"
            onClick={() => setShowChangePwd(true)}
            className="btn-outline flex items-center gap-2 shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">key</span>
            Change Password
          </button>
        </div>
      </section>

      {/* ── Change Password Modal ── */}
      <Modal
        isOpen={showChangePwd}
        onClose={closeModal}
        title="Change Password"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#6B7280]">
            Enter your current password, then choose a new password with at least 8 characters.
          </p>

          {/* Current password */}
          <div>
            <label className="form-label" htmlFor="pwd-current">Current Password *</label>
            <div className="relative">
              <input
                id="pwd-current"
                type={showCurrent ? 'text' : 'password'}
                className="input-field pr-10"
                placeholder="Your current password"
                value={pwdForm.current}
                onChange={e => setPwdForm(f => ({ ...f, current: e.target.value }))}
                autoComplete="current-password"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111111]"
                aria-label={showCurrent ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined text-[20px]">{showCurrent ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="form-label" htmlFor="pwd-new">
              New Password * <span className="text-[#6B7280] font-normal">(min 8 chars)</span>
            </label>
            <div className="relative">
              <input
                id="pwd-new"
                type={showNew ? 'text' : 'password'}
                className="input-field pr-10"
                placeholder="New password"
                value={pwdForm.newPwd}
                onChange={e => setPwdForm(f => ({ ...f, newPwd: e.target.value }))}
                autoComplete="new-password"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111111]"
                aria-label={showNew ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined text-[20px]">{showNew ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {/* Strength bar */}
            {pwdForm.newPwd.length > 0 && (
              <div className="mt-2 flex items-center gap-1">
                {[4, 8, 12].map((threshold, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                      pwdForm.newPwd.length >= threshold
                        ? i === 0 ? 'bg-red-600' : i === 1 ? 'bg-amber-400' : 'bg-[#6B7280]'
                        : 'bg-outline-variant/30'
                    }`}
                  />
                ))}
                <span className="text-xs text-[#6B7280] ml-2 shrink-0">
                  {pwdForm.newPwd.length < 4 ? 'Too short' : pwdForm.newPwd.length < 8 ? 'Weak' : pwdForm.newPwd.length < 12 ? 'Good' : 'Strong'}
                </span>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="form-label" htmlFor="pwd-confirm">Confirm New Password *</label>
            <input
              id="pwd-confirm"
              type="password"
              className={`input-field ${pwdForm.confirm && pwdForm.confirm !== pwdForm.newPwd ? 'border-error ring-1 ring-error/30' : ''}`}
              placeholder="Re-enter new password"
              value={pwdForm.confirm}
              onChange={e => setPwdForm(f => ({ ...f, confirm: e.target.value }))}
              autoComplete="new-password"
            />
            {pwdForm.confirm && pwdForm.confirm !== pwdForm.newPwd && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                Passwords do not match.
              </p>
            )}
            {pwdForm.confirm && pwdForm.confirm === pwdForm.newPwd && pwdForm.newPwd.length >= 8 && (
              <p className="text-xs text-[#6B7280] mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Passwords match.
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
            <button
              id="confirm-change-password-btn"
              onClick={handleChangePwd}
              disabled={
                pwdSubmitting ||
                !pwdForm.current ||
                pwdForm.newPwd.length < 8 ||
                pwdForm.newPwd !== pwdForm.confirm
              }
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {pwdSubmitting
                ? <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                : <span className="material-symbols-outlined text-[16px]">lock_reset</span>
              }
              Update Password
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


