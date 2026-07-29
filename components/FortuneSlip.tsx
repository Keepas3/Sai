'use client';

import { useEffect, useState, type CSSProperties, type MouseEvent } from 'react';

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
const MIN_SHAKES = 3;
const MAX_SHAKES = 4;

// Once a slip is drawn, the box disappears for this long before it resets.
const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = 'fortune-slip:next-available-at';

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

  // On mount, check whether a slip was already drawn within the last 24 hours.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? Number(stored) : null;
      setNextAvailableAt(parsed && !Number.isNaN(parsed) ? parsed : null);
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
    setIsOpen(false);
    setIsShaking(false);
    setShakeCount(0);
    setShakesNeeded(randomShakesNeeded());
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
        setIsShaking(false);
        setIsOpen(true);

        const nextTime = Date.now() + COOLDOWN_MS;
        try {
          window.localStorage.setItem(STORAGE_KEY, String(nextTime));
        } catch {
          // ignore — cooldown just won't persist across reloads
        }
        setNextAvailableAt(nextTime);
      } else {
        setIsShaking(false);
      }
    }, duration);
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

      {isOpen && (
        <div
          className="fixed inset-0 z-[1300] flex items-center justify-center bg-[rgba(5,3,2,0.72)] px-4 py-6 backdrop-blur-sm"
          style={{ animation: 'fortune-fade 250ms ease-out both' }}
          onClick={handleClose}
        >
          <div
            className="relative w-full max-w-[280px] origin-top"
            style={{ animation: 'fortune-unroll 650ms cubic-bezier(0.22,1,0.36,1) both' }}
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
              className="relative overflow-hidden rounded-[12px] border border-[#8b5a3c]/30 text-[#3b2413] shadow-[0_25px_80px_rgba(0,0,0,0.55)]"
              style={{
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
                <p className="text-center text-[10px] font-mono uppercase tracking-[0.4em] text-[#8b5a3c]">
                  おみくじ
                </p>
                <div className="mx-auto mt-2 h-px w-10 bg-[#8b5a3c]/40" />
                <h3 className="mt-3 text-center text-xl font-semibold tracking-wide text-[#4a2b16]">
                  {title}
                </h3>

                <div className="mt-5 rounded-[12px] border border-[#8b5a3c]/20 bg-[#fffdf8]/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  <p className="whitespace-pre-line text-center text-[15px] leading-8 text-[#3f2815]">
                    {content}
                  </p>
                </div>

                <p className="mt-3 whitespace-pre-line text-center text-[13px] italic leading-6 text-[#8b5a3c]/80">
                  {teaser}
                </p>

                <div className="mt-5 flex items-center justify-center gap-2 text-[#8b5a3c]/50">
                  <span className="h-px w-6 bg-[#8b5a3c]/30" />
                  <span className="text-[11px]">✳</span>
                  <span className="h-px w-6 bg-[#8b5a3c]/30" />
                </div>

                <p className="mt-3 text-center text-[10px] font-mono uppercase tracking-[0.3em] text-[#8b5a3c]/70">
                  Tap anywhere to close
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}