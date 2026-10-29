'use client';

interface FortuneButterflyProps {
  caught: boolean;
  onCatch: () => void;
}

// A small blue butterfly that flutters in and lands on the top-left corner of
// the open fortune slip. Tapping it catches it: it stays put and a little
// message explains the good-luck charm it gives. Must be rendered inside the
// slip's (non-clipping) wrapper, since the paper itself is overflow-hidden.
export default function FortuneButterfly({ caught, onCatch }: FortuneButterflyProps) {
  // One wing, drawn for the right side of the body (x 24..46); the left side
  // reuses it mirrored. The inner <g className="wing"> is what flaps (scaleX
  // around the body line at x=24).
  const wing = (
    <g className="wing">
      <path d="M24 19 C30 3 42 1 46 8 C48 14 40 20 24 21 Z" fill="url(#fortune-bf-upper)" />
      <path d="M24 21.5 C38 21 44 28 40.5 34 C36.5 38.5 28 32 24 24.5 Z" fill="url(#fortune-bf-lower)" />
      <circle cx="39" cy="10" r="2" fill="#e8f5ff" opacity="0.7" />
      <circle cx="37" cy="29" r="1.4" fill="#e8f5ff" opacity="0.6" />
      <path d="M24 20 C32 11 38 9 44 9" stroke="#0f3f8a" strokeOpacity="0.35" strokeWidth="0.6" fill="none" />
    </g>
  );

  // The stylesheet is global so its selectors reach the SVG groups in `wing`
  // above; every class name is prefixed `fortune-bf` to stay collision-free.
  return (
    <>
      <style jsx global>{`
        .fortune-bf {
          animation: fortune-bf-fly 1.9s cubic-bezier(0.22, 0.8, 0.3, 1) 0.9s both;
        }
        .fortune-bf .wing {
          transform-origin: 24px 20px;
          animation: fortune-bf-flap 0.16s ease-in-out 0.9s 12,
            fortune-bf-idle 3.4s ease-in-out 2.82s infinite;
        }
        .fortune-bf-glow {
          filter: drop-shadow(0 0 5px rgba(74, 163, 255, 0.85));
        }
        .fortune-bf-bubble {
          animation: fortune-bf-pop 280ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes fortune-bf-fly {
          0% {
            transform: translate(170px, -130px) rotate(30deg) scale(0.6);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          40% {
            transform: translate(90px, -30px) rotate(-15deg) scale(0.9);
          }
          65% {
            transform: translate(30px, -50px) rotate(12deg) scale(1.05);
          }
          85% {
            transform: translate(8px, -4px) rotate(-5deg) scale(1);
          }
          100% {
            transform: translate(0, 0) rotate(0deg) scale(1);
            opacity: 1;
          }
        }

        @keyframes fortune-bf-flap {
          0%,
          100% {
            transform: scaleX(1);
          }
          50% {
            transform: scaleX(0.25);
          }
        }

        /* Resting flaps: mostly still, then a lazy open-and-close. */
        @keyframes fortune-bf-idle {
          0%,
          70%,
          100% {
            transform: scaleX(1);
          }
          82% {
            transform: scaleX(0.35);
          }
          92% {
            transform: scaleX(1);
          }
        }

        @keyframes fortune-bf-pop {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.92);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .fortune-bf {
            animation: none;
          }
          .fortune-bf .wing {
            animation: none;
          }
          .fortune-bf-bubble {
            animation: none;
          }
        }
      `}</style>

      <div className="absolute -left-3 -top-5 z-20">
        <button
          type="button"
          onClick={(event) => {
            // Catching the butterfly must not count as tapping the backdrop.
            event.stopPropagation();
            if (!caught) onCatch();
          }}
          aria-label={caught ? 'Blue butterfly, caught' : 'Blue butterfly. Tap to catch it.'}
          className={`fortune-bf ${caught ? 'fortune-bf-glow' : ''} block h-[44px] w-[52px] cursor-pointer border-0 bg-transparent p-0`}
        >
          <svg viewBox="0 0 48 40" width="52" height="44" aria-hidden="true" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="fortune-bf-upper" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8fd0ff" />
                <stop offset="100%" stopColor="#1e6fd9" />
              </linearGradient>
              <linearGradient id="fortune-bf-lower" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4aa3ff" />
                <stop offset="100%" stopColor="#1558b8" />
              </linearGradient>
            </defs>
            {/* left wing: the same shape mirrored across the body line */}
            <g transform="matrix(-1 0 0 1 48 0)">{wing}</g>
            {wing}
            <ellipse cx="24" cy="22" rx="1.7" ry="8" fill="#12356b" />
            <path d="M24 14.5 C23 10 21 7 19 6 M24 14.5 C25 10 27 7 29 6" stroke="#12356b" strokeWidth="0.8" strokeLinecap="round" fill="none" />
          </svg>
        </button>

        {caught && (
          <div
            className="fortune-bf-bubble pointer-events-none absolute left-3 top-[46px] w-[200px] rounded-[10px] border border-[#8b5a3c]/30 bg-[#fff9ea] px-3 py-2 text-[#3b2413] shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          >
            <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#1e6fd9]">
              Good luck charm
            </p>
            <p className="mt-1 text-[12px] leading-[1.45]">
              Your streak will continue, even if you miss days.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
