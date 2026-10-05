'use client';

import React, { useEffect, useState } from 'react';
import { MODE_CONFIG, loadSavedOptions, resolveOptions, saveOptions } from './gameModeConfig';
import type { GameOptions, PlayableMode } from './gameModeConfig';

interface ModeSettingsDialogProps {
  mode: PlayableMode;
  onStart: (options: GameOptions) => void;
  onCancel: () => void;
}

const ACCENT = '#e5729f';

// Small popup shown when a mode is picked on the title screen: the rules in a
// few short lines plus (for modes that have one) the setting toggle. It's
// only mounted on click, so reading the remembered choice from localStorage
// in the initial state can't cause a hydration mismatch.
export default function ModeSettingsDialog({ mode, onStart, onCancel }: ModeSettingsDialogProps) {
  const config = MODE_CONFIG[mode];
  const option = config.option;
  const [options, setOptions] = useState<GameOptions>(() => resolveOptions(mode, loadSavedOptions()));

  // Esc closes just this popup. TetrisModal also listens for Escape on window
  // and would close the whole game window, so this listens in the capture
  // phase and stops the event before it reaches that bubble-phase handler.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      e.preventDefault();
      onCancel();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [onCancel]);

  const start = () => {
    saveOptions(options);
    onStart(options);
  };

  const selected = option ? (options[option.key] ?? option.default) : null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'absolute', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${config.title} settings`}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '21rem', boxSizing: 'border-box', padding: '1.25rem 1.4rem',
          backgroundColor: 'rgba(10,10,14,0.96)', border: `1px solid ${ACCENT}`, borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.6), 0 0 20px rgba(229,114,159,0.25)',
          display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left',
        }}
      >
        <h3 style={{ margin: 0, color: ACCENT, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.18em', textAlign: 'center' }}>
          {config.title}
        </h3>

        <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem', lineHeight: 1.45 }}>
          {config.rules(options).map((line) => <li key={line}>{line}</li>)}
        </ul>

        {option && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              {option.label}
            </span>
            <div role="radiogroup" aria-label={option.label} style={{ display: 'flex', gap: '0.5rem' }}>
              {option.values.map((value) => {
                const isSelected = value === selected;
                return (
                  <button
                    key={value}
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setOptions((prev) => ({ ...prev, [option.key]: value }))}
                    style={{
                      flex: 1, padding: '8px 0', cursor: 'pointer', borderRadius: '6px', fontFamily: 'inherit',
                      fontSize: '0.8rem', letterSpacing: '0.06em',
                      color: isSelected ? 'white' : 'rgba(255,255,255,0.65)',
                      backgroundColor: isSelected ? 'rgba(229,114,159,0.5)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isSelected ? ACCENT : 'rgba(255,255,255,0.15)'}`,
                      fontWeight: isSelected ? 'bold' : 'normal',
                      transition: 'all 0.15s',
                    }}
                  >
                    {option.format(value)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.25rem' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '10px 0', cursor: 'pointer', borderRadius: '8px', fontFamily: 'inherit',
              fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em',
              color: 'rgba(255,255,255,0.7)', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            Cancel
          </button>
          <button
            autoFocus
            onClick={start}
            style={{
              flex: 1, padding: '10px 0', cursor: 'pointer', borderRadius: '8px', fontFamily: 'inherit',
              fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 'bold',
              color: 'white', backgroundColor: 'rgba(229,114,159,0.5)', border: `1px solid ${ACCENT}`,
              boxShadow: '0 0 15px rgba(229,114,159,0.35)',
            }}
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
}
