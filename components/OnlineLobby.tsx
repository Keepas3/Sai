'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MAX_ROOM_SIZE, QUICK_CHAT_MESSAGES, type QuickChatEntry, type GameMode } from './useOnlineRoom';
import ControlsSettings from './ControlsSettings';

// Guideline-style speed curve tops out well before this (see
// calculateDropInterval in TetrisGame.tsx) — 15 is already close to instant
// drop, so it's a sane ceiling for the picker rather than an arbitrary cap.
const MAX_STARTING_LEVEL = 15;
// Sandbox-scale ceiling on extra lives — enough for a "keep playing" cushion
// without turning last-player-standing into an endurance grind.
const MAX_LIVES = 5;

interface OnlineLobbyProps {
  onStart: () => void;
  onCancel: () => void;
  // Pre-fills and auto-joins from a shared link's ?code= param, skipping the
  // Create/Join choice screen entirely. Ported from tetris-arena's
  // OnlineLobby.tsx — see that copy for the full "why" behind every guard
  // this touches below (kicked/full-room reachability, mainly).
  initialCode?: string;
  // Room state/actions — owned by TetrisApp (via useOnlineRoom) rather than
  // this component, so the same Realtime channel survives the handoff into
  // TetrisGame once the match starts (needed for garbage exchange).
  roomCode: string | null;
  isHost: boolean;
  opponents: { guestId: string; nickname: string }[];
  selfReady: boolean;
  readyGuestIds: Set<string>;
  startAt: number | null;
  createRoom: () => string;
  joinRoom: (code: string) => void;
  sendReady: () => void;
  sendUnready: () => void;
  leaveRoom: () => void;
  // Session stats — also owned by TetrisApp (survives TetrisGame's per-match
  // remounts). Shown here rather than on TetrisGame's result screen so it's
  // visible right where you'd decide whether to keep playing.
  winCount: number;
  // Own display name, shown in the player list instead of a truncated guest
  // id — settable any time, not just before joining, since it's broadcast
  // live via presence (see useOnlineRoom).
  nickname: string;
  setNickname: (n: string) => void;
  // Whichever opponent (or self) is hosting — drives the "(Host)" label and
  // gates the host-only settings/kick controls below.
  hostGuestId: string | null;
  roomSettings: { maxPlayers: number; startingLevel: number; lives: number; gameMode: GameMode; sharedNextHold: boolean };
  setMaxPlayers: (n: number) => void;
  setStartingLevel: (n: number) => void;
  setLives: (n: number) => void;
  // Practice mode (Sandbox's ruleset in a shared room, no attacks/lives/
  // elimination) is the first of several planned game modes — see
  // useOnlineRoom's GameMode type.
  setGameMode: (m: GameMode) => void;
  // Co-op only — whether Hold is one shared slot and each player's Next
  // queue is visible to their partner, or both stay fully private per
  // player (the default).
  setSharedNextHold: (shared: boolean) => void;
  // Host-only removal — informational room-size cap doesn't reject joins on
  // its own (see useOnlineRoom), so this is the actual enforcement tool.
  sendKick: (guestId: string) => void;
  // True right after this client's own kick listener fires — shown once on
  // the choose screen (teardown already dropped roomCode back to null by
  // the time this renders).
  wasKicked: boolean;
  // True right after a join attempt gets rejected for being over the host's
  // room-size cap — same "shown once on the choose screen" handling as
  // wasKicked above.
  roomFull: boolean;
  // Room-scoped preset chat (see QUICK_CHAT_MESSAGES in useOnlineRoom) —
  // only shown once actually in a room, there's no one to talk to before that.
  quickChatLog: QuickChatEntry[];
  sendQuickChat: (messageId: number) => void;
}

const PANEL_STYLE: React.CSSProperties = {
  width: '100%',
  maxWidth: '380px',
  backgroundColor: 'rgba(5,5,8,0.72)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  padding: '1.5rem',
  boxShadow: '0 10px 35px rgba(0,0,0,0.45)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.9rem',
  alignItems: 'stretch',
};

const PRIMARY_BUTTON_STYLE: React.CSSProperties = {
  backgroundColor: 'color-mix(in srgb, var(--tt-accent) 50%, transparent)',
  border: '1px solid var(--tt-accent)',
  color: 'white',
  padding: '10px 16px',
  fontSize: '0.8rem',
  cursor: 'pointer',
  borderRadius: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
};

const SECONDARY_BUTTON_STYLE: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: '1px solid rgba(255,255,255,0.25)',
  color: 'rgba(255,255,255,0.75)',
  padding: '9px 16px',
  fontSize: '0.75rem',
  cursor: 'pointer',
  borderRadius: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
};

