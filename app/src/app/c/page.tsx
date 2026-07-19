'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import * as api from '@/api';

function CardRedirectContent() {
  const searchParams = useSearchParams();
  const cardNumber = searchParams?.get('n') || '';

  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardData, setCardData] = useState<any | null>(null);

  useEffect(() => {
    if (!cardNumber) {
      setError('No card number specified in the link.');
      setLoading(false);
      return;
    }
    
    // Normalize: remove spaces and non-digits
    const normalized = cardNumber.replace(/\D/g, '');
    if (normalized.length !== 16) {
      setError('Invalid card number format. Must be 16 digits.');
      setLoading(false);
      return;
    }

    api.resolveCardNumber(normalized)
      .then((data) => {
        setCardData(data);
        
        // Handle redirection logic
        if (data.status === 'member_linked') {
          // Case 1: Merchant user is logged in
          if (isAuthenticated && user?.merchant_id === data.merchant_id) {
            window.location.href = `/members/${data.member_id}/`;
          } else {
            // Case 2: Public customer scan
            window.location.href = `/m/${data.public_token}/`;
          }
        } else {
          // Card is not linked (status: merchant_allocated or unassigned)
          setLoading(false);
        }
      })
      .catch((err) => {
        setError(err.message || 'Could not recognize this card.');
        setLoading(false);
      });
  }, [cardNumber, isAuthenticated, user]);

  if (loading) {
    return (
      <div className="text-center space-y-4 animate-pulse">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-[#C9A227] animate-spin" />
        </div>
        <p className="text-lg font-medium text-warm-grey">Reading Card Identity...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md w-full text-center space-y-6 bg-[#111111] p-8 rounded-2xl border border-error/20">
        <div className="w-20 h-20 rounded-full bg-error-container/10 flex items-center justify-center mx-auto text-error">
          <span className="material-symbols-outlined text-[40px]">credit_card_off</span>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-poppins text-[#FAF7EF]">Lookup Failed</h2>
          <p className="text-body-md text-warm-grey">{error}</p>
        </div>
        <button onClick={() => window.location.href = '/'} className="btn-outline w-full py-2.5">
          Back to Home
        </button>
      </div>
    );
  }

  // Card is NOT linked (status is 'merchant_allocated' or 'unassigned')
  return (
    <div className="max-w-md w-full text-center space-y-6 bg-[#111111] p-8 rounded-2xl border border-[#C9A227]/25">
      <div className="w-20 h-20 rounded-full bg-[#C9A227]/10 flex items-center justify-center mx-auto text-[#C9A227] animate-pulse">
        <span className="material-symbols-outlined text-[40px]">lock_open</span>
      </div>
      
      <div className="space-y-2">
        <h2 className="text-2xl font-bold font-poppins text-[#C9A227]">Card Not Activated</h2>
        <p className="text-body-sm text-warm-grey font-mono bg-white/5 py-1 px-3 rounded inline-block">
          {cardData?.card_number}
        </p>
        {cardData?.business_name ? (
          <p className="text-body-md text-warm-grey pt-2">
            This card has been allocated to <strong className="text-[#FAF7EF]">{cardData.business_name}</strong> but is not yet assigned to any member.
          </p>
        ) : (
          <p className="text-body-md text-warm-grey pt-2">
            This card is registered in the system but has not yet been allocated to any merchant.
          </p>
        )}
      </div>

      {/* If logged-in merchant is scanning their own allocated card, offer direct link shortcut */}
      {isAuthenticated && user?.merchant_id === cardData?.merchant_id ? (
        <div className="space-y-3 pt-4">
          <button 
            onClick={() => window.location.href = `/members/new/?card_id=${cardData?.id}`} 
            className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Register Member with Card
          </button>
          <button 
            onClick={() => window.location.href = '/cards/'} 
            className="btn-outline w-full py-2.5"
          >
            Assign to Existing Member
          </button>
        </div>
      ) : (
        <div className="space-y-3 pt-4">
          <p className="text-xs text-warm-grey/60">
            If you are a customer, please hand this card back to the store executive to activate your loyalty account.
          </p>
          <button onClick={() => window.location.href = '/'} className="btn-outline w-full py-2.5">
            Back to Home
          </button>
        </div>
      )}
    </div>
  );
}

export default function CardRedirectPage() {
  return (
    <div className="landing-root min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center text-[#FAF7EF] px-4">
      <Suspense fallback={
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-[#C9A227] animate-spin" />
          </div>
          <p className="text-lg font-medium text-warm-grey">Initializing redirect...</p>
        </div>
      }>
        <CardRedirectContent />
      </Suspense>
    </div>
  );
}
