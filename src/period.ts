import { DateTime } from 'luxon';
import type { Source } from './config.js';
import type { Frequency, Period } from './types.js';
export function periodFor(source: Source, frequency: Frequency, date: string, sealHours = 48): Period {
  const start = DateTime.fromISO(date, { zone: source.timezone }).startOf('day');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !start.isValid || start.toISODate() !== date) throw new Error('Invalid report date');
  if (frequency === 'weekly' && start.weekday !== 1) throw new Error('Weekly report dates must be Mondays');
  const end = start.plus(frequency === 'daily' ? { days: 1 } : { weeks: 1 });
  return { source: source.id, frequency, date, start: start.toUTC().toISO()!, end: end.toUTC().toISO()!, due: end.set({ hour: 9 }).toUTC().toISO()!, seal: end.plus({ hours: sealHours }).toUTC().toISO()!, timezone: source.timezone };
}
export function duePeriods(source: Source, now: string, backfillDays: number, sealHours: number): Period[] {
  const local = DateTime.fromISO(now).setZone(source.timezone);
  const periods: Period[] = [];
  for (const frequency of source.frequencies) {
    const count = frequency === 'daily' ? Math.max(1, backfillDays) : 2;
    for (let index = 1; index <= count; index++) {
      const date = frequency === 'daily' ? local.minus({ days: index }).toISODate()! : local.startOf('week').minus({ weeks: index }).toISODate()!;
      const period = periodFor(source, frequency, date, sealHours);
      if (period.due <= now) periods.push(period);
    }
  }
  return periods.sort((a, b) => a.due.localeCompare(b.due));
}
export const reportKey = (period: Period): string => `${period.source}:${period.frequency}:${period.date}`;
