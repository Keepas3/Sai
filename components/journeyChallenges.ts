// Pure (no React) challenge data + scheduling for "Journey to the East".
// Ported from blocks-arena's useJourneyRoom.ts. A challenge window's phase is
// a pure function of time, so two co-op clients derive the identical schedule
// from the shared startAt + matchSeed without any host broadcast.

// Same PRNG as TetrisGame.tsx (module-private there) — seeded from the match
// seed so both clients independently derive the same challenge shuffle.
export const mulberry32 = (seed: number) => {
  let s = seed;
  return () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export type ChallengeType =
  | 'tspin-rush'
  | 'line-blitz'
  | 'combo-chain'
  | 'survive-storm'
  | 'perfect-clear'
  | 'speed-place'
  | 'tetris-only'
  | 'score-frenzy';

export interface JourneyChallenge {
  type: ChallengeType;
  label: string;
  description: string;
  durationMs: number;
}

// blocks-arena's 1v1 list also has 'attack-burst' (send garbage to an
// opponent). Solo and shared-board co-op have no one to attack, so both use
// blocks-arena's co-op list, where it's replaced by 'score-frenzy'.
export const CHALLENGES: JourneyChallenge[] = [
  { type: 'tspin-rush',    label: 'Flux Twist Rush',    description: 'Score as many Flux Twists as possible (+1 each)',    durationMs: 30_000 },
  { type: 'line-blitz',    label: 'Line Blitz',         description: 'Clear as many lines as possible (Quad = 4)',          durationMs: 35_000 },
  { type: 'combo-chain',   label: 'Combo Chain',        description: 'Build the longest combo streak (+1 per level)',       durationMs: 40_000 },
  { type: 'survive-storm', label: 'Survive the Storm',  description: "Don't top out to earn points (+10 flat)",             durationMs: 45_000 },
  { type: 'perfect-clear', label: 'Perfect Clear Hunt', description: 'Clear the board completely (+15) or +1 per line',    durationMs: 60_000 },
  { type: 'speed-place',   label: 'Speed Placement',    description: 'Place pieces as fast as possible (+1 per 3 placed)', durationMs: 25_000 },
  { type: 'score-frenzy',  label: 'Score Frenzy',       description: 'Clear lines for weighted points (single +1, double +2, triple +4, Quad +8)', durationMs: 35_000 },
  { type: 'tetris-only',   label: 'Quad Only',          description: 'Score only with 4-line clears (+5 per Quad)',        durationMs: 40_000 },
];

// Points needed to win. 50 is the default; the mode popup (and, online, the
// host's lobby setting) can raise it to any value in JOURNEY_GOALS.
export const JOURNEY_GOALS = [50, 75, 100] as const;
export const DEFAULT_WIN_SCORE = 50;
export const COOLDOWN_MS = 3_000;
export const TOPOUT_PAUSE_MS = 3_000;
// TetrisGame's own 3-2-1-GO countdown runs for 4 seconds after mounting
// (ticks at 3, 2, 1, GO!, then PLAYING). The challenge schedule begins after
// that so the first window opens when the player can actually play.
export const COUNTDOWN_OFFSET_MS = 4_000;

export function buildChallengeOrder(seed: number): JourneyChallenge[] {
  const rng = mulberry32(seed);
  const arr = [...CHALLENGES];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface JourneyPhase {
  phase: 'challenge' | 'cooldown';
  challenge: JourneyChallenge;  // active challenge or (during cooldown) the upcoming one
  challengeSeq: number;         // 0-based monotonic challenge counter
  timeLeftMs: number;
  isCooldown: boolean;
}

export function computePhase(elapsedMs: number, challenges: JourneyChallenge[]): JourneyPhase {
  let offset = 0;
  let seq = 0;
  while (true) {
    const challenge = challenges[seq % challenges.length];
    const windowEnd = offset + challenge.durationMs;
    if (elapsedMs < windowEnd) {
      return { phase: 'challenge', challenge, challengeSeq: seq, timeLeftMs: windowEnd - elapsedMs, isCooldown: false };
    }
    const cooldownEnd = windowEnd + COOLDOWN_MS;
    if (elapsedMs < cooldownEnd) {
      const next = challenges[(seq + 1) % challenges.length];
      return { phase: 'cooldown', challenge: next, challengeSeq: seq + 1, timeLeftMs: cooldownEnd - elapsedMs, isCooldown: true };
    }
    offset = cooldownEnd;
    seq++;
  }
}

// Sent once per window end by each co-op client, received by the other.
export interface WindowReport {
  challengeSeq: number;
  windowScore: number;
  survived: boolean;
  hasPc: boolean;
}

// Perfect Clear Hunt pays whichever is better: the 15-point board clear or +1
// per line. (blocks-arena paid a flat 15 once any clear happened, which could
// make a window worth LESS after a perfect clear than before it — a problem now
// that progress is shown live and must only ever go up.)
const PERFECT_CLEAR_POINTS = 15;

export function computeWindowPoints(
  challenge: JourneyChallenge,
  report: Pick<WindowReport, 'windowScore' | 'survived' | 'hasPc'>,
): number {
  switch (challenge.type) {
    case 'survive-storm': return report.survived ? 10 : 0;
    case 'perfect-clear': return report.hasPc ? Math.max(PERFECT_CLEAR_POINTS, report.windowScore) : report.windowScore;
    default:              return report.windowScore;
  }
}

// Points a window is worth *so far*, for the live progress bar and the instant
// win check. Same as computeWindowPoints except Survive the Storm, whose +10 is
// only earned by lasting the whole window — counting it early would be taken
// back by a late topout, so it stays at 0 until the window ends.
export function liveWindowPoints(type: ChallengeType, windowScore: number, hasPc: boolean): number {
  switch (type) {
    case 'survive-storm': return 0;
    case 'perfect-clear': return hasPc ? Math.max(PERFECT_CLEAR_POINTS, windowScore) : windowScore;
    default:              return windowScore;
  }
}

// Score Frenzy weighting — single +1, double +2, triple +4, Quad +8.
export const frenzyPoints = (lines: number) => (lines === 1 ? 1 : lines === 2 ? 2 : lines === 3 ? 4 : 8);