const NICKNAME_INPUT_STYLE: React.CSSProperties = {
  width: '4.5rem',
  backgroundColor: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '4px',
  color: 'white',
  fontSize: '0.8rem',
  letterSpacing: '0.1em',
  textAlign: 'center',
  padding: '4px 6px',
  fontFamily: 'monospace',
  outline: 'none',
};

const SETTING_SELECT_STYLE: React.CSSProperties = {
  backgroundColor: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '4px',
  color: 'white',
  fontSize: '0.75rem',
  padding: '3px 6px',
  fontFamily: 'monospace',
  outline: 'none',
};

// Narrower than PANEL_STYLE and fixed-width rather than maxWidth — it sits
// beside the main panel (see the outer row below), not in place of it. Same
// width as ControlsSettings' own panel so the two side columns read as a
// matched pair flanking the main one.
const QUICK_CHAT_PANEL_STYLE: React.CSSProperties = {
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
  gap: '0.6rem',
};

const QUICK_CHAT_BUTTON_STYLE: React.CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.15)',
  color: 'rgba(255,255,255,0.85)',
  padding: '6px 8px',
  fontSize: '0.65rem',
  cursor: 'pointer',
  borderRadius: '4px',
  textAlign: 'left',
  fontFamily: 'monospace',
  lineHeight: 1.3,
};

