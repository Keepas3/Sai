'use client';

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';

interface FortuneSlip {
  title: string;
  preview: string;
  note: string;
}

interface FortuneSlipProps {
  slips?: FortuneSlip[];
  inline?: boolean;
}

// The box needs this many taps before it "releases" a slip — mimics
// actually rattling an omikuji box a few times before a stick falls out.
// ---------------------------------------------------------------------------
// TEMPORARY — FOR LOCAL TESTING ONLY.
// Flip this to `true` to skip waiting for real daily resets: the box will
// only need 1 shake to open, and it'll reappear (and advance the streak)
// after DEV_RESET_INTERVAL_MS instead of the actual next 4 AM Eastern —
// so you can click through several "days" in under a minute and watch the
// streak history / 7-day omamori reward trigger. Set back to `false`
// (or just delete this block) before shipping.
const DEV_FAST_FORWARD = true;
const DEV_RESET_INTERVAL_MS = 15_000; // 15 seconds per "day" while testing
// ---------------------------------------------------------------------------

const MIN_SHAKES = DEV_FAST_FORWARD ? 1 : 3;
const MAX_SHAKES = DEV_FAST_FORWARD ? 1 : 4;

// Once a slip is drawn, the box disappears until the next daily reset.
const RESET_HOUR_EASTERN = 4; // 4:00 AM America/New_York
const STORAGE_KEY = 'fortune-slip:next-available-at';
const STREAK_COUNT_KEY = 'fortune-slip:streak-count';
// The reset boundary (epoch ms) that followed the most recent open — used to
// tell whether the next open happens during the very next available window
// (streak continues) or later (one or more days were missed, streak resets).
const STREAK_PERIOD_KEY = 'fortune-slip:streak-period-end';
// The titles collected so far in the current streak cycle, so they can be
// shown back once the player has enough of a streak going.
const STREAK_HISTORY_KEY = 'fortune-slip:streak-history';
// Persists the chosen reward message so it survives a page reload while the
// player is still within the reward day (before the next reset clears it).
const STREAK_OMAMORI_MESSAGE_KEY = 'fortune-slip:streak-omamori-message';

// From day 3 onward, show the fortunes collected so far this cycle.
const HISTORY_VISIBLE_FROM_STREAK = 2;

// Closing is ignored for this long after the popup opens, so a tap that
// bleeds through right as it appears (e.g. an extra shake-tap landing on the
// backdrop the instant it opens) can't dismiss it before it's even readable.
// Roughly matches how long the unroll-in animation takes to settle.
const MIN_VISIBLE_MS = 800;
// The overall day-streak counts up indefinitely and never resets just for
// reaching this — only missing a day resets it. What this controls is the
// *cycle*: every time the streak hits a multiple of this many days, the
// omamori reward triggers and the weekly history starts over, while the
// streak count itself keeps climbing (8, 9, 10, ...).
const STREAK_CYCLE_LENGTH = 7;

// Shown once, chosen at random, the moment the 7-day omamori is earned.
// Unlike the regular fortune notes (which come from Sanity and can be about
// anything), these are written specifically about the achievement itself —
// so the reward reads as its own distinct thing, not just another fortune.
const OMAMORI_MESSAGES = [
  'Seven days, unbroken. This charm is yours to keep.',
  "Not everyone comes back seven days running. You did.",
  "This omamori carries the weight of a full week's devotion.",
  'Few make it this far. Wear this luck well.',
  'A charm earned counts for more than a charm given.',
  'Seven visits, one charm. May it watch over what comes next.',
  "You showed up seven times when you didn't have to. That's commitment.",
  "This one isn't left to chance — you built it, day by day.",
  "Hold onto this. It remembers the week you didn't quit.",
  'Fortune finds the lucky. This charm finds the persistent.',
];

