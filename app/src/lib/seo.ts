// ─── SEO Utilities for MetroCardz ────────────────────────────────────────────
// All JSON-LD schema builders and metadata helpers live here.
// Usage: import { localBusinessSchema, buildFAQSchema, buildBreadcrumbSchema } from '@/lib/seo';

export const SITE_URL = 'https://www.metrocardz.in';
export const BRAND_NAME = 'MetroCardz';
export const BRAND_PHONE = '+91-98765-43210'; // TODO: replace with real number
export const BRAND_EMAIL = 'hello@metrocardz.in';
export const BRAND_LOGO = `${SITE_URL}/logo.png`;

// ─── LocalBusiness schema (used on every page) ───────────────────────────────
export const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: BRAND_NAME,
  image: BRAND_LOGO,
  url: SITE_URL,
  telephone: BRAND_PHONE,
  email: BRAND_EMAIL,
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'IN',
  },
  areaServed: 'IN',
  description:
    'MetroCardz designs and prints custom membership, loyalty, and gift cards for retail stores, restaurants, salons, gyms, hospitals, and supermarkets across India. Gold foil, QR codes, holograms — all in your brand.',
  priceRange: '₹₹',
  sameAs: [
    'https://www.instagram.com/metrocardz',
    'https://www.facebook.com/metrocardz',
  ],
};

// ─── Product schema builder ───────────────────────────────────────────────────
export interface ProductSchemaInput {
  name: string;
  description: string;
  image: string;
  category: string;
  url: string;
}

export function buildProductSchema(products: ProductSchemaInput[]) {
  return products.map((p) => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    image: p.image,
    category: p.category,
    url: p.url,
    brand: {
      '@type': 'Brand',
      name: BRAND_NAME,
    },
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'INR',
      areaServed: 'IN',
    },
  }));
}

// ─── FAQPage schema builder ───────────────────────────────────────────────────
export interface FAQItem {
  question: string;
  answer: string;
}

