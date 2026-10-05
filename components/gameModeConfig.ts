// Single source of truth for the title-screen mode popup: which modes have a
// setting, its allowed values/default, the concise rules text, and the
// leaderboard key each setting scores under.
import { JOURNEY_GOALS, DEFAULT_WIN_SCORE } from './journeyChallenges';

export type PlayableMode = 'standard' | 'sprint' | 'blitz' | 'journey';

export interface GameOptions {
  sprintGoal?: number;    // 40 Lines: lines to clear
  blitzMinutes?: number;  // Blitz: round length
  journeyGoal?: number;   // Journey: points to win
}

export const SPRINT_GOALS = [20, 30, 40] as const;
export const DEFAULT_SPRINT_GOAL = 40;
export const BLITZ_MINUTES = [1, 2, 3] as const;
export const DEFAULT_BLITZ_MINUTES = 3;

interface ModeOption {
  key: keyof GameOptions;
  label: string;
  values: readonly number[];
  default: number;
  format: (value: number) => string;
}

interface ModeConfig {
  title: string;
  option?: ModeOption;
  rules: (options: GameOptions) => string[];
}

export const MODE_CONFIG: Record<PlayableMode, ModeConfig> = {
  standard: {
    title: 'Zen Mode',
    rules: () => [
      'Relaxed practice with no score or timer.',
      'Open Sandbox to tweak gravity and spawn pieces.',
      'A topout just clears the board.',
    ],
  },
  sprint: {
    title: '40 Lines',
    option: { key: 'sprintGoal', label: 'Lines to clear', values: SPRINT_GOALS, default: DEFAULT_SPRINT_GOAL, format: (v) => `${v}` },
    rules: (o) => [
      `Clear ${o.sprintGoal ?? DEFAULT_SPRINT_GOAL} lines as fast as you can.`,
      'Fastest time wins.',
      'Ranked separately for each line count.',
    ],
  },
  blitz: {
    title: 'Blitz',
    option: { key: 'blitzMinutes', label: 'Time limit', values: BLITZ_MINUTES, default: DEFAULT_BLITZ_MINUTES, format: (v) => `${v} min` },
    rules: (o) => [
      `Score as much as you can in ${o.blitzMinutes ?? DEFAULT_BLITZ_MINUTES} min.`,
      'Combos and back-to-backs score big.',
      'Ranked separately for each length.',
    ],
  },
  journey: {
    title: 'Journey to the East',
    option: { key: 'journeyGoal', label: 'Points to win', values: JOURNEY_GOALS, default: DEFAULT_WIN_SCORE, format: (v) => `${v}` },
    rules: (o) => [
      'The Sage sets timed challenges.',
      `Earn points in each — reach ${o.journeyGoal ?? DEFAULT_WIN_SCORE} to win.`,
      'A topout clears your board and pauses scoring for 3s.',
    ],
  },
};

export const isPlayableMode = (mode: string): mode is PlayableMode => mode in MODE_CONFIG;

// Fills in the default for the mode's setting (if any) so callers never have
// to repeat the defaults.
export function resolveOptions(mode: PlayableMode, options: GameOptions = {}): GameOptions {
  const opt = MODE_CONFIG[mode].option;
  if (!opt) return {};
  const value = options[opt.key];
  return { [opt.key]: opt.values.includes(value as number) ? value : opt.default };
}

// The `tetris_scores.mode` value a run is saved/queried under. The default
// settings keep the original bare keys ('sprint', 'blitz'), so every score
// that existed before settings were added stays on the same board.
export function scoreKeyFor(mode: string, options: GameOptions = {}): string {
  if (mode === 'sprint') {
    const goal = options.sprintGoal ?? DEFAULT_SPRINT_GOAL;
    return goal === DEFAULT_SPRINT_GOAL ? 'sprint' : `sprint-${goal}`;
  }
  if (mode === 'blitz') {
    const minutes = options.blitzMinutes ?? DEFAULT_BLITZ_MINUTES;
    return minutes === DEFAULT_BLITZ_MINUTES ? 'blitz' : `blitz-${minutes}`;
  }
  return mode;
}

// Last-used choices, remembered between visits. Every access is guarded —
// storage can be missing/blocked (private windows, embedded previews) and the
// UI must work the same without it.
const STORAGE_KEY = 'raining-blocks:mode-options';

export function loadSavedOptions(): GameOptions {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GameOptions) : {};
  } catch {
    return {};
  }
}

export function saveOptions(options: GameOptions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...loadSavedOptions(), ...options }));
  } catch {
    // Not remembering the choice is fine.
  }
}
