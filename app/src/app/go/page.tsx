import type { Metadata } from 'next';
import { GoLandingClient } from './GoLandingClient';

export const metadata: Metadata = {
  title: 'Metro Cardz GO — Explore Deals & Experiences',
  description: 'Discover exclusive deals, restaurants, resorts, water parks, and member-only experiences across Mumbai and beyond.',
};

export default function GoPage() {
  return <GoLandingClient />;
}
