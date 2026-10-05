'use client';

import React, { useMemo, useState } from 'react';
import TetrisGame from './TetrisGame';
import { JourneySageBar, JourneyRacerBar, JourneyResultBar } from './JourneyHUD';
import { DEFAULT_WIN_SCORE } from './journeyChallenges';
import { useJourneyRun } from './useJourneyRun';
import type { JourneyLink } from './useJourneyRun';
import type { useOnlineRoom } from './useOnlineRoom';

// Journey's gameplay constants (blocks-arena's JourneyApp): level 1 start,
// gravity capped at level 8, and effectively infinite lives since a topout
// is just a board clear.
const JOURNEY_LIVES = 9999;
const JOURNEY_MAX_LEVEL = 8;

// Matches TetrisGame's own root maxWidth, so the Sage/racer bars line up with
// the playfield instead of stretching across the modal.
const COLUMN_STYLE: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
  width: '100%', maxWidth: '48rem',
};

// ── Solo ─────────────────────────────────────────────────────────────────────

function JourneySoloRun({ onMenu, onPlayAgain, winScore }: { onMenu: () => void; onPlayAgain: () => void; winScore: number }) {
  // Fixed for this run. startAt is "now" because TetrisGame's 3-2-1-GO
  // countdown begins the moment it mounts alongside this component.
  const [startAt] = useState(() => Date.now());
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 31));
  const run = useJourneyRun({ startAt, seed, winScore });

  return (
    <div style={COLUMN_STYLE}>
      {run.result ? (
        <JourneyResultBar
          result={run.result}
          winScore={winScore}
          finishedMs={run.finishedMs}
          isCoop={false}
          onPlayAgain={onPlayAgain}
          onExit={onMenu}
          exitLabel="Menu"
        />
      ) : (
        <JourneySageBar
          phase={run.phase}
          myWindowScore={run.myWindowScore}
          myNickname=""
          isScoringPaused={run.isScoringPaused}
        />
      )}
      <TetrisGame
        mode="journey"
        onMenu={onMenu}
        seed={seed}
        startingLevel={1}
        maxLevel={JOURNEY_MAX_LEVEL}
        lives={JOURNEY_LIVES}
        incomingGarbage={run.incomingGarbage}
        onTSpin={run.handleTSpin}
        onLinesCleared={run.handleLinesCleared}
        onCombo={run.handleCombo}
        onPiecePlaced={run.handlePiecePlaced}
        onTopout={run.handleTopout}
      />
      <JourneyRacerBar score={run.totalScore} label="You" winScore={winScore} />
    </div>
  );
}

// Remounting (rather than resetting) is what starts a fresh run: new startAt,
// new seed, and a fresh TetrisGame all come for free. Play Again keeps the
// same points goal that was picked in the mode popup.
export function JourneySoloGame({ onMenu, winScore = DEFAULT_WIN_SCORE }: { onMenu: () => void; winScore?: number }) {
  const [runKey, setRunKey] = useState(0);
  return <JourneySoloRun key={runKey} onMenu={onMenu} onPlayAgain={() => setRunKey((k) => k + 1)} winScore={winScore} />;
}

// ── Co-op ────────────────────────────────────────────────────────────────────

type OnlineRoom = ReturnType<typeof useOnlineRoom>;

export function JourneyCoopGame({ room, matchOpponents, onMenu, onRematchMenu }: {
  room: OnlineRoom;
  matchOpponents: { guestId: string; nickname: string }[];
  onMenu: () => void;
  onRematchMenu: () => void;
}) {
  const partner = matchOpponents[0];
  const partnerGuestId = partner?.guestId;
  const partnerLeft = partnerGuestId != null && room.eliminatedGuestIds.has(partnerGuestId);

  const link = useMemo<JourneyLink>(() => ({
    sendJourneyMsg: room.sendJourneyMsg,
    incomingJourneyMsg: room.incomingJourneyMsg,
    sendGarbage: room.sendGarbage,
    partnerGuestId,
    partnerLeft,
  }), [room.sendJourneyMsg, room.incomingJourneyMsg, room.sendGarbage, partnerGuestId, partnerLeft]);

  // The host's lobby setting, delivered with the match start (so both players
  // race to the same goal).
  const winScore = room.matchJourneyGoal ?? DEFAULT_WIN_SCORE;
  const run = useJourneyRun({ startAt: room.startAt, seed: room.matchSeed, link, winScore });

  return (
    <div style={COLUMN_STYLE}>
      {run.result ? (
        <JourneyResultBar
          result={run.result}
          winScore={winScore}
          finishedMs={run.finishedMs}
          partnerNickname={partner?.nickname}
          isCoop
          onExit={onRematchMenu}
          exitLabel="Back to lobby"
          autoExitSeconds={5}
        />
      ) : (
        <JourneySageBar
          phase={run.phase}
          myWindowScore={run.myWindowScore}
          myNickname={room.nickname}
          isScoringPaused={run.isScoringPaused}
          partnerWindowScore={run.partnerWindowScore}
          partnerNickname={partner?.nickname}
        />
      )}
      <TetrisGame
        mode="coop"
        journey
        onMenu={onMenu}
        onRematchMenu={onRematchMenu}
        seed={room.matchSeed ?? undefined}
        startingLevel={1}
        maxLevel={JOURNEY_MAX_LEVEL}
        lives={JOURNEY_LIVES}
        // Journey ends through useJourneyRun, never through TetrisGame's own
        // coop shared-loss path — so no eliminations are passed down.
        opponentIds={matchOpponents.map((o) => o.guestId)}
        eliminatedOpponentIds={[]}
        opponentNicknames={Object.fromEntries(matchOpponents.map((o) => [o.guestId, o.nickname]))}
        onBoardUpdate={room.sendBoardUpdate}
        opponentBoards={room.opponentBoards}
        incomingGarbage={room.incomingGarbage}
        onTSpin={run.handleTSpin}
        onLinesCleared={run.handleLinesCleared}
        onCombo={run.handleCombo}
        onPiecePlaced={run.handlePiecePlaced}
        onTopout={run.handleTopout}
        quitVotes={room.quitVotes}
        selfQuitVote={room.selfQuitVote}
        quitVoteDeadline={room.quitVoteDeadline}
        onQuitVote={room.sendQuitVote}
        onRetractQuitVote={room.retractQuitVote}
      />
      <JourneyRacerBar score={run.totalScore} label={`${room.nickname || 'You'} + ${partner?.nickname || 'Partner'}`} winScore={winScore} />
    </div>
  );
}
