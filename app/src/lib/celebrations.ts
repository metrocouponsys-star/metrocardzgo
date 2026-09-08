import type { Member, CelebrationMember } from '../types';

export function parseMonthAndDay(dateStr?: string): { month: number; day: number } | null {
  if (!dateStr) return null;
  const clean = dateStr.trim().split('T')[0];
  const parts = clean.split(/[-/]/);
  if (parts.length < 3) return null;

  let m = 0;
  let d = 0;

  // Case 1: YYYY-MM-DD
  if (parts[0].length === 4) {
    m = parseInt(parts[1], 10) - 1;
    d = parseInt(parts[2], 10);
  } else if (parts[2].length === 4) {
    // Case 2: DD-MM-YYYY
    d = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10) - 1;
  } else {
    // Fallback
    m = parseInt(parts[1], 10) - 1;
    d = parseInt(parts[2], 10);
  }

  if (isNaN(m) || isNaN(d) || m < 0 || m > 11 || d < 1 || d > 31) return null;
  return { month: m, day: d };
}

export function computeCelebrationsFromMembers(
  members: Member[],
  daysAhead = 60
): CelebrationMember[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();
  const results: CelebrationMember[] = [];

  for (const m of members) {
    if (m.status === 'deactivated') continue;

    const events: { type: 'birthday' | 'anniversary'; dateStr?: string }[] = [
      { type: 'birthday', dateStr: m.date_of_birth },
      { type: 'anniversary', dateStr: m.anniversary_date },
    ];

    for (const { type, dateStr } of events) {
      if (!dateStr) continue;
      const parsed = parseMonthAndDay(dateStr);
      if (!parsed) continue;

      let eventDate = new Date(currentYear, parsed.month, parsed.day);
      eventDate.setHours(0, 0, 0, 0);

      // If already passed this year, check next year
      if (eventDate.getTime() < today.getTime()) {
        eventDate = new Date(currentYear + 1, parsed.month, parsed.day);
        eventDate.setHours(0, 0, 0, 0);
      }

      const diffMs = eventDate.getTime() - today.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= daysAhead) {
        results.push({
          member_id: m.id,
          name: m.name,
          phone: m.phone,
          member_code: m.member_code,
          loyalty_points: m.loyalty_points,
          event_type: type,
          event_date: dateStr,
          days_until: diffDays,
        });
      }
    }
  }

  results.sort((a, b) => a.days_until - b.days_until);
  return results;
}
