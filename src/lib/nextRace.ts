export interface RacePlaceholder {
  name: string;
  circuit: string;
  startUtc: string;
}

export const NEXT_RACE: RacePlaceholder = {
  name: '2026 Miami Grand Prix',
  circuit: 'Miami International Autodrome',
  startUtc: '2026-05-03T19:30:00Z'
};

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

export function countdownTo(targetIso: string, now: Date = new Date()): Countdown {
  const diff = new Date(targetIso).getTime() - now.getTime();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  }
  const seconds = Math.floor(diff / 1000) % 60;
  const minutes = Math.floor(diff / 1000 / 60) % 60;
  const hours = Math.floor(diff / 1000 / 60 / 60) % 24;
  const days = Math.floor(diff / 1000 / 60 / 60 / 24);
  return { days, hours, minutes, seconds, done: false };
}
