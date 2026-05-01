<script lang="ts">
  import { router } from './lib/router.svelte';
  import { prefs } from './lib/prefs.svelte';
  import BottomNav from './components/BottomNav.svelte';
  import Home from './views/Home.svelte';
  import Schedule from './views/Schedule.svelte';
  import Standings from './views/Standings.svelte';
  import Settings from './views/Settings.svelte';

  $effect(() => {
    const on = prefs.value.reducedMotion;
    if (typeof document === 'undefined') return;
    if (on) document.documentElement.setAttribute('data-reduced-motion', 'true');
    else document.documentElement.removeAttribute('data-reduced-motion');
  });
</script>

<header class="hdr">
  <div class="wordmark">F1<span class="wordmark-dim">SCORE</span></div>
</header>

<main>
  {#if router.current.name === 'schedule'}
    <Schedule />
  {:else if router.current.name === 'standings'}
    <Standings />
  {:else if router.current.name === 'settings'}
    <Settings />
  {:else}
    <Home />
  {/if}
</main>

<BottomNav />

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
    margin-left: var(--space-1);
    color: var(--text);
  }
</style>
