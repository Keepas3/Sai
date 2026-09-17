'use client';

// Adapted from a reactbits-style "AccordionGallery" example: a row of image
// panels where the active one expands with a 3D tilt, parallax image drift,
// grayscale-to-color, and a caption reveal. The reference drives all of that
// through GSAP timelines; this site has no GSAP dependency, and its other
// hand-built animated components (GalleryDriftWall.tsx, GlowCursor.tsx)
// deliberately avoid pulling in an animation library — they hand-roll either
// a requestAnimationFrame loop (continuous motion) or plain CSS transitions
// (discrete state changes). Every animated value here is a discrete state
// change (which panel is active), so it's implemented as plain React state
// feeding inline styles/CSS custom properties, with CSS `transition` in
// AccordionGallery.module.css doing all the interpolation — no per-panel
// refs or imperative timeline needed.
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react';
import styles from './AccordionGallery.module.css';

export interface AccordionGalleryItem {
  image: string;
  label?: string;
  description?: string;
  link?: string;
  alt?: string;
}

interface AccordionGalleryProps {
  items: AccordionGalleryItem[];
  defaultIndex?: number;
  accentColor?: string;
  overlayColor?: string;
  textColor?: string;
  height?: number;
  gap?: number;
  radius?: number;
  expandRatio?: number;
  orientation?: 'horizontal' | 'vertical';
  duration?: number;
  // A CSS transition-timing-function (e.g. "ease-out", "cubic-bezier(...)")
  // — NOT a GSAP easing name like "power3.out", since there's no GSAP here.
  ease?: string;
  parallax?: number;
  tilt?: number;
  stagger?: number;
  trigger?: 'hover' | 'click';
  showLabels?: boolean;
  grayscale?: boolean;
  className?: string;
}

export default function AccordionGallery({
  items,
  defaultIndex = 2,
  accentColor = '#ffffff',
  overlayColor = '#060010',
  textColor = '#ffffff',
  height = 567,
  gap = 10,
  radius = 16,
  expandRatio = 0.52,
  orientation = 'horizontal',
  duration = 0.6,
  ease = 'cubic-bezier(0.16, 1, 0.3, 1)',
  parallax = 0.5,
  tilt = 8,
  stagger = 0.06,
  trigger = 'hover',
  showLabels = true,
  grayscale = true,
  className = '',
}: AccordionGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const vertical = orientation === 'vertical';
  const count = items.length;
  const ratio = Math.min(Math.max(expandRatio, 0.2), 0.9);

  const [rawActive, setActive] = useState(() => Math.min(Math.max(defaultIndex, 0), Math.max(count - 1, 0)));
  // Derived rather than synced via an effect — if `items` shrinks after
  // mount, this just clamps the read instead of needing a setState-in-effect
  // round trip to keep `rawActive` in range.
  const active = Math.min(Math.max(rawActive, 0), Math.max(count - 1, 0));
  const [mediaSize, setMediaSize] = useState(320);

  // Measures the row/column so the media parallax drift can be sized
  // relative to it — same ResizeObserver-on-the-container pattern as
  // GalleryDriftWall.tsx's containerRef.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const total = vertical ? rect.height : rect.width;
      const usable = Math.max(total - gap * (count - 1), 120);
      setMediaSize(Math.max(140, usable * ratio * 1.22));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [gap, count, ratio, vertical]);

  if (!count) return null;

  // Collapsed panels get a bit more breathing room (flex-grow > 1) and only
  // partial grayscale, rather than being tiny and fully desaturated — keeps
  // the non-featured panels legible instead of reading as "dead" filler.
  const COLLAPSED_GROW = 0.7;
  const COLLAPSED_GRAY = 0.55;

  const grow = count > 1 ? (ratio * (count - 1)) / (1 - ratio) : 1;

  const handleClick = (i: number, e: MouseEvent) => {
    if (i !== active) {
      e.preventDefault();
      setActive(i);
    }
  };

  const handleKeyDown = (i: number, e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i + 1) % count);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i - 1 + count) % count);
    }
  };

  return (
    <div
      ref={rootRef}
      className={`${styles.accordionGallery}${vertical ? ` ${styles.vertical}` : ''}${className ? ` ${className}` : ''}`}
      style={{
        '--ag-accent': accentColor,
        '--ag-overlay': overlayColor,
        '--ag-text': textColor,
        '--ag-gap': `${gap}px`,
        '--ag-radius': `${radius}px`,
        '--ag-duration': `${duration}s`,
        '--ag-ease': ease,
        '--ag-stagger': `${stagger}s`,
        '--ag-media-size': `${mediaSize}px`,
        height: vertical ? `${Math.round(height * 1.6)}px` : `${height}px`,
      } as CSSProperties}
      role="list"
      aria-label="Image accordion gallery"
    >
      {items.map((item, i) => {
        const isActive = i === active;
        const rot = isActive ? 0 : i < active ? tilt : -tilt;
        const panelTransform = vertical ? `rotateX(${-rot}deg)` : `rotateY(${rot}deg)`;

        const drift = Math.max(-1.5, Math.min(1.5, active - i));
        const shift = isActive ? 0 : drift * parallax * mediaSize * 0.06;
        const mediaTransform = vertical
          ? `translate(-50%, -50%) translateY(${shift}px)`
          : `translate(-50%, -50%) translateX(${shift}px)`;

        // Dynamic tag mirrors the same pattern already used in
        // app/projects/page.tsx for its project cards.
        const Tag = (item.link ? 'a' : 'div') as any;
        // Only force a new tab for external links — an internal route (e.g.
        // "/projects/slug") should navigate in-tab like any other link.
        // Same convention already used in BlogLinkButton.tsx / the blog's
        // link mark.
        const isExternal = !!item.link && !item.link.startsWith('/');
        const linkProps = item.link
          ? { href: item.link, ...(isExternal ? { target: '_blank', rel: 'noreferrer noopener' } : {}) }
          : {};

        return (
          <Tag
            key={i}
            className={`${styles.panel}${isActive ? ` ${styles.panelActive}` : ''}`}
            style={{ flexGrow: isActive ? grow : COLLAPSED_GROW, borderRadius: `${radius}px`, transform: panelTransform }}
            {...linkProps}
            onClick={(e: MouseEvent) => handleClick(i, e)}
            onMouseEnter={() => trigger === 'hover' && setActive(i)}
            onFocus={() => setActive(i)}
            onKeyDown={(e: KeyboardEvent) => handleKeyDown(i, e)}
            role="listitem"
            tabIndex={0}
            aria-current={isActive ? 'true' : undefined}
            aria-label={item.label}
          >
            <span
              className={styles.frame}
              style={{ '--ag-gray': grayscale ? (isActive ? 0 : COLLAPSED_GRAY) : 0, '--ag-dim': isActive ? 0 : 0.35 } as CSSProperties}
            >
              <span className={styles.media} style={{ transform: mediaTransform }}>
                <img src={item.image} alt={item.alt || item.label || ''} draggable={false} />
              </span>
              <span className={styles.overlay} aria-hidden="true" />
            </span>
            {showLabels && (
              <span className={styles.label} aria-hidden="true">
                <span className={styles.bar} />
                <span className={styles.textGroup}>
                  <span className={styles.text}>{item.label}</span>
                  {item.description && <span className={styles.description}>{item.description}</span>}
                </span>
              </span>
            )}
          </Tag>
        );
      })}
    </div>
  );
}
