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

type Tab = 'offers' | 'history' | 'points' | 'rewards' | 'coupons' | 'notes' | 'scratch';

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

  // Derived: coupons that are applicable for this purchase amount
  // Mirrors the backend validation in record_member_purchase so the merchant
  // sees exactly what will be accepted before they submit.
  const getApplicableCoupons = (amount: string) => {
    const today = new Date().toISOString().split('T')[0];
    const purchaseAmt = Number(amount) || 0;
    return coupons.filter((c: any) => {
      if (!c.is_active) return false;
      if (c.expires_at && c.expires_at < today) return false;
      if (c.max_uses != null && c.used_count >= c.max_uses) return false;
      if (purchaseAmt > 0 && c.min_purchase > 0 && purchaseAmt < c.min_purchase) return false;
      return true;
    });
  };

  // Compute the discount amount a selected coupon gives for the current amount
  const computeCouponDiscount = (coupon: any, amount: string): number => {
    const amt = Number(amount) || 0;
    if (!coupon || amt <= 0) return 0;
    if (coupon.discount_type === 'flat') return Math.min(Number(coupon.value), amt);
    return Math.round((amt * Number(coupon.value)) / 100 * 100) / 100;
  };

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
      <div className="px-6 py-6 max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm animate-pulse flex gap-4">
          <Skeleton className="w-20 h-20 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    );
  }

  if (!member) return null;

  const offerTitle = redeemState?.offerTitle;
  const activeScratchCards = scratchCards.filter((c: any) => !c.scratched);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 px-4 sm:px-6 py-6 max-w-6xl mx-auto space-y-6 selection:bg-amber-200">
      
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/members')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back
        </button>
      </div>

      <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white font-black text-xl flex items-center justify-center shadow-md">
              {member.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">{member.name}</h1>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">#{member.member_code}</span>
                <span>{member.phone}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-7 bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-6 text-white shadow-md">
          <p className="text-xs font-black uppercase opacity-75">Loyalty Balance</p>
          <div className="text-5xl font-black">{member.loyalty_points.toLocaleString()} pts</div>
        </div>
        <div className="md:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <button
            onClick={() => setShowPurchaseModal(true)}
            className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-sm hover:bg-slate-800"
          >
            Record Purchase
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-4 pt-3 gap-1 overflow-x-auto">
          {['offers', 'coupons', 'history', 'notes', 'scratch'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-xs font-bold border-b-2 capitalize transition-all ${
                tab === t ? 'text-amber-700 border-amber-500' : 'text-slate-500 border-transparent hover:text-slate-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'offers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {member.offer_states?.map(state => (
                <div key={state.id} className="p-4 border rounded-2xl border-slate-100 bg-slate-50">
                  <h4 className="font-bold text-sm">{state.offer?.title || 'Offer'}</h4>
                  <button 
                    onClick={() => setRedeemState({ offerStateId: state.id, offerTitle: state.offer?.title || '' })}
                    className="mt-3 w-full py-2 bg-amber-500 text-slate-900 rounded-lg text-xs font-bold"
                  >
                    Redeem
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === 'coupons' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coupons.map((c: any) => (
                <div key={c.id} className="p-4 border-2 border-dashed border-slate-200 rounded-2xl flex justify-between items-center">
                  <span className="font-mono font-bold text-slate-900">{c.code}</span>
                  <button 
                    onClick={() => { setPurchaseForm(f => ({ ...f, coupon_code: c.code })); setShowPurchaseModal(true); }}
                    className="text-amber-600 font-bold text-xs"
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {tab === 'history' && (
             <div className="space-y-3">
               {loyaltyHistory.map(tx => (
                 <div key={tx.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl text-xs">
                   <span className="font-bold">{tx.type === 'earn' ? 'Earned' : 'Redeemed'}</span>
                   <span className={`font-black ${tx.type === 'earn' ? 'text-emerald-600' : 'text-rose-600'}`}>
                     {tx.type === 'earn' ? '+' : '-'}{tx.points}
                   </span>
                 </div>
               ))}
             </div>
          )}

          {tab === 'notes' && (
            <div className="space-y-4">
              <div className="card p-md space-y-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-label-md font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">notes</span>
                    Customer Notes
                  </h4>
                  {savingNotes && <span className="text-label-xs text-on-surface-variant animate-pulse">Saving…</span>}
                </div>
                <textarea
                  rows={3}
                  className="input-field text-body-sm w-full"
                  placeholder="Add internal notes about this customer (e.g. preferences, allergies, VIP status)..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  onBlur={handleSaveNotes}
                />
                <p className="text-label-xs text-on-surface-variant/70">Saves automatically on blur</p>
              </div>
            </div>
          )}

          {/* Referral Engine */}
          <div className="card p-md space-y-md">
            <h4 className="text-label-md font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">group_add</span>
              Referrals & Invites
            </h4>
            {member.referred_by_member_id ? (
              <div className="p-3 bg-secondary-container/20 border border-secondary-container rounded-lg text-body-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px]">check_circle</span>
                <span>Referred by another member</span>
              </div>
            ) : (
              <form onSubmit={handleApplyReferral} className="space-y-3">
                <p className="text-body-sm text-on-surface-variant">
                  If referred by an existing member, apply their code here:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralInput}
                    onChange={e => setReferralInput(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    className="flex-1 px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg font-mono text-body-md text-center outline-none focus:border-primary transition-all"
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
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-surface-container rounded text-green-600 font-bold"
                  title="Share on WhatsApp"
                >
                  <span className="material-symbols-outlined text-[16px]">share</span>
                </a>
              </div>
            </div>
          </div>

          {/* Scratch & Win */}
          <div className="card p-md space-y-md">
            <h4 className="text-label-md font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">card_giftcard</span>
              Scratch & Win Rewards
            </h4>
            {scratchCards.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">No scratch cards available yet.</p>
            ) : (
              <div className="space-y-2">
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
            )}
          </div>

          {/* Auto-Renewal Setting */}
          <div className="card p-md space-y-md">
            <h4 className="text-label-md font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">sync</span>
              Auto-Renewal Setting
            </h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-sm font-medium">Automatic Membership Renewal</p>
                <p className="text-label-xs text-on-surface-variant font-normal">If enabled, membership renews automatically upon expiration.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={autoRenew} onChange={handleToggleAutoRenew} className="sr-only peer" />
                <div className="w-9 h-5 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
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

          {/* Live Estimated Points Preview — uses NET amount if a coupon is selected */}
          {Number(purchaseForm.amount) > 0 && (() => {
            // Compute net amount after any selected coupon so the preview matches backend
            const selectedCouponForPreview = coupons.find((c: any) => c.code === purchaseForm.coupon_code && c.is_active);
            const previewDiscount = selectedCouponForPreview ? computeCouponDiscount(selectedCouponForPreview, purchaseForm.amount) : 0;
            const netAmtForPreview = Math.max(0, Number(purchaseForm.amount) - previewDiscount);
            const estimatedPts = calculateEstimatedPoints(String(netAmtForPreview));
            return (
              <div className="p-3 bg-secondary-container/20 border border-secondary-container rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                  <div>
                    <p className="text-label-md font-bold text-on-surface">Loyalty Points to Earn</p>
                    <p className="text-label-sm text-on-surface-variant">
                      {previewDiscount > 0
                        ? `On net ₹${netAmtForPreview.toLocaleString()} after ₹${previewDiscount} coupon`
                        : 'Calculated based on store points rules'}
                    </p>
                  </div>
                </div>
                <span className="text-headline-sm font-bold text-secondary">
                  +{estimatedPts} pts
                </span>
              </div>
            );
          })()}

          {/* ── Coupon Selection ── */}
          <div>
            <label className="form-label" htmlFor="purchase-coupon">
              Apply Coupon Code <span className="text-on-surface-variant font-normal">(Optional)</span>
            </label>
            {(() => {
              // Only show coupons applicable to this purchase amount so the merchant
              // isn't confused by coupons that the backend would reject.
              const applicableCoupons = getApplicableCoupons(purchaseForm.amount);
              const allActiveCoupons = coupons.filter((c: any) => c.is_active);
              const selectedCoupon = applicableCoupons.find((c: any) => c.code === purchaseForm.coupon_code)
                ?? allActiveCoupons.find((c: any) => c.code === purchaseForm.coupon_code);
              const discountAmt = selectedCoupon ? computeCouponDiscount(selectedCoupon, purchaseForm.amount) : 0;

              return (
                <div className="space-y-2">
                  {allActiveCoupons.length === 0 ? (
                    // Merchant has no coupons at all
                    <p className="text-label-sm text-on-surface-variant italic bg-surface-container px-3 py-2 rounded-lg">
                      No coupon codes configured for this store yet.
                    </p>
                  ) : applicableCoupons.length === 0 ? (
                    // Coupons exist but none pass the filter for this amount
                    <div className="flex items-start gap-2 bg-surface-container px-3 py-2 rounded-lg">
                      <span className="material-symbols-outlined text-on-surface-variant text-[16px] mt-0.5">info</span>
                      <p className="text-label-sm text-on-surface-variant">
                        No coupons available for this purchase
                        {Number(purchaseForm.amount) > 0 ? ` (₹${purchaseForm.amount})` : ''}.
                        {Number(purchaseForm.amount) <= 0 && ' Enter an amount above to check eligibility.'}
                      </p>
                    </div>
                  ) : (
                    // Show applicable coupon dropdown
                    <select
                      className="input-field"
                      value={purchaseForm.coupon_code}
                      onChange={e => setPurchaseForm({ ...purchaseForm, coupon_code: e.target.value })}
                    >
                      <option value="">-- No coupon --</option>
                      {applicableCoupons.map((c: any) => {
                        const discount = computeCouponDiscount(c, purchaseForm.amount);
                        const discountLabel = c.discount_type === 'percent'
                          ? `${c.value}% OFF${Number(purchaseForm.amount) > 0 ? ` = ₹${discount} savings` : ''}`
                          : `₹${c.value} OFF`;
                        const limitLabel = c.max_uses != null ? ` · ${c.max_uses - c.used_count} uses left` : '';
                        return (
                          <option key={c.id} value={c.code}>
                            {c.code} ({discountLabel}{limitLabel})
                          </option>
                        );
                      })}
                    </select>
                  )}

                  {/* Live discount preview when a valid coupon is selected */}
                  {selectedCoupon && discountAmt > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
                      <span className="material-symbols-outlined text-green-600 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
                      <div className="flex-1">
                        <p className="text-label-sm font-bold text-green-800">Coupon <span className="font-mono">{selectedCoupon.code}</span> applied</p>
                        <p className="text-label-xs text-green-700">
                          You save ₹{discountAmt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          {Number(purchaseForm.amount) > 0 && (
                            <> · Net amount: ₹{Math.max(0, Number(purchaseForm.amount) - discountAmt).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</>)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Free-text fallback for manual / staff-keyed codes */}
                  <input
                    id="purchase-coupon"
                    type="text"
                    className="input-field uppercase tracking-wider font-mono"
                    placeholder={applicableCoupons.length > 0 ? 'Or type a promo code manually...' : 'Enter promo code...'}
                    value={purchaseForm.coupon_code}
                    onChange={e => setPurchaseForm({ ...purchaseForm, coupon_code: e.target.value.toUpperCase() })}
                  />
                </div>
              );
            })()}
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

          <div className="flex gap-3 justify-end pt-4 border-t border-outline-variant/30">
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
