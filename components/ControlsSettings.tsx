'use client';

import React, { useEffect, useState } from 'react';

// Same localStorage keys/shape TetrisGame.tsx itself reads on mount — this
// panel doesn't feed TetrisGame through any prop or shared state, it just
// writes to the same contract, so a change made here is already in effect
// the moment a match actually starts. Deliberately a *separate* standalone
// copy of the rebinding UI rather than a shared component TetrisGame also
// consumes: TetrisGame's own version is wired into its live keydown handler
// and gameStateRef gating, which this panel (no running match, no game
// state) has no equivalent of — duplicating this one self-contained panel
// was less risk than threading lobby-only UI through that already-large,
// match-critical file.
const DEFAULT_CONTROLS: Record<string, string> = {
  'Left': 'ArrowLeft', 'Right': 'ArrowRight', 'Down': 'ArrowDown',
  'Rotate CW': 'ArrowUp', 'Rotate CCW': 'z', 'Rotate 180': 'a',
  'Hard Drop': ' ', 'Hold': 'c',
};
// Only these 8 are rebindable here. TetrisGame's own saved object may also
// carry sandbox-only actions (Clear Board, spawn hotkeys, etc.) that don't
// apply to versus play — loading merges onto DEFAULT_CONTROLS above (so
// only these 8 keys ever end up in this component's state) and saving
// writes that same 8-key object back, which TetrisGame's own load effect
// then merges onto *its* full defaults, so the sandbox-only keys are never
// touched or dropped by a save made from here.
const CONTROL_ACTIONS = Object.keys(DEFAULT_CONTROLS);
const DEFAULT_TUNING = { das: 170, arr: 30, dcd: 0, sdf: 40 };

const PANEL_STYLE: React.CSSProperties = {
  width: '210px',
  flexShrink: 0,
  backgroundColor: 'rgba(5,5,8,0.72)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  padding: '0.85rem',
  boxShadow: '0 10px 35px rgba(0,0,0,0.45)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  // Fixed-height content (a set list of keybinds/sliders, nothing that
  // grows) sitting in a panel that stretches to match its taller siblings
  // (see the row in OnlineLobby.tsx) — centering distributes the leftover
  // space evenly instead of leaving it stranded below the last slider.
  justifyContent: 'center',
};

const KEY_BUTTON_STYLE: React.CSSProperties = {
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  padding: '6px',
  fontSize: '10px',
  cursor: 'pointer',
  width: '100%',
  textAlign: 'center',
  height: '26px',
  fontFamily: 'monospace',
};

export default function ControlsSettings() {
  const [controls, setControls] = useState<Record<string, string>>(DEFAULT_CONTROLS);
  const [tuning, setTuning] = useState(DEFAULT_TUNING);
  const [listeningAction, setListeningAction] = useState<string | null>(null);
  // Hydration-safe deferred load — state starts at the same defaults on
  // server and first client paint, then a mount effect reads the real
  // client-only value (same pattern as useSearchParam/useColorTheme).
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tetrisControls');
      if (saved) setControls((prev) => ({ ...prev, ...JSON.parse(saved) }));
    } catch { /* ignore malformed storage, keep defaults */ }
    try {
      const saved = localStorage.getItem('tetrisTuning');
      if (saved) setTuning((prev) => ({ ...prev, ...JSON.parse(saved) }));
    } catch { /* ignore malformed storage, keep defaults */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem('tetrisControls', JSON.stringify(controls));
  }, [controls, loaded]);

  useEffect(() => {
    if (loaded) localStorage.setItem('tetrisTuning', JSON.stringify(tuning));
  }, [tuning, loaded]);

  // Captures the next keypress anywhere on the page while a rebind is
  // "listening" — only attached while actually listening, so it never
  // competes with anything else on the page the rest of the time.
  useEffect(() => {
    if (!listeningAction) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      setControls((prev) => ({ ...prev, [listeningAction]: e.key }));
      setListeningAction(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [listeningAction]);

  return (
    <div style={PANEL_STYLE}>
      <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0, textAlign: 'center' }}>
        Controls
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
        {CONTROL_ACTIONS.map((action) => {
          const keyName = controls[action];
          return (
            <div key={action} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '8px', textTransform: 'uppercase', textAlign: 'center' }}>
                {action}
              </span>
              <button
                onClick={() => setListeningAction(action)}
                style={{ ...KEY_BUTTON_STYLE, backgroundColor: listeningAction === action ? 'var(--tt-accent)' : 'rgba(255,255,255,0.1)' }}
              >
                {listeningAction === action ? '...' : (keyName === ' ' ? 'Space' : keyName.replace('Arrow', ''))}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.6rem' }}>
        <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
          Handling
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px' }}>DAS</span>
            <span style={{ color: 'white', fontSize: '9px' }}>{tuning.das}ms</span>
          </div>
          <input type="range" min="50" max="300" step="10" value={tuning.das} onChange={(e) => setTuning((p) => ({ ...p, das: Number(e.target.value) }))} style={{ width: '100%', accentColor: 'var(--tt-accent)', height: '4px' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px' }}>ARR</span>
            <span style={{ color: 'white', fontSize: '9px' }}>{tuning.arr}ms</span>
          </div>
          <input type="range" min="0" max="100" step="1" value={tuning.arr} onChange={(e) => setTuning((p) => ({ ...p, arr: Number(e.target.value) }))} style={{ width: '100%', accentColor: 'var(--tt-accent)', height: '4px' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px' }}>DCD</span>
            <span style={{ color: 'white', fontSize: '9px' }}>{tuning.dcd}ms</span>
          </div>
          <input type="range" min="0" max="100" step="1" value={tuning.dcd} onChange={(e) => setTuning((p) => ({ ...p, dcd: Number(e.target.value) }))} style={{ width: '100%', accentColor: 'var(--tt-accent)', height: '4px' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px' }}>SDF</span>
            <span style={{ color: 'white', fontSize: '9px' }}>{tuning.sdf >= 41 ? 'MAX' : `${tuning.sdf}x`}</span>
          </div>
          <input type="range" min="2" max="41" step="1" value={tuning.sdf} onChange={(e) => setTuning((p) => ({ ...p, sdf: Number(e.target.value) }))} style={{ width: '100%', accentColor: 'var(--tt-accent)', height: '4px' }} />
        </div>
      </div>
    </div>
  );
}
