'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { JourneyPhase } from './journeyChallenges';
import type { JourneyResult } from './useJourneyRun';
import { JourneySageAvatar, JourneyRacerAvatar } from './journeyAvatars';

// Ported from blocks-arena's JourneyCoopHUD (the horizontal Sage bar above the
// board and the racer progress bar below it), with the partner fields optional
// so the same bars serve the solo run.

const CHALLENGE_COLORS: Record<string, string> = {
  'tspin-rush':    '#a78bfa',
  'line-blitz':    '#38bdf8',
  'combo-chain':   '#4ade80',
  'survive-storm': '#f87171',
  'perfect-clear': '#fbbf24',
  'speed-place':   '#fb923c',
  'tetris-only':   '#0ea5e9',
  'score-frenzy':  '#e879f9',
};
const DEFAULT_ACCENT = '#00b4a0';
const ME_COLOR = '#a78bfa';
const PARTNER_COLOR = '#4ade80';

// Both bars sit over the themed background image, which washed out the old
// translucent fill — a darker, blurred panel keeps the text readable on any theme.
const PANEL_BG = 'rgba(10,10,14,0.82)';
const PANEL_BLUR = 'blur(6px)';

// Arc that drains from full to empty as the window closes.
function CountdownRing({ timeLeftMs, totalMs, color }: { timeLeftMs: number; totalMs: number; color: string }) {
  const r = 22, cx = 26, cy = 26, stroke = 4;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, timeLeftMs / totalMs));
  const secs = Math.ceil(timeLeftMs / 1000);
  return (
    <svg width={cx * 2} height={cy * 2} style={{ display: 'block' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle
        cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${circ * pct} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 0.1s linear' }}
      />
      <text x={cx} y={cy + 5} textAnchor="middle" fill={color} fontSize={12} fontWeight="bold">{secs}</text>
    </svg>
  );
}

// The racer sprite is drawn 2.5x its old size (22px → 55px), so it stands on
// top of the track rather than being centered on it, and the track gets
// headroom for it (plus side padding so it doesn't hang off either end).
const RACER_SIZE = 55;
const TRACK_HEIGHT = 26;
const RACER_HEADROOM = RACER_SIZE - TRACK_HEIGHT + 2;

function ProgressTrack({ score, winScore }: { score: number; winScore: number }) {
  const pct = (score / winScore) * 100;
  // Tick marks every fifth of the way to the goal (10, 20, 30, 40, 50 at 50;
  // 15 apart at 75; 20 apart at 100 — all whole numbers for the allowed goals).
  const ticks = Array.from({ length: 6 }, (_, i) => (i * winScore) / 5);
  return (
    <div style={{ padding: `${RACER_HEADROOM}px ${RACER_SIZE / 2}px 0` }}>
      <div style={{ position: 'relative', height: TRACK_HEIGHT, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 5, overflow: 'visible' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${pct}%`, minWidth: score > 0 ? 4 : 0,
          background: `linear-gradient(90deg, ${ME_COLOR}55, ${PARTNER_COLOR}55)`,
          borderRadius: 5, transition: 'width 0.4s ease',
        }} />
        {ticks.slice(1).map((m) => (
          <div key={m} style={{
            position: 'absolute', left: `${(m / winScore) * 100}%`, top: 0, bottom: 0, width: 1,
            backgroundColor: m === winScore ? ME_COLOR : 'rgba(255,255,255,0.25)', transform: 'translateX(-50%)',
          }} />
        ))}
        <div style={{ position: 'absolute', left: `${pct}%`, bottom: 0, transform: 'translateX(-50%)', transition: 'left 0.4s ease', zIndex: 2, lineHeight: 0 }}>
          {score >= winScore ? <span style={{ fontSize: 28, lineHeight: 1 }}>🏁</span> : <JourneyRacerAvatar color={ME_COLOR} size={RACER_SIZE} />}
        </div>
        <div style={{ position: 'absolute', right: -1, top: '50%', transform: 'translateY(-50%)', fontSize: 14, lineHeight: 1 }}>🏁</div>
      </div>
      {/* Labels sit exactly under their tick marks. */}
      <div style={{ position: 'relative', height: 11, marginTop: 3 }}>
        {ticks.map((m) => (
          <span key={m} style={{ position: 'absolute', left: `${(m / winScore) * 100}%`, transform: 'translateX(-50%)', fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>{m}</span>
        ))}
      </div>
    </div>
  );
}

// Smooth local countdown — interpolated between the hook's 100ms ticks so the
// ring drains smoothly instead of jumping.
function useLocalTimeLeft(phase: JourneyPhase | null) {
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    if (!phase) return;
    const end = Date.now() + phase.timeLeftMs;
    let frame = 0;
    const tick = () => {
      const remaining = Math.max(0, end - Date.now());
      setTimeLeft(remaining);
      if (remaining > 0) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // phase.timeLeftMs changes every tick; the kind/seq changes are what matter
    // for re-anchoring, but re-anchoring each tick is cheap and self-correcting.
  }, [phase?.challengeSeq, phase?.isCooldown, phase?.timeLeftMs]); // eslint-disable-line react-hooks/exhaustive-deps
  return timeLeft;
}

interface SageBarProps {
  phase: JourneyPhase | null;
  myWindowScore: number;
  myNickname: string;
  isScoringPaused: boolean;
  // Co-op only — omit both for a solo run.
  partnerWindowScore?: number;
  partnerNickname?: string;
}

// Horizontal bar above the board: Sage avatar, current challenge, countdown
// ring, and this challenge's points (the running total lives in the racer bar).
export function JourneySageBar({ phase, myWindowScore, myNickname, isScoringPaused, partnerWindowScore, partnerNickname }: SageBarProps) {
  const timeLeft = useLocalTimeLeft(phase);
  const accent = phase ? (CHALLENGE_COLORS[phase.challenge.type] ?? DEFAULT_ACCENT) : DEFAULT_ACCENT;
  const isActive = phase?.phase === 'challenge';
  const totalMs = isActive ? phase!.challenge.durationMs : 3000;
  const isCoop = partnerWindowScore != null;

  return (
    <div style={{
      // Fixed height (the countdown ring is the tallest thing in it): the bar's
      // contents differ between a live challenge, the cooldown and the top-out
      // notice, and letting it resize nudged the whole column taller/shorter.
      width: '100%', height: 68, padding: '0 14px', boxSizing: 'border-box',
      background: PANEL_BG, backdropFilter: PANEL_BLUR, border: `1px solid ${accent}55`, borderRadius: 10,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      {/* Drawn at 52px (it was a 24px sprite): the bar is a fixed 68px tall, so
          this fills it without changing the bar's height. */}
      <div style={{ width: 52, height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <JourneySageAvatar glow={accent} size={52} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {isActive && phase ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: accent, letterSpacing: '0.06em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {phase.challenge.label}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {phase.challenge.description}
            </div>
            {isScoringPaused && (
              <div style={{ fontSize: 9, color: '#f87171', letterSpacing: '0.06em', marginTop: 2 }}>— TOP OUT — scoring paused —</div>
            )}
          </>
        ) : phase?.isCooldown ? (
          <>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Next challenge in</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: 'rgba(255,255,255,0.85)', lineHeight: 1.1 }}>{Math.ceil(timeLeft / 1000)}</div>
            <div style={{ fontSize: 10, color: CHALLENGE_COLORS[phase.challenge.type] ?? DEFAULT_ACCENT, marginTop: 1 }}>{phase.challenge.label}</div>
          </>
        ) : (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Awaiting first challenge…</div>
        )}
      </div>

      {isActive && phase && <CountdownRing timeLeftMs={timeLeft} totalMs={totalMs} color={accent} />}

      {/* Points for the challenge that's running right now (co-op: one box per
          player). They only bank into the total when the challenge ends. */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          Current challenge
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ textAlign: 'center', background: `${ME_COLOR}18`, border: `1px solid ${ME_COLOR}33`, borderRadius: 6, padding: '4px 10px', minWidth: 52 }}>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em', marginBottom: 2 }}>{isCoop ? (myNickname || 'YOU') : 'POINTS'}</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: ME_COLOR, lineHeight: 1 }}>{myWindowScore}</div>
          </div>
          {isCoop && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>+</div>
              <div style={{ textAlign: 'center', background: `${PARTNER_COLOR}18`, border: `1px solid ${PARTNER_COLOR}33`, borderRadius: 6, padding: '4px 10px', minWidth: 52 }}>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em', marginBottom: 2 }}>{partnerNickname || 'PARTNER'}</div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: PARTNER_COLOR, lineHeight: 1 }}>{partnerWindowScore}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Bar below the board: progress toward the win score.
export function JourneyRacerBar({ score, label, winScore }: { score: number; label: string; winScore: number }) {
  return (
    <div style={{
      width: '100%', padding: '10px 17px', boxSizing: 'border-box',
      background: PANEL_BG, backdropFilter: PANEL_BLUR, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10,
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      {/* Title + who's racing + the running score (these used to sit in a row
          above the track, where the bigger racer would now overlap them). */}
      <div style={{ flexShrink: 0, maxWidth: 120, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.14em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          Journey to<br />the East
        </div>
        <div style={{ fontSize: 11, color: ME_COLOR, letterSpacing: '0.05em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 'bold' }}>{score}/{winScore}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <ProgressTrack score={score} winScore={winScore} />
      </div>
    </div>
  );
}

function formatClock(ms: number) {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

// Replaces the Sage bar once the run ends (win, or the partner left).
export function JourneyResultBar({ result, winScore, finishedMs, partnerNickname, isCoop, onPlayAgain, onExit, exitLabel, autoExitSeconds }: {
  result: Exclude<JourneyResult, null>;
  winScore: number;
  finishedMs: number | null;
  partnerNickname?: string;
  isCoop: boolean;
  onPlayAgain?: () => void;
  onExit: () => void;
  exitLabel: string;
  // Optional auto-return countdown (co-op, like blocks-arena's 5s return).
  autoExitSeconds?: number;
}) {
  const won = result === 'win';
  const accent = won ? '#4ade80' : '#fbbf24';
  const [left, setLeft] = useState(autoExitSeconds ?? 0);
  const onExitRef = useRef(onExit);
  useEffect(() => { onExitRef.current = onExit; }, [onExit]);
  useEffect(() => {
    if (!autoExitSeconds) return;
    let count = autoExitSeconds;
    const id = setInterval(() => {
      count -= 1;
      if (count <= 0) { clearInterval(id); setLeft(0); onExitRef.current(); }
      else setLeft(count);
    }, 1000);
    return () => clearInterval(id);
  }, [autoExitSeconds]);

  const btn = (primary: boolean): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
    fontFamily: 'inherit',
    // White text on a dark fill: the accent colour is only a border/glow, since
    // coloured text on a see-through panel disappears over bright backgrounds.
    color: 'white',
    fontWeight: primary ? 'bold' : 'normal',
    background: primary ? `${accent}40` : 'rgba(255,255,255,0.06)',
    border: `1px solid ${primary ? accent : 'rgba(255,255,255,0.35)'}`,
  });

  return (
    // Same dark, blurred panel as the Sage/racer bars (so it reads on any theme),
    // and the same 68px height as the Sage bar it replaces — no layout jump.
    <div style={{
      width: '100%', minHeight: 68, padding: '6px 18px', boxSizing: 'border-box',
      background: PANEL_BG, backdropFilter: PANEL_BLUR, border: `1px solid ${accent}`, borderRadius: 10,
      boxShadow: `0 0 14px ${accent}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap',
    }}>
      <JourneySageAvatar glow={accent} size={52} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 'bold', color: 'white', letterSpacing: '0.1em', textShadow: `0 0 12px ${accent}` }}>
          {won ? 'VICTORY!' : 'PARTNER LEFT'}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 3 }}>
          {won
            ? `${isCoop ? 'Team reached' : 'You reached'} ${winScore} points${finishedMs != null ? ` in ${formatClock(finishedMs)}` : ''}!`
            : `${partnerNickname || 'Partner'} disconnected`}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {onPlayAgain && <button onClick={onPlayAgain} style={btn(true)}>Play again</button>}
        <button onClick={onExit} style={btn(!onPlayAgain)}>
          {exitLabel}{autoExitSeconds ? ` (${left})` : ''}
        </button>
      </div>
    </div>
  );
}
