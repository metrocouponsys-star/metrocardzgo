'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface IndustryDemoButtonProps {
  slug: string;
  industryTitle: string;
}

const DEMO_ACCOUNTS_MAP: Record<string, { phone: string; pass: string; businessName: string; icon: string }> = {
  'hospital-health-cards': { phone: '9876500001', pass: 'demo123', businessName: 'Metro Insurance Agency', icon: '🛡️' },
  'corporate-id-cards': { phone: '9876500002', pass: 'demo123', businessName: 'Metro Realty & Advisory', icon: '🏢' },
  'travels-vacations-cards': { phone: '9876500003', pass: 'demo123', businessName: 'Metro Travels & Vacations', icon: '✈️' },
  'ac-services-hvac-cards': { phone: '9876500004', pass: 'demo123', businessName: 'Metro AC & Home Services', icon: '❄️' },
  'supermarket-loyalty-cards': { phone: '9876500005', pass: 'demo123', businessName: 'Metro Supermarket & Hypermart', icon: '🛒' },
  'gym-membership-cards': { phone: '9876500006', pass: 'demo123', businessName: 'Metro Gym & Fitness Club', icon: '🏋️' },
  'salon-membership-cards': { phone: '9876543210', pass: 'demo123', businessName: 'Glamour Salon & Spa', icon: '✂️' },
  'automobile-detailing-cards': { phone: '9876500008', pass: 'demo123', businessName: 'Metro Auto Garage & Detailing', icon: '🚗' },
  'restaurant-loyalty-cards': { phone: '9876500009', pass: 'demo123', businessName: 'Metro Roasters & Fine Dining', icon: '☕' },
  'retail-gift-cards': { phone: '9876500010', pass: 'demo123', businessName: 'Metro Jewels & Diamond Heritage', icon: '💎' },
  'garments-loyalty-cards': { phone: '9876500011', pass: 'demo123', businessName: 'Metro Fashion & Garments', icon: '👔' },
  'boutique-loyalty-cards': { phone: '9876500012', pass: 'demo123', businessName: 'Royal Bridal Boutique', icon: '👗' },
  'optician-loyalty-cards': { phone: '9876500013', pass: 'demo123', businessName: 'Vision Craft Opticians', icon: '👓' },
  'footwear-loyalty-cards': { phone: '9876500014', pass: 'demo123', businessName: 'Sole Comfort Footwear Lounge', icon: '👟' },
  'dental-loyalty-cards': { phone: '9876500015', pass: 'demo123', businessName: 'Apex Dental Studio & Smile Clinic', icon: '🦷' },
  'mobile-electronics-cards': { phone: '9876500016', pass: 'demo123', businessName: 'Metro Mobile & Electronics Hub', icon: '📱' },
};

export function IndustryDemoButton({ slug, industryTitle }: IndustryDemoButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const demoInfo = DEMO_ACCOUNTS_MAP[slug] || {
    phone: '9876543210',
    pass: 'demo123',
    businessName: `${industryTitle} Demo`,
    icon: '⚡',
  };

  const handleLaunchDemo = async () => {
    setLoading(true);
    try {
      // Dynamic import api and store to work on client-side
      const api = await import('@/api');
      const authStore = await import('@/store/authStore');
      const toastStore = await import('@/store/toastStore');

      const authResult = await api.login(demoInfo.phone, demoInfo.pass);
      authStore.useAuthStore.getState().setAuth(authResult.user, authResult.token);
      toastStore.useToastStore.getState().addToast('success', `Logged in to ${demoInfo.businessName} Demo! 👋`);
      
      router.push('/dashboard');
    } catch (e: any) {
      console.error(e);
      // Fallback redirect to login with query param
      router.push(`/login?phone=${demoInfo.phone}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 p-5 rounded-2xl border border-gold/30 bg-gradient-to-r from-gold/10 via-black to-gold/5 max-w-2xl">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{demoInfo.icon}</span>
        <div>
          <h3 className="font-poppins font-bold text-warm-white text-base">
            Test {demoInfo.businessName} Live Demo
          </h3>
          <p className="text-warm-white/60 text-xs">
            Instant merchant access with pre-configured dummy member cards, loyalty points & active offers.
          </p>
        </div>
      </div>
      
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleLaunchDemo}
          disabled={loading}
          className="px-6 py-2.5 rounded-full font-poppins font-bold text-xs text-rich-black inline-flex items-center gap-2 transition-all duration-200 hover:scale-105 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C9A227 100%)', boxShadow: '0 0 15px rgba(201,162,39,0.3)' }}
        >
          {loading ? (
            <span>Launching Demo...</span>
          ) : (
            <>
              <span>⚡ Launch Interactive Merchant Demo</span>
              <span>→</span>
            </>
          )}
        </button>
        <span className="text-warm-grey/50 text-xs">No signup required</span>
      </div>
    </div>
  );
}