// Returns the epoch ms timestamp of the next occurrence of RESET_HOUR_EASTERN
// in America/New_York time, at or after `referenceDate`. Handles the
// EST/EDT switch automatically since it reads the zone's actual offset
// for the target day rather than assuming a fixed UTC offset.
function getNextDailyResetUTC(referenceDate: Date): number {
  const nyFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = nyFormatter.formatToParts(referenceDate).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});

  let year = Number(parts.year);
  let month = Number(parts.month);
  let day = Number(parts.day);
  // Some engines render midnight as "24" with hour12: false.
  const hour = Number(parts.hour) === 24 ? 0 : Number(parts.hour);
  const minute = Number(parts.minute);
  const second = Number(parts.second);

  const isPastResetToday =
    hour > RESET_HOUR_EASTERN || (hour === RESET_HOUR_EASTERN && (minute > 0 || second > 0));

  if (isPastResetToday) {
    const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
    year = nextDay.getUTCFullYear();
    month = nextDay.getUTCMonth() + 1;
    day = nextDay.getUTCDate();
  }

  // Figure out whether that target date falls in EST or EDT so we know
  // exactly how many hours ahead of UTC "4 AM Eastern" actually is.
  const offsetFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    timeZoneName: 'short',
  });
  const anchor = new Date(Date.UTC(year, month - 1, day, 12));
  const offsetLabel = offsetFormatter.formatToParts(anchor).find((p) => p.type === 'timeZoneName')?.value;
  const offsetHours = offsetLabel === 'EDT' ? -4 : -5;

  return Date.UTC(year, month - 1, day, RESET_HOUR_EASTERN - offsetHours, 0, 0);
}

// Wraps getNextDailyResetUTC so both call sites below automatically respect
// DEV_FAST_FORWARD without duplicating the branch in each place.
function getNextPeriodBoundary(referenceDate: Date): number {
  if (DEV_FAST_FORWARD) {
    return referenceDate.getTime() + DEV_RESET_INTERVAL_MS;
  }
  return getNextDailyResetUTC(referenceDate);
}

interface StreakEntry {
  weekday: string; // 'Sun' | 'Mon' | ... — see WEEKDAY_ORDER
  title: string;
}

const WEEKDAY_ORDER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Which weekday a draw falls on, read in the same America/New_York calendar
// day the reset logic already uses — so a draw at 11pm Pacific (which is
// past midnight Eastern) lands on the day ET considers "today," matching
// which reset window it actually counted toward.
function getWeekdayLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
  }).format(date);
}

// `previousPeriodEnd` is the reset boundary that followed the last open
// (i.e. what was stored as `nextAvailableAt` at the time). The streak
// continues only if `now` falls within the single window immediately after
// that boundary — meaning the player opened it the very next time it was
// available. If they skipped one or more resets, it's a fresh streak of 1.
// Reaching a 7-day cycle boundary does NOT reset this — only a missed day
// does. See `getCycleDay` for the part that repeats every 7 days.
function computeUpdatedStreak(now: number, previousPeriodEnd: number | null, previousStreak: number): number {
  if (previousPeriodEnd === null || !Number.isFinite(previousPeriodEnd)) {
    return 1;
  }
  // Nudge a second past the boundary so re-running the reset calculation
  // from that exact instant correctly advances to the *following* reset
  // instead of returning the same one (since it lands exactly on 4:00:00).
  const nextBoundary = getNextPeriodBoundary(new Date(previousPeriodEnd + 1000));
  const isConsecutive = now < nextBoundary;
  return isConsecutive ? previousStreak + 1 : 1;
}

// Maps the uncapped day-streak onto its position within the current 7-day
// cycle (1-7, repeating). Day 7 of a cycle is the omamori/reward day and the
// weekly history table; day 1 of the next cycle is where both reset.
function getCycleDay(streakValue: number): number {
  if (streakValue <= 0) return 0;
  return ((streakValue - 1) % STREAK_CYCLE_LENGTH) + 1;
}

function randomShakesNeeded() {
  return MIN_SHAKES + Math.floor(Math.random() * (MAX_SHAKES - MIN_SHAKES + 1));
}

