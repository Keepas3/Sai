'use client';

import React, { useCallback, useEffect, useState } from 'react';
import TitleScreen from './TitleScreen';
import TetrisGame from './TetrisGame';
import OnlineLobby from './OnlineLobby';
import { useOnlineRoom } from './useOnlineRoom';

interface TetrisAppProps {
  // From a shared join link (LibraryPage's ?code= -> TetrisModal -> here).
  // Jumps straight to the lobby and pre-fills/auto-joins that room, instead
  // of making a link-follower click "Online Play" themselves first.
  initialCode?: string;
}

export default function TetrisApp({ initialCode }: TetrisAppProps) {
  const [view, setView] = useState<'TITLE' | 'LOBBY' | 'PLAYING'>('TITLE');
  const [gameMode, setGameMode] = useState('standard');
  // A voluntary Back/Leave Lobby/Quit tears the room down — which would
  // otherwise make the initialCode prop below auto-rejoin all over again,
  // since it never clears itself (the URL doesn't change once the modal is
  // open). Unlike tetris-arena's VersusApp, leaving the lobby here doesn't
  // navigate anywhere or unmount this component (see handleMenu below) — it
  // just flips `view` back to 'TITLE' while TetrisApp itself, and this
  // prop, stay exactly as they were. So every exit path that could loop
  // back through OnlineLobby (Back, Leave Lobby, and the mid/post-match
  // Quit fallback) needs to set this, not just the mid-match one tetris-
  // arena's own fix covered.
  const [hasQuit, setHasQuit] = useState(false);
  // Distinguishes a solo PLAYING screen from an online-match one, rather than
  // inferring it from room.roomCode — the room stays connected for the whole
  // LOBBY<->PLAYING lifetime of a match (see useOnlineRoom), so roomCode
  // alone isn't a reliable "which flow is this" signal at every instant.
  const [isOnlineMatch, setIsOnlineMatch] = useState(false);

  // Owned here (not inside OnlineLobby) so the Realtime channel survives the
  // LOBBY -> PLAYING handoff and stays alive for garbage/match-result
  // broadcasts during the match.
  const room = useOnlineRoom();
  // Snapshot of who's in the match, taken the instant it starts — room.opponents
  // is live presence and could shift mid-match (e.g. someone's tab closing),
  // but the last-player-standing win condition needs a denominator that can't
  // move under a running match.
  const [matchOpponents, setMatchOpponents] = useState<{ guestId: string; nickname: string }[]>([]);
  // Session-scoped, not persisted — resets on a full leave (Quit) but
  // survives rematches, since staying in the same room is exactly when a
  // running count should keep counting.
  const [winCount, setWinCount] = useState(0);

  // A link-follower lands on the title screen by default (`view` starts
  // 'TITLE') — this jumps straight to the lobby once initialCode actually
  // resolves (it starts undefined for one render, see useSearchParam),
  // skipping the "click Online Play yourself" step. initialCode is stable
  // for the rest of this component's life once set, so this effect only
  // ever fires the one time it transitions from undefined to a real code.
  useEffect(() => {
    if (initialCode) setView('LOBBY');
  }, [initialCode]);

  const handleAttack = useCallback((amount: number) => {
    const alive = matchOpponents.filter((o) => !room.eliminatedGuestIds.has(o.guestId));
    if (alive.length === 0) return;
    const target = alive[Math.floor(Math.random() * alive.length)];
    room.sendGarbage(amount, target.guestId);
  }, [matchOpponents, room.eliminatedGuestIds, room.sendGarbage]);

  const handlePlay = (mode: string) => {
    // The title screen's "Online Play" button routes here instead of
    // straight to PLAYING — it needs a room + synchronized start before
    // there's a match to play.
    if (mode === 'versus-lobby') {
      setView('LOBBY');
      return;
    }
    setIsOnlineMatch(false);
    setGameMode(mode);
    setView('PLAYING');
  };

  const handleMenu = () => {
    // Doubles as OnlineLobby's onCancel (its Back and Leave Lobby buttons)
    // — see hasQuit's own comment above for why this needs to be set here,
    // not just on the mid-match Quit fallback below.
    setHasQuit(true);
    setView('TITLE');
  };

  return (
    // alignItems: 'safe center' (not plain 'center') matters here — this
    // box's height is fixed by TetrisModal's minHeight (it's absolutely
    // positioned with inset:0, so it never grows to fit its own content; see
    // TetrisModal.tsx). Versus/Blitz's taller layout (opponent previews, a
    // 5-row stats column) can exceed that fixed height, and plain 'center'
    // splits the overflow evenly above *and* below — the top half lands in
    // negative-scroll space that TetrisModal's overflowY:auto can't reach,
    // so what actually rendered was everything crammed toward the top with
    // the missing top-overflow showing up as dead space at the bottom
    // instead. 'safe center' centers only when content fits; otherwise it
    // falls back to top-alignment, so all the overflow lands below (fully
    // reachable by scrolling) instead of split with half stuck out of reach.
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'safe center', justifyContent: 'center' }}>
      {view === 'TITLE' && <TitleScreen onPlay={handlePlay} />}

      {view === 'LOBBY' && (
        <OnlineLobby
          onStart={() => { setMatchOpponents(room.opponents); setIsOnlineMatch(true); setView('PLAYING'); }}
          onCancel={handleMenu}
          // Once quit, the link can never resurrect this room again for the
          // rest of this modal instance's lifetime (same reasoning as
          // hasQuit's own comment above). While still in the room
          // (room.roomCode truthy), initialCode is blanked too — the room's
          // own live state is source of truth at that point, not the
          // original link.
          initialCode={hasQuit ? undefined : (room.roomCode ? undefined : initialCode)}
          roomCode={room.roomCode}
          isHost={room.isHost}
          opponents={room.opponents}
          selfReady={room.selfReady}
          readyGuestIds={room.readyGuestIds}
          startAt={room.startAt}
          createRoom={room.createRoom}
          joinRoom={room.joinRoom}
          sendReady={room.sendReady}
          sendUnready={room.sendUnready}
          leaveRoom={room.leaveRoom}
          winCount={winCount}
          nickname={room.nickname}
          setNickname={room.setNickname}
          hostGuestId={room.hostGuestId}
          roomSettings={room.roomSettings}
          setMaxPlayers={room.setMaxPlayers}
          setStartingLevel={room.setStartingLevel}
          setLives={room.setLives}
          setGameMode={room.setGameMode}
          setSharedNextHold={room.setSharedNextHold}
          sendKick={room.sendKick}
          wasKicked={room.wasKicked}
          roomFull={room.roomFull}
          quickChatLog={room.quickChatLog}
          sendQuickChat={room.sendQuickChat}
        />
      )}

      {view === 'PLAYING' && isOnlineMatch && (
        <TetrisGame
          mode={room.matchGameMode === 'practice' ? 'practice' : room.matchGameMode === 'coop' ? 'coop' : 'versus'}
          onMenu={() => { room.leaveRoom(); setWinCount(0); setHasQuit(true); setIsOnlineMatch(false); setView('LOBBY'); }}
          onRematchMenu={() => { room.resetMatchReady(); setView('LOBBY'); }}
          onAttack={handleAttack}
          incomingGarbage={room.incomingGarbage}
          onEliminated={room.sendEliminated}
          eliminatedOpponentIds={Array.from(room.eliminatedGuestIds)}
          opponentIds={matchOpponents.map((o) => o.guestId)}
          opponentNicknames={Object.fromEntries(matchOpponents.map((o) => [o.guestId, o.nickname]))}
          seed={room.matchSeed ?? undefined}
          startingLevel={room.matchStartingLevel ?? undefined}
          lives={room.matchLives ?? undefined}
          sharedNextHold={room.matchSharedNextHold ?? undefined}
          onBoardUpdate={room.sendBoardUpdate}
          opponentBoards={room.opponentBoards}
          onMatchWin={() => setWinCount((c) => c + 1)}
          quitVotes={room.quitVotes}
          selfQuitVote={room.selfQuitVote}
          quitVoteDeadline={room.quitVoteDeadline}
          onQuitVote={room.sendQuitVote}
          onRetractQuitVote={room.retractQuitVote}
        />
      )}

      {/* Solo modes (Zen/40 Lines/Blitz) — unchanged from before Online Play
          existed, just gated on !isOnlineMatch now that PLAYING covers both. */}
      {view === 'PLAYING' && !isOnlineMatch && <TetrisGame mode={gameMode} onMenu={handleMenu} />}
    </div>
  );
}
