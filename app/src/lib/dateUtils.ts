import { format as dateFnsFormat, formatDistanceToNow as dateFnsFormatDistanceToNow, differenceInDays as dateFnsDifferenceInDays } from 'date-fns';

/**
 * Safely parse any date value into a valid Date object.
 * Returns null if the value cannot be parsed into a valid Date.
 */
export function safeParseDate(val: any): Date | null {
  if (val === null || val === undefined || val === '') return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  if (typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;
    
    // Check for masked DPDP date format like "**/**/1990"
    if (trimmed.includes('*')) {
      const matchYear = trimmed.match(/\d{4}/);
      if (matchYear) {
        const y = parseInt(matchYear[0], 10);
        return new Date(y, 0, 1);
      }
      return null;
    }

    // Replace space between date and time with 'T' if missing (common in SQL timestamps e.g. "2026-03-24 10:14:00")
    const normalized = trimmed.includes(' ') && !trimmed.includes('T')
      ? trimmed.replace(' ', 'T')
      : trimmed;

    const d = new Date(normalized);
    if (!isNaN(d.getTime())) return d;

    // Try fallback for DD-MM-YYYY or DD/MM/YYYY
    const parts = trimmed.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        // DD-MM-YYYY
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const d2 = new Date(year, month, day);
        if (!isNaN(d2.getTime())) return d2;
      } else if (parts[0].length === 4) {
        // YYYY-MM-DD
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d3 = new Date(year, month, day);
        if (!isNaN(d3.getTime())) return d3;
      }
    }
  }
  return null;
}

/**
 * Safely format a date with date-fns format pattern. Never throws 'Invalid time value'.
 */
export function safeFormat(dateVal: any, pattern: string, fallback: string = '—'): string {
  const d = safeParseDate(dateVal);
  if (!d) return fallback;
  try {
    return dateFnsFormat(d, pattern);
  } catch {
    return fallback;
  }
}

/**
 * Safely format distance to now (e.g. "5 minutes ago"). Never throws.
 */
export function safeFormatDistanceToNow(dateVal: any, fallback: string = 'recently'): string {
  const d = safeParseDate(dateVal);
  if (!d) return fallback;
  try {
    return dateFnsFormatDistanceToNow(d);
  } catch {
    return fallback;
  }
}

/**
 * Safely calculate difference in days between two dates. Never throws.
 */
export function safeDifferenceInDays(dateLeft: any, dateRight: any, fallback: number = 0): number {
  const dl = safeParseDate(dateLeft);
  const dr = safeParseDate(dateRight);
  if (!dl || !dr) return fallback;
  try {
    return dateFnsDifferenceInDays(dl, dr);
  } catch {
    return fallback;
  }
}

/**
 * Safely call toLocaleDateString without throwing on invalid dates.
 */
export function safeToLocaleDate(
  dateVal: any,
  locale: string = 'en-IN',
  options?: Intl.DateTimeFormatOptions,
  fallback: string = '—'
): string {
  const d = safeParseDate(dateVal);
  if (!d) return fallback;
  try {
    return d.toLocaleDateString(locale, options);
  } catch {
    return fallback;
  }
}

/**
 * Safely calculate days until next birthday or anniversary (annual recurring event).
 * Returns null on invalid or missing date or if date is masked with unknown month/day.
 */
export function safeDaysUntilAnnual(dateVal: any): number | null {
  if (!dateVal || typeof dateVal !== 'string' && !(dateVal instanceof Date)) return null;
  if (typeof dateVal === 'string' && dateVal.includes('*')) return null; // Masked date has no day/month

  const d = safeParseDate(dateVal);
  if (!d) return null;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const m = d.getMonth();
    const day = d.getDate();
    let target = new Date(today.getFullYear(), m, day);
    if (target < today) {
      target = new Date(today.getFullYear() + 1, m, day);
    }
    const diffMs = target.getTime() - today.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

/**
 * Format a card number into groups of 4 digits for display.
 * "4000100000010001" → "4000 1000 0001 0001"
 * Handles already-spaced numbers, short codes, and masked values gracefully.
 * @param raw   Raw card number string (digits, spaces, or dashes)
 * @param mask  If true, masks all but the last 4 digits with •
 */
export function formatCardNumber(raw: string | null | undefined, mask = false): string {
  if (!raw) return '';
  const digits = raw.replace(/[\s\-]/g, '').replace(/\D/g, '');
  if (digits.length === 0) return raw.trim(); // non-numeric code — return as-is

  if (mask && digits.length >= 4) {
    const last4 = digits.slice(-4);
    const maskedStr = '•'.repeat(digits.length - 4) + last4;
    return maskedStr.match(/.{1,4}/g)?.join(' ') ?? maskedStr;
  }

  return digits.match(/.{1,4}/g)?.join(' ') ?? digits;
}

