import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-200">
        <span className="material-symbols-outlined text-[40px]">credit_card_off</span>
      </div>
      <h1 className="text-3xl font-black text-slate-900 mb-2">404 - Page Not Found</h1>
      <p className="text-sm text-slate-500 max-w-xs mb-6 font-medium">
        The page or membership card pass you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wide shadow-md transition-all"
      >
        Return to MetroCardz Home
      </Link>
    </div>
  );
}
