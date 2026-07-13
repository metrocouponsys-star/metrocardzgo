'use client';

import React, { useEffect } from 'react';
import { LandingNavbar } from './components/LandingNavbar';
import { LandingFooter } from './components/LandingFooter';
import { HeroSection } from './sections/HeroSection';
import { TrustStripSection } from './sections/TrustStripSection';
import { CardShowcaseSection } from './sections/CardShowcaseSection';
import { FlipDemoSection } from './sections/FlipDemoSection';
import { PrintedGallerySection } from './sections/PrintedGallerySection';
import { IndustriesSection } from './sections/IndustriesSection';
import { HowItWorksSection } from './sections/HowItWorksSection';
import { PricingSection } from './sections/PricingSection';
import { TestimonialsSection } from './sections/TestimonialsSection';
import { ContactSection } from './sections/ContactSection';

// Initialise IntersectionObserver for .reveal-up elements
function useRevealOnScroll() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    // Observe after a tick so all sections are mounted
    const t = setTimeout(() => {
      document.querySelectorAll('.reveal-up').forEach(el => observer.observe(el));
    }, 100);

    return () => {
      clearTimeout(t);
      observer.disconnect();
    };
  }, []);
}

export const LandingPage: React.FC = () => {
  useRevealOnScroll();

  // Smooth-scroll override for anchor links (Lenis-like feel with native API)
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  return (
    <div className="landing-root" style={{ overflowX: 'hidden' }}>
      <LandingNavbar />

      <main>
        <HeroSection />
        <TrustStripSection />
        <CardShowcaseSection />
        <FlipDemoSection />
        <PrintedGallerySection />
        <IndustriesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
        <ContactSection />
      </main>

      <LandingFooter />
    </div>
  );
};

export default LandingPage;