export function buildFAQSchema(faqs: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// ─── BreadcrumbList schema builder ───────────────────────────────────────────
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ─── generateMetadata helpers ─────────────────────────────────────────────────
export function buildOpenGraph(opts: {
  title: string;
  description: string;
  url: string;
  image?: string;
}) {
  return {
    title: opts.title,
    description: opts.description,
    url: opts.url,
    siteName: BRAND_NAME,
    images: [
      {
        url: opts.image ?? `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: opts.title,
      },
    ],
    locale: 'en_IN',
    type: 'website' as const,
  };
}

// ─── Industry page data ───────────────────────────────────────────────────────
export interface IndustryPage {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  introParagraph: string;
  secondParagraph: string;
  features: string[];
  faqs: FAQItem[];
  primaryKeyword: string;
  productName: string;
  productDescription: string;
}

export const INDUSTRY_PAGES: IndustryPage[] = [
  {
    slug: 'gym-membership-cards',
    title: 'Gym Membership Cards',
    metaTitle: 'Gym Membership Card Design & Printing | MetroCardz',
    metaDescription:
      'Custom gym membership cards with gold foil, QR codes, and your branding. Minimum 100 cards. Free design mockup. Get yours in 5–7 days. Get a free design mockup today.',
    h1: 'Custom Gym Membership Cards, Designed & Printed for You',
    introParagraph:
      'A premium gym membership card reinforces your fitness club\'s brand every time a member pulls it out. MetroCardz prints custom gym cards with gold foil, chip or QR code, and your logo — minimum 100 cards, delivered in 5–7 business days.',
    secondParagraph:
      'From single-location studios to multi-chain fitness centres, we design gym PVC cards that members keep in their wallets and actually show off. Choose from standard PVC, frosted matte, or premium embossed finishes.',
    features: [
      'Gold foil or colour-fill branding',
      'QR code linked to your loyalty app or check-in system',
      'Membership tier colours (Silver, Gold, Platinum)',
      'Offer grid on the back (class discounts, guest passes)',
      'NFC/chip options for contactless check-in',
      'Minimum order: 100 cards',
    ],
    faqs: [
      {
        question: 'How long does printing take for gym membership cards?',
        answer:
          'Standard turnaround is 5–7 business days after design approval. Rush orders in 3 business days are available on request.',
      },
      {
        question: 'What is the minimum order quantity for gym cards?',
        answer:
          'The minimum order is 100 cards. Volume discounts apply from 500 cards onwards.',
      },
      {
        question: 'Can I add a QR code and membership tier to the gym card?',
        answer:
          'Yes — every card can carry a QR code, barcode, or NFC chip linked to your management system, plus tier labels (Silver, Gold, Platinum) and an offer grid on the back.',
      },
      {
        question: 'What card material options are available?',
        answer:
          'We offer standard 0.76 mm PVC, frosted matte PVC, and premium 0.84 mm PVC. All are credit-card sized (CR80 standard) and wallet-ready.',
      },
    ],
    primaryKeyword: 'gym membership card design',
    productName: 'Custom Gym Membership Card',
    productDescription:
      'Premium PVC gym membership card with gold foil branding, QR code, and custom member tier design for fitness clubs and gyms across India.',
  },
  {
    slug: 'salon-membership-cards',
    title: 'Salon Membership Cards',
    metaTitle: 'Salon Membership Card Design & Printing | MetroCardz',
    metaDescription:
      'Custom salon and spa membership cards with luxury finishes. Beauty parlour loyalty cards with your brand. Free design mockup. Get a free design mockup today.',
    h1: 'Luxury Salon & Spa Membership Cards, Printed to Impress',
    introParagraph:
      'Turn every salon visit into a branded moment. MetroCardz prints custom salon membership cards with rose-gold foil, hologram finishes, and loyalty offer grids — perfect for beauty parlours, spas, and wellness studios across India.',
    secondParagraph:
      'Our salon cards are designed to feel as premium as the services you offer. Every card features your branding on the front and a personalised offer grid on the back — giving clients a reason to return.',
    features: [
      'Rose-gold or classic gold foil finish',
      'Hologram sticker for authenticity',
      'Loyalty points / visit tracker on back',
      'Services menu snippet (blow-dry, facial, etc.)',
      'Custom member name personalisation available',
      'Minimum order: 100 cards',
    ],
    faqs: [
      {
        question: 'How long does it take to print salon membership cards?',
        answer:
          'Standard delivery is 5–7 business days after design approval. Rush 3-day turnaround is available for urgent orders.',
      },
      {
        question: 'Can I personalise each card with the client\'s name?',
        answer:
          'Yes — variable data printing lets us personalise each card with the client\'s name, member number, or tier level at no extra setup cost.',
      },
      {
        question: 'What loyalty features can I include on the back of the card?',
        answer:
          'The back can carry a stamp/visit grid, QR code for a digital loyalty wallet, service discount list, referral code, or any combination you choose.',
      },
      {
        question: 'What is the minimum order for salon cards?',
        answer:
          'Minimum order is 100 cards. Bulk pricing applies from 500 cards onwards.',
      },
    ],
    primaryKeyword: 'salon membership card design',
    productName: 'Custom Salon & Spa Membership Card',
    productDescription:
      'Luxury PVC membership card with gold foil or hologram finish for salons, beauty parlours, and spas. Custom branding with loyalty offer grid.',
  },
  {
    slug: 'restaurant-loyalty-cards',
    title: 'Restaurant Loyalty Cards',
    metaTitle: 'Restaurant Loyalty Card Printing | MetroCardz',
    metaDescription:
      'Custom restaurant loyalty cards with QR codes and offer grids. Café punch cards and dining membership cards printed in India. Get a free design mockup today.',
    h1: 'Custom Restaurant Loyalty Cards — Drive Repeat Visits',
    introParagraph:
      'A well-designed restaurant loyalty card keeps customers coming back for the next visit. MetroCardz prints custom dining cards with buy-1-get-1 offer grids, QR codes for digital punch, and premium foil finishes that match your restaurant\'s identity.',
    secondParagraph:
      'From fine-dining restaurants to neighbourhood cafés and quick-service chains, our cards are designed to be shown off at the counter. Offer grids, stamp boxes, QR codes, and member IDs — all on a wallet-sized PVC card.',
    features: [
      'Buy-1-get-1 and offer grid on card back',
      'QR code for digital menu or loyalty programme',
      'Stamp boxes for punch-card loyalty',
      'Gold or colour-matched foil branding',
      'Chef\'s special / seasonal offer panels',
      'Minimum order: 100 cards',
    ],
    faqs: [
      {
        question: 'How long does restaurant loyalty card printing take?',
        answer:
          'Standard turnaround is 5–7 business days after design approval. Rush orders can be ready in 3 business days.',
      },
      {
        question: 'Can I add a QR code to my restaurant card?',
        answer:
          'Yes — QR codes can link to your digital menu, Google review page, loyalty app, or any URL you choose. Barcodes are also available.',
      },
      {
        question: 'What is the minimum order quantity for restaurant loyalty cards?',
        answer:
          'Minimum order is 100 cards. Discounted pricing is available for orders of 500 cards and above.',
      },
      {
        question: 'Can the offer grid on the back be customised?',
        answer:
          'Fully. You can specify up to 6 offer boxes on the back — e.g. "10% off", "Free Dessert", "2X Points", "Buy 1 Get 1" — designed to your menu and season.',
      },
    ],
    primaryKeyword: 'restaurant loyalty card printing',
    productName: 'Custom Restaurant Loyalty Card',
    productDescription:
      'PVC restaurant loyalty card with gold foil, QR code, offer grid, and custom branding for restaurants, cafés, and dining establishments.',
  },
  {
    slug: 'retail-gift-cards',
    title: 'Retail Gift Cards',
    metaTitle: 'Custom Gift Card Printing for Retail Stores | MetroCardz',
    metaDescription:
      'Custom retail gift cards and loyalty cards printed in India. Jewellery store, fashion retail, and chain store gift cards with gold foil. Get a free design mockup today.',
    h1: 'Custom Retail Gift & Loyalty Cards — Your Brand in Every Wallet',
    introParagraph:
      'Gift cards are the highest-converting retail tool — and a beautifully designed one doubles as a brand ambassador. MetroCardz prints custom retail gift and loyalty cards with gold foil, barcode, and premium finishes for fashion stores, jewellery shops, and retail chains.',
    secondParagraph:
      'Every retail card we produce carries your store\'s branding, value denomination panel, and a unique barcode or QR code for redemption tracking — all on a wallet-sized PVC card that customers are proud to hand as a gift.',
    features: [
      'Value denomination panel (fixed or blank for staff fill)',
      'Barcode or QR code for POS integration',
      'Gold or silver foil finish',
      'Expiry and T&C text on back',
      'Seasonal design variants (Diwali, Wedding, Anniversary)',
      'Minimum order: 100 cards',
    ],
    faqs: [
      {
        question: 'How long does custom gift card printing take?',
        answer:
          'Standard delivery is 5–7 business days after design approval. Express 3-day turnaround is available.',
      },
      {
        question: 'Can I print seasonal gift card designs for Diwali or weddings?',
        answer:
          'Absolutely — seasonal design variants are our most popular option for retailers. We can run multiple designs in a single order with different denominations or occasions.',
      },
      {
        question: 'What is the minimum order for retail gift cards?',
        answer:
          'Minimum is 100 cards per design. You can order multiple designs in a single batch — e.g. 200 Diwali + 200 Wedding.',
      },
      {
        question: 'Can the gift cards integrate with my POS system?',
        answer:
          'We print barcodes or QR codes to your specification. The integration with your POS or loyalty software is managed on your end — we supply the correctly formatted code on each card.',
      },
    ],
    primaryKeyword: 'custom gift card printing',
    productName: 'Custom Retail Gift Card',
    productDescription:
      'Premium PVC gift and loyalty cards for retail stores with gold foil, barcode, and custom branding. Suitable for fashion, jewellery, and general retail.',
  },
  {
    slug: 'hospital-health-cards',
    title: 'Hospital Health Cards',
    metaTitle: 'Hospital Health Membership Card Printing | MetroCardz',
    metaDescription:
      'Custom hospital and clinic patient membership cards with QR codes and photo ID. Health checkup and wellness membership cards printed in India. Get a free design mockup today.',
    h1: 'Custom Hospital & Clinic Health Membership Cards',
    introParagraph:
      'A professional health membership card builds patient trust and streamlines clinic operations. MetroCardz prints custom hospital cards with patient photo, QR code, UHN/UHID, and health plan details — designed to the same standard as a bank card.',
    secondParagraph:
      'From single-location clinics to multi-specialty hospitals and diagnostic chains, our health cards serve as patient identity, loyalty, and health-plan certificates in one. Smart chip and NFC options are available for integrated patient management systems.',
    features: [
      'Patient photo with lamination option',
      'QR or barcode linked to patient management system',
      'Health plan / package details on back',
      'Doctor\'s name and department personalisation',
      'NFC/smart chip for integrated EMR access',
      'Minimum order: 100 cards',
    ],
    faqs: [
      {
        question: 'How long does hospital membership card printing take?',
        answer:
          'Standard turnaround is 5–7 business days after design and data approval. Bulk orders for large hospitals may require 10 business days.',
      },
      {
        question: 'Can I include a patient photo on the health card?',
        answer:
          'Yes — we support variable data printing including patient photos. You supply the data in our standard CSV + image format and each card is personalised individually.',
      },
      {
        question: 'What is the minimum order for hospital health cards?',
        answer:
          'Minimum is 100 cards. For personalised cards (with individual names and photos), the minimum is also 100 per batch.',
      },
      {
        question: 'Can the card link to our hospital management software?',
        answer:
          'We print any QR code, barcode (Code 39, Code 128, EAN), or data matrix you specify. The software integration is managed on your end.',
      },
    ],
    primaryKeyword: 'hospital health membership card',
    productName: 'Custom Hospital Health Membership Card',
    productDescription:
      'Professional PVC health membership card for hospitals and clinics with patient photo, QR code, and health plan details.',
  },
  {
    slug: 'supermarket-loyalty-cards',
    title: 'Supermarket Loyalty Cards',
    metaTitle: 'Supermarket Loyalty Card Printing | MetroCardz',
    metaDescription:
      'Custom supermarket and grocery loyalty cards with cashback and points programmes. Retail chain membership cards printed in India. Get a free design mockup today.',
    h1: 'Custom Supermarket Loyalty Cards — Points on Every Purchase',
    introParagraph:
      'A supermarket loyalty card keeps shoppers returning and spending more per visit. MetroCardz prints custom grocery store loyalty cards with cashback panels, QR codes, and your brand — designed to compete with the biggest retail chains.',
    secondParagraph:
      'Our supermarket cards carry a points-accumulation grid or digital QR link on the back, an expiry date panel, and your store\'s branding on the front — all on a credit-card-sized PVC card that your cashiers can scan instantly at checkout.',
    features: [
      'Points / cashback tracker on back',
      'Barcode or QR code for POS scanning',
      'Gold foil or colour-matched branding',
      'Member tier (Regular, Silver, Gold)',
      'Seasonal offer panel',
      'Minimum order: 100 cards',
    ],
    faqs: [
      {
        question: 'How long does supermarket loyalty card printing take?',
        answer:
          'Standard delivery is 5–7 business days after design approval. Rush orders are available in 3 business days.',
      },
      {
        question: 'Can the loyalty card connect to my supermarket POS?',
        answer:
          'Yes — we print barcodes (EAN-13, Code 128) or QR codes to your specification for seamless POS scanning. Software integration is on your side.',
      },
      {
        question: 'What is the minimum order for supermarket loyalty cards?',
        answer:
          'Minimum order is 100 cards. Volume discounts apply from 500 cards and above.',
      },
      {
        question: 'Can I run multiple member tiers on the same card print run?',
        answer:
          'Yes — you can order different tier designs (e.g. Regular, Gold, Platinum) in a single production run, each with distinct colours and tier labels.',
      },
    ],
    primaryKeyword: 'supermarket loyalty card printing',
    productName: 'Custom Supermarket Loyalty Card',
    productDescription:
      'PVC supermarket loyalty card with cashback grid, barcode, and custom branding for grocery stores and retail chains.',
  },
  {
    slug: 'corporate-id-cards',
    title: 'Corporate Membership Cards',
    metaTitle: 'Corporate Membership Card Design & Printing | MetroCardz',
    metaDescription:
      'Custom corporate membership and employee privilege cards with gold foil and NFC. Corporate gift cards and ID cards printed in India. Get a free design mockup today.',
    h1: 'Custom Corporate Membership & Privilege Cards for Businesses',
    introParagraph:
      'A premium corporate membership card signals prestige to clients and partners. MetroCardz prints corporate privilege cards, employee benefit cards, and VIP client cards with gold foil, embossing, and NFC — the kind of card that gets noticed at every business meeting.',
    secondParagraph:
      'From employee privilege programmes to client gifting and conference VIP passes, our corporate cards are printed to the same standard as premium bank cards — with your brand, your colours, and your message.',
    features: [
      'Gold or platinum foil embossing',
      'NFC/smart chip for access control',
      'Executive embossed card numbers',
      'Custom die-cut shapes available',
      'Employee or client name personalisation',
      'Minimum order: 100 cards',
    ],
    faqs: [
      {
        question: 'How long does corporate membership card printing take?',
        answer:
          'Standard turnaround is 5–7 business days. For embossed or NFC-enabled cards, allow 7–10 business days.',
      },
      {
        question: 'Can I personalise each corporate card with a name?',
        answer:
          'Yes — variable data printing allows individual names, designations, employee IDs, or card numbers on each card at no extra setup cost.',
      },
      {
        question: 'What is the minimum order for corporate privilege cards?',
        answer:
          'Minimum is 100 cards. For NFC-enabled or smart-chip cards, the minimum is 200 cards.',
      },
      {
        question: 'Are custom die-cut card shapes available?',
        answer:
          'Yes — we offer standard CR80 (credit card size), mini cards, and custom die-cut shapes for premium corporate gifting programmes.',
      },
    ],
    primaryKeyword: 'corporate membership card design',
    productName: 'Custom Corporate Membership Card',
    productDescription:
      'Premium corporate privilege and membership cards with gold foil, NFC, and custom branding for businesses, employee programmes, and client gifting.',
  },
];