export default function FortuneSlip({
  slips = [],
  inline = false,
}: FortuneSlipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);
  const [shakesNeeded, setShakesNeeded] = useState(randomShakesNeeded);
  const [selectedSlip, setSelectedSlip] = useState<FortuneSlip | null>(null);
  const [nextAvailableAt, setNextAvailableAt] = useState<number | null>(null);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);
  const [emergeOrigin, setEmergeOrigin] = useState<{ x: number; y: number } | null>(null);
  const [streak, setStreak] = useState(0);
  const [streakHistory, setStreakHistory] = useState<StreakEntry[]>([]);
  const [omamoriMessage, setOmamoriMessage] = useState<string | null>(null);
  // True only when the popup was opened by tapping the *persisted* omamori
  // button (a later visit). The very first reveal right after drawing on
  // day 7 still shows the normal fortune content, same as any other day.
  const [isViewingRewardMessage, setIsViewingRewardMessage] = useState(false);
  const boxButtonRef = useRef<HTMLButtonElement | null>(null);
  // Timestamp of the most recent open, so a stray tap landing right as the
  // popup appears (e.g. the shake gesture's last tap bleeding through) can't
  // dismiss it before the unroll animation even finishes.
  const openedAtRef = useRef<number>(0);

  // Pick a random slip when the component mounts or when slips change
  useEffect(() => {
    if (slips.length > 0 && !selectedSlip) {
      const randomIndex = Math.floor(Math.random() * slips.length);
      setSelectedSlip(slips[randomIndex]);
    }
  }, [slips, selectedSlip]);

  const title = selectedSlip?.title || "Today's Fortune";
  const teaser = selectedSlip?.preview?.trim() || 'Tap to reveal today’s fortune.';
  const content = selectedSlip?.note?.trim() || 'No fortune slips have been configured yet.';
  const imageSrc = '/box.png';

  // On mount, check whether a slip has already been drawn since the last reset.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? Number(stored) : null;
      setNextAvailableAt(parsed && !Number.isNaN(parsed) ? parsed : null);

      // Also restore the streak count and (if it was a 7-day reward) the
      // message that goes with it, so reloading mid-reward-day still shows
      // the same omamori instead of losing it.
      const storedStreak = Number(window.localStorage.getItem(STREAK_COUNT_KEY));
      if (Number.isFinite(storedStreak) && storedStreak > 0) {
        setStreak(storedStreak);
      }
      const storedMessage = window.localStorage.getItem(STREAK_OMAMORI_MESSAGE_KEY);
      if (storedMessage) {
        setOmamoriMessage(storedMessage);
      }
    } catch {
      // localStorage may be unavailable (private browsing, etc.) — fail open.
      setNextAvailableAt(null);
    }
    setHasCheckedStorage(true);
  }, []);

  // If we're on cooldown, automatically reveal the box again the moment it
  // expires, without requiring a page refresh.
  useEffect(() => {
    if (!nextAvailableAt) return;

    const msRemaining = nextAvailableAt - Date.now();
    if (msRemaining <= 0) {
      setNextAvailableAt(null);
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      return;
    }

    const timer = setTimeout(() => {
      setNextAvailableAt(null);
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }, msRemaining);

    return () => clearTimeout(timer);
  }, [nextAvailableAt]);

  const isAvailable = !nextAvailableAt || Date.now() >= nextAvailableAt;
  // True for the whole cooldown window following a cycle-day-7 draw (day 7,
  // 14, 21, ...) — the omamori takes the box's place and stays visible for
  // the rest of that day, instead of the box just disappearing like normal.
  const isRewardCooldown = hasCheckedStorage && !isAvailable && getCycleDay(streak) === STREAK_CYCLE_LENGTH;

  useEffect(() => {
    if (!isOpen) {
      setIsShaking(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    if (Date.now() - openedAtRef.current < MIN_VISIBLE_MS) return;
    setIsOpen(false);
    setIsShaking(false);
    setShakeCount(0);
    setShakesNeeded(randomShakesNeeded());
    setIsViewingRewardMessage(false);
  };

  const handleOpen = (event?: MouseEvent<HTMLButtonElement>) => {
    if (isOpen) {
      handleClose();
      return;
    }

    // Ignore taps that land mid-shake so the animation always finishes cleanly.
    if (isShaking) return;

    const nextCount = shakeCount + 1;
    const isFinalShake = nextCount >= shakesNeeded;

    setShakeCount(nextCount);
    setIsShaking(true);

    const duration = isFinalShake ? 750 : 320;

    setTimeout(() => {
      if (isFinalShake) {
        const rect = boxButtonRef.current?.getBoundingClientRect();
        if (rect) {
          setEmergeOrigin({
            x: rect.left + rect.width / 2 - window.innerWidth / 2,
            y: rect.top + rect.height / 2 - window.innerHeight / 2,
          });
        } else {
          setEmergeOrigin({ x: 0, y: 60 });
        }

        setIsShaking(false);
        setIsOpen(true);
        setIsViewingRewardMessage(false);
        openedAtRef.current = Date.now();

        const now = Date.now();
        const nextTime = getNextPeriodBoundary(new Date(now));

        // Read what was stored from the *previous* open before overwriting it.
        let previousPeriodEnd: number | null = null;
        let previousStreak = 0;
        try {
          const storedPeriodEnd = Number(window.localStorage.getItem(STREAK_PERIOD_KEY));
          previousPeriodEnd = Number.isFinite(storedPeriodEnd) && storedPeriodEnd > 0 ? storedPeriodEnd : null;
          previousStreak = Number(window.localStorage.getItem(STREAK_COUNT_KEY)) || 0;
        } catch {
          // ignore — treated as a fresh streak below
        }

        const updatedStreak = computeUpdatedStreak(now, previousPeriodEnd, previousStreak);
        setStreak(updatedStreak);
        const updatedCycleDay = getCycleDay(updatedStreak);

        // Roll the history forward: a fresh cycle (cycle day 1 — either the
        // streak broke, or the previous cycle just completed on day 7)
        // starts over with just today's fortune; otherwise today's entry
        // gets added to whatever was collected so far this cycle.
        let previousHistory: StreakEntry[] = [];
        try {
          const storedHistoryRaw = window.localStorage.getItem(STREAK_HISTORY_KEY);
          const parsedHistory = storedHistoryRaw ? JSON.parse(storedHistoryRaw) : [];
          previousHistory = Array.isArray(parsedHistory)
            ? parsedHistory.filter(
                (entry): entry is StreakEntry =>
                  typeof entry?.weekday === 'string' && typeof entry?.title === 'string'
              )
            : [];
        } catch {
          previousHistory = [];
        }

        const todayEntry: StreakEntry = { weekday: getWeekdayLabel(new Date(now)), title };
        const updatedHistory = updatedCycleDay === 1 ? [todayEntry] : [...previousHistory, todayEntry];
        setStreakHistory(updatedHistory);

        const rewardMessage =
          updatedCycleDay === STREAK_CYCLE_LENGTH
            ? OMAMORI_MESSAGES[Math.floor(Math.random() * OMAMORI_MESSAGES.length)]
            : null;
        setOmamoriMessage(rewardMessage);

        try {
          window.localStorage.setItem(STORAGE_KEY, String(nextTime));
          window.localStorage.setItem(STREAK_COUNT_KEY, String(updatedStreak));
          window.localStorage.setItem(STREAK_PERIOD_KEY, String(nextTime));
          window.localStorage.setItem(STREAK_HISTORY_KEY, JSON.stringify(updatedHistory));
          if (rewardMessage) {
            window.localStorage.setItem(STREAK_OMAMORI_MESSAGE_KEY, rewardMessage);
          }
        } catch {
          // ignore — cooldown/streak just won't persist across reloads
        }
        setNextAvailableAt(nextTime);
      } else {
        setIsShaking(false);
      }
    }, duration);
  };

  // Opens (or closes, if already open) the persisted 7-day reward view.
  // No shaking needed here — the omamori is just sitting there waiting.
  const handleOpenReward = () => {
    if (isOpen) {
      handleClose();
      return;
    }

    const rect = boxButtonRef.current?.getBoundingClientRect();
    if (rect) {
      setEmergeOrigin({
        x: rect.left + rect.width / 2 - window.innerWidth / 2,
        y: rect.top + rect.height / 2 - window.innerHeight / 2,
      });
    } else {
      setEmergeOrigin({ x: 0, y: 60 });
    }
    setIsOpen(true);
    setIsViewingRewardMessage(true);
    openedAtRef.current = Date.now();
  };

  const shakesRemaining = Math.max(shakesNeeded - shakeCount, 0);
  // Each successive tap rattles a little harder, building toward the release.
  const shakeIntensity = 4 + shakeCount * 2.5;
  const isCurrentFinalShake = shakeCount >= shakesNeeded;
  const shakeDurationMs = isCurrentFinalShake ? 750 : 320;

  return (
    <>
      <style jsx>{`
        @keyframes fortune-shake {
          0%,
          100% {
            transform: rotate(0deg) translateX(0);
          }
          15% {
            transform: rotate(calc(var(--shake-intensity) * -1deg))
              translateX(calc(var(--shake-intensity) * -1px));
          }
          32% {
            transform: rotate(calc(var(--shake-intensity) * 1deg))
              translateX(calc(var(--shake-intensity) * 1px));
          }
          49% {
            transform: rotate(calc(var(--shake-intensity) * -0.8deg))
              translateX(calc(var(--shake-intensity) * -0.8px));
          }
          66% {
            transform: rotate(calc(var(--shake-intensity) * 0.8deg))
              translateX(calc(var(--shake-intensity) * 0.8px));
          }
          83% {
            transform: rotate(calc(var(--shake-intensity) * -0.4deg))
              translateX(calc(var(--shake-intensity) * -0.4px));
          }
        }

        @keyframes fortune-fade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fortune-emerge {
          0% {
            transform: translate(var(--start-x), var(--start-y)) scale(var(--start-scale));
          }
          100% {
            transform: translate(0, 0) scale(1);
          }
        }

        @keyframes fortune-unroll {
          0% {
            transform: scaleY(0.15) scaleX(0.9) translateY(-14px);
            opacity: 0;
          }
          55% {
            transform: scaleY(1.04) scaleX(1.01) translateY(2px);
            opacity: 1;
          }
          75% {
            transform: scaleY(0.98) scaleX(0.995) translateY(-1px);
          }
          100% {
            transform: scaleY(1) scaleX(1) translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      {hasCheckedStorage && isAvailable && (
        <button
          ref={boxButtonRef}
          type="button"
          onClick={handleOpen}
          className={`group overflow-visible rounded-[16px] border border-transparent bg-transparent p-0 text-left shadow-none transition-transform duration-200 hover:scale-[1.03] ${
            inline ? 'relative z-[1200] inline-flex shrink-0 items-center justify-center' : 'hidden'
          }`}
          style={
            {
              width: '64px',
              height: '152px',
              borderRadius: '14px 14px 12px 12px',
              animation: isShaking ? `fortune-shake ${shakeDurationMs}ms ease-in-out` : 'none',
              '--shake-intensity': String(shakeIntensity),
            } as CSSProperties
          }
          aria-label={
            shakesRemaining > 0
              ? `Shake the fortune box — ${shakesRemaining} more shake${
                  shakesRemaining === 1 ? '' : 's'
                } needed`
              : 'Open fortune slip'
          }
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={title}
              className="h-full w-full object-contain object-left"
            />
          ) : (
            <>
              <div className="absolute inset-0 rounded-[20px] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_35%)]" />
              <div className="absolute inset-0 rounded-[20px] border border-[#f3c999]/20" />
              <div className="absolute left-2 right-2 top-2 h-7 rounded-full border border-[#f3c999]/25 bg-[linear-gradient(90deg,rgba(255,255,255,0.12),rgba(91,23,16,0.35))]" />
              <div className="absolute inset-x-3 top-10 flex items-center justify-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#f3c999]/25 bg-[#4f0f0e]/75 text-[16px] text-[#f8e4b6] shadow-[inset_0_2px_4px_rgba(255,255,255,0.14)]">
                  福
                </div>
              </div>
              <div className="absolute left-3 right-3 top-[56px] h-[1px] border-t border-dashed border-[#f3c999]/25" />
              <div className="absolute -right-[10px] top-[40px] h-[72px] w-[12px] rounded-r-full border border-[#f3c999]/20 bg-[linear-gradient(180deg,#b82d1d,#65120d)] shadow-[inset_0_2px_0_rgba(255,255,255,0.16)]" />
              <div className="absolute inset-x-3 bottom-3 flex items-center justify-center rounded-full border border-[#f3c999]/20 bg-[#4f0f0e]/70 px-1 py-1 text-[10px] font-medium uppercase tracking-[0.24em] text-[#f8e4b6]/90">
                <span className="text-[12px]">運</span>
              </div>
            </>
          )}
        </button>
      )}

      {isRewardCooldown && (
        <button
          ref={boxButtonRef}
          type="button"
          onClick={handleOpenReward}
          className={`group overflow-visible rounded-[16px] border border-transparent bg-transparent p-0 text-left shadow-none transition-transform duration-200 hover:scale-[1.03] ${
            inline ? 'relative z-[1200] inline-flex shrink-0 items-center justify-center' : 'hidden'
          }`}
          style={{ width: '64px', height: '152px' }}
          aria-label="View your 7-day omamori reward"
        >
          <img src="/omamori.png" alt="Omamori charm" className="h-full w-full object-contain object-left" />
        </button>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-[1300] flex items-center justify-center bg-[rgba(5,3,2,0.72)] px-4 py-6 backdrop-blur-sm"
          style={{ animation: 'fortune-fade 250ms ease-out both' }}
          onClick={handleClose}
        >
          <div
            className="relative w-full max-w-[280px]"
            style={
              {
                animation: 'fortune-emerge 420ms cubic-bezier(0.16,1,0.3,1) both',
                '--start-x': `${emergeOrigin?.x ?? 0}px`,
                '--start-y': `${emergeOrigin?.y ?? 60}px`,
                '--start-scale': 0.22,
              } as CSSProperties
            }
          >
            {/* cord + tag, as if this were pulled out on a string */}
            <div className="pointer-events-none absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-[90%] flex-col items-center">
              <div className="h-3 w-3 rounded-full border-2 border-[#b82d1d]/80 bg-[#fff9ea]" />
              <div className="h-5 w-[2px] bg-[#b82d1d]/60" />
            </div>

            {/* extra sheets peeking out behind, like a small stack of slips */}
            <div className="pointer-events-none absolute -inset-1 -z-20 rotate-2 rounded-[14px] border border-[#8b5a3c]/10 bg-[#f2cf95]/40" />
            <div className="pointer-events-none absolute -inset-1 -z-10 -rotate-1 rounded-[14px] border border-[#8b5a3c]/15 bg-[#f2cf95]/60" />

            <div
              className="relative origin-top overflow-hidden rounded-[12px] border border-[#8b5a3c]/30 text-[#3b2413] shadow-[0_25px_80px_rgba(0,0,0,0.55)]"
              style={{
                animation: 'fortune-unroll 520ms ease-out 260ms both',
                background:
                  'radial-gradient(circle at 18% 22%, rgba(139,90,60,0.07), transparent 42%), radial-gradient(circle at 82% 78%, rgba(139,90,60,0.06), transparent 46%), linear-gradient(145deg,#fff9ea,#f2cf95)',
              }}
            >
              {/* faint vertical rule, like manuscript paper */}
              <div
                className="pointer-events-none absolute inset-0 opacity-70"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(to right, transparent, transparent 22px, rgba(139,90,60,0.07) 22px, rgba(139,90,60,0.07) 23px)',
                }}
              />

              {/* double inner border, framing it like a certificate */}
              <div className="pointer-events-none absolute inset-3 rounded-[10px] border border-[#8b5a3c]/20" />
              <div className="pointer-events-none absolute inset-[14px] rounded-[8px] border border-[#8b5a3c]/10" />

              {/* vermillion seal, stamped over the edge */}
              <div
                className="pointer-events-none absolute -right-2 top-4 flex h-11 w-11 rotate-[-12deg] items-center justify-center rounded-[4px] border-[3px] border-[#b82d1d]/70 text-lg font-bold text-[#b82d1d]/70"
                style={{ mixBlendMode: 'multiply' }}
              >
                福
              </div>

              {/* accent bar down the left margin */}
              <div className="pointer-events-none absolute bottom-6 left-4 top-6 w-[3px] rounded-full bg-[#b82d1d]/50" />

              <div className="relative px-7 pb-6 pt-8">
                {isViewingRewardMessage ? (
                  <div className="flex flex-col items-center py-4">
                    <p className="text-center text-[10px] font-mono uppercase tracking-[0.5em] text-[#b82d1d]">
                      ✦ Omamori ✦
                    </p>
                    <p className="mt-5 text-center text-[16px] font-semibold not-italic leading-8 text-[#7a1f12]">
                      {omamoriMessage}
                    </p>

                    <div className="mt-6 flex items-center justify-center gap-2 text-[#b82d1d]/40">
                      <span className="h-px w-6 bg-[#b82d1d]/30" />
                      <span className="text-[11px]">福</span>
                      <span className="h-px w-6 bg-[#b82d1d]/30" />
                    </div>

                    <p className="mt-3 text-center text-[10px] font-mono uppercase tracking-[0.3em] text-[#8b5a3c]/70">
                      Tap anywhere to close
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-center text-[10px] font-mono uppercase tracking-[0.4em] text-[#8b5a3c]">
                      おみくじ
                    </p>
                    <div className="mx-auto mt-2 h-px w-10 bg-[#8b5a3c]/40" />
                    <h3 className="mt-3 text-center text-xl font-semibold tracking-wide text-[#4a2b16]">
                      {title}
                    </h3>

                    {streak > 0 && (
                      <div className="mx-auto mt-2 flex w-fit items-center gap-1.5 rounded-full border border-[#b82d1d]/30 bg-[#b82d1d]/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b82d1d]">
                        <span>🔥</span>
                        <span>
                          {streak}-Day Streak
                        </span>
                      </div>
                    )}

                    <div className="mt-5 rounded-[12px] border border-[#8b5a3c]/20 bg-[#fffdf8]/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                      <p className="whitespace-pre-line text-center text-[15px] leading-8 text-[#3f2815]">
                        {content}
                      </p>
                    </div>

                    <p className="mt-3 whitespace-pre-line text-center text-[13px] italic leading-6 text-[#8b5a3c]/80">
                      {teaser}
                    </p>

                    {getCycleDay(streak) >= HISTORY_VISIBLE_FROM_STREAK && streakHistory.length > 0 && (
                      <div className="mt-4 rounded-[10px] border border-[#8b5a3c]/20 bg-[#fffdf8]/70 p-3">
                        <p className="text-center text-[10px] font-mono uppercase tracking-[0.3em] text-[#8b5a3c]">
                          This Week's Fortunes
                        </p>
                        <div className="mt-2 grid grid-cols-7 gap-1">
                          {WEEKDAY_ORDER.map((day) => {
                            const entry = streakHistory.find((item) => item.weekday === day);
                            return (
                              <div key={day} className="flex flex-col items-center gap-1">
                                <span className="text-[8px] font-mono uppercase tracking-wide text-[#8b5a3c]/70">
                                  {day}
                                </span>
                                <div
                                  title={entry?.title}
                                  className={`flex h-14 w-full items-center justify-center rounded-md border px-1 text-center text-[8.5px] leading-snug ${
                                    entry
                                      ? 'border-[#8b5a3c]/30 bg-[#f2cf95]/50 text-[#4a2b16]'
                                      : 'border-dashed border-[#8b5a3c]/15 bg-transparent text-[#8b5a3c]/30'
                                  }`}
                                >
                                  <span className="line-clamp-2 break-words">{entry ? entry.title : '—'}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="mt-5 flex items-center justify-center gap-2 text-[#8b5a3c]/50">
                      <span className="h-px w-6 bg-[#8b5a3c]/30" />
                      <span className="text-[11px]">✳</span>
                      <span className="h-px w-6 bg-[#8b5a3c]/30" />
                    </div>

                    <p className="mt-3 text-center text-[10px] font-mono uppercase tracking-[0.3em] text-[#8b5a3c]/70">
                      Tap anywhere to close
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}