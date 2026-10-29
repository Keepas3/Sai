// Rules for the fortune slip's blue butterfly and the "streak charm" it gives.
// Pure helpers only (no React) so FortuneSlip.tsx stays readable.

// '1' while a charm is active; removed once it has saved a streak.
export const CHARM_KEY = 'fortune-slip:streak-charm';
// JSON { week, count }: how many butterflies have shown up in which week.
export const BUTTERFLY_WEEK_KEY = 'fortune-slip:butterfly-week';

// Chance of a butterfly on a draw, indexed by how many have already shown up
// this week: the first is 40%, the second 20%, and that's the weekly cap.
export const BUTTERFLY_CHANCES = [0.4, 0.2];

export interface ButterflyWeekState {
  week: number;
  count: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Whole-day index of the fortune-day a draw belongs to (consecutive fortune-days
// differ by exactly 1). `boundaryMs` is the 4 AM Eastern reset that ends that
// fortune-day. Subtracting 12h puts both EST (09:00 UTC) and EDT (08:00 UTC)
// boundaries on the previous UTC day, i.e. the fortune-day's own date.
export function getFortuneDayIndex(boundaryMs: number): number {
  return Math.floor((boundaryMs - 12 * 60 * 60 * 1000) / DAY_MS);
}

// Calendar-week id (Monday start) of the fortune-day a draw belongs to, so the
// week rolls over at Monday 4 AM Eastern, the same clock as the daily reset.
// Day 0 of the epoch is a Thursday, hence the +3 to make Monday the first day
// of the week.
export function getFortuneWeekId(boundaryMs: number): number {
  return Math.floor((getFortuneDayIndex(boundaryMs) + 3) / 7);
}

export function loadHasCharm(): boolean {
  try {
    return window.localStorage.getItem(CHARM_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveHasCharm(active: boolean): void {
  try {
    if (active) window.localStorage.setItem(CHARM_KEY, '1');
    else window.localStorage.removeItem(CHARM_KEY);
  } catch {
    // ignore — the charm just won't persist across reloads
  }
}

export function loadButterflyWeek(): ButterflyWeekState | null {
  try {
    const raw = window.localStorage.getItem(BUTTERFLY_WEEK_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (
      parsed &&
      Number.isFinite(parsed.week) &&
      Number.isFinite(parsed.count) &&
      parsed.count >= 0
    ) {
      return { week: parsed.week, count: parsed.count };
    }
  } catch {
    // ignore malformed storage
  }
  return null;
}

export function saveButterflyWeek(state: ButterflyWeekState): void {
  try {
    window.localStorage.setItem(BUTTERFLY_WEEK_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

// Decides whether a butterfly shows up on this draw. A charm that's already
// active means no roll at all (and nothing is counted). Otherwise the odds
// depend on how many already showed up this calendar week; a new week starts
// the count over. `rand` is a 0-1 random number (injected for testability).
export function rollButterfly(args: {
  hasCharm: boolean;
  stored: ButterflyWeekState | null;
  week: number;
  rand: number;
  // Testing only: skip every rule and always show it (and don't count it).
  force?: boolean;
}): { show: boolean; next: ButterflyWeekState } {
  const { hasCharm, stored, week, rand, force = false } = args;
  const count = stored && stored.week === week ? stored.count : 0;
  const unchanged = { week, count };

  if (force) return { show: true, next: unchanged };
  if (hasCharm) return { show: false, next: unchanged };
  const chance = BUTTERFLY_CHANCES[count] ?? 0;
  if (rand < chance) return { show: true, next: { week, count: count + 1 } };
  return { show: false, next: unchanged };
}
