'use client';

// Adapted from a reactbits-style "DriftWall" example: continuously drifting
// 3D-tilted photo columns with parallax-on-hover and per-tile hover-lift.
// The rAF-driven animation loop and column/copy math are structurally
// unchanged from that source (still transform-only per frame — translate3d
// for column drift, translate/rotate/scale for the plane's parallax tilt).
// Everything else — the props surface, the FlatPhoto item shape, and the
// pause-when-nobody-benefits guards below — is adapted for this site's
// Gallery "All Photos" view. The pause pattern (keep the rAF chain ticking,
// skip the expensive branch, resume instantly) mirrors the fix already
// shipped for GlowCursor.tsx's idle-fade.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import styles from './GalleryDriftWall.module.css';

export interface FlatPhoto {
  key: string;
  index: number;
  url: string;
  title: string;
  description?: string;
  albumId: string;
  albumTitle: string;
}

interface GalleryDriftWallProps {
  items: FlatPhoto[];
  onSelect: (index: number) => void;
  // True while something else (the lightbox) is covering the wall — no
  // point animating behind a fullscreen overlay.
  isPaused?: boolean;
}

// Page-specific tuning, not exposed as props — this is one view of the
// Gallery page, not a generic reusable library component. Desktop sizing;
// see the isMobile-driven overrides inside the component below — at the
// desktop tile size + column count, a phone-width viewport could only ever
// fit ~1.5 columns on screen (the plane's flex width times its scale
// transform vastly exceeds a phone's viewport), so mobile needs its own
// smaller tile/gap/column numbers rather than just shrinking everything
// uniformly the way the album coverflow's single scale factor could.
const COLUMNS = 5;
const TILE_WIDTH = 200;
const TILE_HEIGHT = 132;
const GAP = 18;
const PLANE_SCALE = 1.28;
const TILT = 16;
const TURN = -14;
const DEPTH = 60;
const SPEED = 42;
const VARIANCE = 0.45;
const PARALLAX = 0.6;

// prefers-reduced-motion used to fully freeze the drift — but it's the only
// thing on the whole site that checks this flag, so on a machine where it's
// on for an unrelated reason (a laptop's battery/performance toggle, not a
// deliberate motion-sensitivity choice) the wall looked broken/frozen while
// everything else kept animating normally. A heavily slowed drift instead
// of a hard stop still respects the setting's intent — much calmer motion —
// without reading as "this part of the site doesn't work."
const REDUCED_MOTION_SPEED_FACTOR = 0.2;

const MOBILE_COLUMNS = 3;
const MOBILE_TILE_WIDTH = 104;
const MOBILE_TILE_HEIGHT = 72;
const MOBILE_GAP = 8;
const MOBILE_PLANE_SCALE = 1.08;

// Loose ceilings, not a tight budget — the infinite-scroll illusion needs
// enough duplicated tiles to cover ~1.6x the visible height per column, and
// with only a handful of photos per column (a small gallery, or one spread
// thin across COLUMNS) that can genuinely need a dozen-plus copies. A tight
// cap here was the actual cause of the wall periodically going blank: once
// real coverage exceeded the cap, the track ran out of duplicated tiles
// before looping back, and that gap scrolled into view as a visible hole
// every cycle. These only exist to stop a truly pathological case (a
// near-empty gallery) from computing something absurd.
const MAX_COPIES = 24;
const MAX_CONTAINER_HEIGHT = 1400;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const columnFactor = (index: number, variance: number) => {
  const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
  return 1 + variance * pseudo;
};

