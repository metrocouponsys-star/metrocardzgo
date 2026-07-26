'use client';
import dynamic from 'next/dynamic';
const MerchantApp = dynamic(() => import('@/views/MerchantApp'), { ssr: false });
export default function AdminRoutePage() { return <MerchantApp />; }
