'use client';

import React, { useState } from 'react';

// Ported from blocks-arena. Each avatar tries the PNG in /public first and
// falls back to a pixel-block drawing if the image fails to load.
const JOURNEY_SAGE_IMG  = '/journey-sage.png';
const JOURNEY_RACER_IMG = '/journey-racer.png';

const S = 8;
const SAGE_CELLS: [number, number, string][] = [
  [1,0,'#fbbf24'],[2,0,'#fbbf24'],
  [0,1,'#fbbf24'],[1,1,'#a78bfa'],[2,1,'#a78bfa'],[3,1,'#fbbf24'],
  [0,2,'#a78bfa'],[1,2,'#a78bfa'],[2,2,'#a78bfa'],[3,2,'#a78bfa'],
  [1,3,'#a78bfa'],[2,3,'#a78bfa'],
  [0,3,'#38bdf8'],[0,4,'#38bdf8'],[0,5,'#38bdf8'],
  [1,4,'#a78bfa'],[2,4,'#a78bfa'],
  [1,5,'#a78bfa'],[2,5,'#a78bfa'],
];

// `size` (px) draws the sage as a square of that size; omitted keeps the
// original compact 32x48 box.
export function JourneySageAvatar({ glow, size }: { glow: string; size?: number }) {
  const [imgErr, setImgErr] = useState(false);
  // The block fallback is a 4x6 grid, so a size-px-tall sprite uses size/6 cells.
  const cell = size != null ? size / 6 : S;
  const w = size ?? 4 * S, h = size ?? 6 * S;
  if (imgErr) {
    return (
      <div style={{ position: 'relative', width: 4 * cell, height: 6 * cell }}>
        {SAGE_CELLS.map(([c, r, color], i) => (
          <div key={i} style={{
            position: 'absolute',
            left: c * cell, top: r * cell,
            width: cell, height: cell,
            backgroundColor: color,
            boxShadow: `0 0 ${cell * 0.6}px ${glow}55`,
            borderRadius: 1,
          }} />
        ))}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={JOURNEY_SAGE_IMG}
      alt="sage"
      width={w}
      height={h}
      onError={() => setImgErr(true)}
      style={{ objectFit: 'contain', filter: `drop-shadow(0 0 6px ${glow}cc)`, imageRendering: 'pixelated' }}
    />
  );
}

export function JourneyRacerAvatar({ color, size = 200 }: { color: string; size?: number }) {
  const [imgErr, setImgErr] = useState(false);
  if (imgErr) {
    const b = Math.round(size * 0.14);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <div style={{ display: 'flex', gap: 1 }}>
          <div style={{ width: b, height: b, backgroundColor: 'transparent' }} />
          <div style={{ width: b, height: b, backgroundColor: color, borderRadius: 1, boxShadow: `0 0 4px ${color}` }} />
        </div>
        <div style={{ display: 'flex', gap: 1 }}>
          <div style={{ width: b, height: b, backgroundColor: color, borderRadius: 1, boxShadow: `0 0 4px ${color}` }} />
          <div style={{ width: b, height: b, backgroundColor: color, borderRadius: 1, boxShadow: `0 0 4px ${color}` }} />
        </div>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={JOURNEY_RACER_IMG}
      alt="racer"
      width={size}
      height={size}
      onError={() => setImgErr(true)}
      style={{ objectFit: 'contain', filter: `drop-shadow(0 0 3px ${color})`, imageRendering: 'pixelated' }}
    />
  );
}