export default function GalleryDriftWall({ items, onSelect, isPaused = false }: GalleryDriftWallProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const trackRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef(0);

  const offsetsRef = useRef<number[]>([]);
  const velocitiesRef = useRef<number[]>([]);
  const hoveredColRef = useRef(-1);
  const pointerRef = useRef({ x: 0, y: 0 });
  const pointerDampedRef = useRef({ x: 0, y: 0 });
  const lastTsRef = useRef<number | null>(null);

  // Plain ref, not state — read every frame inside the rAF loop, so a
  // state update (and the re-render it'd trigger) would be pure waste.
  const pausedRef = useRef(isPaused);

  const [containerHeight, setContainerHeight] = useState(600);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const [reduced, setReduced] = useState(false);

  // Same breakpoint/pattern as the album coverflow in app/gallery/page.tsx
  // and TetrisGame.tsx's own isMobile check.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const columns = isMobile ? MOBILE_COLUMNS : COLUMNS;
  const tileWidth = isMobile ? MOBILE_TILE_WIDTH : TILE_WIDTH;
  const tileHeight = isMobile ? MOBILE_TILE_HEIGHT : TILE_HEIGHT;
  const gap = isMobile ? MOBILE_GAP : GAP;
  const planeScale = isMobile ? MOBILE_PLANE_SCALE : PLANE_SCALE;

  useEffect(() => {
    pausedRef.current = isPaused || document.hidden;
  }, [isPaused]);

  useEffect(() => {
    setReduced(prefersReducedMotion());
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Pause when the tab is backgrounded — same "skip work nobody benefits
  // from" principle as GlowCursor's idle-fade, gated on tab visibility
  // instead of pointer idle time.
  useEffect(() => {
    const onVisibilityChange = () => {
      pausedRef.current = isPaused || document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [isPaused]);

  const columnItems = useMemo(() => {
    const cols: FlatPhoto[][] = Array.from({ length: columns }, () => []);
    items.forEach((item, i) => cols[i % columns].push(item));
    return cols.map((col) => (col.length ? col : items.slice(0, 1)));
  }, [items, columns]);

  const columnMeta = useMemo(() => {
    const unit = tileHeight + gap;
    const cappedHeight = Math.min(containerHeight, MAX_CONTAINER_HEIGHT);
    return columnItems.map((col) => {
      const copyHeight = Math.max(unit, col.length * unit);
      const copies = Math.min(MAX_COPIES, Math.max(2, Math.ceil((cappedHeight * 1.6) / copyHeight) + 1));
      return { copyHeight, copies };
    });
  }, [columnItems, containerHeight, tileHeight, gap]);

  // Defensive: bound how large a reported container height can push the
  // copy math, mirroring GlowCursor's "size to what's visible" lesson.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerHeight(Math.min(entry.contentRect.height || 600, MAX_CONTAINER_HEIGHT));
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const baseVelocities = useMemo(() => {
    return columnItems.map((_, c) => {
      const altSign = c % 2 === 0 ? 1 : -1;
      return SPEED * columnFactor(c, VARIANCE) * altSign;
    });
  }, [columnItems]);

  useEffect(() => {
    offsetsRef.current = columnMeta.map((meta, c) => meta.copyHeight * ((c * 0.37) % 1));
    velocitiesRef.current = columnItems.map(() => 0);
  }, [columnMeta, columnItems]);

  const applyPlaneTransform = useCallback(
    (px: number, py: number) => {
      const plane = planeRef.current;
      if (!plane) return;
      plane.style.transform =
        `translate(-50%, -50%) scale(${planeScale}) ` + `rotateX(${TILT + py}deg) rotateY(${TURN + px}deg) ` + `translateZ(${-DEPTH}px)`;
    },
    [planeScale]
  );

  useEffect(() => {
    if (items.length === 0) return;

    const animate = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dt = Math.min(0.05, Math.max(0, ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;

      // The plane's own tilt transform always runs, paused or not — it's a
      // single cheap style write, and skipping it (as a previous version of
      // this component did) left the plane with NO transform at all
      // whenever a pause started before the first frame ever ran, which is
      // what made the whole wall appear to vanish (the un-transformed plane
      // sits at its raw top:50%/left:50% CSS position instead of being
      // centered, so only a sliver near the container's center was ever
      // visible). Only the per-column drift loop below — the actual
      // per-frame cost — is worth skipping while paused.
      const maxTilt = PARALLAX * 8;
      const targetX = pointerRef.current.x * maxTilt;
      const targetY = -pointerRef.current.y * maxTilt;
      const damp = 1 - Math.exp(-dt / 0.12);
      pointerDampedRef.current.x += (targetX - pointerDampedRef.current.x) * damp;
      pointerDampedRef.current.y += (targetY - pointerDampedRef.current.y) * damp;
      applyPlaneTransform(pointerDampedRef.current.x, pointerDampedRef.current.y);

      if (!pausedRef.current) {
        const motionScale = reduced ? REDUCED_MOTION_SPEED_FACTOR : 1;
        for (let c = 0; c < trackRefs.current.length; c++) {
          const meta = columnMeta[c];
          if (!meta) continue;
          const target = hoveredColRef.current === c ? 0 : baseVelocities[c] * motionScale;

          const ease = 1 - Math.exp(-dt / (target === 0 ? 0.16 : 0.28));
          velocitiesRef.current[c] += (target - velocitiesRef.current[c]) * ease;
          let next = (offsetsRef.current[c] ?? 0) + velocitiesRef.current[c] * dt;
          next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
          offsetsRef.current[c] = next;

          const el = trackRefs.current[c];
          if (el) el.style.transform = `translate3d(0, ${-next}px, 0)`;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [baseVelocities, columnMeta, reduced, applyPlaneTransform, items.length]);

  const activate = useCallback((id: string, index: number) => {
    activeIdRef.current = id;
    hoveredColRef.current = index;
    setActiveId(id);
  }, []);
  const release = useCallback(() => {
    activeIdRef.current = null;
    hoveredColRef.current = -1;
    setActiveId(null);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (PARALLAX > 0 && !reduced) {
        pointerRef.current = {
          x: (e.clientX - rect.left) / rect.width - 0.5,
          y: (e.clientY - rect.top) / rect.height - 0.5,
        };
      }
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      const tile = hit?.closest('[data-tile-id]') as HTMLElement | null;
      if (!tile) return;
      const id = tile.dataset.tileId;
      if (!id || id === activeIdRef.current) return;
      activeIdRef.current = id;
      hoveredColRef.current = Number(tile.dataset.col);
      setActiveId(id);
    },
    [reduced]
  );

  const handlePointerLeaveWall = useCallback(() => {
    pointerRef.current = { x: 0, y: 0 };
    release();
  }, [release]);

  const cssVars = useMemo(
    () =>
      ({
        '--dw-tile-w': `${tileWidth}px`,
        '--dw-tile-h': `${tileHeight}px`,
        '--dw-gap': `${gap}px`,
      }) as React.CSSProperties,
    [tileWidth, tileHeight, gap]
  );

  if (items.length === 0) {
    return <div className={styles.empty}>No photos yet.</div>;
  }

  return (
    <div
      ref={containerRef}
      className={styles.wall}
      style={cssVars}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeaveWall}
      role="group"
      aria-label="All photos"
    >
      <div ref={planeRef} className={styles.plane}>
        {columnItems.map((col, c) => {
          const meta = columnMeta[c];
          const copies = Array.from({ length: meta.copies });
          return (
            <div className={styles.column} key={`col-${c}`}>
              <div
                className={styles.track}
                ref={(el) => {
                  trackRefs.current[c] = el;
                }}
              >
                {copies.map((_, copyIndex) =>
                  col.map((item, itemIndex) => {
                    const id = `${c}-${copyIndex}-${itemIndex}`;
                    return (
                      <div
                        key={id}
                        tabIndex={0}
                        role="button"
                        aria-label={item.title}
                        data-tile-id={id}
                        data-col={c}
                        className={`${styles.tile}${activeId === id ? ` ${styles.isActive}` : ''}`}
                        onFocus={() => activate(id, c)}
                        onBlur={release}
                        onClick={() => onSelect(item.index)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelect(item.index);
                          }
                        }}
                      >
                        <span className={styles.tileInner}>
                          {/* No loading="lazy" here — native lazy-loading computes
                              distance-from-viewport from the element's untransformed
                              layout box, which is meaningless for a tile living inside
                              a 3D-transformed, constantly-translating plane/track. That
                              mismatch was why tiles would sometimes fail to fetch at
                              all, or pop in late ("blink and reappear") once the
                              browser's heuristic finally decided they were near enough
                              — loading eagerly sidesteps the heuristic entirely. */}
                          <img src={item.url} alt={item.title} decoding="async" draggable={false} />
                          <span className={styles.tileOverlay} aria-hidden="true" />
                        </span>
                        <span className={styles.albumTag}>{item.albumTitle}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
