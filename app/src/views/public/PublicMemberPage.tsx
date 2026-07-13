import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { PublicMemberView } from '../../types';
import * as api from '../../api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { format } from 'date-fns';

const OFFER_ICONS: Record<string, string> = {
  percent_off: 'percent', free_service: 'spa', wallet_points: 'account_balance_wallet',
  referral: 'people', birthday: 'cake',
};

export default function PublicMemberPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicMemberView | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.getPublicMemberView(token).then(d => {
      if (!d) setNotFound(true);
      else setData(d);
      setLoading(false);
    });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-container animate-pulse" />
          <div className="h-4 w-32 bg-surface-container rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-error-container flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-on-error-container text-[40px]">credit_card_off</span>
        </div>
        <h1 className="text-headline-md font-headline-md text-on-surface mb-2">Card Not Recognized</h1>
        <p className="text-body-md text-on-surface-variant max-w-xs">
          This membership card could not be found. Please check the QR code and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="prime-gradient px-4 py-6 text-white text-center relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary-container/20 rounded-full blur-2xl" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-secondary/10 rounded-full blur-2xl" />
        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-white text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
          </div>
          <h1 className="text-headline-md font-headline-md font-bold">{data.merchant_name}</h1>
          <p className="text-body-md opacity-70 mt-0.5">Loyalty Membership</p>
        </div>
      </header>

      {/* Member info */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Expired banner */}
        {data.status === 'expired' && (
          <div className="bg-error-container rounded-xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-on-error-container">warning</span>
            <div>
              <p className="font-bold text-on-error-container">Membership Expired</p>
              <p className="text-body-md text-on-error-container/80">
                Visit {data.merchant_name} to renew your membership and restore access to your benefits.
              </p>
            </div>
          </div>
        )}

        {/* Member card */}
        <div className="card p-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-headline-md">
              {data.member_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-body-lg font-bold">{data.member_name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-bold bg-secondary text-on-secondary">
                  {data.membership_type_name}
                </span>
                <StatusBadge status={data.status} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-container rounded-xl p-3">
              <p className="text-label-sm text-on-surface-variant mb-1">Loyalty Points</p>
              <p className="text-headline-md font-headline-md text-primary">{data.loyalty_points.toLocaleString()} pts</p>
            </div>
            <div className="bg-surface-container rounded-xl p-3">
              <p className="text-label-sm text-on-surface-variant mb-1">
                {data.status === 'expired' ? 'Expired On' : 'Valid Until'}
              </p>
              <p className="text-body-lg font-bold text-on-surface">{format(new Date(data.expiry_date), 'dd MMM yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Offers */}
        {data.offers.length > 0 && data.status !== 'expired' && (
          <div>
            <h3 className="section-title mb-3">Your Benefits</h3>
            <div className="space-y-3">
              {data.offers.map(offer => (
                <div key={offer.id} className="card p-md flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[20px]">{OFFER_ICONS[offer.offer_type] || 'star'}</span>
                  </div>
                  <div>
                    <p className="text-body-md font-bold">{offer.title}</p>
                    <p className="text-body-md text-on-surface-variant">{offer.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4 border-t border-outline-variant/30">
          {data.merchant_phone && (
            <p className="text-body-md text-on-surface-variant mb-1">
              Questions? Call <a href={`tel:${data.merchant_phone}`} className="text-primary font-bold">{data.merchant_phone}</a>
            </p>
          )}
          <p className="text-label-sm text-on-surface-variant">Powered by Metro Cardz</p>
        </div>
      </div>
    </div>
  );
}
