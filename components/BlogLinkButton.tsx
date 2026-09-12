'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface BlogLinkButtonProps {
  href?: string;
  children: ReactNode;
}

// The blog's "glassy" link rows (see .glass-link-btn in globals.css) used to
// render as a single <a> wrapping both the link text AND the ⋮ icon, so
// tapping the icon just followed the link like the rest of the row instead
// of opening a share/copy menu. Split into: an inner <a> for the text (still
// navigates on click) and a separate <button> for the icon that opens a
// small popup instead.
export default function BlogLinkButton({ href, children }: BlogLinkButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  if (!href) {
    return (
      <span className="glass-link-btn">
        <span className="glass-link-text">{children}</span>
      </span>
    );
  }

  const rel = !href.startsWith('/') ? 'noreferrer noopener' : undefined;
  const target = !href.startsWith('/') ? '_blank' : undefined;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — menu just stays open.
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ url: href });
      } catch {
        // User dismissed the native share sheet — not an error.
      }
      setMenuOpen(false);
    } else {
      await copyLink();
    }
  };

  return (
    <div className="glass-link-btn" ref={containerRef}>
      <a href={href} rel={rel} target={target} className="glass-link-text-wrap">
        <span className="glass-link-text">{children}</span>
      </a>

      <button
        type="button"
        className="glass-link-icon"
        aria-label="Link options"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        ⋮
      </button>

      {menuOpen && (
        <div className="glass-link-menu" role="menu">
          <button type="button" role="menuitem" className="glass-link-menu-item" onClick={shareLink}>
            Share
          </button>
          <button type="button" role="menuitem" className="glass-link-menu-item" onClick={copyLink}>
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      )}
    </div>
  );
}
