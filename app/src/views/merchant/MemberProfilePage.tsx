import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { StatusBadge, MembershipBadge } from '../../components/ui/StatusBadge';
import { OfferCard } from '../../components/ui/OfferCard';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { CardSkeleton, Skeleton } from '../../components/ui/Skeleton';
import type { Member, MemberOfferState, Redemption, LoyaltyTransaction, MembershipType, MemberStatus } from '../../types';
import * as api from '../../api';
import { invalidateContaining, cached } from '../../api/cache';
import { format, differenceInDays } from 'date-fns';

type Tab = 'offers' | 'history' | 'points' | 'rewards';

export default function MemberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const [member, setMember] = useState<(Member & { offer_states: MemberOfferState[] }) | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loyaltyHistory, setLoyaltyHistory] = useState<LoyaltyTransaction[]>([]);
  const [rewardCatalog, setRewardCatalog] = useState<any[]>([]);
  const [claimingRewardId, setClaimingRewardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('offers');

  // New features states
  const [referralLink, setReferralLink] = useState('');
  const [scratchCards, setScratchCards] = useState<any[]>([]);
  const [autoRenew, setAutoRenew] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [coupons, setCoupons] = useState<any[]>([]);

  // Google Wallet state
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletUrl, setWalletUrl] = useState<string | null>(null);

  // Redemption confirm modal
  const [redeemState, setRedeemState] = useState<{ offerStateId: string; offerTitle: string; remainingBefore: number | null; isPointsRedemption?: boolean; pointsCost?: number } | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [referralInput, setReferralInput] = useState('');
  const [applyingReferral, setApplyingReferral] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [redeemingVoucher, setRedeemingVoucher] = useState(false);

  // Purchase Modal State
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({
    amount: '',
    coupon_code: '',
    offer_state_id: '',
    note: '',
  });
  const [recordingPurchase, setRecordingPurchase] = useState(false);
  const [pointsRules, setPointsRules] = useState<any[]>([]);

  // Edit Member Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [editForm, setEditForm] = useState<{
    name: string;
    phone: string;
    email: string;
    date_of_birth: string;
    anniversary_date: string;
    membership_type_id: string;
    status: MemberStatus;
  }>({
    name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    anniversary_date: '',
    membership_type_id: '',
    status: 'active',
  });
  const [updatingMember, setUpdatingMember] = useState(false);


  const fetchMember = async (forceRefresh = false) => {
    if (!id) return;
    const mId = user?.merchant_id || '';
    const cacheKey = `member/${id}`;
    try {
      // Force-bust cache after any mutation so we always get fresh data
      if (forceRefresh) invalidateContaining(id || '');

      // Run ALL primary calls in parallel — parallelised getMember + extras
      const [m, reds, loyalty, rewards, pRules, cList] = await Promise.all([
        cached(cacheKey, () => api.getMember(mId, id)),
        cached(`member-redemptions/${id}`, () => api.getMemberRedemptions(mId, id)).catch(() => [] as any[]),
        cached(`member-loyalty/${id}`, () => api.getLoyaltyHistory(mId, id)).catch(() => [] as any[]),
        cached(`rewards/${mId}`, () => api.getRewards(mId)).catch(() => [] as any[]),
        cached(`points-rules/${mId}`, () => api.getPointsRules(mId)).catch(() => [] as any[]),
        cached(`coupons/${mId}`, () => api.getCoupons(mId)).catch(() => [] as any[]),
      ]);

      setMember(m);
      setNotes(m.notes || '');
      setAutoRenew((m as any).auto_renew || false);
      setRedemptions(reds);
      setLoyaltyHistory(loyalty);
      setRewardCatalog(rewards.filter((r: any) => r.is_active !== false));
      setPointsRules(pRules || []);
      setCoupons((cList || []).filter((c: any) => c.is_active !== false));

      // Non-critical — fire after primary data renders, no spinner needed
      api.getReferralLink(m.id).then(res => setReferralLink(res.referral_link)).catch(() => { });
      api.getScratchCards(m.id).then(setScratchCards).catch(() => { });
    } catch (e: any) {
      addToast('error', e.message || 'Member not found');
      navigate('/members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchMember();
  }, [id, user?.merchant_id]);

  const handleClaimReward = async (reward: any) => {
    if (!member) return;
    if (member.loyalty_points < reward.points_cost) {
      addToast('error', `Insufficient points. Requires ${reward.points_cost} pts`);
      return;
    }
    setClaimingRewardId(reward.id);
    try {
      await api.claimReward(reward.id, member.id);
      invalidateContaining(id || '');
      invalidateContaining('members');
      invalidateContaining('dashboard');
      addToast('success', `Reward "${reward.name}" claimed successfully!`);
      fetchMember(true);
    } catch (e: any) {
      addToast('error', e.message || 'Failed to claim reward');
    } finally {
      setClaimingRewardId(null);
    }
  };



  const handleRedeem = async () => {
    if (!redeemState || !member || !user) return;
    setRedeeming(true);
    const amt = Number(purchaseAmount) || undefined;
    try {
      if (redeemState.isPointsRedemption) {
        // Feature 1: points redemption flow
        await api.redeemPoints(user.merchant_id || '', member.id, redeemState.offerStateId, user.id, amt);
      } else {
        await api.redeemOffer(user.merchant_id || '', member.id, redeemState.offerStateId, user.id, amt);
      }
      setSuccessAnimation(true);
      setPurchaseAmount(''); // reset
      setTimeout(() => {
        setSuccessAnimation(false);
        setRedeemState(null);
        invalidateContaining(id || '');
        invalidateContaining('members');
        invalidateContaining('dashboard');
        fetchMember(true); // refresh — also updates loyalty_points balance
        addToast('success', `"${redeemState.offerTitle}" redeemed successfully!`);
      }, 1800);
    } catch (e: any) {
      setRedeemState(null);
      addToast('error', e.message || 'Redemption failed');
    } finally {
      setRedeeming(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!member || !user) return;
    setSavingNotes(true);
    try {
      await api.updateMember(user.merchant_id || '', member.id, { notes });
      addToast('success', 'Customer notes updated');
    } catch (e: any) {
      addToast('error', e.message || 'Failed to update notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleApplyReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralInput.trim() || !member || !user) return;
    setApplyingReferral(true);
    try {
      await api.applyReferral(user.merchant_id || '', member.id, referralInput.trim());
      addToast('success', 'Referral code applied successfully');
      setReferralInput('');
      invalidateContaining(id || '');
      invalidateContaining('members');
      invalidateContaining('dashboard');
      fetchMember(true);
    } catch (e: any) {
      addToast('error', e.message || 'Invalid referral code');
    } finally {
      setApplyingReferral(false);
    }
  };

  const handleRenew = async () => {
    if (!member || !user) return;
    setRenewing(true);
    try {
      await api.renewMember(user.merchant_id || '', member.id);
      addToast('success', 'Membership renewed for 1 year!');
      invalidateContaining(id || '');
      invalidateContaining('members');
      invalidateContaining('dashboard');
      fetchMember(true);
    } catch (e: any) {
      addToast('error', e.message || 'Renewal failed');
    } finally {
      setRenewing(false);
    }
  };

  const handleRedeemVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCodeInput.trim() || !member) return;
    setRedeemingVoucher(true);
    try {
      const v = await api.redeemVoucher(voucherCodeInput.trim().toUpperCase(), member.id);
      addToast('success', `Voucher ${v.code} (₹${v.value}) redeemed & credited to ${member.name}!`);
      setVoucherCodeInput('');
      invalidateContaining(id || '');
      invalidateContaining('members');
      invalidateContaining('dashboard');
      fetchMember(true);
    } catch (e: any) {
      addToast('error', e.message || 'Invalid or expired gift voucher code');
    } finally {
      setRedeemingVoucher(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    if (!member || !user) return;
    try {
      await api.updateMember(user.merchant_id || '', member.id, { auto_renew: !autoRenew } as Partial<Member>);
      setAutoRenew(!autoRenew);
      addToast('success', `Auto-renewal turned ${!autoRenew ? 'ON' : 'OFF'}`);
    } catch {
      addToast('error', 'Failed to toggle auto-renewal');
    }
  };

  const handleOpenEditModal = () => {
    if (!member) return;
    setEditForm({
      name: member.name || '',
      phone: member.phone || '',
      email: member.email || '',
      date_of_birth: member.date_of_birth || '',
      anniversary_date: member.anniversary_date || '',
      membership_type_id: member.membership_type_id || '',
      status: member.status || 'active',
    });
    api.getMembershipTypes(user?.merchant_id || '').then(setMembershipTypes).catch(() => { });
    setShowEditModal(true);
  };

  const handleSaveEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !user) return;
    setUpdatingMember(true);
    try {
      await api.updateMember(user.merchant_id || '', member.id, editForm);
      addToast('success', 'Member details updated successfully');
      setShowEditModal(false);
      invalidateContaining(id || '');
      invalidateContaining('members');
      invalidateContaining('dashboard');
      fetchMember(true);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update member details');
    } finally {
      setUpdatingMember(false);
    }
  };

  const handleRecordPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !user) return;
    const amt = Number(purchaseForm.amount);
    if (isNaN(amt) || amt <= 0) {
      addToast('error', 'Please enter a valid purchase amount');
      return;
    }
    setRecordingPurchase(true);
    try {
      const res = await api.recordPurchase(user.merchant_id || '', member.id, {
        amount: amt,
        coupon_code: purchaseForm.coupon_code.trim() || undefined,
        offer_state_id: purchaseForm.offer_state_id || undefined,
        note: purchaseForm.note.trim() || undefined,
      });
      addToast('success', res.message || `Purchase recorded! Earned ${res.points_earned} points.`);
      setShowPurchaseModal(false);
      setPurchaseForm({ amount: '', coupon_code: '', offer_state_id: '', note: '' });
      invalidateContaining(id || '');
      invalidateContaining('members');
      invalidateContaining('dashboard');
      fetchMember(true);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to record purchase');
    } finally {
      setRecordingPurchase(false);
    }
  };

  const calculateEstimatedPoints = (amountStr: string) => {
    const amt = Number(amountStr);
    if (isNaN(amt) || amt <= 0) return 0;
    let total = 0;
    const activeRules = pointsRules.filter((r: any) => r.is_active !== false);
    if (activeRules.length === 0) {
      // Default standard logic: 10% points or 1 point per 10 rupees
      return Math.floor(amt / 10);
    }
    activeRules.forEach((rule: any) => {
      if (rule.rule_type === 'per_rupee') {
        const unit = rule.spend_unit || 1;
        if (unit > 0) {
          total += Math.floor((amt / unit) * rule.points_value);
        }
      } else if (rule.rule_type === 'per_visit') {
        total += Number(rule.points_value) || 0;
      }
    });
    return total;
  };

  const handleScratch = async (cardId: string) => {
    try {
      const res = await api.revealScratchCard(cardId);
      addToast('success', `Revealed reward: ${res.reward_value} (${res.reward_type})!`);
      fetchMember();
    } catch {
      addToast('error', 'Failed to scratch card');
    }
  };

  const handleDownloadCard = async () => {
    if (!member) return;
    try {
      addToast('info', 'Generating PDF...');
      await api.downloadCardPdf(member.id);
      addToast('success', 'PDF downloaded successfully');
    } catch {
      addToast('error', 'Failed to download card PDF');
    }
  };

  const daysToExpiry = member ? differenceInDays(new Date(member.expiry_date), new Date()) : 0;

  const isOwner = user?.role === 'owner';

  if (loading) {
    return (
      <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-5xl mx-auto space-y-xl">
        <div className="prime-gradient rounded-2xl p-lg animate-pulse">
          <div className="flex gap-4">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!member) return null;

  const offerTitle = redeemState?.offerTitle;
  const offerStateBefore = member.offer_states?.find(s => s.id === redeemState?.offerStateId);
  const remainingAfter = offerStateBefore?.remaining_qty !== null && offerStateBefore?.remaining_qty !== undefined
    ? offerStateBefore.remaining_qty - 1 : null;

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate('/members')} className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface text-body-md transition-colors mb-1">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Search
      </button>

      {/* Main Grid: 2-Column on Desktop (lg:grid-cols-12), 1-Column on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Credit Card, Primary CTA, Pill Tabs, Tab Content */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Credit Card Profile Header */}
          <section className="prime-gradient rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-56 h-56 bg-white/10 rounded-full blur-3xl" />

            {/* Merchant / Restaurant Branding Header Row */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/15 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                {user?.logo_url ? (
                  <img src={user.logo_url} alt="Merchant logo" className="w-8 h-8 rounded-lg object-cover border border-white/30 shadow-xs" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <span className="material-symbols-outlined text-amber-300 text-[18px]">storefront</span>
                  </div>
                )}
                <div>
                  <h3 className="font-serif italic font-bold text-headline-sm tracking-wide text-white drop-shadow-xs leading-none">
                    {user?.merchant_name || 'Restaurant & Hospitality VIP'}
                  </h3>
                  <p className="text-[10px] text-white/70 uppercase tracking-widest mt-0.5 font-mono">Loyalty Pass</p>
                </div>
              </div>
              {member.membership_type && <MembershipBadge name={member.membership_type.name} />}
            </div>

            {/* Expiry warnings if any */}
            {member.status === 'expiring_soon' && (
              <div className="relative z-10 mb-3 bg-amber-500/25 border border-amber-400/40 rounded-xl px-3 py-1.5 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-300 text-[16px]">warning</span>
                <span className="text-xs text-amber-100 font-medium">Expires in {daysToExpiry} days — renew soon</span>
              </div>
            )}
            {member.status === 'expired' && (
              <div className="relative z-10 mb-3 bg-error/30 border border-error/40 rounded-xl px-3 py-1.5 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-200 text-[16px]">cancel</span>
                <span className="text-xs text-red-100 font-medium">Expired — redemptions disabled</span>
              </div>
            )}

            {/* Member Card Details */}
            <div className="relative z-10">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">{member.name}</h2>
                  <StatusBadge status={member.status} />
                </div>
                <p className="text-white/80 font-mono text-sm font-semibold tracking-widest uppercase mt-1">#{member.member_code}</p>
                <p className="text-white text-base sm:text-lg font-mono font-bold flex items-center gap-2 mt-1.5">
                  <span className="material-symbols-outlined text-[20px]">phone</span>
                  {member.phone}
                </p>
              </div>
            </div>

            {/* Card Stats Footer */}
            <div className="relative z-10 mt-5 pt-3 border-t border-white/15 flex justify-between items-end">
              <div>
                <p className="text-white/60 text-[11px] uppercase tracking-wider font-semibold mb-0.5">Valid Until</p>
                <p className="font-semibold text-sm">{format(new Date(member.expiry_date), 'MMM dd, yyyy')}</p>
              </div>
              <div className="text-center">
                <p className="text-white/60 text-[11px] uppercase tracking-wider font-semibold mb-0.5">Total Visits</p>
                <p className="font-bold text-base">{member.total_visits || 0}</p>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-[11px] uppercase tracking-wider font-semibold mb-0.5">Loyalty Points</p>
                <p className="text-2xl font-extrabold text-amber-300 drop-shadow-xs">{member.loyalty_points.toLocaleString()}</p>
              </div>
            </div>
          </section>

          {/* Record Purchase — single full-width CTA */}
          <button
            id="record-purchase-btn"
            onClick={() => setShowPurchaseModal(true)}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3 rounded-xl text-body-md font-semibold shadow-md active:scale-98 transition-transform"
          >
            <span className="material-symbols-outlined text-[20px]">shopping_cart_checkout</span>
            Record Purchase
          </button>

          {/* Pill Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {([
              { key: 'offers', label: 'Active Offers', icon: 'local_offer' },
              { key: 'history', label: 'Redemptions', icon: 'history' },
              { key: 'points', label: 'Points History', icon: 'stars' },
              { key: 'rewards', label: 'Rewards', icon: 'card_giftcard' },
            ] as const).map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setTab(key as Tab)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-label-md font-medium transition-all ${
                  tab === key
                    ? 'bg-primary text-on-primary shadow-sm font-semibold'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/40'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]" style={tab === key ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
                {label}
              </button>
            ))}
          </div>

          {/* Tab: Active Offers */}
          {tab === 'offers' && (
            <div className="space-y-3">
              {member.status === 'expired' && (
                <div className="p-4 bg-error-container rounded-xl border border-error/20 text-on-error-container flex items-center gap-2">
                  <span className="material-symbols-outlined">block</span>
                  Redemptions are disabled — membership expired
                </div>
              )}
              {member.offer_states && member.offer_states.length > 0 ? (
                <div className="space-y-3">
                  {member.offer_states.map(state => {
                    const offer = state.offer || {
                      id: state.offer_template_id,
                      merchant_id: '',
                      title: 'Member Offer',
                      description: 'Contact staff to redeem.',
                      offer_type: 'free_service' as const,
                      value: 1,
                      active: true,
                    };
                    const remainingVal = state.remaining_qty ?? 0;
                    const initialVal = state.initial_qty ?? remainingVal;
                    return (
                      <div key={state.id} className="card p-4 space-y-3 border border-outline-variant/30 hover:border-primary/40 transition-all shadow-xs">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-body-md text-on-surface leading-snug">{offer.title}</p>
                            {offer.description && (
                              <p className="text-label-sm text-on-surface-variant mt-0.5 line-clamp-2">{offer.description}</p>
                            )}
                            {offer.is_points_redemption && (
                              <span className="inline-flex items-center gap-1 mt-1.5 bg-amber-100 text-amber-800 font-bold text-label-xs px-2.5 py-0.5 rounded-full border border-amber-200">
                                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                                {offer.loyalty_points_cost} pts to redeem
                              </span>
                            )}
                            {offer.loyalty_points_earn && !offer.is_points_redemption && (
                              <span className="inline-flex items-center gap-1 mt-1.5 bg-green-100 text-green-800 font-bold text-label-xs px-2.5 py-0.5 rounded-full border border-green-200">
                                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                                +{offer.loyalty_points_earn} pts earn
                              </span>
                            )}
                          </div>
                          {/* High-visibility Remaining Quantity Badge */}
                          {state.remaining_qty !== null && state.remaining_qty !== undefined && (
                            <span className="flex-shrink-0 bg-primary text-on-primary font-bold text-xs px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">confirmation_number</span>
                              {remainingVal}/{initialVal} left
                            </span>
                          )}
                        </div>
                        <button
                          disabled={member.status === 'expired'}
                          onClick={() => setRedeemState({
                            offerStateId: state.id,
                            offerTitle: offer?.title || '',
                            remainingBefore: state.remaining_qty,
                            isPointsRedemption: offer?.is_points_redemption,
                            pointsCost: offer?.loyalty_points_cost ?? undefined,
                          })}
                          className="w-full btn-primary py-2 text-label-md flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-98 transition-transform"
                        >
                          <span className="material-symbols-outlined text-[16px]">redeem</span>
                          Redeem Now
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-on-surface-variant card">
                  <span className="material-symbols-outlined text-[48px] mb-2 text-primary/60">local_offer</span>
                  <p className="font-medium">No active offers for this member.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Redemption History */}
          {tab === 'history' && (
            <div className="space-y-2">
              {redemptions.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant card">
                  <span className="material-symbols-outlined text-[48px] mb-2 text-primary/60">history</span>
                  <p className="font-medium">No redemptions yet</p>
                </div>
              ) : (
                redemptions.map(r => (
                  <div key={r.id} className="card p-md flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary-container/40 flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-body-md font-bold">{r.offer?.title || (r as any).title || (r as any).offer_title || 'Offer Redeemed'}</p>
                      <p className="text-label-sm text-on-surface-variant">
                        {format(new Date(r.created_at), 'dd MMM yyyy, HH:mm')} · Staff: {r.staff_name || 'Store Staff'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: Points History */}
          {tab === 'points' && (
            <div className="space-y-3">
              <div className="card p-md flex items-center gap-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-600 text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                </div>
                <div>
                  <p className="text-label-sm text-amber-700 uppercase font-semibold">Current Balance</p>
                  <p className="text-headline-md font-bold text-amber-900">{member.loyalty_points.toLocaleString()} points</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-label-sm text-amber-700">Total earned</p>
                  <p className="text-body-md font-bold text-amber-900">
                    +{loyaltyHistory.filter(t => t.type === 'earn').reduce((s, t) => s + t.points, 0)} pts
                  </p>
                </div>
              </div>
              {loyaltyHistory.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant card">
                  <span className="material-symbols-outlined text-[48px] mb-2 text-amber-500">stars</span>
                  <p className="font-medium">No loyalty points earned yet.</p>
                  <p className="text-label-sm mt-1">Points are earned when purchases are recorded or reward offers are redeemed.</p>
                </div>
              ) : (
                loyaltyHistory.map(tx => (
                  <div key={tx.id} className="card p-md flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'earn' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {tx.type === 'earn' ? 'add_circle' : 'remove_circle'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-body-md font-bold">{tx.source_offer_title || (tx.type === 'earn' ? 'Points Earned' : 'Points Redeemed')}</p>
                      <p className="text-label-sm text-on-surface-variant">
                        {format(new Date(tx.created_at), 'dd MMM yyyy, HH:mm')}
                        {' '}· Balance after: {tx.balance_after.toLocaleString()} pts
                      </p>
                    </div>
                    <div className={`text-body-lg font-bold ${tx.type === 'earn' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'earn' ? '+' : ''}{tx.points} pts
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: Reward Catalog — Interactive 2x2 Grid with Glow */}
          {tab === 'rewards' && (
            <div className="space-y-4">
              {rewardCatalog.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant card">
                  <span className="material-symbols-outlined text-[48px] mb-2 text-primary/60">card_giftcard</span>
                  <p className="font-medium">No rewards available in the catalog yet.</p>
                  <p className="text-label-sm mt-1">Configure reward catalog items from Rewards page.</p>
                </div>
              ) : (
                /* 2x2 Responsive Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rewardCatalog.map((rew: any) => {
                    const canAfford = member.loyalty_points >= rew.points_cost;
                    return (
                      <div
                        key={rew.id}
                        className={`card p-4 flex flex-col justify-between border border-outline-variant/40 transition-all duration-200 hover:shadow-lg hover:border-primary/50 hover:ring-2 hover:ring-primary/20 active:scale-[0.98] ${
                          !canAfford ? 'opacity-75' : ''
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <h4 className="font-bold text-body-md text-on-surface leading-snug flex-1">{rew.name}</h4>
                            <span className="bg-amber-100 text-amber-900 text-label-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0 border border-amber-200">
                              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                              {rew.points_cost} pts
                            </span>
                          </div>
                          {rew.description && (
                            <p className="text-label-sm text-on-surface-variant line-clamp-2 mb-3">{rew.description}</p>
                          )}
                        </div>
                        <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between mt-auto">
                          <span className="text-label-xs font-medium text-on-surface-variant">
                            {rew.quantity_available !== null && rew.quantity_available !== undefined ? `${rew.quantity_available} left` : 'Unlimited'}
                          </span>
                          <button
                            disabled={!canAfford || claimingRewardId === rew.id || member.status === 'expired'}
                            onClick={() => handleClaimReward(rew)}
                            className="btn-primary !py-1.5 !px-3 text-label-sm disabled:opacity-50 shadow-xs"
                          >
                            {claimingRewardId === rew.id ? 'Claiming...' : canAfford ? 'Claim Reward' : 'Needs Points'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Active Coupons */}
              {coupons.length > 0 && (
                <div className="mt-4 pt-4 border-t border-outline-variant/40">
                  <h4 className="font-bold text-body-md text-on-surface flex items-center gap-1.5 mb-3">
                    <span className="material-symbols-outlined text-secondary text-[20px]">confirmation_number</span>
                    Active Store Coupons ({coupons.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {coupons.map((c: any) => (
                      <div key={c.id} className="card p-3 flex items-center justify-between border border-secondary-container/50 bg-secondary-container/10">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-secondary text-body-md tracking-wider bg-secondary-container/40 px-2 py-0.5 rounded">{c.code}</span>
                            <span className="text-label-xs font-semibold px-2 py-0.5 rounded-full bg-surface-container text-on-surface">
                              {c.discount_type === 'percent' ? `${c.value}% OFF` : `₹${c.value} OFF`}
                            </span>
                          </div>
                          <p className="text-label-xs text-on-surface-variant mt-1">
                            Min purchase: ₹{c.min_purchase}
                          </p>
                        </div>
                        <button
                          onClick={() => { setPurchaseForm(f => ({ ...f, coupon_code: c.code })); setShowPurchaseModal(true); }}
                          className="btn-outline !py-1 !px-2.5 text-label-xs flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">shopping_cart</span>
                          Use
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Column: Accordions & Auxiliary Controls */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Renewal CTA (if expiring / expired) */}
          {(member.status === 'expired' || member.status === 'expiring_soon' || daysToExpiry <= 30) && (
            <div className="card p-md border border-amber-200 bg-amber-50/40 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-label-md">
                <span className="material-symbols-outlined">autorenew</span>
                Renew Membership
              </div>
              <p className="text-body-sm text-on-surface-variant">Extend validity for another 1 year.</p>
              <button onClick={handleRenew} disabled={renewing} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
                {renewing && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
                Renew Validity
              </button>
            </div>
          )}

          {/* Accordion: Redeem Gift Voucher */}
          <details className="card p-0 overflow-hidden border border-outline-variant/30 group">
            <summary className="flex items-center justify-between px-4 py-3.5 cursor-pointer list-none font-semibold text-body-md text-on-surface select-none">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">confirmation_number</span>
                Redeem Gift Voucher
              </span>
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant transition-transform group-open:rotate-180">expand_more</span>
            </summary>
            <div className="px-4 pb-4 space-y-3 border-t border-outline-variant/20">
              <p className="text-body-sm text-on-surface-variant pt-3">Enter gift voucher code to link & credit value:</p>
              <form onSubmit={handleRedeemVoucher} className="flex gap-2">
                <input
                  type="text"
                  value={voucherCodeInput}
                  onChange={e => setVoucherCodeInput(e.target.value.toUpperCase())}
                  placeholder="VOUCHER CODE"
                  className="flex-1 px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg font-mono text-body-md text-center outline-none focus:border-primary transition-all uppercase"
                />
                <button type="submit" disabled={redeemingVoucher || !voucherCodeInput.trim()} className="btn-primary py-2 px-4 flex items-center gap-1">
                  {redeemingVoucher ? '...' : 'Redeem'}
                </button>
              </form>
            </div>
          </details>

          {/* Accordion: Referrals & Invites */}
          <details className="card p-0 overflow-hidden border border-outline-variant/30 group">
            <summary className="flex items-center justify-between px-4 py-3.5 cursor-pointer list-none font-semibold text-body-md text-on-surface select-none">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">group_add</span>
                Referrals &amp; Invites
              </span>
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant transition-transform group-open:rotate-180">expand_more</span>
            </summary>
            <div className="px-4 pb-4 space-y-3 border-t border-outline-variant/20">
              {member.referred_by_member_id ? (
                <div className="mt-3 p-3 bg-secondary-container/20 border border-secondary-container rounded-lg text-body-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[18px]">check_circle</span>
                  Referred by another member
                </div>
              ) : (
                <form onSubmit={handleApplyReferral} className="space-y-2 pt-3">
                  <p className="text-body-sm text-on-surface-variant">If referred by an existing member, apply their code here:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={referralInput}
                      onChange={e => setReferralInput(e.target.value.toUpperCase())}
                      placeholder="ENTER CODE"
                      className="flex-1 px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg font-mono text-body-md text-center outline-none focus:border-primary transition-all"
                    />
                    <button type="submit" disabled={applyingReferral || !referralInput.trim()} className="btn-primary py-2 px-4">
                      {applyingReferral ? '...' : 'Apply'}
                    </button>
                  </div>
                </form>
              )}
              <div className="pt-3 border-t border-outline-variant/30 space-y-1">
                <p className="text-label-sm text-on-surface-variant font-medium">Customer Shareable Referral Link:</p>
                <div className="flex items-center gap-1.5 bg-surface-container-low p-2 rounded-lg border border-outline-variant/50">
                  <input readOnly value={referralLink || 'Generating link...'} className="flex-1 bg-transparent text-body-sm font-mono outline-none" />
                  <button type="button" onClick={() => { navigator.clipboard.writeText(referralLink); addToast('success', 'Referral link copied!'); }}
                    className="p-1 hover:bg-surface-container rounded" title="Copy Link">
                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  </button>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Join ${user?.merchant_name || 'our store'} membership using my code ${member.referral_code || ''}: ${referralLink}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="p-1 hover:bg-surface-container rounded text-green-600 font-bold" title="Share on WhatsApp"
                  >
                    <span className="material-symbols-outlined text-[16px]">share</span>
                  </a>
                </div>
              </div>
            </div>
          </details>

          {/* Accordion: Customer Notes */}
          <details className="card p-0 overflow-hidden border border-outline-variant/30 group">
            <summary className="flex items-center justify-between px-4 py-3.5 cursor-pointer list-none font-semibold text-body-md text-on-surface select-none">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">sticky_note_2</span>
                Customer Notes
              </span>
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant transition-transform group-open:rotate-180">expand_more</span>
            </summary>
            <div className="px-4 pb-4 pt-3 border-t border-outline-variant/20">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                onBlur={handleSaveNotes}
                placeholder="Add internal notes about this customer..."
                className="w-full h-24 p-3 bg-surface-container-low border border-outline-variant rounded-lg text-body-md outline-none focus:border-primary transition-all resize-none"
              />
              <div className="flex justify-between items-center text-label-xs text-on-surface-variant mt-1">
                <span>Saves automatically on blur</span>
                {savingNotes && (
                  <span className="text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined animate-spin text-[12px]">progress_activity</span>
                    Saving...
                  </span>
                )}
              </div>
            </div>
          </details>

          {/* Accordion: Scratch & Win (only if cards exist) */}
          {scratchCards.length > 0 && (
            <details className="card p-0 overflow-hidden border border-outline-variant/30 group">
              <summary className="flex items-center justify-between px-4 py-3.5 cursor-pointer list-none font-semibold text-body-md text-on-surface select-none">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">card_giftcard</span>
                  Scratch &amp; Win Rewards
                  <span className="bg-primary text-on-primary text-label-xs px-1.5 py-0.5 rounded-full">{scratchCards.length}</span>
                </span>
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant transition-transform group-open:rotate-180">expand_more</span>
              </summary>
              <div className="px-4 pb-4 pt-3 border-t border-outline-variant/20 space-y-2">
                {scratchCards.map(c => (
                  <div key={c.id} className="p-3 bg-surface-container border border-outline-variant rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-body-sm font-bold">{c.is_revealed ? `Revealed: ${c.reward_value}` : '🎁 Secret Reward Card'}</p>
                      <p className="text-label-xs text-on-surface-variant">Issued on visit #{c.trigger_visit}</p>
                    </div>
                    {!c.is_revealed ? (
                      <button onClick={() => handleScratch(c.id)} className="btn-secondary !py-1 !px-3 text-label-sm" style={{ minHeight: 'auto' }}>
                        Scratch Now
                      </button>
                    ) : (
                      <span className="text-label-sm text-success font-semibold uppercase">Claimed</span>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Auto-Renewal Toggle */}
          <div className="card p-4 flex items-center justify-between border border-outline-variant/30">
            <div>
              <p className="text-body-md font-semibold text-on-surface">Auto-renew membership</p>
              <p className="text-label-sm text-on-surface-variant mt-0.5">Renews automatically upon expiry.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={autoRenew} onChange={handleToggleAutoRenew} className="sr-only peer" />
              <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Bottom Actions Row: Edit / PDF / Wallet */}
          {isOwner && (
            <div className="flex gap-2">
              <button
                onClick={handleOpenEditModal}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container text-label-md transition-colors font-medium"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Edit
              </button>
              <button
                onClick={handleDownloadCard}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container text-label-md transition-colors font-medium"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                PDF
              </button>
              {walletUrl ? (
                <a
                  href={walletUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container text-label-md transition-colors no-underline font-medium"
                >
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_to_wallet</span>
                  Wallet
                </a>
              ) : (
                <button
                  disabled={walletLoading}
                  onClick={async () => {
                    if (!member) return;
                    setWalletLoading(true);
                    try {
                      const res = await api.generateWalletPassUrl(member.id);
                      setWalletUrl(res.save_url);
                      window.open(res.save_url, '_blank', 'noopener,noreferrer');
                      addToast('success', 'Google Wallet pass generated!');
                    } catch {
                      addToast('error', 'Failed to generate Wallet pass — try again');
                    } finally {
                      setWalletLoading(false);
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container text-label-md transition-colors disabled:opacity-50 font-medium"
                >
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_to_wallet</span>
                  {walletLoading ? '...' : 'Wallet'}
                </button>
              )}
            </div>
          )}

          {/* Invite Code Footer */}
          {member.referral_code && (
            <div className="flex items-center justify-center gap-2 text-on-surface-variant pt-1">
              <span className="material-symbols-outlined text-[15px]">qr_code</span>
              <span className="text-label-sm font-mono">Invite code: {member.referral_code}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(member.referral_code || ''); addToast('success', 'Referral code copied!'); }}
                className="hover:bg-surface-container p-1 rounded transition-colors" title="Copy Referral Code"
              >
                <span className="material-symbols-outlined text-[15px]">content_copy</span>
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Redemption Confirm Modal */}
      <ConfirmModal
        isOpen={!!redeemState && !successAnimation}
        onClose={() => !redeeming && setRedeemState(null)}
        onConfirm={handleRedeem}
        title={redeemState?.isPointsRedemption ? 'Redeem Loyalty Points' : 'Confirm Redemption'}
        confirmLabel={redeemState?.isPointsRedemption ? `Redeem ${redeemState.pointsCost} Points` : 'Confirm Redemption'}
        isLoading={redeeming}
        description={
          <div className="space-y-3">
            <div className="bg-surface-container rounded-xl p-4">
              <p className="font-bold text-on-surface">{redeemState?.offerTitle}</p>
              {redeemState?.isPointsRedemption && redeemState.pointsCost && (
                <div className="mt-2 flex items-center gap-2 text-body-md">
                  <span className="text-amber-600 font-bold">{member.loyalty_points} pts available</span>
                  <span className="material-symbols-outlined text-on-surface-variant text-[16px]">arrow_forward</span>
                  <span className={`font-bold ${member.loyalty_points - redeemState.pointsCost < 0 ? 'text-error' : 'text-amber-600'}`}>
                    {member.loyalty_points - redeemState.pointsCost} pts after
                  </span>
                </div>
              )}
              {redeemState?.remainingBefore !== null && redeemState?.remainingBefore !== undefined && !redeemState?.isPointsRedemption && (
                <div className="flex items-center gap-2 mt-2 text-body-md">
                  <span className="font-bold text-primary">{redeemState.remainingBefore} remaining</span>
                  <span className="material-symbols-outlined text-on-surface-variant text-[16px]">arrow_forward</span>
                  <span className="font-bold text-amber-600">{(redeemState.remainingBefore || 0) - 1} remaining</span>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <label className="form-label !mb-1 text-label-sm font-semibold text-on-surface">Purchase Amount (₹) - Optional</label>
              <input
                type="number"
                placeholder="e.g. 500 (used to track customer spending)"
                value={purchaseAmount}
                onChange={e => setPurchaseAmount(e.target.value)}
                className="input-field font-semibold text-body-md"
              />
            </div>
            <p className="text-body-md text-on-surface-variant">
              This action is irreversible. Confirm that you want to redeem this offer for <strong>{member?.name}</strong>.
            </p>
          </div>
        }
      />

      {/* Success Animation */}
      {successAnimation && (
        <div className="fixed inset-0 z-[950] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <p className="text-headline-md font-headline-md text-on-surface">Redeemed!</p>
            <p className="text-body-md text-on-surface-variant text-center">{offerTitle}</p>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      <Modal isOpen={showEditModal} onClose={() => !updatingMember && setShowEditModal(false)} title="Edit Member Profile">
        <form onSubmit={handleSaveEditMember} className="space-y-4">
          <div>
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={e => setEditForm({ ...editForm, name: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="form-label">Phone Number *</label>
            <input
              type="tel"
              required
              value={editForm.phone}
              onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              value={editForm.email}
              onChange={e => setEditForm({ ...editForm, email: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="form-label">Membership Type</label>
            <select
              value={editForm.membership_type_id}
              onChange={e => setEditForm({ ...editForm, membership_type_id: e.target.value })}
              className="input-field"
            >
              {membershipTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Membership Status</label>
            <select
              value={editForm.status}
              onChange={e => setEditForm({ ...editForm, status: e.target.value as MemberStatus })}
              className="input-field"
            >
              <option value="active">Active</option>
              <option value="expiring_soon">Expiring Soon</option>
              <option value="expired">Expired</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                value={editForm.date_of_birth}
                onChange={e => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="form-label">Anniversary Date</label>
              <input
                type="date"
                value={editForm.anniversary_date}
                onChange={e => setEditForm({ ...editForm, anniversary_date: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-outline-variant/30">
            <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary" disabled={updatingMember}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={updatingMember}>
              {updatingMember && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Record Purchase Modal ── */}
      <Modal
        isOpen={showPurchaseModal}
        onClose={() => {
          setShowPurchaseModal(false);
          setPurchaseForm({ amount: '', coupon_code: '', offer_state_id: '', note: '' });
        }}
        title="Record Shopping Purchase & Assign Points"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleRecordPurchase} className="space-y-4">
          <p className="text-body-sm text-on-surface-variant">
            Enter shopping amount. Configured reward rules will automatically assign loyalty points to <strong>{member.name}</strong>.
          </p>

          <div>
            <label className="form-label" htmlFor="purchase-amount">
              Shopping Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-body-md">₹</span>
              <input
                id="purchase-amount"
                type="number"
                step="0.01"
                min="1"
                required
                className="input-field pl-8 text-title-md font-bold"
                placeholder="e.g. 1500"
                value={purchaseForm.amount}
                onChange={e => setPurchaseForm({ ...purchaseForm, amount: e.target.value })}
              />
            </div>
          </div>

          {/* Live Estimated Points Preview */}
          {Number(purchaseForm.amount) > 0 && (
            <div className="p-3 bg-secondary-container/20 border border-secondary-container rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                <div>
                  <p className="text-label-md font-bold text-on-surface">Loyalty Points to Earn</p>
                  <p className="text-label-sm text-on-surface-variant">Calculated based on store points rules</p>
                </div>
              </div>
              <span className="text-headline-sm font-bold text-secondary">
                +{calculateEstimatedPoints(purchaseForm.amount)} pts
              </span>
            </div>
          )}

          <div>
            <label className="form-label" htmlFor="purchase-coupon">
              Apply Coupon Code <span className="text-on-surface-variant font-normal">(Optional)</span>
            </label>
            {coupons.length > 0 && (
              <select
                className="input-field mb-2"
                value={purchaseForm.coupon_code}
                onChange={e => setPurchaseForm({ ...purchaseForm, coupon_code: e.target.value })}
              >
                <option value="">-- Auto-select / Select Available Coupon --</option>
                {coupons.map((c: any) => {
                  const label = `${c.code} (${c.discount_type === 'percent' ? `${c.value}% OFF` : `₹${c.value} OFF`}${c.min_purchase > 0 ? ` · Min ₹${c.min_purchase}` : ''})`;
                  return (
                    <option key={c.id} value={c.code}>
                      {label}
                    </option>
                  );
                })}
              </select>
            )}
            <input
              id="purchase-coupon"
              type="text"
              className="input-field uppercase tracking-wider font-mono"
              placeholder={coupons.length > 0 ? "Or type custom promo code..." : "e.g. SAVE20"}
              value={purchaseForm.coupon_code}
              onChange={e => setPurchaseForm({ ...purchaseForm, coupon_code: e.target.value.toUpperCase() })}
            />
          </div>

          {/* Optional Member Offer Redemption */}
          {member.offer_states && member.offer_states.filter(s => s.status === 'active').length > 0 && (
            <div>
              <label className="form-label" htmlFor="purchase-offer">
                Redeem Offer <span className="text-on-surface-variant font-normal">(Optional)</span>
              </label>
              <select
                id="purchase-offer"
                className="input-field"
                value={purchaseForm.offer_state_id}
                onChange={e => setPurchaseForm({ ...purchaseForm, offer_state_id: e.target.value })}
              >
                <option value="">-- No offer --</option>
                {member.offer_states
                  .filter(s => s.status === 'active')
                  .map(s => {
                    const title = (s as any).offer_template?.title || (s as any).offer?.title || `Offer #${s.offer_template_id.slice(0, 6)}`;
                    const qtyStr = s.remaining_qty !== null ? `(${s.remaining_qty} left)` : '(Unlimited)';
                    return (
                      <option key={s.id} value={s.id}>
                        {title} {qtyStr}
                      </option>
                    );
                  })}
              </select>
            </div>
          )}

          <div>
            <label className="form-label" htmlFor="purchase-note">
              Transaction Note <span className="text-on-surface-variant font-normal">(Optional)</span>
            </label>
            <input
              id="purchase-note"
              type="text"
              className="input-field"
              placeholder="e.g. Bill #1042 — Salon Service"
              value={purchaseForm.note}
              onChange={e => setPurchaseForm({ ...purchaseForm, note: e.target.value })}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-outline-variant/30 sticky bottom-0 bg-surface-container-lowest -mx-lg px-lg pb-1 z-10">
            <button
              type="button"
              onClick={() => {
                setShowPurchaseModal(false);
                setPurchaseForm({ amount: '', coupon_code: '', offer_state_id: '', note: '' });
              }}
              className="btn-secondary flex-1"
              disabled={recordingPurchase}
            >
              Cancel
            </button>
            <button
              id="confirm-purchase-btn"
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={recordingPurchase || !purchaseForm.amount}
            >
              {recordingPurchase ? (
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
              )}
              Assign Points & Save
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
