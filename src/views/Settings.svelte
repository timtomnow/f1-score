<script lang="ts">
  import { prefs, setPref, resetPrefs, toggleFollowedDriver, type DefaultView, type Units } from '../lib/prefs.svelte';
  import { theme, driverDisplayName } from '../lib/theme.svelte';
  import { teamColor, teamColorFromHex } from '../lib/teams';
  import Card from '../components/Card.svelte';
  import Segmented from '../components/Segmented.svelte';
  import Skeleton from '../components/Skeleton.svelte';
  import Toggle from '../components/Toggle.svelte';
  import DriverPicker from '../components/DriverPicker.svelte';
  import type { Driver } from '../lib/openf1';

  type PickerMode = 'favorite' | 'followed' | null;
  let picker = $state<PickerMode>(null);

  let favorite = $derived<Driver | null>(
    theme.drivers.find((d) => String(d.driver_number) === prefs.value.favoriteDriverId) ?? null
  );
  let followed = $derived<Driver[]>(
    theme.drivers.filter((d) => prefs.value.followedDriverIds.includes(String(d.driver_number)))
  );

  function pickColor(d: Driver): { accent: string; fg: string } {
    const named = d.team_name ? teamColor(d.team_name) : null;
    if (named && named.accent !== '#6c6c75') return named;
    return teamColorFromHex(d.team_colour) ?? named ?? { accent: '#6c6c75', fg: '#ffffff' };
  }

  const VIEW_OPTIONS: Array<{ value: DefaultView; label: string }> = [
    { value: 'auto', label: 'Auto' },
    { value: 'schedule', label: 'Schedule' },
    { value: 'standings', label: 'Standings' },
    { value: 'live', label: 'Live' }
  ];

  const UNIT_OPTIONS: Array<{ value: Units; label: string }> = [
    { value: 'metric', label: 'Metric' },
    { value: 'imperial', label: 'Imperial' }
  ];

  function onSelectFavorite(driverId: string): void {
    setPref('favoriteDriverId', driverId);
  }
  function onClearFavorite(): void {
    setPref('favoriteDriverId', null);
  }
  function onToggleFollowed(driverId: string): void {
    toggleFollowedDriver(driverId);
  }
  function removeFollowed(driverId: string): void {
    toggleFollowedDriver(driverId);
  }

  function confirmReset(): void {
    if (typeof window === 'undefined' || window.confirm('Reset all preferences?')) {
      resetPrefs();
    }
  }
</script>

<header class="view-header">
  <h1>Settings</h1>
</header>

