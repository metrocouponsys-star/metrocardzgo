import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { ConfirmModal, Modal } from '../../components/ui/Modal';
import { StatCard } from '../../components/ui/StatCard';
import type { Merchant } from '../../types';
import * as api from '../../api';
import { safeFormat } from '../../lib/dateUtils';

type FilterTab = 'all' | 'pending' | 'approved' | 'suspended' | 'rejected';
type ViewMode = 'table' | 'cards';

interface TabItem {
  id: FilterTab;
  label: string;
  count: number;
  alert?: boolean;
}

const TIER_STYLES: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  starter: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: 'star',
  },
  pro: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: 'verified',
  },
  professional: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: 'verified',
  },
  enterprise: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: 'workspace_premium',
  },
  gold: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: 'crown',
  },
  silver: {
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-300',
    icon: 'shield',
  },
  bronze: {
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
    icon: 'award_star',
  },
};

/** Normalize merchant data across camelCase / snake_case responses */
function normalizeMerchant(m: any) {
  const businessName = m.business_name || m.businessName || 'Unnamed Merchant';
  const category = m.category || 'General';
  const planTier = m.plan_tier || m.planTier || 'Starter';
  const whatsappNumber = m.whatsapp_number || m.whatsappNumber || '';
  const logoUrl = m.logo_url || m.logoUrl || null;
  const address = m.address || '';
  const status = (m.status || 'active') as 'active' | 'suspended';
  const approvalStatus = (m.approval_status || m.approvalStatus || 'approved') as 'pending' | 'approved' | 'rejected';
  const memberCount = Number(m._count?.members ?? m.member_count ?? 0);
  const referralBonusPoints = Number(m.referral_bonus_points ?? m.referralBonusPoints ?? 50);
  const createdAt = m.created_at || m.createdAt || new Date().toISOString();

  return {
    id: String(m.id),
    businessName,
    category,
    planTier,
    whatsappNumber,
    logoUrl,
    address,
    status,
    approvalStatus,
    memberCount,
    referralBonusPoints,
    createdAt,
    raw: m,
  };
}

