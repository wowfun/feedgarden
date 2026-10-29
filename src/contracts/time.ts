import { DateTime } from 'luxon';

export function iso(value: DateTime, label = 'timestamp'): string {
  const result = value.toISO();
  if (!result) throw new Error('Invalid ' + label + ': ' + (value.invalidExplanation ?? 'cannot serialize ISO timestamp'));
  return result;
}
export function isoDate(value: DateTime, label = 'date'): string {
  const result = value.toISODate();
  if (!result) throw new Error('Invalid ' + label + ': ' + (value.invalidExplanation ?? 'cannot serialize ISO date'));
  return result;
}
