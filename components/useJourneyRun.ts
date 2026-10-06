'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CHALLENGES, COUNTDOWN_OFFSET_MS, DEFAULT_WIN_SCORE, TOPOUT_PAUSE_MS,
  buildChallengeOrder, computePhase, computeWindowPoints, frenzyPoints, liveWindowPoints,
} from './journeyChallenges';
import type { ChallengeType, JourneyPhase, WindowReport } from './journeyChallenges';

// What the co-op path needs from the online room. Omitted = solo run.
export interface JourneyLink {
  sendJourneyMsg: (event: 'window-score' | 'progress', payload: unknown) => void;
  incomingJourneyMsg: { event: string; payload: unknown; seq: number } | null;
  sendGarbage: (amount: number, targetGuestId?: string) => void;
  partnerGuestId?: string;
  partnerLeft: boolean;
}

export type JourneyResult = 'win' | 'partner-left' | null;

const SOLO_STORM_GARBAGE_MS = 1_500;
const COOP_STORM_GARBAGE_MS = 2_000;

// One hook for both modes (blocks-arena had three near-duplicates). Solo banks
// each window's points as soon as it ends; co-op waits until both players'
// window reports are in and banks the combined total.
export function useJourneyRun({ startAt, seed, link, winScore = DEFAULT_WIN_SCORE }: {
  startAt: number | null;
  seed: number | null;
  link?: JourneyLink;
  // Points needed to win (the mode popup / lobby setting). Fixed for a run.
  winScore?: number;
}) {
  const isCoop = link != null;

  // Latest link in a ref so the ticker/handlers stay stable.
  const linkRef = useRef(link);
  useEffect(() => { linkRef.current = link; }, [link]);

  const challenges = useMemo(() => (seed == null ? CHALLENGES : buildChallengeOrder(seed)), [seed]);
  const challengesRef = useRef(challenges);
  useEffect(() => { challengesRef.current = challenges; }, [challenges]);

  // Per-window accumulators — reset every time a new challenge window opens.
  const windowScoreRef = useRef(0);
  const piecesThisWindowRef = useRef(0);
  const toppedOutThisWindowRef = useRef(false);
  const hasPcThisWindowRef = useRef(false);
  const currentWindowSeqRef = useRef(-1);
  const windowReportSentRef = useRef(false);
  const currentChallengeTypeRef = useRef<ChallengeType | null>(null);

  const myReportsRef = useRef<Map<number, WindowReport>>(new Map());
  const partnerReportsRef = useRef<Map<number, WindowReport>>(new Map());
  const finalizedRef = useRef<Set<number>>(new Set());
  // Points from fully finished windows ("banked")...
  const totalRef = useRef(0);
  // ...plus what the window in progress is worth so far, for each player. The
  // progress bar shows banked + live, and the run ends the moment that reaches
  // the goal — not only when a window closes.
  const myLiveRef = useRef(0);
  const partnerLiveRef = useRef(0);
  const wonRef = useRef(false);

  // Solo pause (Settings panel): the challenge schedule is wall-clock, so while
  // paused it's frozen by tracking how long we've been paused and subtracting
  // that from "now". Co-op can't do this — both players share one schedule —
  // so pausing there only freezes your own board.
  const pauseStartedAtRef = useRef<number | null>(null);
  const totalPausedMsRef = useRef(0);
  const [paused, setPausedState] = useState(false);
  const setPaused = useCallback((next: boolean) => {
    if (linkRef.current) return; // co-op: clock keeps running
    if (next && pauseStartedAtRef.current === null) {
      pauseStartedAtRef.current = Date.now();
      setPausedState(true);
    } else if (!next && pauseStartedAtRef.current !== null) {
      totalPausedMsRef.current += Date.now() - pauseStartedAtRef.current;
      pauseStartedAtRef.current = null;
      setPausedState(false);
    }
  }, []);
  // Play-time "now": frozen at the moment the pause began, minus past pauses.
  const playNow = useCallback(() => (pauseStartedAtRef.current ?? Date.now()) - totalPausedMsRef.current, []);

  const topoutPauseEndRef = useRef(0);
  const topoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (topoutTimerRef.current) clearTimeout(topoutTimerRef.current); }, []);

  const [totalScore, setTotalScore] = useState(0);
  const [myWindowScore, setMyWindowScore] = useState(0);
  const [partnerWindowScore, setPartnerWindowScore] = useState(0);
  const [won, setWon] = useState(false);
  const [isScoringPaused, setIsScoringPaused] = useState(false);
  const [phase, setPhase] = useState<JourneyPhase | null>(null);
  // Solo only — fed into TetrisGame's incomingGarbage during Survive the Storm.
  const [incomingGarbage, setIncomingGarbage] = useState<{ amount: number; seq: number } | null>(null);
  // Elapsed play time (ms, excluding the countdown) when the winning point banked.
  const [finishedMs, setFinishedMs] = useState<number | null>(null);

  // Partner dropped mid-run. Unlike blocks-arena (which awards victory), this
  // just ends the run — nothing was earned. Derived rather than stored so it
  // takes effect the same render the partner disappears. A win that already
  // banked stays a win.
  const partnerLeft = link?.partnerLeft ?? false;
  const result: JourneyResult = won ? 'win' : (partnerLeft && startAt ? 'partner-left' : null);

  // Recomputes the displayed total (banked + the open window's live points) and
  // ends the run the instant it reaches the goal. A window that has already been
  // banked contributes nothing live, so it can't be counted twice.
  const refreshTotal = useCallback(() => {
    const seq = currentWindowSeqRef.current;
    const live = seq >= 0 && !finalizedRef.current.has(seq) ? myLiveRef.current + partnerLiveRef.current : 0;
    const total = Math.min(winScore, totalRef.current + live);
    setTotalScore(total);
    if (total >= winScore && !wonRef.current) {
      wonRef.current = true;
      setWon(true);
      if (startAt != null) setFinishedMs(Math.max(0, playNow() - (startAt + COUNTDOWN_OFFSET_MS)));
    }
  }, [startAt, winScore, playNow]);

  // Bank a completed window once everything needed is in. Guarded per seq so a
  // late/duplicate report can never double-count.
  const finalizeWindow = useCallback((seq: number) => {
    if (finalizedRef.current.has(seq)) return;
    const mine = myReportsRef.current.get(seq);
    if (!mine) return;
    const partner = partnerReportsRef.current.get(seq);
    if (linkRef.current && !partner) return;
    finalizedRef.current.add(seq);

    const list = challengesRef.current;
    const challenge = list[seq % list.length];
    const pts = computeWindowPoints(challenge, mine) + (partner ? computeWindowPoints(challenge, partner) : 0);

    totalRef.current = Math.min(winScore, totalRef.current + pts);
    // Only clear the partner's live box if that window is still the open one
    // (their report can arrive after our next window has already started).
    if (currentWindowSeqRef.current === seq) {
      myLiveRef.current = 0;
      partnerLiveRef.current = 0;
      setPartnerWindowScore(0);
    }
    refreshTotal();
  }, [winScore, refreshTotal]);

  // Incoming co-op messages from the partner. The room keeps its last message
  // across matches, so anything at or below the seq seen on mount is a
  // leftover from a previous run and must not be replayed into this one.
  const incomingMsg = link?.incomingJourneyMsg ?? null;
  const baseSeqRef = useRef(link?.incomingJourneyMsg?.seq ?? 0);
  useEffect(() => {
    if (!incomingMsg || incomingMsg.seq <= baseSeqRef.current) return;
    if (incomingMsg.event === 'window-score') {
      const report = incomingMsg.payload as WindowReport;
      partnerReportsRef.current.set(report.challengeSeq, report);
      finalizeWindow(report.challengeSeq);
    } else if (incomingMsg.event === 'progress') {
      const { windowPts, seq } = incomingMsg.payload as { windowPts: number; seq?: number };
      // Only the window we're in: a late message from the previous window must
      // not leak into this one's total.
      const current = currentWindowSeqRef.current;
      if ((seq == null || seq === current) && current >= 0 && !finalizedRef.current.has(current)) {
        partnerLiveRef.current = windowPts;
        setPartnerWindowScore(windowPts);
        refreshTotal();
      }
    }
  }, [incomingMsg, finalizeWindow, refreshTotal]);

  // Phase ticker — 100ms. Drives the exposed `phase`, window rollover, and
  // sending/banking the end-of-window report.
  useEffect(() => {
    if (!startAt || seed == null || result !== null) return;
    const challengeStartAt = startAt + COUNTDOWN_OFFSET_MS;

    const tick = () => {
      const now = playNow();
      if (now < challengeStartAt) return;

      const newPhase = computePhase(now - challengeStartAt, challenges);
      setPhase(newPhase);
      currentChallengeTypeRef.current = newPhase.phase === 'challenge' ? newPhase.challenge.type : null;

      // New challenge window opened.
      if (newPhase.phase === 'challenge' && newPhase.challengeSeq !== currentWindowSeqRef.current) {
        windowScoreRef.current = 0;
        piecesThisWindowRef.current = 0;
        toppedOutThisWindowRef.current = false;
        hasPcThisWindowRef.current = false;
        windowReportSentRef.current = false;
        currentWindowSeqRef.current = newPhase.challengeSeq;
        myLiveRef.current = 0;
        partnerLiveRef.current = 0;
        setMyWindowScore(0);
        setPartnerWindowScore(0);
        refreshTotal();
      }

      // Window just ended — report once.
      if (newPhase.phase === 'cooldown' && !windowReportSentRef.current) {
        const endedSeq = newPhase.challengeSeq - 1;
        if (endedSeq >= 0 && endedSeq === currentWindowSeqRef.current) {
          windowReportSentRef.current = true;
          const endedChallenge = challenges[endedSeq % challenges.length];
          const report: WindowReport = {
            challengeSeq: endedSeq,
            windowScore: endedChallenge.type === 'speed-place'
              ? Math.floor(piecesThisWindowRef.current / 3)
              : windowScoreRef.current,
            survived: !toppedOutThisWindowRef.current,
            hasPc: hasPcThisWindowRef.current,
          };
          myReportsRef.current.set(endedSeq, report);
          finalizeWindow(endedSeq);
          linkRef.current?.sendJourneyMsg('window-score', report);
        }
      }
    };

    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [startAt, seed, challenges, result, finalizeWindow, refreshTotal, playNow]);

  // Survive the Storm needs an actual storm. Solo feeds garbage to our own
  // board; co-op sends it to the partner (both clients run this, so both
  // boards receive it).
  const phaseKind = phase?.phase ?? null;
  const challengeKind = phase?.challenge.type ?? null;
  useEffect(() => {
    // Solo storm garbage stops while paused (Settings open) so it doesn't pile
    // up and dump on you the moment you resume.
    if (!startAt || result !== null || paused) return;
    if (phaseKind !== 'challenge' || challengeKind !== 'survive-storm') return;
    if (isCoop) {
      const target = linkRef.current?.partnerGuestId;
      if (!target) return;
      const id = setInterval(() => linkRef.current?.sendGarbage(1, target), COOP_STORM_GARBAGE_MS);
      return () => clearInterval(id);
    }
    let n = 0;
    const id = setInterval(() => setIncomingGarbage({ amount: 1, seq: ++n }), SOLO_STORM_GARBAGE_MS);
    return () => clearInterval(id);
  }, [startAt, result, paused, isCoop, phaseKind, challengeKind]);

  const isScoring = () => Date.now() > topoutPauseEndRef.current;

  // Re-derive what this window is worth so far, show it, tell the partner, and
  // fold it into the total (which may end the run right here).
  const publishLive = useCallback(() => {
    const type = currentChallengeTypeRef.current;
    if (!type || wonRef.current) return;
    const raw = type === 'speed-place' ? Math.floor(piecesThisWindowRef.current / 3) : windowScoreRef.current;
    const live = liveWindowPoints(type, raw, hasPcThisWindowRef.current);
    myLiveRef.current = live;
    setMyWindowScore(live);
    linkRef.current?.sendJourneyMsg('progress', { windowPts: live, seq: currentWindowSeqRef.current });
    refreshTotal();
  }, [refreshTotal]);

  const addWindowScore = useCallback((delta: number) => {
    if (!isScoring()) return;
    windowScoreRef.current += delta;
    publishLive();
  }, [publishLive]);

  // (TetrisGame also passes the T-spin type / combo streak; only the event
  // itself scores, so the arguments are intentionally not declared.)
  const handleTSpin = useCallback(() => {
    if (currentChallengeTypeRef.current === 'tspin-rush') addWindowScore(1);
  }, [addWindowScore]);

  const handleLinesCleared = useCallback((count: number, isTetris: boolean, isPc: boolean) => {
    if (!isScoring()) return;
    if (isPc) hasPcThisWindowRef.current = true;
    const t = currentChallengeTypeRef.current;
    if (t === 'line-blitz' || t === 'perfect-clear') addWindowScore(count);
    if (t === 'tetris-only' && isTetris) addWindowScore(5);
    if (t === 'score-frenzy') addWindowScore(frenzyPoints(count));
  }, [addWindowScore]);

  const handleCombo = useCallback(() => {
    if (currentChallengeTypeRef.current === 'combo-chain') addWindowScore(1);
  }, [addWindowScore]);

  const handlePiecePlaced = useCallback(() => {
    if (!isScoring()) return;
    if (currentChallengeTypeRef.current !== 'speed-place') return;
    piecesThisWindowRef.current++;
    publishLive();
  }, [publishLive]);

  const handleTopout = useCallback(() => {
    toppedOutThisWindowRef.current = true;
    topoutPauseEndRef.current = Date.now() + TOPOUT_PAUSE_MS;
    setIsScoringPaused(true);
    if (topoutTimerRef.current) clearTimeout(topoutTimerRef.current);
    topoutTimerRef.current = setTimeout(() => setIsScoringPaused(false), TOPOUT_PAUSE_MS);
  }, []);

  return {
    phase,
    totalScore,
    myWindowScore,
    partnerWindowScore,
    result,
    finishedMs,
    isScoringPaused,
    incomingGarbage,
    handleTSpin,
    handleLinesCleared,
    handleCombo,
    handlePiecePlaced,
    handleTopout,
    setPaused,
  };
}
