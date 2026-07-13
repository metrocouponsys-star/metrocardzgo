'use client';

import React, { useEffect, useRef, useState } from 'react';

const STEPS = [
  {
    num: '01',
    title: 'Share Your Brand',
    desc: 'Send us your logo, brand colours, and any design ideas. We handle the rest.',
    icon: '✦',
  },
  {
    num: '02',
    title: 'We Design',
    desc: 'Our designers craft a premium card mockup tailored to your business identity.',
    icon: '◈',
  },
  {
    num: '03',
    title: 'Advanced Printing',
    desc: 'Gold foil, holograms, QR codes, chips — printed to the highest standard.',
    icon: '◉',
  },
  {
    num: '04',
    title: 'Delivered & Activated',
    desc: 'Cards delivered to your door, ready to hand out to your members.',
    icon: '✔',
  },
];

export const HowItWorksSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = stepsRef.current.indexOf(entry.target as HTMLDivElement);
            if (idx !== -1) setActiveStep(idx);
          }
        });
      },
      { threshold: 0.6 }
    );
    stepsRef.current.forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="process" ref={sectionRef} className="py-24 overflow-hidden" style={{ background: 'linear-gradient(180deg, #0D0D0D 0%, #0f0c00 50%, #0D0D0D 100%)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-3">Simple Process</p>
          <h2 className="font-poppins font-black text-4xl sm:text-5xl text-warm-white mb-4">
            How It <span className="text-gold-gradient">Works</span>
          </h2>
          <p className="text-warm-grey text-base max-w-lg mx-auto">
            From your brand brief to cards in your hands — in just 4 simple steps.
          </p>
        </div>

        {/* Desktop: horizontal timeline */}
        <div className="hidden md:block relative">
          {/* Connector line */}
          <div className="absolute top-10 left-[calc(12.5%)] right-[calc(12.5%)] h-px" style={{ background: 'rgba(201,162,39,0.15)' }}>
            {/* Active progress */}
            <div
              className="h-full transition-all duration-700"
              style={{
                width: `${(activeStep / (STEPS.length - 1)) * 100}%`,
                background: 'linear-gradient(90deg, #C9A227, #D4AF37)',
                boxShadow: '0 0 8px rgba(201,162,39,0.5)',
              }}
            />
          </div>

          <div className="grid grid-cols-4 gap-6">
            {STEPS.map((step, i) => {
              const done = i <= activeStep;
              return (
                <div
                  key={step.num}
                  ref={el => { stepsRef.current[i] = el; }}
                  className="flex flex-col items-center text-center cursor-pointer group"
                  onClick={() => setActiveStep(i)}
                >
                  {/* Circle */}
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-2xl mb-6 transition-all duration-500 relative z-10"
                    style={{
                      background: done ? 'linear-gradient(135deg, #D4AF37, #C9A227)' : 'rgba(201,162,39,0.08)',
                      border: done ? '2px solid #C9A227' : '2px solid rgba(201,162,39,0.2)',
                      boxShadow: done ? '0 0 30px rgba(201,162,39,0.4)' : 'none',
                      transform: done ? 'scale(1.05)' : 'scale(1)',
                    }}
                  >
                    <span style={{ color: done ? '#0D0D0D' : 'rgba(201,162,39,0.5)', fontSize: 20 }}>{step.icon}</span>
                  </div>

                  {/* Step number */}
                  <span className="font-poppins font-black text-xs tracking-widest mb-2 transition-colors duration-300" style={{ color: done ? '#C9A227' : 'rgba(201,162,39,0.3)' }}>
                    STEP {step.num}
                  </span>

                  {/* Title */}
                  <h3 className="font-poppins font-bold text-base mb-2 transition-colors duration-300" style={{ color: done ? '#FAF7EF' : 'rgba(250,247,239,0.4)' }}>
                    {step.title}
                  </h3>

                  {/* Desc */}
                  <p className="text-sm leading-relaxed transition-colors duration-300" style={{ color: done ? 'rgba(250,247,239,0.6)' : 'rgba(250,247,239,0.25)' }}>
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile: vertical timeline */}
        <div className="md:hidden space-y-0">
          {STEPS.map((step, i) => {
            const done = i <= activeStep;
            return (
              <div key={step.num} className="flex gap-4">
                {/* Line + circle */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500"
                    style={{
                      background: done ? 'linear-gradient(135deg, #D4AF37, #C9A227)' : 'rgba(201,162,39,0.08)',
                      border: done ? '2px solid #C9A227' : '2px solid rgba(201,162,39,0.2)',
                    }}
                  >
                    <span style={{ color: done ? '#0D0D0D' : 'rgba(201,162,39,0.4)', fontSize: 16 }}>{step.icon}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="w-px flex-1 my-1" style={{ background: done ? 'rgba(201,162,39,0.5)' : 'rgba(201,162,39,0.1)', minHeight: 40 }} />
                  )}
                </div>
                {/* Content */}
                <div className="pb-8 pt-1">
                  <span className="text-xs font-semibold tracking-widest" style={{ color: done ? '#C9A227' : 'rgba(201,162,39,0.3)' }}>STEP {step.num}</span>
                  <h3 className="font-poppins font-bold text-base text-warm-white mt-1 mb-1">{step.title}</h3>
                  <p className="text-warm-grey text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-14">
          <button
            onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 rounded-full font-poppins font-bold text-rich-black transition-all duration-200 hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #C9A227)', boxShadow: '0 0 30px rgba(201,162,39,0.3)' }}
          >
            Start My Card Program
          </button>
        </div>
      </div>
    </section>
  );
};
