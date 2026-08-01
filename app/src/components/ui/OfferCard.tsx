import React from 'react';
import type { OfferTemplate, MemberOfferState } from '../../types';

const OFFER_ICONS: Record<string, string> = {
  percent_off:       'percent',
  free_service:      'spa',
  wallet_points:     'account_balance_wallet',
  referral:          'people',
  birthday:          'cake',
  points_redemption: 'stars',
  visit_milestone:   'workspace_premium',
};

// ── PREMIUM soft-tint icon backgrounds ─────────────────────────────────────
const OFFER_ICON_COLORS: Record<string, string> = {
  percent_off:       'bg-emerald-50 text-emerald-600',
  free_service:      'bg-sky-50 text-sky-600',
  wallet_points:     'bg-[#FBF7EA] text-[#B8941F]',
  referral:          'bg-[#F3F4F6] text-[#6B7280]',
  birthday:          'bg-pink-50 text-pink-600',
  points_redemption: 'bg-amber-50 text-amber-600',
  visit_milestone:   'bg-violet-50 text-violet-600',
};

// ── PREMIUM soft-tint type badges ──────────────────────────────────────────
const OFFER_BADGE: Record<string, { label: string; cls: string }> = {
  percent_off:       { label: 'DISCOUNT',      cls: 'bg-emerald-50 text-emerald-700' },
  free_service:      { label: 'REWARD',        cls: 'bg-sky-50 text-sky-700' },
  wallet_points:     { label: 'POINTS',        cls: 'bg-[#FBF7EA] text-[#9A7A18]' },
  referral:          { label: 'REFERRAL',      cls: 'bg-[#F3F4F6] text-[#6B7280]' },
  birthday:          { label: 'BIRTHDAY',      cls: 'bg-pink-50 text-pink-700' },
  points_redemption: { label: 'POINTS REDEEM', cls: 'bg-amber-50 text-amber-700' },
  visit_milestone:   { label: 'MILESTONE',     cls: 'bg-violet-50 text-violet-700' },
};

interface OfferCardProps {
  offer: OfferTemplate;
  offerState?: MemberOfferState;
  onRedeem?: (offerStateId: string) => void;
  readOnly?: boolean;
}

export function OfferCard({ offer, offerState, onRedeem, readOnly }: OfferCardProps) {
  const icon = OFFER_ICONS[offer.offer_type] || 'star';
  const iconColor = OFFER_ICON_COLORS[offer.offer_type] || 'bg-[#FBF7EA] text-[#B8941F]';
  const badge = OFFER_BADGE[offer.offer_type] || { label: 'OFFER', cls: 'bg-[#FBF7EA] text-[#9A7A18]' };

  const isExhausted = offerState?.status === 'exhausted' || (offerState?.remaining_qty !== undefined && offerState.remaining_qty !== null && offerState.remaining_qty <= 0);
  const hasQty = offerState?.remaining_qty !== null && offerState?.remaining_qty !== undefined;

  return (
    <div className={`bg-white rounded-2xl p-5 flex flex-col justify-between group transition-all
      ${isExhausted
        ? 'opacity-60 shadow-card'
        : 'shadow-card hover:shadow-card-hover hover:-translate-y-0.5'
      }
    `}>
      {/* Header row */}
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconColor}`}>
          <span className="material-symbols-outlined text-[26px]">{icon}</span>
        </div>
        <span className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* Content */}
      <div className="mb-5 flex-1">
        <h4 className="text-base font-bold text-[#111111] mb-1 leading-snug">{offer.title}</h4>
        <p className="text-sm text-[#6B7280] line-clamp-2 leading-relaxed">{offer.description}</p>

        {hasQty && offerState && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 bg-[#F3F4F6] h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isExhausted ? 'bg-[#D1D5DB]' : 'bg-[#B8941F]'}`}
                style={{ width: `${offerState.initial_qty ? ((offerState.remaining_qty ?? 0) / offerState.initial_qty) * 100 : 0}%` }}
              />
            </div>
            <span className="text-[11px] text-[#9CA3AF] font-medium whitespace-nowrap">
              {offerState.remaining_qty}/{offerState.initial_qty} left
            </span>
          </div>
        )}
      </div>

      {/* Redeem button */}
      {!readOnly && (
        <button
          disabled={isExhausted || !onRedeem || !offerState}
          onClick={() => offerState && onRedeem && onRedeem(offerState.id)}
          className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.97]
            ${isExhausted
              ? 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed'
              : 'bg-[#B8941F] text-white hover:bg-[#9A7A18] hover:shadow-[0_4px_12px_rgba(184,148,31,0.3)]'
            }
          `}
        >
          {isExhausted ? 'Fully Used' : 'Redeem Now'}
        </button>
      )}
    </div>
  );
}