<Card label="Favorite driver">
  <p class="hint">Tints the app accent and highlights this driver across views.</p>

  {#if theme.driversError && !favorite}
    <div class="text-err">{theme.driversError}</div>
  {:else if !theme.driversLoaded}
    <Skeleton lines={2} height="48px" />
  {:else}
    <button type="button" class="row pickable" onclick={() => (picker = 'favorite')}>
      {#if favorite}
        {@const c = pickColor(favorite)}
        <span class="bar" style:background={c.accent}></span>
        <span class="num" style:color={c.accent}>
          {String(favorite.driver_number).padStart(2, '0')}
        </span>
        <span class="name">
          <span class="full">{driverDisplayName(favorite)}</span>
          <span class="team">{favorite.team_name ?? ''}</span>
        </span>
        <span class="cta">Change</span>
      {:else}
        <span class="bar muted"></span>
        <span class="placeholder">No favorite selected</span>
        <span class="cta">Choose</span>
      {/if}
    </button>
  {/if}
</Card>

<Card label="Followed drivers">
  <p class="hint">Highlighted in lists. Detail cards arrive in a future stage.</p>

  {#if !theme.driversLoaded}
    <Skeleton lines={2} height="36px" />
  {:else if followed.length === 0}
    <div class="text-empty">None yet.</div>
  {:else}
    <ul class="chips">
      {#each followed as d (d.driver_number)}
        {@const c = pickColor(d)}
        <li>
          <button
            type="button"
            class="chip"
            style:--chip-accent={c.accent}
            onclick={() => removeFollowed(String(d.driver_number))}
            aria-label="Remove {driverDisplayName(d)}"
          >
            <span class="chip-bar"></span>
            <span class="chip-acr">{d.name_acronym ?? String(d.driver_number)}</span>
            <span class="chip-x" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  <button type="button" class="add" onclick={() => (picker = 'followed')} disabled={!theme.driversLoaded}>
    + Add driver
  </button>
</Card>

<Card label="Default landing view">
  <Segmented
    options={VIEW_OPTIONS}
    value={prefs.value.defaultView}
    onChange={(v) => setPref('defaultView', v as DefaultView)}
    ariaLabel="Default landing view"
  />
  <p class="hint small">"Auto" picks Live during a session weekend, otherwise Schedule.</p>
</Card>

<Card label="Units">
  <Segmented
    options={UNIT_OPTIONS}
    value={prefs.value.units}
    onChange={(v) => setPref('units', v as Units)}
    ariaLabel="Units"
  />
</Card>

<Card label="Reduced motion">
  <div class="toggle-row">
    <div class="toggle-text">
      <div class="toggle-title">Limit animation</div>
      <div class="toggle-sub">Overrides system pref when on.</div>
    </div>
    <Toggle
      checked={prefs.value.reducedMotion}
      onChange={(v) => setPref('reducedMotion', v)}
      ariaLabel="Reduced motion"
    />
  </div>
</Card>

<button type="button" class="reset" onclick={confirmReset}>Reset preferences</button>

<DriverPicker
  open={picker === 'favorite'}
  title="Pick favorite driver"
  drivers={theme.drivers}
  mode="single"
  selected={prefs.value.favoriteDriverId ? [prefs.value.favoriteDriverId] : []}
  allowClear={true}
  onClose={() => (picker = null)}
  onSelect={onSelectFavorite}
  onClear={onClearFavorite}
/>

<DriverPicker
  open={picker === 'followed'}
  title="Followed drivers"
  drivers={theme.drivers}
  mode="multi"
  selected={prefs.value.followedDriverIds}
  onClose={() => (picker = null)}
  onSelect={onToggleFollowed}
/>

<style>
  .hint {
    margin: 0 0 var(--space-3);
    color: var(--text-dim);
    font-size: 13px;
    line-height: 1.4;
  }
  .hint.small {
    margin-top: var(--space-3);
    margin-bottom: 0;
    font-size: 12px;
    color: var(--text-faint);
  }

  .row {
    display: grid;
    grid-template-columns: 4px 36px 1fr auto;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
    padding: var(--space-3) var(--space-3);
    background: var(--surface-2);
    border-radius: var(--radius-md);
    text-align: left;
    min-height: 56px;
  }
  .pickable:hover { background: var(--surface); }
  .bar {
    width: 4px;
    height: 32px;
    border-radius: var(--radius-pill);
  }
  .bar.muted { background: var(--border); }
  .num {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    font-size: 18px;
    text-align: right;
  }
  .name {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .full {
    font-size: 14px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .team {
    font-size: 11px;
    color: var(--text-faint);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .placeholder {
    grid-column: 2 / 4;
    color: var(--text-faint);
    font-size: 14px;
  }
  .cta {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--accent);
    font-weight: 700;
  }

  .chips {
    list-style: none;
    margin: 0 0 var(--space-3);
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: 6px var(--space-3);
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-pill);
    color: var(--text);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1px;
    min-height: 32px;
  }
  .chip-bar {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--chip-accent, var(--text-faint));
  }
  .chip-acr {
    font-family: var(--font-mono);
  }
  .chip-x {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-faint);
  }
  .chip:hover .chip-x { color: var(--text); }

  .add {
    background: var(--surface-2);
    border: 1px dashed var(--border);
    border-radius: var(--radius-pill);
    padding: var(--space-2) var(--space-4);
    color: var(--text-dim);
    font-size: 13px;
    font-weight: 600;
    min-height: 40px;
  }
  .add:hover { color: var(--text); }
  .add:disabled { opacity: 0.5; cursor: not-allowed; }

  .toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }
  .toggle-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .toggle-title { font-size: 14px; }
  .toggle-sub { font-size: 12px; color: var(--text-faint); }

  .reset {
    width: 100%;
    margin-top: var(--space-2);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-pill);
    background: transparent;
    border: 1px solid var(--border);
    color: var(--error);
    font-size: 14px;
    font-weight: 600;
    min-height: 44px;
  }
  .reset:hover { background: var(--surface); }
</style>
