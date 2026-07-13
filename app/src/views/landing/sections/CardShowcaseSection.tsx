'use client';

import React, { useRef, useState } from 'react';

type Category = 'All' | 'Retail' | 'Food & Beverage' | 'Wellness' | 'Healthcare' | 'Automotive';

const CATEGORIES: Category[] = ['All', 'Retail', 'Food & Beverage', 'Wellness', 'Healthcare', 'Automotive'];

// All cards — mapped to actual images in /public/images/cards/
const CARDS = [
  {
    id: 'membership',
    name: 'Metro Cardz',
    type: 'Universal Loyalty Card',
    category: 'Retail' as Category,
    image: '/images/cards/membership.png',
    desc: 'Mumbai\'s Best Deals & Experiences',
  },
  {
    id: 'vip',
    name: 'VIP Membership',
    type: 'Premium Membership',
    category: 'Retail' as Category,
    image: '/images/cards/vip.jpeg',
    desc: 'Exclusive Gold Member Privileges',
  },
  {
    id: 'jewellery',
    name: 'Sundaram Jewellers',
    type: 'Jewellery Membership',
    category: 'Retail' as Category,
    image: '/images/cards/jewellery.jpeg',
    desc: 'VIP Membership — Shine Every Day',
  },
  {
    id: 'supermarket',
    name: 'R-Mart',
    type: 'Supermarket Value Card',
    category: 'Retail' as Category,
    image: '/images/cards/supermarket.jpeg',
    desc: 'Farm to Kitchen — Save on Every Visit',
  },
  {
    id: 'salon',
    name: 'Black Swan Salon',
    type: 'Salon Membership',
    category: 'Wellness' as Category,
    image: '/images/cards/salon.jpeg',
    desc: 'Gold VIP Members Only',
  },
  {
    id: 'gym',
    name: 'Fitness Factory',
    type: 'Fitness Membership',
    category: 'Wellness' as Category,
    image: '/images/cards/gym.jpeg',
    desc: 'Cardio · Steam · Personal Training',
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    type: 'Dining Loyalty Card',
    category: 'Food & Beverage' as Category,
    image: '/images/cards/restaurant.jpeg',
    desc: 'Save Rs. 3700/- on Dining',
  },
  {
    id: 'gift',
    name: 'Bon Appétit',
    type: 'Restaurant Gift Card',
    category: 'Food & Beverage' as Category,
    image: '/images/cards/gift.jpeg',
    desc: 'Cafe Alfresco — Est. 1995',
  },
  {
    id: 'healthcare',
    name: 'Dental Care',
    type: 'Healthcare Card',
    category: 'Healthcare' as Category,
    image: '/images/cards/healthcare.jpeg',
    desc: 'Free Checkup & Special Discounts',
  },
  {
    id: 'automotive',
    name: 'Shree Motors',
    type: 'Automotive Service Card',
    category: 'Automotive' as Category,
    image: '/images/cards/automotive.jpeg',
    desc: 'All Brand 2, 3, 4 Wheelers',
  },
];

interface SampleCardProps {
  card: typeof CARDS[0];
  active: boolean;
}

const SampleCard: React.FC<SampleCardProps> = ({ card, active }) => {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const W = active ? 280 : 236;
  const H = active ? 176 : 149; // credit card ratio ~1.586:1

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setTilt({
      rx: -((e.clientY - cy) / (rect.height / 2)) * 8,
      ry: ((e.clientX - cx) / (rect.width / 2)) * 8,
    });
  };

  const onMouseLeave = () => setTilt({ rx: 0, ry: 0 });

  return (
    <div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="flex-shrink-0 cursor-pointer select-none"
      style={{
        width: W,
        height: H,
        transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
        transform: `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${active ? 1 : 0.92})`,
        filter: active
          ? 'brightness(1) drop-shadow(0 8px 24px rgba(0,0,0,0.45)) drop-shadow(0 2px 6px rgba(201,162,39,0.3))'
          : 'brightness(0.55) drop-shadow(0 4px 10px rgba(0,0,0,0.4))',
      }}
    >
      <img
        src={card.image}
        alt={card.name}
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: 14,
          display: 'block',
          userSelect: 'none',
          WebkitUserDrag: 'none' as React.CSSProperties['userSelect'],
        } as React.CSSProperties}
      />
    </div>
  );
};

export const CardShowcaseSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [activeIdx, setActiveIdx] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const filtered = CARDS.filter(c => activeCategory === 'All' || c.category === activeCategory);

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (trackRef.current?.offsetLeft ?? 0);
    scrollLeft.current = trackRef.current?.scrollLeft ?? 0;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - (trackRef.current.offsetLeft ?? 0);
    const walk = (x - startX.current) * 1.5;
    trackRef.current.scrollLeft = scrollLeft.current - walk;
  };
  const onMouseUp = () => { isDragging.current = false; };

  return (
    <section id="cards" className="py-24 overflow-hidden" style={{ background: '#0D0D0D' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header */}
        <div className="text-center mb-12 reveal-up">
          <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-3">Sample Cards</p>
          <h2 className="font-poppins font-black text-4xl sm:text-5xl text-warm-white mb-4">
            Card <span className="text-gold-gradient">Showcase</span>
          </h2>
          <p className="text-warm-grey text-base max-w-xl mx-auto">
            Drag to browse our premium card designs. Every card is fully customised to your brand.
          </p>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 flex-wrap justify-center mb-10">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setActiveIdx(0); }}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
              style={activeCategory === cat
                ? { background: 'linear-gradient(135deg, #D4AF37, #C9A227)', color: '#0D0D0D', fontWeight: 700 }
                : { background: 'rgba(201,162,39,0.08)', color: 'rgba(201,162,39,0.7)', border: '1px solid rgba(201,162,39,0.2)' }
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Draggable carousel */}
        <div
          ref={trackRef}
          className="flex gap-6 overflow-x-auto hide-scrollbar py-8 cursor-grab active:cursor-grabbing select-none"
          style={{ scrollBehavior: 'smooth' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <div className="flex-shrink-0 w-8" />
          {filtered.map((card, i) => (
            <div key={card.id} onClick={() => setActiveIdx(i)}>
              <SampleCard card={card} active={i === activeIdx} />
            </div>
          ))}
          <div className="flex-shrink-0 w-8" />
        </div>

        {/* Dot pagination */}
        <div className="flex justify-center gap-2 mt-2">
          {filtered.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === activeIdx ? 24 : 6,
                height: 6,
                background: i === activeIdx ? '#C9A227' : 'rgba(201,162,39,0.25)',
              }}
            />
          ))}
        </div>

        {/* Active card info */}
        <div className="text-center mt-8 min-h-14">
          {filtered[activeIdx] && (
            <div className="reveal-up visible">
              <p className="font-poppins font-bold text-warm-white text-lg">{filtered[activeIdx].name}</p>
              <p className="text-gold text-sm font-medium">{filtered[activeIdx].type}</p>
              <p className="text-warm-grey text-xs mt-1">{filtered[activeIdx].desc}</p>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};
