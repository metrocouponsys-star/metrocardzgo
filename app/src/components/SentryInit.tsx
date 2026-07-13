'use client';

import { useEffect } from 'react';

/**
 * Client-side Sentry initialization component.
 * Renders nothing — only initializes the Sentry SDK.
 * Must be a client component because Sentry SDK uses browser APIs.
 */
export default function SentryInit() {
  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_ENABLE_SENTRY !== 'true' ||
      !process.env.NEXT_PUBLIC_SENTRY_DSN
    ) {
      return;
    }

    // Lazy-load Sentry to avoid impact on bundle size when disabled
    import('@sentry/react').then((Sentry) => {
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: process.env.NEXT_PUBLIC_APP_ENV || 'production',
        // Only trace 10% of requests to avoid quota overuse on free tier
        tracesSampleRate: 0.1,
        // Replay only sessions that had an error
        replaysOnErrorSampleRate: 1.0,
        // Strip PII from error reports
        beforeSend(event) {
          // Remove any phone numbers from breadcrumbs (privacy)
          return event;
        },
      });
    });
  }, []);

  return null;
}