export default function MerchantManagementPage() {
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const { impersonate } = useAuthStore();

  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  // Suspend action state
  const [suspendTarget, setSuspendTarget] = useState<Merchant | null>(null);
  const [suspending, setSuspending] = useState(false);

  // Edit action state
  const [editTarget, setEditTarget] = useState<Merchant | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    business_name: '',
    category: '',
    plan_tier: 'Starter',
    whatsapp_number: '',
    address: '',
    referral_bonus_points: 50,
  });

  // Delete action state
  const [deleteTarget, setDeleteTarget] = useState<Merchant | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actioningMerchant, setActioningMerchant] = useState<string | null>(null);

  // Change password action state
  const [passwordTarget, setPasswordTarget] = useState<Merchant | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Create action state
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [planTier, setPlanTier] = useState('Starter');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [address, setAddress] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');

  const fetchMerchants = async () => {
    setLoading(true);
    try {
      const data = await api.getAllMerchants();
      setMerchants(Array.isArray(data) ? data : []);
    } catch {
      addToast('error', 'Failed to load merchants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  const normalizedList = useMemo(() => {
    return merchants.map(normalizeMerchant);
  }, [merchants]);

  // Aggregate KPI metrics
  const stats = useMemo(() => {
    const total = normalizedList.length;
    const active = normalizedList.filter(m => m.status === 'active' && m.approvalStatus === 'approved').length;
    const pending = normalizedList.filter(m => m.approvalStatus === 'pending').length;
    const suspended = normalizedList.filter(m => m.status === 'suspended').length;
    const rejected = normalizedList.filter(m => m.approvalStatus === 'rejected').length;
    const totalMembers = normalizedList.reduce((acc, m) => acc + m.memberCount, 0);

    return { total, active, pending, suspended, rejected, totalMembers };
  }, [normalizedList]);

  // Filtered merchants based on active tab and search query
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const qDigits = searchQuery.replace(/\D/g, '');

    return normalizedList.filter(m => {
      const matchesSearch =
        !q ||
        m.businessName.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.address.toLowerCase().includes(q) ||
        (qDigits && m.whatsappNumber.replace(/\D/g, '').includes(qDigits));

      if (!matchesSearch) return false;

      if (activeTab === 'all') return true;
      if (activeTab === 'pending') return m.approvalStatus === 'pending';
      if (activeTab === 'approved') return m.approvalStatus === 'approved';
      if (activeTab === 'suspended') return m.status === 'suspended';
      if (activeTab === 'rejected') return m.approvalStatus === 'rejected';
      return true;
    });
  }, [normalizedList, activeTab, searchQuery]);

  const tabs: TabItem[] = useMemo(() => [
    { id: 'all', label: 'All', count: stats.total },
    { id: 'pending', label: 'Pending Review', count: stats.pending, alert: stats.pending > 0 },
    { id: 'approved', label: 'Active Approved', count: stats.active },
    { id: 'suspended', label: 'Suspended', count: stats.suspended },
    { id: 'rejected', label: 'Rejected', count: stats.rejected },
  ], [stats]);

  const handleCreateMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !category.trim() || !ownerName.trim() || !ownerPhone.trim()) {
      addToast('error', 'Please fill in all required fields');
      return;
    }
    setCreateLoading(true);
    try {
      const newMerchant = await api.createMerchant({
        business_name: businessName.trim(),
        category: category.trim(),
        plan_tier: planTier,
        whatsapp_number: whatsappNumber.trim(),
        address: address.trim() || undefined,
        owner_name: ownerName.trim(),
        owner_phone: ownerPhone.trim().replace(/\s+/g, ''),
        owner_email: ownerEmail.trim() || undefined,
      });
      setMerchants(prev => [newMerchant, ...prev]);
      addToast('success', `${businessName} successfully created and registered.`);
      setCreateOpen(false);
      setBusinessName('');
      setCategory('');
      setPlanTier('Starter');
      setWhatsappNumber('');
      setAddress('');
      setOwnerName('');
      setOwnerPhone('');
      setOwnerEmail('');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to create merchant');
    } finally {
      setCreateLoading(false);
    }
  };

  const toggleSuspend = async () => {
    if (!suspendTarget) return;
    setSuspending(true);
    try {
      const newStatus = suspendTarget.status === 'active' ? 'suspended' : 'active';
      const updated = await api.updateMerchantStatus(suspendTarget.id, newStatus);
      setMerchants(m => m.map(x => (x.id === updated.id ? { ...x, ...updated, status: newStatus } : x)));
      addToast(
        'success',
        newStatus === 'suspended'
          ? `${suspendTarget.business_name} suspended — merchant logins disabled.`
          : `${suspendTarget.business_name} is active again.`
      );
      setSuspendTarget(null);
    } catch {
      addToast('error', 'Failed to update merchant status');
    } finally {
      setSuspending(false);
    }
  };

  const handleApprove = async (mId: string) => {
    setActioningMerchant(mId);
    try {
      const updated = await api.approveMerchant(mId);
      setMerchants(m => m.map(x => (x.id === mId ? { ...x, ...updated, approval_status: 'approved' } : x)));
      addToast('success', 'Merchant approved successfully');
    } catch (e: any) {
      addToast('error', e.message || 'Approval failed');
    } finally {
      setActioningMerchant(null);
    }
  };

  const handleReject = async (mId: string) => {
    setActioningMerchant(mId);
    try {
      const updated = await api.rejectMerchant(mId);
      setMerchants(m => m.map(x => (x.id === mId ? { ...x, ...updated, approval_status: 'rejected' } : x)));
      addToast('success', 'Merchant application rejected');
    } catch (e: any) {
      addToast('error', e.message || 'Action failed');
    } finally {
      setActioningMerchant(null);
    }
  };

  const openEditModal = (merchant: any) => {
    setEditForm({
      business_name: merchant.businessName || merchant.business_name || '',
      category: merchant.category || '',
      plan_tier: merchant.planTier || merchant.plan_tier || 'Starter',
      whatsapp_number: merchant.whatsappNumber || merchant.whatsapp_number || '',
      address: merchant.address || '',
      referral_bonus_points: Number(merchant.referralBonusPoints ?? merchant.referral_bonus_points ?? 50),
    });
    setEditTarget(merchant.raw || merchant);
  };

  const handleEditMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    if (!editForm.business_name.trim()) {
      addToast('error', 'Business name is required');
      return;
    }
    setEditLoading(true);
    try {
      const updated = await api.updateMerchant(editTarget.id, editForm);
      setMerchants(m => m.map(x => (x.id === updated.id ? { ...x, ...updated, ...editForm } : x)));
      addToast('success', `${editForm.business_name} updated successfully`);
      setEditTarget(null);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update merchant');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteMerchant = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.deleteMerchant(deleteTarget.id);
      setMerchants(m => m.filter(x => x.id !== deleteTarget.id));
      addToast('success', `${deleteTarget.business_name} permanently removed`);
      setDeleteTarget(null);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete merchant');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTarget || !newPassword.trim()) return;
    if (newPassword.trim().length < 4) {
      addToast('error', 'Password must be at least 4 characters');
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await api.changeMerchantPassword(passwordTarget.id, newPassword.trim());
      addToast('success', res.message || `Password for ${passwordTarget.business_name || (passwordTarget as any).businessName || 'merchant'} updated successfully`);
      setPasswordTarget(null);
      setNewPassword('');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update merchant password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const copyPhoneNumber = (phone: string, id: string) => {
    if (!phone) return;
    navigator.clipboard?.writeText(phone);
    setCopiedPhoneId(id);
    addToast('info', 'Phone number copied to clipboard');
    setTimeout(() => setCopiedPhoneId(null), 2500);
  };

  const handleImpersonate = (mId: string, name: string) => {
    impersonate(mId, name);
    addToast('success', `Logged in as ${name}`);
    navigate('/portal/dashboard');
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in text-on-surface">
      {/* ── Page Header & Quick Add ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-outline-variant/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20">
              Admin Platform
            </span>
            <span className="text-xs text-on-surface-variant font-medium">
              {stats.total} Merchants Registered
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-3xl">storefront</span>
            Merchant Directory
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Supervise registered businesses, issue card inventory, manage subscriptions, and audit access.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={fetchMerchants}
            disabled={loading}
            title="Refresh merchant data"
            className="h-10 px-3 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container transition-all flex items-center justify-center text-on-surface-variant hover:text-on-surface shadow-xs active:scale-95 disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[20px] ${loading ? 'animate-spin text-primary' : ''}`}>
              refresh
            </span>
          </button>

          <button
            onClick={() => setCreateOpen(true)}
            className="h-10 px-4 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">add_business</span>
            <span>Add Merchant</span>
          </button>
        </div>
      </div>

      {/* ── KPI Stat Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Merchants"
          value={stats.total}
          icon="storefront"
          variant="navy"
          className="cursor-pointer hover:border-primary/40 transition-all shadow-xs"
          onClick={() => setActiveTab('all')}
        />

        <StatCard
          label="Active & Operational"
          value={stats.active}
          icon="verified"
          variant="teal"
          className="cursor-pointer hover:border-secondary/50 transition-all shadow-xs"
          onClick={() => setActiveTab('approved')}
        />

        <div
          onClick={() => setActiveTab('pending')}
          className={`stat-card cursor-pointer transition-all shadow-xs rounded-2xl p-4 sm:p-5 border flex flex-col justify-between ${
            stats.pending > 0
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20'
              : 'bg-surface border-outline-variant hover:border-amber-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              Pending Approval
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">pending_actions</span>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-900">{stats.pending}</span>
            {stats.pending > 0 && (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-200/70 px-2 py-0.5 rounded-full animate-pulse">
                Needs Review
              </span>
            )}
          </div>
        </div>

        <StatCard
          label="Enrolled Members"
          value={stats.totalMembers.toLocaleString()}
          icon="group"
          variant="accent"
          className="shadow-xs"
        />
      </div>

      {/* ── Search, Tabs & View Controls ───────────────────────────────────── */}
      <div className="bg-surface-bright rounded-2xl border border-outline-variant/60 shadow-xs p-3 sm:p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === tab.id
                      ? 'bg-white/25 text-white'
                      : tab.alert
                      ? 'bg-amber-200 text-amber-900 font-extrabold'
                      : 'bg-outline-variant/60 text-on-surface-variant'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search + View Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search name, phone, city, category..."
                className="w-full h-10 pl-9 pr-8 text-xs sm:text-sm rounded-xl border border-outline-variant bg-surface focus:bg-surface-bright focus:border-primary focus:outline-none transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* View switcher: hidden on small mobile where card view is native */}
            <div className="hidden md:flex items-center rounded-xl border border-outline-variant bg-surface p-0.5">
              <button
                onClick={() => setViewMode('table')}
                title="Table View (Full Screen Laptop)"
                className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
                  viewMode === 'table' ? 'bg-primary text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">table_rows</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                title="Card Grid View"
                className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
                  viewMode === 'cards' ? 'bg-primary text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content View: Mobile Cards & Desktop Table ──────────────────────── */}
      {loading ? (
        <div className="bg-surface-bright rounded-2xl border border-outline-variant/60 p-12 text-center space-y-4 shadow-xs">
          <div className="inline-block p-4 rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span>
          </div>
          <p className="text-sm font-semibold text-on-surface">Loading merchant accounts...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-bright rounded-2xl border border-outline-variant/60 p-12 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-3xl">storefront</span>
          </div>
          <h3 className="text-base font-bold text-on-surface">No merchants match your criteria</h3>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-md mx-auto">
            {searchQuery
              ? `No businesses found matching "${searchQuery}". Try searching for another name, category, or clear filters.`
              : 'There are currently no merchants in this category.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
              }}
              className="mt-2 text-xs font-bold text-primary hover:underline"
            >
              Clear filters and show all
            </button>
          )}
        </div>
      ) : (
        <>
          {/* 1. Mobile Cards Feed (< md breakpoint or when viewMode === 'cards') */}
          <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 ${viewMode === 'table' ? 'md:hidden' : ''}`}>
            {filtered.map(m => {
              const tier = TIER_STYLES[m.planTier.toLowerCase()] || TIER_STYLES.starter;
              const isActioning = actioningMerchant === m.id;

              return (
                <div
                  key={m.id}
                  className="bg-surface-bright rounded-2xl border border-outline-variant/70 shadow-xs hover:shadow-md transition-all p-4 flex flex-col justify-between space-y-3 relative overflow-hidden"
                >
                  {/* Status Banner */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {m.logoUrl ? (
                        <img
                          src={m.logoUrl}
                          alt={m.businessName}
                          className="w-12 h-12 rounded-xl object-contain border border-outline-variant bg-surface p-1 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-container text-white font-extrabold text-xl flex items-center justify-center shrink-0 shadow-xs">
                          {m.businessName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <h3 className="font-extrabold text-sm sm:text-base text-on-surface truncate" title={m.businessName}>
                          {m.businessName}
                        </h3>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className="text-[11px] font-semibold text-on-surface-variant bg-slate-100 px-2 py-0.5 rounded-md">
                            {m.category}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${tier.bg} ${tier.text} ${tier.border} flex items-center gap-1`}>
                            <span className="material-symbols-outlined text-[11px]">{tier.icon}</span>
                            {m.planTier}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          m.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                        }`}
                      >
                        {m.status}
                      </span>
                      {m.approvalStatus !== 'approved' && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            m.approvalStatus === 'pending'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-red-100 text-red-900 border-red-300'
                          }`}
                        >
                          {m.approvalStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info Rows */}
                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-outline-variant/30 text-on-surface-variant">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Enrolled Members</span>
                      <span className="font-extrabold text-sm text-primary flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">group</span>
                        {m.memberCount.toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Registered On</span>
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                        {safeFormat(m.createdAt, 'dd MMM yyyy', '—')}
                      </span>
                    </div>

                    {m.whatsappNumber && (
                      <div className="col-span-2 flex items-center justify-between pt-1">
                        <a
                          href={`https://wa.me/${m.whatsappNumber.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-semibold"
                        >
                          <span className="material-symbols-outlined text-sm text-emerald-600">chat</span>
                          {m.whatsappNumber}
                        </a>
                        <button
                          onClick={() => copyPhoneNumber(m.whatsappNumber, m.id)}
                          className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-0.5"
                        >
                          <span className="material-symbols-outlined text-xs">
                            {copiedPhoneId === m.id ? 'check' : 'content_copy'}
                          </span>
                          <span>{copiedPhoneId === m.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}

                    {m.address && (
                      <div className="col-span-2 text-[11px] text-slate-500 flex items-start gap-1 truncate" title={m.address}>
                        <span className="material-symbols-outlined text-xs text-slate-400 shrink-0 mt-0.5">location_on</span>
                        <span className="truncate">{m.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-1">
                    {m.approvalStatus === 'pending' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleApprove(m.id)}
                          disabled={isActioning}
                          className="h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[16px]">check</span>
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(m.id)}
                          disabled={isActioning}
                          className="h-9 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Allocate Cards */}
                        <button
                          onClick={() => navigate(`/portal/admin/cards?merchant=${m.id}`)}
                          className="flex-1 h-9 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
                          title="Allocate Physical Cards to this Merchant"
                        >
                          <span className="material-symbols-outlined text-[16px]">credit_card</span>
                          <span>Cards</span>
                        </button>

                        {/* Impersonate */}
                        {m.status === 'active' && (
                          <button
                            onClick={() => handleImpersonate(m.id, m.businessName)}
                            className="flex-1 h-9 rounded-xl bg-primary hover:bg-primary-dark text-on-primary font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-xs active:scale-95"
                            title="Log in to merchant portal as owner"
                          >
                            <span className="material-symbols-outlined text-[16px]">login</span>
                            <span>Portal</span>
                          </button>
                        )}

                        {/* Edit */}
                        <button
                          onClick={() => openEditModal(m)}
                          className="w-9 h-9 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center transition-all shrink-0"
                          title="Edit Details"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>

                        {/* Change Password */}
                        <button
                          onClick={() => {
                            setPasswordTarget(m.raw);
                            setNewPassword('');
                            setShowPassword(false);
                          }}
                          className="w-9 h-9 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 flex items-center justify-center transition-all shrink-0"
                          title="Change Merchant Password"
                        >
                          <span className="material-symbols-outlined text-[18px]">key</span>
                        </button>

                        {/* Suspend / Reactivate */}
                        <button
                          onClick={() => setSuspendTarget(m.raw)}
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
                            m.status === 'active'
                              ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          }`}
                          title={m.status === 'active' ? 'Suspend Merchant' : 'Reactivate Merchant'}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {m.status === 'active' ? 'block' : 'check_circle'}
                          </span>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteTarget(m.raw)}
                          className="w-9 h-9 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center transition-all shrink-0"
                          title="Delete Merchant"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. Desktop High-Density Table View (md+ breakpoint when viewMode === 'table') */}
          <div className={`hidden ${viewMode === 'table' ? 'md:block' : ''} bg-surface-bright rounded-2xl border border-outline-variant/60 shadow-xs overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/40 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant select-none">
                    <th className="py-3.5 px-4">Merchant & Business Details</th>
                    <th className="py-3.5 px-4">Category & Tier</th>
                    <th className="py-3.5 px-4">WhatsApp Contact</th>
                    <th className="py-3.5 px-4 text-center">Members</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Registered</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filtered.map(m => {
                    const tier = TIER_STYLES[m.planTier.toLowerCase()] || TIER_STYLES.starter;
                    const isActioning = actioningMerchant === m.id;

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors group">
                        {/* Business Name & Logo */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {m.logoUrl ? (
                              <img
                                src={m.logoUrl}
                                alt={m.businessName}
                                className="w-10 h-10 rounded-xl object-contain border border-outline-variant bg-surface p-0.5 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-xs">
                                {m.businessName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0 max-w-[220px]">
                              <p className="font-extrabold text-sm text-on-surface truncate" title={m.businessName}>
                                {m.businessName}
                              </p>
                              {m.address ? (
                                <p className="text-xs text-slate-500 truncate" title={m.address}>
                                  {m.address}
                                </p>
                              ) : (
                                <span className="text-[11px] text-slate-400">No address recorded</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category & Tier */}
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <span className="font-semibold text-xs text-slate-800 block">
                              {m.category}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${tier.bg} ${tier.text} ${tier.border}`}>
                              <span className="material-symbols-outlined text-[11px]">{tier.icon}</span>
                              {m.planTier}
                            </span>
                          </div>
                        </td>

                        {/* WhatsApp Contact */}
                        <td className="py-3 px-4">
                          {m.whatsappNumber ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={`https://wa.me/${m.whatsappNumber.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-sm text-emerald-600">chat</span>
                                {m.whatsappNumber}
                              </a>
                              <button
                                onClick={() => copyPhoneNumber(m.whatsappNumber, m.id)}
                                title="Copy Phone Number"
                                className="text-slate-400 hover:text-slate-700"
                              >
                                <span className="material-symbols-outlined text-xs">
                                  {copiedPhoneId === m.id ? 'check' : 'content_copy'}
                                </span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        {/* Enrolled Members */}
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold text-sm text-primary px-2.5 py-1 rounded-lg bg-primary/5 border border-primary/10">
                            {m.memberCount.toLocaleString()}
                          </span>
                        </td>

                        {/* Status (Dual Badges) */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                m.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-red-50 text-red-800 border-red-200'
                              }`}
                            >
                              {m.status}
                            </span>
                            {m.approvalStatus !== 'approved' && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  m.approvalStatus === 'pending'
                                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                                    : 'bg-red-50 text-red-900 border-red-300'
                                }`}
                              >
                                {m.approvalStatus}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Registered Date */}
                        <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {safeFormat(m.createdAt, 'dd MMM yyyy', '—')}
                        </td>

                        {/* Actions Toolbar */}
                        <td className="py-3 px-4 text-right">
                          {m.approvalStatus === 'pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleApprove(m.id)}
                                disabled={isActioning}
                                className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-50"
                              >
                                <span className="material-symbols-outlined text-[15px]">check</span>
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(m.id)}
                                disabled={isActioning}
                                className="h-8 px-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-50"
                              >
                                <span className="material-symbols-outlined text-[15px]">close</span>
                                Reject
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                              {/* Allocate Cards */}
                              <button
                                onClick={() => navigate(`/portal/admin/cards?merchant=${m.id}`)}
                                className="h-8 px-2.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs flex items-center gap-1 transition-all"
                                title="Allocate Physical Cards"
                              >
                                <span className="material-symbols-outlined text-[15px]">credit_card</span>
                                <span>Allocate</span>
                              </button>

                              {/* Impersonate */}
                              {m.status === 'active' && (
                                <button
                                  onClick={() => handleImpersonate(m.id, m.businessName)}
                                  className="h-8 px-2.5 rounded-lg bg-primary hover:bg-primary-dark text-on-primary font-bold text-xs flex items-center gap-1 transition-all shadow-xs"
                                  title="Log in to merchant portal as owner"
                                >
                                  <span className="material-symbols-outlined text-[15px]">login</span>
                                  <span>Portal</span>
                                </button>
                              )}

                              {/* Edit */}
                              <button
                                onClick={() => openEditModal(m)}
                                className="w-8 h-8 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center transition-all"
                                title="Edit Details"
                              >
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                              </button>

                              {/* Change Password */}
                              <button
                                onClick={() => {
                                  setPasswordTarget(m.raw);
                                  setNewPassword('');
                                  setShowPassword(false);
                                }}
                                className="w-8 h-8 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 flex items-center justify-center transition-all"
                                title="Change Merchant Password"
                              >
                                <span className="material-symbols-outlined text-[16px]">key</span>
                              </button>

                              {/* Suspend / Reactivate */}
                              <button
                                onClick={() => setSuspendTarget(m.raw)}
                                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                                  m.status === 'active'
                                    ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                }`}
                                title={m.status === 'active' ? 'Suspend Merchant' : 'Reactivate Merchant'}
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  {m.status === 'active' ? 'block' : 'check_circle'}
                                </span>
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => setDeleteTarget(m.raw)}
                                className="w-8 h-8 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center transition-all"
                                title="Delete Merchant"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="bg-surface-container-low px-4 py-3 border-t border-outline-variant/40 flex items-center justify-between text-xs text-on-surface-variant">
              <span>
                Showing <strong className="text-on-surface">{filtered.length}</strong> of{' '}
                <strong className="text-on-surface">{stats.total}</strong> merchants
              </span>
              <span className="text-[11px] text-slate-400">Metro Cardz Platform Management</span>
            </div>
          </div>
        </>
      )}

      {/* ── Suspend / Reactivate Confirmation Modal ──────────────────────────── */}
      <ConfirmModal
        isOpen={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        onConfirm={toggleSuspend}
        title={suspendTarget?.status === 'active' ? 'Suspend Merchant Account' : 'Reactivate Merchant Account'}
        isLoading={suspending}
        danger={suspendTarget?.status === 'active'}
        confirmLabel={suspendTarget?.status === 'active' ? 'Suspend Merchant' : 'Reactivate Merchant'}
        description={
          suspendTarget?.status === 'active'
            ? `Suspending "${suspendTarget?.business_name}" will immediately disable portal login access for their owner and staff, and pause customer redemptions.`
            : `Reactivating "${suspendTarget?.business_name}" will immediately restore full portal access for the merchant and allow redemptions.`
        }
      />

      {/* ── Delete Merchant Confirmation Modal ───────────────────────────────── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => !deleteLoading && setDeleteTarget(null)}
        onConfirm={handleDeleteMerchant}
        title="Delete Merchant Account"
        isLoading={deleteLoading}
        danger={true}
        confirmLabel={deleteLoading ? 'Deleting...' : 'Yes, Delete Merchant'}
        description={
          `Are you sure you want to delete "${deleteTarget?.business_name}"? This action permanently removes the merchant account, associated member passes, and card allocations. This cannot be undone.`
        }
      />

      {/* ── Change Merchant Password Modal ────────────────────────────────────── */}
      <Modal
        isOpen={!!passwordTarget}
        onClose={() => !passwordLoading && setPasswordTarget(null)}
        title={`Change Password — ${passwordTarget?.business_name || (passwordTarget as any)?.businessName || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-amber-700 text-lg shrink-0 mt-0.5">lock_reset</span>
            <div>
              <p className="font-bold">Reset Merchant Login Access</p>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                This updates the login password for the merchant owner account. The merchant can immediately log into the portal with their phone number and this new password.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">New Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={4}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 4 chars)"
                className="input-field h-10 text-sm pr-10 w-full"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 flex items-center justify-center"
                tabIndex={-1}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
              <span>Minimum 4 characters</span>
              <button
                type="button"
                onClick={() => {
                  const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
                  setNewPassword(randomDigits);
                  setShowPassword(true);
                }}
                className="text-primary font-semibold hover:underline"
              >
                Generate 6-digit PIN
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-outline-variant/30">
            <button
              type="button"
              onClick={() => setPasswordTarget(null)}
              className="btn-secondary h-10 px-4 text-xs sm:text-sm font-semibold"
              disabled={passwordLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={passwordLoading || !newPassword.trim()}
              className="h-10 px-5 text-xs sm:text-sm font-bold flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all disabled:opacity-50"
            >
              {passwordLoading && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
              Save Password
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Merchant Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => !editLoading && setEditTarget(null)}
        title={`Edit Merchant — ${editTarget?.business_name || ''}`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleEditMerchant} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-on-surface mb-1">Business Name *</label>
              <input
                type="text"
                required
                value={editForm.business_name}
                onChange={e => setEditForm(f => ({ ...f, business_name: e.target.value }))}
                className="input-field h-10 text-sm"
                placeholder="e.g. TABS Beauty Studio"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Industry Category</label>
              <select
                value={editForm.category}
                onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                className="input-field h-10 text-sm bg-surface"
              >
                <option value="">Select category...</option>
                {[
                  'Salon',
                  'Restaurant',
                  'Retail',
                  'Gym',
                  'Healthcare',
                  'Groceries',
                  'Jewellery',
                  'JEWELLERY',
                  'Pharmacy',
                  'Electronics',
                  'Automobile',
                  'Dental',
                  'Footwear',
                  'Optician',
                  'Beauty Studio',
                  'Boutique',
                  'Other',
                ].map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Plan Tier</label>
              <select
                value={editForm.plan_tier}
                onChange={e => setEditForm(f => ({ ...f, plan_tier: e.target.value }))}
                className="input-field h-10 text-sm bg-surface"
              >
                <option value="Starter">Starter</option>
                <option value="Pro">Pro</option>
                <option value="Professional">Professional</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">WhatsApp Contact Phone</label>
              <input
                type="tel"
                value={editForm.whatsapp_number}
                onChange={e => setEditForm(f => ({ ...f, whatsapp_number: e.target.value }))}
                className="input-field h-10 text-sm"
                placeholder="e.g. 919876543210"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Referral Bonus Points</label>
              <input
                type="number"
                min={0}
                max={10000}
                value={editForm.referral_bonus_points}
                onChange={e => setEditForm(f => ({ ...f, referral_bonus_points: Number(e.target.value) }))}
                className="input-field h-10 text-sm"
                placeholder="50"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-on-surface mb-1">Store Address / Location</label>
              <input
                type="text"
                value={editForm.address}
                onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                className="input-field h-10 text-sm"
                placeholder="e.g. Shop 21, Auris Galleria, Link Road, Malad West"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-outline-variant/30">
            <button
              type="button"
              onClick={() => setEditTarget(null)}
              className="btn-secondary h-10 px-4 text-xs sm:text-sm font-semibold"
              disabled={editLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className="btn-primary h-10 px-5 text-xs sm:text-sm font-bold flex items-center gap-1.5"
            >
              {editLoading && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Add Merchant Modal ──────────────────────────────────────────────── */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Register New Merchant" maxWidth="max-w-xl">
        <form onSubmit={handleCreateMerchant} className="space-y-4">
          <div className="space-y-4">
            {/* Section 1: Business Details */}
            <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-3.5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                <span className="material-symbols-outlined text-[18px]">store</span>
                <span>Business Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-on-surface mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="e.g. Royal Bridal Boutique"
                    className="input-field h-10 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="e.g. Salon, Jewellery"
                    className="input-field h-10 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Plan Tier *</label>
                  <select
                    value={planTier}
                    onChange={e => setPlanTier(e.target.value)}
                    className="input-field h-10 text-sm bg-surface"
                  >
                    <option value="Starter">Starter</option>
                    <option value="Pro">Pro</option>
                    <option value="Professional">Professional</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    value={whatsappNumber}
                    onChange={e => setWhatsappNumber(e.target.value)}
                    placeholder="e.g. 919876543210"
                    className="input-field h-10 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Store Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="e.g. City, Landmark"
                    className="input-field h-10 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Owner Account Credentials */}
            <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-3.5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                <span className="material-symbols-outlined text-[18px]">person_check</span>
                <span>Owner Login Credentials</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Owner Full Name *</label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                    placeholder="e.g. Rajesh Sharma"
                    className="input-field h-10 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Owner Mobile Phone * (Login ID)</label>
                  <input
                    type="tel"
                    required
                    value={ownerPhone}
                    onChange={e => setOwnerPhone(e.target.value)}
                    placeholder="e.g. 9876500010"
                    className="input-field h-10 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-on-surface mb-1">Owner Email (Optional)</label>
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={e => setOwnerEmail(e.target.value)}
                    placeholder="owner@business.com"
                    className="input-field h-10 text-sm"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Default temporary login password will be set to the Owner's Phone Number.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-outline-variant/30">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="btn-secondary h-10 px-4 text-xs sm:text-sm font-semibold"
              disabled={createLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="btn-primary h-10 px-6 text-xs sm:text-sm font-bold flex items-center gap-2"
            >
              {createLoading && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
              Register Merchant
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
