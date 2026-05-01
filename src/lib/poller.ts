export interface PollerOptions<T> {
  fetch: (signal: AbortSignal) => Promise<T>;
  intervalMs: number;
  onUpdate: (value: T) => void;
  onError?: (error: unknown) => void;
}

export interface Poller {
  start: () => void;
  stop: () => void;
}

function isAbort(err: unknown): boolean {
  return !!err && typeof err === 'object' && (err as { name?: string }).name === 'AbortError';
}

export function createPoller<T>(opts: PollerOptions<T>): Poller {
  let active = false;
  let timer: ReturnType<typeof setInterval> | null = null;
  let inflight: AbortController | null = null;

  async function tick(): Promise<void> {
    if (inflight) inflight.abort();
    const ac = new AbortController();
    inflight = ac;
    try {
      const value = await opts.fetch(ac.signal);
      if (ac.signal.aborted) return;
      opts.onUpdate(value);
    } catch (err) {
      if (ac.signal.aborted || isAbort(err)) return;
      opts.onError?.(err);
    } finally {
      if (inflight === ac) inflight = null;
    }
  }

  function startInterval(): void {
    if (timer !== null) return;
    void tick();
    timer = setInterval(() => { void tick(); }, opts.intervalMs);
  }

  function stopInterval(): void {
    if (timer !== null) { clearInterval(timer); timer = null; }
    if (inflight) { inflight.abort(); inflight = null; }
  }

  function onVisibility(): void {
    if (!active) return;
    if (document.hidden) stopInterval();
    else startInterval();
  }

  return {
    start(): void {
      if (active) return;
      active = true;
      document.addEventListener('visibilitychange', onVisibility);
      if (!document.hidden) startInterval();
    },
    stop(): void {
      if (!active) return;
      active = false;
      stopInterval();
      document.removeEventListener('visibilitychange', onVisibility);
    }
  };
}
