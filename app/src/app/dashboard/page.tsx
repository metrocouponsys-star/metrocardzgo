import { redirect } from 'next/navigation';

/**
 * /dashboard → redirects to /portal/dashboard (the actual SPA route)
 * This prevents a second BrowserRouter mounting at this URL.
 */
export default function DashboardRedirectPage() {
  redirect('/portal/dashboard');
}
