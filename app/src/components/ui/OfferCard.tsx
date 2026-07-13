import React from 'react';
import type { OfferTemplate, MemberOfferState } from '../../types';

const OFFER_ICONS: Record<string, string> = {
  percent_off: 'percent',
  free_service: 'spa',
  wallet_points: 'account_balance_wallet',
  referral: 'people',
  birthday: 'cake',
};

const OFFER_COLORS: Record<string, string> = {
  percent_off: 'bg-secondary-container/20 text-secondary',
  free_service: 'bg-primary-container/10 text-primary',
  wallet_points: 'bg-tertiary-fixed/30 text-tertiary-container',
  referral: 'bg-surface-container text-on-surface-variant',
  birthday: 'bg-tertiary-fixed/40 text-on-tertiary-fixed-variant',
};

const OFFER_BADGE: Record<string, { label: string; cls: string }> = {
  percent_off: { label: 'DISCOUNT', cls: 'bg-secondary-fixed text-on-secondary-fixed' },
  free_service: { label: 'REWARD', cls: 'bg-tertiary-fixed text-on-tertiary-fixed' },
  wallet_points: { label: 'POINTS', cls: 'bg-primary-fixed text-on-primary-fixed' },
  referral: { label: 'REFERRAL', cls: 'bg-surface-container-high text-on-surface-variant' },
  birthday: { label: 'BIRTHDAY', cls: 'bg-tertiary-fixed text-on-tertiary-fixed' },
};

interface OfferCardProps {
  offer: OfferTemplate;
  offerState?: MemberOfferState;
  onRedeem?: (offerStateId: string) => void;
  readOnly?: boolean;
}

export function OfferCard({ offer, offerState, onRedeem, readOnly }: OfferCardProps) {
  const icon = OFFER_ICONS[offer.offer_type] || 'star';
  const iconColor = OFFER_COLORS[offer.offer_type] || '';
  const badge = OFFER_BADGE[offer.offer_type];

  const isExhausted = offerState?.status === 'exhausted' || (offerState?.remaining_qty !== undefined && offerState.remaining_qty !== null && offerState.remaining_qty <= 0);
  const hasQty = offerState?.remaining_qty !== null && offerState?.remaining_qty !== undefined;

  return (
    <div className={`bg-surface-container-lowest rounded-xl p-md shadow-sm border border-outline-variant/30 flex flex-col justify-between group transition-all
      ${isExhausted ? 'opacity-60' : 'hover:shadow-md'}
    `}>
      <div className="flex justify-between items-start mb-md">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconColor}`}>
          <span className="material-symbols-outlined text-[28px]">{icon}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
          {badge.label}
        </span>
      </div>
      <div className="mb-lg flex-1">
        <h4 className="text-body-lg font-bold text-on-background mb-1">{offer.title}</h4>
        <p className="text-body-md text-on-surface-variant line-clamp-2">{offer.description}</p>
        {hasQty && offerState && (
          <div className="mt-2 flex items-center gap-1">
            <div className="flex-1 bg-surface-container h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isExhausted ? 'bg-outline' : 'bg-secondary'}`}
                style={{ width: `${offerState.initial_qty ? ((offerState.remaining_qty ?? 0) / offerState.initial_qty) * 100 : 0}%` }}
              />
            </div>
            <span className="text-label-sm text-on-surface-variant ml-1">
              {offerState.remaining_qty}/{offerState.initial_qty} left
            </span>
          </div>
        )}
      </div>
      {!readOnly && (
        <button
          disabled={isExhausted || !onRedeem || !offerState}
          onClick={() => offerState && onRedeem && onRedeem(offerState.id)}
          className={`w-full py-3 rounded-lg font-label-md text-label-md transition-all active:scale-95
            ${isExhausted
              ? 'bg-surface-container text-on-surface-variant cursor-not-allowed'
              : 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container'
            }
          `}
        >
          {isExhausted ? 'Fully Used' : 'Redeem Now'}
        </button>
      )}
    </div>
  );
}
