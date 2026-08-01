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
import { invalidateContaining } from '../../api/cache';
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


  const fetchMember = async () => {
    if (!id) return;
    const mId = user?.merchant_id || '';
    try {
      // FIX: Run ALL primary calls in parallel — eliminates the 2-RTT waterfall
      // (previously: getMember waited alone, then Promise.all ran = 2× latency)
      const [m, reds, loyalty, rewards, pRules, cList] = await Promise.all([
        api.getMember(mId, id),
        api.getMemberRedemptions(mId, id).catch(() => []),
        api.getLoyaltyHistory(mId, id).catch(() => []),
        api.getRewards(mId).catch(() => []),
        api.getPointsRules(mId).catch(() => []),
        api.getCoupons(mId).catch(() => []),
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
      api.getReferralLink(m.id).then(res => setReferralLink(res.referral_link)).catch(() => {});
      api.getScratchCards(m.id).then(setScratchCards).catch(() => {});
    } catch (e: any) {
      addToast('error', e.message || 'Member not found');
      navigate('/members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
      addToast('success', `Reward "${reward.name}" claimed successfully!`);
      fetchMember();
    } catch (e: any) {
      addToast('error', e.message || 'Failed to claim reward');
    } finally {
      setClaimingRewardId(null);
    }
  };


  useEffect(() => { fetchMember(); }, [id]);

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
        fetchMember(); // refresh — also updates loyalty_points balance
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
      fetchMember();
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
      fetchMember();
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
      fetchMember();
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
    api.getMembershipTypes(user?.merchant_id || '').then(setMembershipTypes).catch(() => {});
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
      fetchMember();
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
      fetchMember();
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
      <div className="px-4 md:px-10 py-8 max-w-5xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-card p-8 animate-pulse">
          <div className="flex gap-5">
            <Skeleton className="w-20 h-20 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    <div className="px-4 md:px-10 py-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate('/members')} className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#111111] text-sm transition-colors">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Search
      </button>

      {/* ── PREMIUM Header Card — white, soft shadow, gold accent points ─── */}
      <section className="bg-white rounded-2xl shadow-card relative overflow-hidden">
        {/* Subtle gold accent strip on left */}
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: '#B8941F' }} />

        <div className="p-6 md:p-8 pl-8 md:pl-10">
          {/* Expiry warnings — soft-tint premium alerts */}
          {member.status === 'expiring_soon' && (
            <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2.5">
              <span className="material-symbols-outlined text-amber-500 text-[18px]">warning</span>
              <span className="text-sm text-amber-800 font-medium">Membership expires in {daysToExpiry} days — renew to continue</span>
            </div>
          )}
          {member.status === 'expired' && (
            <div className="mb-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2.5">
              <span className="material-symbols-outlined text-red-400 text-[18px]">cancel</span>
              <span className="text-sm text-red-700 font-medium">Membership expired — renew to enable redemptions</span>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Avatar — gold tint */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-[#F5EDD0] flex items-center justify-center text-[#B8941F] text-3xl font-bold shrink-0">
              {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h2 className="text-2xl md:text-3xl font-bold text-[#111111] leading-tight">{member.name}</h2>
                {member.membership_type && <MembershipBadge name={member.membership_type.name} />}
                <StatusBadge status={member.status} />
              </div>
              <p className="text-[#9CA3AF] text-sm mb-2">#{member.member_code}</p>
              <div className="flex flex-wrap gap-4 text-xs text-[#6B7280]">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">phone</span>
                  {member.phone}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                  Expires: {format(new Date(member.expiry_date), 'dd MMM yyyy')}
                </span>
              </div>
            </div>

            {/* PREMIUM Loyalty Points — DOMINANT large number in gold */}
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto shrink-0">
              {/* Points card */}
              <div className="bg-[#FBF7EA] rounded-2xl p-5 min-w-[160px]">
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#9A7A18] mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                  Loyalty Points
                </p>
                {/* THE dominant number — 48px bold gold */}
                <p className="text-[48px] leading-[52px] font-extrabold text-[#B8941F] tabular-nums tracking-tight">
                  {member.loyalty_points.toLocaleString()}
                </p>
                <p className="text-xs text-[#9A7A18] mt-0.5">points balance</p>
              </div>

              {/* Visits & Code */}
              <div className="bg-[#F9FAFB] rounded-2xl p-5 min-w-[140px]">
                <div className="mb-4">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[#9CA3AF] mb-0.5">Total Visits</p>
                  <p className="text-3xl font-extrabold text-[#111111]">{member.total_visits || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[#9CA3AF] mb-0.5">Invite Code</p>
                  <div className="flex items-center gap-1">
                    <p className="font-mono font-bold text-[#111111] text-sm">{member.referral_code || 'N/A'}</p>
                    {member.referral_code && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(member.referral_code || '');
                          addToast('success', 'Referral code copied!');
                        }}
                        className="hover:bg-[#E5E7EB] p-1 rounded-lg transition-colors text-[#9CA3AF] hover:text-[#6B7280]"
                        title="Copy Referral Code"
                      >
                        <span className="material-symbols-outlined text-[14px]">content_copy</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex gap-2 mt-6 flex-wrap items-center">
            <button
              id="record-purchase-btn"
              onClick={() => setShowPurchaseModal(true)}
              className="btn-primary flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[17px]">shopping_cart_checkout</span>
              Record Purchase
            </button>

            {isOwner && (
              <>
                <button
                  onClick={handleOpenEditModal}
                  className="btn-secondary flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  Edit
                </button>
                <button
                  className="btn-secondary flex items-center gap-1.5"
                  onClick={handleDownloadCard}
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Download PDF
                </button>
                {/* Google Wallet Button */}
                {walletUrl ? (
                  <a
                    href={walletUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_to_wallet</span>
                    Google Wallet
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
                    className="btn-secondary flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_to_wallet</span>
                    {walletLoading ? 'Generating…' : 'Google Wallet'}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Physical Card Row */}
          <div className="mt-5 pt-5 border-t border-[#F3F4F6]">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {(member as any).card_design_url ? (
                  <img
                    src={(member as any).card_design_url}
                    alt="Physical card"
                    className="h-10 w-16 object-cover rounded-xl border border-[#E5E7EB] shadow-sm"
                  />
                ) : (
                  <span className="material-symbols-outlined text-[#9CA3AF] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
                )}
                {member.physical_card_number ? (
                  <span className="font-mono text-[#111111] font-semibold tracking-widest text-sm">{member.physical_card_number}</span>
                ) : (
                  <span className="text-[#9CA3AF] text-sm italic">No physical card linked</span>
                )}
              </div>
              {isOwner && (
                member.physical_card_number ? (
                  <button onClick={() => navigate('/cards')} className="btn-secondary text-xs px-3 py-1.5">
                    Manage Card
                  </button>
                ) : (
                  <button onClick={() => navigate('/cards')} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">add_card</span>
                    Assign Card
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tabs and content */}
        <div className="lg:col-span-8 space-y-4">
          {/* Tabs — PREMIUM: gold underline active, charcoal inactive */}
          <div className="flex border-b border-[#E5E7EB] flex-wrap bg-white rounded-t-xl overflow-hidden">
            {(['offers', 'history', 'points', 'rewards'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5
                  ${tab === t
                    ? 'text-[#B8941F] border-[#B8941F] bg-[#FBF7EA]/50'
                    : 'text-[#6B7280] border-transparent hover:text-[#111111] hover:bg-[#F9FAFB]'
                  }`}
              >
                {t === 'offers' && <span className="material-symbols-outlined text-[15px]">local_offer</span>}
                {t === 'history' && <span className="material-symbols-outlined text-[15px]">history</span>}
                {t === 'points' && <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>}
                {t === 'rewards' && <span className="material-symbols-outlined text-[15px]">card_giftcard</span>}
                {t === 'offers' ? 'Active Offers' : t === 'history' ? 'History' : t === 'points' ? 'Points' : 'Rewards'}
              </button>
            ))}
          </div>

          {/* Tab: Active Offers */}
          {tab === 'offers' && (
            <div>
              {member.status === 'expired' && (
                <div className="mb-4 p-4 bg-red-50 rounded-xl border border-red-200 text-red-700 flex items-center gap-2">
                  <span className="material-symbols-outlined">block</span>
                  Redemptions are disabled — membership expired
                </div>
              )}
              {member.offer_states && member.offer_states.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    return (
                      <div key={state.id} className="relative">
                        {/* Feature 1: points redemption badge */}
                        {offer.is_points_redemption && (
                          <div className="absolute top-2 right-2 z-10 bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 text-xs flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                            {offer.loyalty_points_cost} pts
                          </div>
                        )}
                        {/* Feature 1: earn badge */}
                        {offer.loyalty_points_earn && !offer.is_points_redemption && (
                          <div className="absolute top-2 right-2 z-10 bg-green-100 text-green-700 border border-green-200 rounded-full px-2 py-0.5 text-xs flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                            +{offer.loyalty_points_earn} pts
                          </div>
                        )}
                        <OfferCard
                          offer={offer}
                          offerState={state}
                          readOnly={member.status === 'expired'}
                          onRedeem={(offerStateId) => {
                            setRedeemState({
                              offerStateId,
                              offerTitle: offer?.title || '',
                              remainingBefore: state.remaining_qty,
                              isPointsRedemption: offer?.is_points_redemption,
                              pointsCost: offer?.loyalty_points_cost ?? undefined,
                            });
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-[#6B7280]">
                  <span className="material-symbols-outlined text-[48px] mb-2">local_offer</span>
                  <p>No active offers for this member.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Redemption History */}
          {tab === 'history' && (
            <div className="space-y-2">
              {redemptions.length === 0 ? (
                <div className="text-center py-12 text-[#6B7280]">
                  <span className="material-symbols-outlined text-[48px] mb-2">history</span>
                  <p>No redemptions yet</p>
                </div>
              ) : (
                redemptions.map(r => (
                  <div key={r.id} className="card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F3F4F6]/30 flex items-center justify-center text-[#6B7280]">
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">{r.offer?.title}</p>
                      <p className="text-xs text-[#6B7280]">
                        {format(new Date(r.created_at), 'dd MMM yyyy, HH:mm')} · Staff: {r.staff_name}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: Points History — Feature 1 */}
          {tab === 'points' && (
            <div className="space-y-3">
              {/* PREMIUM Balance summary — large gold number */}
              <div className="bg-white rounded-2xl shadow-card p-6 flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-[#FBF7EA] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#B8941F] text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[#9CA3AF] mb-0.5">Current Balance</p>
                  <p className="text-[36px] leading-[40px] font-extrabold text-[#B8941F] tabular-nums">{member.loyalty_points.toLocaleString()}<span className="text-base font-semibold text-[#D4AF37] ml-1.5">pts</span></p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[#9CA3AF] mb-0.5">Total Earned</p>
                  <p className="text-xl font-bold text-emerald-600">
                    +{loyaltyHistory.filter(t => t.type === 'earn').reduce((s, t) => s + t.points, 0)} pts
                  </p>
                </div>
              </div>

              {loyaltyHistory.length === 0 ? (
                <div className="text-center py-12 text-[#6B7280]">
                  <span className="material-symbols-outlined text-[48px] mb-2">stars</span>
                  <p>No loyalty points earned yet.</p>
                  <p className="text-xs mt-1">Points are earned when offers with point rewards are redeemed.</p>
                </div>
              ) : (
                loyaltyHistory.map(tx => (
                  <div key={tx.id} className="card p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'earn' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {tx.type === 'earn' ? 'add_circle' : 'remove_circle'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">{tx.source_offer_title || (tx.type === 'earn' ? 'Points Earned' : 'Points Redeemed')}</p>
                      <p className="text-xs text-[#6B7280]">
                        {format(new Date(tx.created_at), 'dd MMM yyyy, HH:mm')}
                        {' '}· Balance after: {tx.balance_after.toLocaleString()} pts
                      </p>
                    </div>
                    <div className={`text-base font-bold ${tx.type === 'earn' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'earn' ? '+' : ''}{tx.points} pts
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: Reward Catalog */}
          {tab === 'rewards' && (
            <div className="space-y-3">
              {rewardCatalog.length === 0 ? (
                <div className="text-center py-12 text-[#6B7280]">
                  <span className="material-symbols-outlined text-[48px] mb-2">card_giftcard</span>
                  <p>No rewards available in the catalog yet.</p>
                  <p className="text-xs mt-1">Configure reward catalog items from Settings / Rewards page.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rewardCatalog.map((rew: any) => {
                    const canAfford = member.loyalty_points >= rew.points_cost;
                    return (
                      <div key={rew.id} className="card p-4 flex flex-col justify-between space-y-3 border border-[#E5E7EB]">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-base text-[#111111]">{rew.name}</h4>
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                              {rew.points_cost} pts
                            </span>
                          </div>
                          {rew.description && (
                            <p className="text-xs text-[#6B7280] mt-1">{rew.description}</p>
                          )}
                        </div>
                        <div className="pt-2 border-t border-[#F3F4F6] flex items-center justify-between">
                          <span className="text-[10px] text-[#6B7280]">
                            {rew.quantity_available !== null ? `${rew.quantity_available} left` : 'Unlimited'}
                          </span>
                          <button
                            disabled={!canAfford || claimingRewardId === rew.id || member.status === 'expired'}
                            onClick={() => handleClaimReward(rew)}
                            className="btn-primary !py-1.5 !px-3 text-xs disabled:opacity-50"
                          >
                            {claimingRewardId === rew.id ? 'Claiming...' : canAfford ? 'Claim Reward' : 'Needs More Points'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Active Coupons Section */}
              <div className="mt-6 pt-4 border-t border-[#E5E7EB]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-sm text-[#111111] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#6B7280] text-[20px]">confirmation_number</span>
                    Active Store Coupons & Promos ({coupons.length})
                  </h4>
                </div>
                {coupons.length === 0 ? (
                  <p className="text-xs text-[#6B7280] italic">No active coupon codes right now.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {coupons.map((c: any) => (
                      <div key={c.id} className="card p-3 flex items-center justify-between border border-[#6B7280]-container/50 bg-[#F3F4F6]/10">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#6B7280] text-sm tracking-wider bg-[#F3F4F6]/40 px-2 py-0.5 rounded">
                              {c.code}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#111111]">
                              {c.discount_type === 'percent' ? `${c.value}% OFF` : `₹${c.value} OFF`}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#6B7280] mt-1">
                            Min purchase: ₹{c.min_purchase} {c.active_days ? `· Active: ${c.active_days}` : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setPurchaseForm(f => ({ ...f, coupon_code: c.code }));
                            setShowPurchaseModal(true);
                          }}
                          className="btn-outline !py-1 !px-2.5 text-[10px] flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">shopping_cart</span>
                          Use in Purchase
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Actions / Notes / Referrals */}
        <div className="lg:col-span-4 space-y-5">
          {/* Renewal CTA if expired/expiring */}
          {(member.status === 'expired' || member.status === 'expiring_soon' || daysToExpiry <= 30) && (
            <div className="card p-4 border border-amber-200 bg-amber-50/30 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                <span className="material-symbols-outlined">autorenew</span>
                Renew Membership
              </div>
              <p className="text-xs text-[#6B7280]">
                Extend membership validity by 1 year from today.
              </p>
              <button
                onClick={handleRenew}
                disabled={renewing}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
              >
                {renewing && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
                Renew Validity
              </button>
            </div>
          )}

          {/* Redeem Gift Voucher Card */}
          <div className="card p-4 space-y-5">
            <h4 className="text-sm font-bold text-[#111111] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
              Redeem Gift Voucher / Card
            </h4>
            <form onSubmit={handleRedeemVoucher} className="space-y-3">
              <p className="text-xs text-[#6B7280]">
                Enter gift voucher or card code to link & credit value to member:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={voucherCodeInput}
                  onChange={e => setVoucherCodeInput(e.target.value.toUpperCase())}
                  placeholder="VOUCHER CODE"
                  className="flex-1 px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg font-mono text-sm text-center outline-none focus:border-[#B8941F] transition-all uppercase"
                />
                <button
                  type="submit"
                  disabled={redeemingVoucher || !voucherCodeInput.trim()}
                  className="btn-primary py-2 px-4 flex items-center gap-1"
                >
                  {redeemingVoucher ? '...' : 'Redeem'}
                </button>
              </div>
            </form>
          </div>

          {/* Customer Notes */}
          <div className="card p-4 space-y-5">
            <h4 className="text-sm font-bold text-[#111111] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">sticky_note_2</span>
              Customer Notes
            </h4>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={handleSaveNotes}
              placeholder="Add internal notes about this customer (e.g. preferences, allergies, VIP status)..."
              className="w-full h-32 p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#B8941F] transition-all resize-none"
            />
            <div className="flex justify-between items-center text-[10px] text-[#6B7280]">
              <span>Saves automatically on blur</span>
              {savingNotes && (
                <span className="text-[#B8941F] flex items-center gap-1">
                  <span className="material-symbols-outlined animate-spin text-[12px]">progress_activity</span>
                  Saving...
                </span>
              )}
            </div>
          </div>

          {/* Referral Engine */}
          <div className="card p-4 space-y-5">
            <h4 className="text-sm font-bold text-[#111111] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">group_add</span>
              Referrals & Invites
            </h4>
            {member.referred_by_member_id ? (
              <div className="p-3 bg-[#F3F4F6]/20 border border-[#6B7280]-container rounded-lg text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[#6B7280] text-[18px]">check_circle</span>
                <span>Referred by another member</span>
              </div>
            ) : (
              <form onSubmit={handleApplyReferral} className="space-y-3">
                <p className="text-xs text-[#6B7280]">
                  If referred by an existing member, apply their code here:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralInput}
                    onChange={e => setReferralInput(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    className="flex-1 px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg font-mono text-sm text-center outline-none focus:border-[#B8941F] transition-all"
                  />
                  <button
                    type="submit"
                    disabled={applyingReferral || !referralInput.trim()}
                    className="btn-primary py-2 px-4"
                  >
                    {applyingReferral ? '...' : 'Apply'}
                  </button>
                </div>
              </form>
            )}
            <div className="pt-3 border-t border-[#F3F4F6] space-y-1">
              <p className="text-xs text-[#6B7280] font-medium">Customer Shareable Referral Link:</p>
              <div className="flex items-center gap-1.5 bg-[#F9FAFB] p-2 rounded-lg border border-[#E5E7EB]/50">
                <input readOnly value={referralLink || 'Generating link...'} className="flex-1 bg-transparent text-xs font-mono outline-none" />
                <button type="button" onClick={() => { navigator.clipboard.writeText(referralLink); addToast('success', 'Referral link copied!'); }}
                  className="p-1 hover:bg-[#F3F4F6] rounded" title="Copy Link">
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                </button>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Join ${user?.merchant_name || 'our store'} membership using my code ${member.referral_code || ''}: ${referralLink}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-[#F3F4F6] rounded text-green-600 font-bold"
                  title="Share on WhatsApp"
                >
                  <span className="material-symbols-outlined text-[16px]">share</span>
                </a>
              </div>
            </div>
          </div>

          {/* Scratch & Win */}
          <div className="card p-4 space-y-5">
            <h4 className="text-sm font-bold text-[#111111] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">card_giftcard</span>
              Scratch & Win Rewards
            </h4>
            {scratchCards.length === 0 ? (
              <p className="text-xs text-[#6B7280]">No scratch cards available yet.</p>
            ) : (
              <div className="space-y-2">
                {scratchCards.map(c => (
                  <div key={c.id} className="p-3 bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold">{c.is_revealed ? `Revealed: ${c.reward_value}` : '🎁 Secret Reward Card'}</p>
                      <p className="text-[10px] text-[#6B7280]">Issued on visit #{c.trigger_visit}</p>
                    </div>
                    {!c.is_revealed ? (
                      <button onClick={() => handleScratch(c.id)} className="btn-secondary !py-1 !px-3 text-xs" style={{ minHeight: 'auto' }}>
                        Scratch Now
                      </button>
                    ) : (
                      <span className="text-xs text-success font-semibold uppercase">Claimed</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Auto-Renewal Setting */}
          <div className="card p-4 space-y-5">
            <h4 className="text-sm font-bold text-[#111111] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">sync</span>
              Auto-Renewal Setting
            </h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">Automatic Membership Renewal</p>
                <p className="text-[10px] text-[#6B7280] font-normal">If enabled, membership renews automatically upon expiration.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={autoRenew} onChange={handleToggleAutoRenew} className="sr-only peer" />
                <div className="w-9 h-5 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E5E7EB] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#B8941F]"></div>
              </label>
            </div>
          </div>
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
            <div className="bg-[#F3F4F6] rounded-xl p-4">
              <p className="font-bold text-[#111111]">{redeemState?.offerTitle}</p>
              {redeemState?.isPointsRedemption && redeemState.pointsCost && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-amber-600 font-bold">{member.loyalty_points} pts available</span>
                  <span className="material-symbols-outlined text-[#6B7280] text-[16px]">arrow_forward</span>
                  <span className={`font-bold ${member.loyalty_points - redeemState.pointsCost < 0 ? 'text-red-600' : 'text-amber-600'}`}>
                    {member.loyalty_points - redeemState.pointsCost} pts after
                  </span>
                </div>
              )}
              {redeemState?.remainingBefore !== null && redeemState?.remainingBefore !== undefined && !redeemState?.isPointsRedemption && (
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <span className="font-bold text-[#B8941F]">{redeemState.remainingBefore} remaining</span>
                  <span className="material-symbols-outlined text-[#6B7280] text-[16px]">arrow_forward</span>
                  <span className="font-bold text-amber-600">{(redeemState.remainingBefore || 0) - 1} remaining</span>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <label className="form-label !mb-1 text-xs font-semibold text-[#111111]">Purchase Amount (₹) - Optional</label>
              <input
                type="number"
                placeholder="e.g. 500 (used to track customer spending)"
                value={purchaseAmount}
                onChange={e => setPurchaseAmount(e.target.value)}
                className="input-field font-semibold text-sm"
              />
            </div>
            <p className="text-sm text-[#6B7280]">
              This action is irreversible. Confirm that you want to redeem this offer for <strong>{member?.name}</strong>.
            </p>
          </div>
        }
      />

      {/* Success Animation */}
      {successAnimation && (
        <div className="fixed inset-0 z-[950] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-[#F3F4F6] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#6B7280] text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <p className="text-xl font-headline-md text-[#111111]">Redeemed!</p>
            <p className="text-sm text-[#6B7280] text-center">{offerTitle}</p>
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
          <div className="flex gap-3 justify-end pt-4 border-t border-[#F3F4F6]">
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
          <p className="text-xs text-[#6B7280]">
            Enter shopping amount. Configured reward rules will automatically assign loyalty points to <strong>{member.name}</strong>.
          </p>

          <div>
            <label className="form-label" htmlFor="purchase-amount">
              Shopping Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] font-bold text-sm">₹</span>
              <input
                id="purchase-amount"
                type="number"
                step="0.01"
                min="1"
                required
                className="input-field pl-8 text-lg font-bold"
                placeholder="e.g. 1500"
                value={purchaseForm.amount}
                onChange={e => setPurchaseForm({ ...purchaseForm, amount: e.target.value })}
              />
            </div>
          </div>

          {/* Live Estimated Points Preview */}
          {Number(purchaseForm.amount) > 0 && (
            <div className="p-3 bg-[#F3F4F6]/20 border border-[#6B7280]-container rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#6B7280] text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                <div>
                  <p className="text-sm font-bold text-[#111111]">Loyalty Points to Earn</p>
                  <p className="text-xs text-[#6B7280]">Calculated based on store points rules</p>
                </div>
              </div>
              <span className="text-lg font-bold text-[#6B7280]">
                +{calculateEstimatedPoints(purchaseForm.amount)} pts
              </span>
            </div>
          )}

          <div>
            <label className="form-label" htmlFor="purchase-coupon">
              Apply Coupon Code <span className="text-[#6B7280] font-normal">(Optional)</span>
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
                Redeem Offer <span className="text-[#6B7280] font-normal">(Optional)</span>
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
              Transaction Note <span className="text-[#6B7280] font-normal">(Optional)</span>
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

          <div className="flex gap-3 justify-end pt-4 border-t border-[#F3F4F6]">
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


