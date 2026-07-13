'use client';

import { useState } from 'react';
import type { FAQItem } from '@/lib/seo';

interface FAQSectionProps {
  faqs: FAQItem[];
}

export function FAQSection({ faqs }: FAQSectionProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="py-16" style={{ background: '#0D0D0D' }}>
      <div className="max-w-3xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-10">
          <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-3">FAQ</p>
          <h2 className="font-poppins font-black text-3xl sm:text-4xl text-warm-white mb-4">
            Common <span className="text-gold-gradient">Questions</span>
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden transition-all duration-300"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: openIdx === i
                  ? '1px solid rgba(201,162,39,0.5)'
                  : '1px solid rgba(201,162,39,0.15)',
              }}
            >
              <button
                className="w-full text-left px-6 py-4 flex items-center justify-between gap-4"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                aria-expanded={openIdx === i}
              >
                <span className="font-poppins font-semibold text-warm-white text-sm leading-snug">
                  {faq.question}
                </span>
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300"
                  style={{
                    background: openIdx === i
                      ? 'linear-gradient(135deg, #D4AF37, #C9A227)'
                      : 'rgba(201,162,39,0.1)',
                    transform: openIdx === i ? 'rotate(45deg)' : 'rotate(0deg)',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1v10M1 6h10" stroke={openIdx === i ? '#0D0D0D' : '#C9A227'} strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
              </button>

              <div
                className="overflow-hidden transition-all duration-300"
                style={{ maxHeight: openIdx === i ? '400px' : '0' }}
              >
                <p className="px-6 pb-5 text-warm-grey text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
