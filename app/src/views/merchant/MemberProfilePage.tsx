import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { StatusBadge, MembershipBadge } from '../../components/ui/StatusBadge';
import { OfferCard } from '../../components/ui/OfferCard';
import { ConfirmModal } from '../../components/ui/Modal';
import { CardSkeleton, Skeleton } from '../../components/ui/Skeleton';
import type { Member, MemberOfferState, Redemption, LoyaltyTransaction } from '../../types';
import * as api from '../../api';
import { format, differenceInDays } from 'date-fns';

type Tab = 'offers' | 'history' | 'points';

export default function MemberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const [member, setMember] = useState<(Member & { offer_states: MemberOfferState[] }) | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loyaltyHistory, setLoyaltyHistory] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('offers');

  // New features states
  const [referralLink, setReferralLink] = useState('');
  const [scratchCards, setScratchCards] = useState<any[]>([]);
  const [autoRenew, setAutoRenew] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState('');

  // Redemption confirm modal
  const [redeemState, setRedeemState] = useState<{ offerStateId: string; offerTitle: string; remainingBefore: number | null; isPointsRedemption?: boolean; pointsCost?: number } | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [referralInput, setReferralInput] = useState('');
  const [applyingReferral, setApplyingReferral] = useState(false);
  const [renewing, setRenewing] = useState(false);


  const fetchMember = async () => {
    if (!id) return;
    try {
      const [m, reds, loyalty] = await Promise.all([
        api.getMember(user?.merchant_id || '', id),
        api.getMemberRedemptions(user?.merchant_id || '', id),
        api.getLoyaltyHistory(user?.merchant_id || '', id),
      ]);
      setMember(m);
      setNotes(m.notes || '');
      setAutoRenew((m as any).auto_renew || false);
      setRedemptions(reds);
      setLoyaltyHistory(loyalty);

      // Load referral link and scratch cards asynchronously
      api.getReferralLink(m.id).then(res => setReferralLink(res.referral_link)).catch(() => {});
      api.getScratchCards(m.id).then(setScratchCards).catch(() => {});
    } catch {
      addToast('error', 'Member not found');
      navigate('/members');
    } finally {
      setLoading(false);
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

  const handleToggleAutoRenew = async () => {
    if (!member || !user) return;
    try {
      await api.updateMember(user.merchant_id || '', member.id, { auto_renew: !autoRenew } as any);
      setAutoRenew(!autoRenew);
      addToast('success', `Auto-renewal turned ${!autoRenew ? 'ON' : 'OFF'}`);
    } catch {
      addToast('error', 'Failed to toggle auto-renewal');
    }
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
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-5xl mx-auto space-y-xl animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate('/members')} className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface text-body-md transition-colors">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Search
      </button>

      {/* Header Card */}
      <section className="prime-gradient rounded-2xl p-lg text-white shadow-elevated relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-primary-container/20 rounded-full blur-3xl" />

        {/* Expiry warning */}
        {member.status === 'expiring_soon' && (
          <div className="relative z-10 mb-4 bg-amber-500/20 border border-amber-400/30 rounded-xl px-4 py-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-300 text-[18px]">warning</span>
            <span className="text-sm text-amber-100">Membership expires in {daysToExpiry} days — renew to continue</span>
          </div>
        )}
        {member.status === 'expired' && (
          <div className="relative z-10 mb-4 bg-error/20 border border-error/30 rounded-xl px-4 py-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-red-300 text-[18px]">cancel</span>
            <span className="text-sm text-red-100">Membership expired — renew to enable redemptions</span>
          </div>
        )}

        <div className="relative z-10 flex flex-col md:flex-row gap-lg items-start md:items-center">
          {/* Avatar */}
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white/20 overflow-hidden shadow-xl bg-primary-container flex items-center justify-center text-on-primary-container text-headline-lg font-bold">
            {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg-mobile">{member.name}</h2>
              {member.membership_type && <MembershipBadge name={member.membership_type.name} />}
              <StatusBadge status={member.status} />
            </div>
            <p className="text-body-md opacity-90 mb-1">#{member.member_code}</p>
            <div className="flex flex-wrap gap-4 text-label-sm opacity-80">
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

          {/* Feature 1: Loyalty Points & Stats */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Loyalty Points */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-md border border-white/10 min-w-[140px]">
              <p className="text-label-sm font-label-md uppercase opacity-70 mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                Loyalty Points
              </p>
              <p className="text-title-lg font-bold">
                {member.loyalty_points.toLocaleString()} <span className="text-body-sm font-normal opacity-70">pts</span>
              </p>
              {loyaltyHistory.length > 0 && (
                <p className="text-label-xs opacity-60 mt-1">
                  {loyaltyHistory.filter(t => t.type === 'earn').length} earn events
                </p>
              )}
            </div>

            {/* Visits & Referral Code */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-md border border-white/10 min-w-[160px]">
              <div className="flex justify-between gap-6">
                <div>
                  <p className="text-label-sm uppercase opacity-70 mb-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">local_activity</span>
                    Visits
                  </p>
                  <p className="text-title-lg font-bold">{member.total_visits || 0}</p>
                </div>
                <div>
                  <p className="text-label-sm uppercase opacity-70 mb-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">share</span>
                    Invite Code
                  </p>
                  <div className="flex items-center gap-1">
                    <p className="font-mono font-bold text-title-md">{member.referral_code || 'N/A'}</p>
                    {member.referral_code && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(member.referral_code || '');
                          addToast('success', 'Referral code copied!');
                        }}
                        className="hover:bg-white/20 p-1 rounded transition-colors"
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

        </div>

        {/* Owner actions */}
        {isOwner && (
          <div className="relative z-10 flex gap-2 mt-4">
            <button
              onClick={() => navigate(`/members/${member.id}/edit`)}
              className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-lg text-label-md font-label-md flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Edit
            </button>
            <button
              className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-lg text-label-md font-label-md flex items-center gap-1 transition-colors"
              onClick={handleDownloadCard}
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Download Card PDF
            </button>
          </div>
        )}

        {/* Physical Card Row */}
        <div className="relative z-10 mt-4 border-t border-white/10 pt-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-white/60 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
            {member.physical_card_number ? (
              <span className="font-mono text-white font-bold tracking-widest text-body-md">{member.physical_card_number}</span>
            ) : (
              <span className="text-white/50 text-label-md italic">No physical card linked</span>
            )}
          </div>
          {isOwner && (
            member.physical_card_number ? (
              <button
                onClick={() => navigate('/cards')}
                className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg text-label-sm transition-colors"
              >
                Manage Card
              </button>
            ) : (
              <button
                onClick={() => navigate('/cards')}
                className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg text-label-sm flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">add_card</span>
                Assign Card
              </button>
            )
          )}
        </div>
      </section>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
        {/* Left Column: Tabs and content */}
        <div className="lg:col-span-8 space-y-md">
          {/* Tabs — Feature 1: added 'points' tab */}
          <div className="flex border-b border-outline-variant/30">
            {(['offers', 'history', 'points'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-6 py-3 text-label-md font-label-md border-b-2 transition-all capitalize flex items-center gap-1
                  ${tab === t ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:bg-surface-container'}`}
              >
                {t === 'offers' && <span className="material-symbols-outlined text-[16px]">local_offer</span>}
                {t === 'history' && <span className="material-symbols-outlined text-[16px]">history</span>}
                {t === 'points' && <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>}
                {t === 'offers' ? 'Active Offers' : t === 'history' ? 'Redemption History' : 'Points History'}
              </button>
            ))}
          </div>

          {/* Tab: Active Offers */}
          {tab === 'offers' && (
            <div>
              {member.status === 'expired' && (
                <div className="mb-4 p-4 bg-error-container rounded-xl border border-error/20 text-on-error-container flex items-center gap-2">
                  <span className="material-symbols-outlined">block</span>
                  Redemptions are disabled — membership expired
                </div>
              )}
              {member.offer_states && member.offer_states.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                  {member.offer_states.map(state => (
                    state.offer && (
                      <div key={state.id} className="relative">
                        {/* Feature 1: points redemption badge */}
                        {state.offer.is_points_redemption && (
                          <div className="absolute top-2 right-2 z-10 bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 text-label-sm flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                            {state.offer.loyalty_points_cost} pts
                          </div>
                        )}
                        {/* Feature 1: earn badge */}
                        {state.offer.loyalty_points_earn && !state.offer.is_points_redemption && (
                          <div className="absolute top-2 right-2 z-10 bg-green-100 text-green-700 border border-green-200 rounded-full px-2 py-0.5 text-label-sm flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                            +{state.offer.loyalty_points_earn} pts
                          </div>
                        )}
                        <OfferCard
                          offer={state.offer}
                          offerState={state}
                          readOnly={member.status === 'expired'}
                          onRedeem={(offerStateId) => {
                            setRedeemState({
                              offerStateId,
                              offerTitle: state.offer?.title || '',
                              remainingBefore: state.remaining_qty,
                              isPointsRedemption: state.offer?.is_points_redemption,
                              pointsCost: state.offer?.loyalty_points_cost ?? undefined,
                            });
                          }}
                        />
                      </div>
                    )
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-on-surface-variant">
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
                <div className="text-center py-12 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[48px] mb-2">history</span>
                  <p>No redemptions yet</p>
                </div>
              ) : (
                redemptions.map(r => (
                  <div key={r.id} className="card p-md flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary-container/30 flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-body-md font-bold">{r.offer?.title}</p>
                      <p className="text-label-sm text-on-surface-variant">
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
              {/* Balance summary bar */}
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
                <div className="text-center py-12 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[48px] mb-2">stars</span>
                  <p>No loyalty points earned yet.</p>
                  <p className="text-label-sm mt-1">Points are earned when offers with point rewards are redeemed.</p>
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
        </div>

        {/* Right Column: Actions / Notes / Referrals */}
        <div className="lg:col-span-4 space-y-md">
          {/* Renewal CTA if expired/expiring */}
          {(member.status === 'expired' || member.status === 'expiring_soon' || daysToExpiry <= 30) && (
            <div className="card p-md border border-amber-200 bg-amber-50/30 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-label-md">
                <span className="material-symbols-outlined">autorenew</span>
                Renew Membership
              </div>
              <p className="text-body-sm text-on-surface-variant">
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

          {/* Customer Notes */}
          <div className="card p-md space-y-md">
            <h4 className="text-label-md font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">sticky_note_2</span>
              Customer Notes
            </h4>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={handleSaveNotes}
              placeholder="Add internal notes about this customer (e.g. preferences, allergies, VIP status)..."
              className="w-full h-32 p-3 bg-surface-container-low border border-outline-variant rounded-lg text-body-md outline-none focus:border-primary transition-all resize-none"
            />
            <div className="flex justify-between items-center text-label-xs text-on-surface-variant">
              <span>Saves automatically on blur</span>
              {savingNotes && (
                <span className="text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined animate-spin text-[12px]">progress_activity</span>
                  Saving...
                </span>
              )}
            </div>
          </div>

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
                  className="p-1 hover:bg-surface-container rounded">
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                </button>
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
    </div>
  );
}
