export interface CountdownParts {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  past: boolean;
}

export function countdownParts(targetMs: number, now: number = Date.now()): CountdownParts {
  const diff = targetMs - now;
  const past = diff <= 0;
  const abs = Math.max(0, diff);
  const seconds = Math.floor(abs / 1000) % 60;
  const minutes = Math.floor(abs / 60_000) % 60;
  const hours = Math.floor(abs / 3_600_000) % 24;
  const days = Math.floor(abs / 86_400_000);
  return { totalMs: diff, days, hours, minutes, seconds, past };
}

const pad2 = (n: number): string => n.toString().padStart(2, '0');

export function formatCountdown(parts: CountdownParts): string {
  if (parts.days > 0) return `${parts.days}d ${pad2(parts.hours)}h ${pad2(parts.minutes)}m`;
  if (parts.hours > 0) return `${parts.hours}h ${pad2(parts.minutes)}m ${pad2(parts.seconds)}s`;
  return `${parts.minutes}m ${pad2(parts.seconds)}s`;
}

export function formatRaceDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

export function formatRaceDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function formatPoints(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  return Number.isInteger(n) ? n.toString() : n.toString();
}

export function formatGap(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value;
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return 'LEADER';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(3)}`;
}

export function formatLapTime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return m > 0 ? `${m}:${s.toFixed(3).padStart(6, '0')}` : s.toFixed(3);
}

export function combineDateTime(date: string, time?: string): string {
  if (!time) return `${date}T00:00:00Z`;
  if (date.includes('T')) return date;
  return `${date}T${time}`;
}
