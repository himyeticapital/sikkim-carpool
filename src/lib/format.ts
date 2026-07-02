export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/**
 * YYYY-MM-DD in the device's timezone — toISOString() would give the UTC
 * calendar date, which is yesterday for IST users until 05:30.
 */
export function toLocalDateKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/**
 * [start, end) instants for a local calendar day, given as YYYY-MM-DD.
 * Comparing local-day boundaries as absolute instants avoids the UTC-shift
 * bug: a naive `YYYY-MM-DD` string is parsed as UTC midnight, which reads as
 * the previous day for IST users until 05:30.
 */
export function localDayBounds(dateKey: string): { start: Date; end: Date } {
  const start = new Date(`${dateKey}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}