export default function OnlineLobby({
  onStart, onCancel, initialCode,
  roomCode, isHost, opponents, selfReady, readyGuestIds, startAt,
  createRoom, joinRoom, sendReady, sendUnready, leaveRoom,
  winCount,
  nickname, setNickname, hostGuestId, roomSettings, setMaxPlayers, setStartingLevel, setLives, setGameMode, setSharedNextHold, sendKick, wasKicked, roomFull,
  quickChatLog, sendQuickChat,
}: OnlineLobbyProps) {
  const [entryMode, setEntryMode] = useState<'choose' | 'joining'>('choose');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [countdownMs, setCountdownMs] = useState<number | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const startedRef = useRef(false);
  const autoJoinedRef = useRef(false);
  const chatLogEndRef = useRef<HTMLDivElement>(null);

  // Keeps the newest message in view without the whole page scrolling —
  // 'nearest' so it's a no-op while the log already fits (i.e. hasn't
  // started scrolling yet).
  useEffect(() => {
    chatLogEndRef.current?.scrollIntoView({ block: 'nearest' });
  }, [quickChatLog]);

  useEffect(() => {
    if (initialCode && !autoJoinedRef.current) {
      autoJoinedRef.current = true;
      joinRoom(initialCode);
    }
  }, [initialCode, joinRoom]);

  useEffect(() => {
    if (!startAt) return;
    startedRef.current = false;

    const tick = () => setCountdownMs(Math.max(0, startAt - Date.now()));
    tick();
    const interval = setInterval(tick, 50);
    const timeout = setTimeout(() => {
      if (!startedRef.current) {
        startedRef.current = true;
        onStart();
      }
    }, Math.max(0, startAt - Date.now()));

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [startAt, onStart]);

  const handleLeave = () => {
    leaveRoom();
    onCancel();
  };

  // A kick (or a rejected over-capacity join) can land while entryMode is
  // still 'joining' (e.g. the removed player had the room-code screen open
  // at the time) — without this, the notice below would be unreachable,
  // since 'joining' is a different branch than the one it's shown in.
  useEffect(() => {
    if (wasKicked || roomFull) setEntryMode('choose');
  }, [wasKicked, roomFull]);

  return (
    // width:100% + alignItems:'stretch' matter here, not just centering — see
    // tetris-arena's OnlineLobby.tsx for the full explanation (this layout is
    // an unmodified copy of it, minus quickplay/join-links).
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '1.5rem', color: 'white', fontFamily: 'monospace' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--tt-accent)', textShadow: '0 2px 6px rgba(0,0,0,0.85), 0 0 20px color-mix(in srgb, var(--tt-accent) 80%, transparent)', margin: '0 0 0.4rem 0', letterSpacing: '0.15em' }}>
          ONLINE PLAY
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '0.2em', fontSize: '0.75rem', margin: 0 }}>
          BETA — LAST PLAYER STANDING WINS
        </p>
      </div>

      {/* Three columns, all stretched to match whichever is tallest — chat
          and controls are both room-independent asides flanking the actual
          lobby panel in the middle. Quick chat only appears once actually in
          a room (see roomCode below), but Controls is a purely local
          preference shown regardless. */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
      {roomCode && (
        <div style={QUICK_CHAT_PANEL_STYLE}>
          <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0, textAlign: 'center' }}>
            Quick Chat
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minHeight: '3.5rem', overflowY: 'auto' }}>
            {quickChatLog.length === 0 ? (
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)' }}>No messages yet</span>
            ) : (
              quickChatLog.map((entry) => (
                <p key={entry.id} style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.4, wordBreak: 'break-word' }}>
                  {entry.systemText ? (
                    <span style={{ color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>{entry.systemText}</span>
                  ) : (
                    <>
                      <span style={{ color: 'var(--tt-accent)', fontWeight: 'bold' }}>
                        {entry.nickname || entry.guestId.slice(0, 4).toUpperCase()}:
                      </span>{' '}
                      {QUICK_CHAT_MESSAGES[entry.messageId!]}
                    </>
                  )}
                </p>
              ))
            )}
            <div ref={chatLogEndRef} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.6rem' }}>
            {QUICK_CHAT_MESSAGES.map((msg, i) => (
              <button key={i} onClick={() => sendQuickChat(i)} style={QUICK_CHAT_BUTTON_STYLE}>
                {msg}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={PANEL_STYLE}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Nickname</span>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={4}
            placeholder="YOU"
            style={NICKNAME_INPUT_STYLE}
          />
        </div>

        {/* initialCode (from a shared join link) stays truthy for this
            component's whole lifetime — TetrisApp only blanks it out while
            actually in a room (roomCode truthy) or once the player has
            explicitly quit (see hasQuit in TetrisApp.tsx). Without the
            !wasKicked/!roomFull guard here, and the matching (!initialCode
            || wasKicked || roomFull) guard on the two branches below, a
            kicked or over-capacity link-joiner would be stranded on
            "Joining room…" forever — teardown drops roomCode back to null,
            which would otherwise make this condition true again with no
            reachable buttons (mirrors the exact bug tetris-arena hit and
            fixed in its own OnlineLobby.tsx). */}
        {!roomCode && initialCode && !wasKicked && !roomFull && (
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', margin: 0 }}>
            Joining room {initialCode}…
          </p>
        )}

        {!roomCode && (!initialCode || wasKicked || roomFull) && entryMode === 'choose' && (
          <>
            {wasKicked && (
              <p style={{ textAlign: 'center', color: '#f87171', fontSize: '0.75rem', margin: 0 }}>
                You were removed from the room by the host.
              </p>
            )}
            {roomFull && (
              <p style={{ textAlign: 'center', color: '#f87171', fontSize: '0.75rem', margin: 0 }}>
                That room is already full.
              </p>
            )}
            <button style={PRIMARY_BUTTON_STYLE} onClick={() => createRoom()}>Create Lobby</button>
            <button style={SECONDARY_BUTTON_STYLE} onClick={() => setEntryMode('joining')}>Join Lobby</button>
            <button style={SECONDARY_BUTTON_STYLE} onClick={onCancel}>Back</button>
          </>
        )}

        {!roomCode && (!initialCode || wasKicked || roomFull) && entryMode === 'joining' && (
          <>
            <input
              autoFocus
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase().slice(0, 5))}
              onKeyDown={(e) => { if (e.key === 'Enter' && joinCodeInput.trim().length >= 4) joinRoom(joinCodeInput); }}
              placeholder="ROOM CODE"
              maxLength={5}
              style={{
                backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px',
                color: 'white', fontSize: '1.1rem', letterSpacing: '0.3em', textAlign: 'center', padding: '10px',
                fontFamily: 'monospace', outline: 'none',
              }}
            />
            <button
              style={{ ...PRIMARY_BUTTON_STYLE, opacity: joinCodeInput.trim().length < 4 ? 0.5 : 1 }}
              disabled={joinCodeInput.trim().length < 4}
              onClick={() => joinRoom(joinCodeInput)}
            >
              Join
            </button>
            <button style={SECONDARY_BUTTON_STYLE} onClick={() => setEntryMode('choose')}>Back</button>
          </>
        )}

        {roomCode && (
          <>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 0.35rem 0' }}>
                Room Code
              </p>
              <p style={{ fontSize: '1.8rem', fontWeight: 'bold', letterSpacing: '0.3em', color: 'var(--tt-accent)', textShadow: '0 0 12px color-mix(in srgb, var(--tt-accent) 60%, transparent)', margin: 0 }}>
                {roomCode}
              </p>
              {isHost && (
                <>
                  <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.5rem' }}>
                    Share this code with your opponent, or send them a link:
                  </p>
                  <button
                    onClick={() => {
                      // Points at /library (where the Tetris easter egg
                      // lives), not a dedicated route like tetris-arena's
                      // /versus — the ?code= param is what LibraryPage reads
                      // to auto-open the modal and pre-fill this join.
                      navigator.clipboard.writeText(`${window.location.origin}/library?code=${roomCode}`);
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 1500);
                    }}
                    style={{
                      marginTop: '0.4rem', backgroundColor: 'transparent', border: '1px solid rgba(126,231,135,0.4)',
                      color: '#7ee787', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer',
                      fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                    }}
                  >
                    {linkCopied ? 'Copied!' : 'Copy Join Link'}
                  </button>
                </>
              )}
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: opponents.length > 0 ? '#7ee787' : 'rgba(255,255,255,0.6)', margin: 0 }}>
              {opponents.length > 0
                ? `${opponents.length + 1} / ${roomSettings.maxPlayers} connected`
                : 'Waiting for opponents…'}
            </p>

            {!startAt && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Game Mode</span>
                  {isHost ? (
                    <select value={roomSettings.gameMode} onChange={(e) => setGameMode(e.target.value as GameMode)} style={SETTING_SELECT_STYLE}>
                      <option value="versus">Versus</option>
                      <option value="practice">Practice</option>
                      <option value="coop">Co-op</option>
                    </select>
                  ) : (
                    <span style={{ color: 'white' }}>{roomSettings.gameMode === 'practice' ? 'Practice' : roomSettings.gameMode === 'coop' ? 'Co-op' : 'Versus'}</span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Room Size</span>
                  {roomSettings.gameMode === 'coop' ? (
                    <span style={{ color: 'white' }}>2 players (Co-op)</span>
                  ) : isHost ? (
                    <select value={roomSettings.maxPlayers} onChange={(e) => setMaxPlayers(Number(e.target.value))} style={SETTING_SELECT_STYLE}>
                      {Array.from({ length: MAX_ROOM_SIZE - 1 }, (_, i) => i + 2).map((n) => (
                        <option key={n} value={n}>{n} players</option>
                      ))}
                    </select>
                  ) : (
                    <span style={{ color: 'white' }}>{roomSettings.maxPlayers} players</span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Starting Level</span>
                  {isHost ? (
                    <select value={roomSettings.startingLevel} onChange={(e) => setStartingLevel(Number(e.target.value))} style={SETTING_SELECT_STYLE}>
                      {Array.from({ length: MAX_STARTING_LEVEL }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  ) : (
                    <span style={{ color: 'white' }}>{roomSettings.startingLevel}</span>
                  )}
                </div>
                {roomSettings.gameMode === 'versus' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Lives</span>
                    {isHost ? (
                      <select value={roomSettings.lives} onChange={(e) => setLives(Number(e.target.value))} style={SETTING_SELECT_STYLE}>
                        {Array.from({ length: MAX_LIVES }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    ) : (
                      <span style={{ color: 'white' }}>{roomSettings.lives}</span>
                    )}
                  </div>
                )}
                {roomSettings.gameMode === 'coop' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Share Next/Hold</span>
                    {isHost ? (
                      <select value={roomSettings.sharedNextHold ? 'yes' : 'no'} onChange={(e) => setSharedNextHold(e.target.value === 'yes')} style={SETTING_SELECT_STYLE}>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    ) : (
                      <span style={{ color: 'white' }}>{roomSettings.sharedNextHold ? 'Yes' : 'No'}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {!startAt && (
              <>
                <button
                  style={selfReady ? SECONDARY_BUTTON_STYLE : PRIMARY_BUTTON_STYLE}
                  onClick={selfReady ? sendUnready : sendReady}
                >
                  {selfReady ? 'Unready' : 'Ready'}
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{nickname || 'You'}{isHost ? ' (Host)' : ''}</span>
                    <span>{selfReady ? 'Ready' : 'Not ready'}</span>
                  </div>
                  {opponents.map((o) => (
                    <div key={o.guestId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{o.nickname || o.guestId.slice(0, 4).toUpperCase()}{o.guestId === hostGuestId ? ' (Host)' : ''}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {readyGuestIds.has(o.guestId) ? 'Ready' : 'Not ready'}
                        {isHost && (
                          <button
                            onClick={() => sendKick(o.guestId)}
                            aria-label={`Remove ${o.nickname || 'player'}`}
                            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.8rem', padding: 0, lineHeight: 1 }}
                            onMouseOver={(e) => { e.currentTarget.style.color = '#f87171'; }}
                            onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                          >
                            ✕
                          </button>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {startAt && countdownMs !== null && (
              <h3 style={{ textAlign: 'center', color: 'white', letterSpacing: '0.1em', margin: 0, textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>
                Starting in {(countdownMs / 1000).toFixed(1)}s
              </h3>
            )}

            {winCount > 0 && (
              <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                Wins this session: {winCount}
              </p>
            )}

            <button style={SECONDARY_BUTTON_STYLE} onClick={handleLeave}>Leave Lobby</button>
          </>
        )}
      </div>

      <ControlsSettings />
      </div>
    </div>
  );
}
