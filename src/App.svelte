<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { NEXT_RACE, countdownTo, type Countdown } from './lib/nextRace';

  let now = $state(new Date());
  let countdown = $derived<Countdown>(countdownTo(NEXT_RACE.startUtc, now));

  let interval: ReturnType<typeof setInterval> | undefined;
  onMount(() => {
    interval = setInterval(() => { now = new Date(); }, 1000);
  });
  onDestroy(() => {
    if (interval) clearInterval(interval);
  });

  const startLocal = new Date(NEXT_RACE.startUtc).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  });
</script>

<header class="hdr">
  <div class="wordmark">F1<span class="wordmark-dim">SCORE</span></div>
  <div class="tag">Coming soon</div>
</header>

<section class="card">
  <div class="card-label">Next race</div>
  <div class="race-name">{NEXT_RACE.name}</div>
  <div class="circuit">{NEXT_RACE.circuit}</div>
  <div class="start-local">{startLocal}</div>

  <div class="countdown" aria-live="polite">
    {#if countdown.done}
      <div class="cd-live">Lights out</div>
    {:else}
      <div class="cd-cell"><span class="cd-num">{countdown.days}</span><span class="cd-lbl">d</span></div>
      <div class="cd-cell"><span class="cd-num">{String(countdown.hours).padStart(2, '0')}</span><span class="cd-lbl">h</span></div>
      <div class="cd-cell"><span class="cd-num">{String(countdown.minutes).padStart(2, '0')}</span><span class="cd-lbl">m</span></div>
      <div class="cd-cell"><span class="cd-num">{String(countdown.seconds).padStart(2, '0')}</span><span class="cd-lbl">s</span></div>
    {/if}
  </div>
</section>

<footer class="ftr">Stage 0 placeholder</footer>

<style>
  .hdr {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: var(--space-5);
  }
  .wordmark {
    font-family: var(--font-mono);
    font-weight: 900;
    font-size: 28px;
    letter-spacing: -1px;
    color: var(--accent);
  }
  .wordmark-dim {
    margin-left: 6px;
    color: var(--text);
  }
  .tag {
    font-size: 12px;
    color: var(--text-faint);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-card);
    padding: var(--space-5) var(--space-4);
  }
  .card-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--text-faint);
    margin-bottom: var(--space-2);
  }
  .race-name {
    font-size: 22px;
    font-weight: 700;
    line-height: 1.15;
  }
  .circuit {
    color: var(--text-dim);
    margin-top: var(--space-1);
    font-size: 14px;
  }
  .start-local {
    color: var(--text);
    margin-top: var(--space-3);
    font-size: 14px;
    font-variant-numeric: tabular-nums;
  }

  .countdown {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-2);
    margin-top: var(--space-5);
  }
  .cd-cell {
    background: var(--surface-2);
    border-radius: 12px;
    padding: var(--space-3) 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .cd-num {
    font-family: var(--font-mono);
    font-size: 28px;
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .cd-lbl {
    font-size: 11px;
    color: var(--text-faint);
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .cd-live {
    text-align: center;
    font-size: 20px;
    font-weight: 800;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  .ftr {
    margin-top: var(--space-5);
    text-align: center;
    color: var(--text-faint);
    font-size: 12px;
  }
</style>
