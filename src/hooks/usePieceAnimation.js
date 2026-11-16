/**
 * usePieceAnimation.js  —  v2 (Active-Token-Only Bounce)
 * ─────────────────────────────────────────────────────────────────────────────
 * Responsibilities
 * ────────────────
 * • Tokens render from local visual positions, independently of logical/network
 *   positions. Animation jobs are serialized so remote moves can queue safely.
 *
 * • Each hop between adjacent tiles goes through four sub-phases driven by
 *   requestAnimationFrame, keeping the hop tight to the actual frame loop:
 *
 *     RISE   (0 → hopPeak ms)   translateY rises from 0 → -HOP_HEIGHT
 *     FALL   (hopPeak → hopDur) translateY falls from -HOP_HEIGHT → 0
 *     SQUISH (0 → SQUISH_MS)    scaleY squishes to SQUISH_Y then rebounds to 1
 *     (then advance one tile and repeat)
 *
 * • On the final landing: squish plays, then onMoveDone fires.
 *
 * API
 * ───
 *   const anim = usePieceAnimation({ boardSize, onStepSound, onMoveDone });
 *
 *   anim.animateMove(seat, fromPos, steps)   – animate a local move and notify on landing
 *   anim.animateToPosition(playerId, pos)    – queue a forward path to a remote position
 *   anim.teleport(seat, pos)                 – instant snap (jail, chance)
 *   anim.initPositions(players)             – reset on match start
 *
 *   anim.renderedPositions  { [playerId]: number } — tile index to render at
 *   anim.activeHopState     { seat, hopY, scaleY } | null  — live transform for active token
 *   anim.isMoving           boolean
 */

import { useRef, useState, useCallback } from "react";

// ─── Timing constants ──────────────────────────────────────────────────────────
const BOARD_SIZE   = 48;
const HOP_HEIGHT   = 14;    // px peak of the bounce arc
const HOP_DURATION = 120;   // ms for a single tile hop (reduced by 45% for snappy fast hopping)
const SQUISH_Y     = 0.65;  // scaleY at the squish nadir (< 1 = squash, > 1 = stretch)
const SQUISH_MS    = 55;    // ms for the squish+rebound phase after landing (faster recovery)
const SETTLE_MS    = 650;   // ms after final squish before onMoveDone fires (intentional delay so user registers landing tile)

// Speed ramp: first hop fast, decelerate toward final tile
// Returns hop duration in ms for step `i` out of `total`
function hopDuration(i, total) {
  const t = i / Math.max(total - 1, 1);            // 0 → 1
  const eased = 1 - Math.pow(1 - t, 2);            // easeOutQuad
  return HOP_DURATION + eased * HOP_DURATION * 0.5; // 120ms → 180ms
}

// Parabolic arc: maps t∈[0,1] → hop height offset in px (peaks at t=0.5)
// −4·H·t·(t−1)  which equals 0 at t=0 and t=1, and H at t=0.5
function arcY(t, height) {
  return -4 * height * t * (t - 1);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function usePieceAnimation({
  boardSize  = BOARD_SIZE,
  onStepSound,
  onMoveDone,
  getTileCenterCoordinates,
} = {}) {

  // Player-ID positions are the only rendered source for token coordinates.
  const [renderedPositions, setRenderedPositions] = useState({});

  // Live hop transform — only exists while ONE seat is animating
  // Shape: { seat: number, hopY: number, scaleY: number } | null
  const [activeHopState, setActiveHopState] = useState(null);

  // Global "is any piece moving" flag
  const [isMoving, setIsMoving] = useState(false);

  // ── Internal refs (don't trigger renders) ───────────────────────────────────
  const rafRef    = useRef(null);  // current requestAnimationFrame handle
  const timerRef  = useRef(null);  // current setTimeout handle
  const renderedPositionsRef = useRef({});
  const plannedPositionsRef = useRef({});
  const playerKeysRef = useRef({});
  const animatingPlayersRef = useRef({});
  const queueRef = useRef([]);
  const activeJobRef = useRef(null);
  const animationGenerationRef = useRef(0);

  const updateRenderedPosition = useCallback((playerId, position) => {
    const normalizedPosition = ((position % boardSize) + boardSize) % boardSize;
    renderedPositionsRef.current = { ...renderedPositionsRef.current, [playerId]: normalizedPosition };
    setRenderedPositions(renderedPositionsRef.current);
  }, [boardSize]);

  const getRenderedPosition = useCallback((playerId) => renderedPositionsRef.current[playerId], []);

  // ── Cancel any in-flight animation ──────────────────────────────────────────
  const cancelAll = useCallback(() => {
    animationGenerationRef.current += 1;
    if (rafRef.current)   cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    rafRef.current   = null;
    timerRef.current = null;
    queueRef.current = [];
    activeJobRef.current = null;
    animatingPlayersRef.current = {};
  }, []);

  // ── Squish phase: plays on landing of every hop ──────────────────────────────
  // After this, calls `onHopEnd` which either starts the next hop or settles.
  function runSquish(seat, onHopEnd, tileIndex, fallbackPosition) {
    const start = performance.now();

    function frame(now) {
      const t = Math.min((now - start) / SQUISH_MS, 1);  // 0 → 1
      const position = getTileCenterCoordinates?.(tileIndex) ?? fallbackPosition;

      // scaleY: 1 → SQUISH_Y → 1  (simple triangle)
      const squishT = t < 0.5 ? t * 2 : 2 - t * 2;      // 0→1→0
      const scaleY = 1 - (1 - SQUISH_Y) * squishT;

      setActiveHopState({ seat, ...position, hopY: 0, scaleY });

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        setActiveHopState({ seat, ...position, hopY: 0, scaleY: 1 });
        rafRef.current = null;
        onHopEnd();
      }
    }
    rafRef.current = requestAnimationFrame(frame);
  }

  // ── Single hop: arc from current tile to next tile position ─────────────────
  // After arc finishes, advances renderedPositions[playerId] then runs squish.
  function runHop(seat, playerId, fromPos, nextPos, dur, onHopEnd) {
    const start = performance.now();
    const fromCenter = getTileCenterCoordinates?.(fromPos);
    const toCenter = getTileCenterCoordinates?.(nextPos);
    const hasCenters = fromCenter && toCenter;

    function frame(now) {
      const t = Math.min((now - start) / dur, 1);    // 0 → 1 over hop duration
      const hopY   = arcY(t, HOP_HEIGHT);             // parabolic arc (negative = up)
      const scaleY = 1;                               // flat during flight
      const currentFromCenter = getTileCenterCoordinates?.(fromPos) ?? fromCenter;
      const currentToCenter = getTileCenterCoordinates?.(nextPos) ?? toCenter;
      const position = hasCenters && currentFromCenter && currentToCenter
        ? {
            x: currentFromCenter.x + (currentToCenter.x - currentFromCenter.x) * t,
            y: currentFromCenter.y + (currentToCenter.y - currentFromCenter.y) * t
          }
        : {};

      setActiveHopState({ seat, ...position, hopY, scaleY });

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        // Land on next tile — update display position
        rafRef.current = null;
        updateRenderedPosition(playerId, nextPos);
        // Run squish then notify caller
        runSquish(seat, onHopEnd, nextPos, hasCenters ? toCenter : {});
      }
    }
    rafRef.current = requestAnimationFrame(frame);
  }

  // ── Main sequence controller ─────────────────────────────────────────────────
  const startNextJob = useCallback(() => {
    if (activeJobRef.current || queueRef.current.length === 0) return;

    const job = queueRef.current.shift();
    activeJobRef.current = job;
    setIsMoving(true);

    if (job.teleport) {
      const generation = animationGenerationRef.current;
      const finishTeleport = () => {
        if (generation !== animationGenerationRef.current) return;
        updateRenderedPosition(job.playerId, job.position);
        setActiveHopState(null);
        activeJobRef.current = null;
        animatingPlayersRef.current[job.playerId] =
          queueRef.current.some((queuedJob) => queuedJob.playerId === job.playerId);
        if (queueRef.current.length) startNextJob();
        else setIsMoving(false);
      };
      if (job.delayMs > 0) setTimeout(finishTeleport, job.delayMs);
      else finishTeleport();
      return;
    }

    setActiveHopState({ seat: job.seat, hopY: 0, scaleY: 1 });
    let currentStep = 0;

    function finishJob() {
      activeJobRef.current = null;
      if (job.notifyMoveDone) onMoveDone?.(job.seat, job.path[job.path.length - 1]);
      animatingPlayersRef.current[job.playerId] =
        queueRef.current.some((queuedJob) => queuedJob.playerId === job.playerId);
      if (queueRef.current.length) {
        startNextJob();
      } else {
        setActiveHopState(null);
        setIsMoving(false);
      }
    }

    function doNextHop() {
      currentStep += 1;
      const nextPos = job.path[currentStep - 1];
      const previousPos = currentStep === 1
        ? (job.fromPosition ?? renderedPositionsRef.current[job.playerId] ?? nextPos)
        : job.path[currentStep - 2];
      const isLast = currentStep === job.path.length;

      if (!isLast) onStepSound?.();

      runHop(job.seat, job.playerId, previousPos, nextPos, hopDuration(currentStep - 1, job.path.length), () => {
        if (isLast) {
          timerRef.current = setTimeout(finishJob, SETTLE_MS);
        } else {
          timerRef.current = setTimeout(doNextHop, 30);
        }
      });
    }

    if (job.path.length === 0) {
      finishJob();
      return;
    }

    if (job.stepped) {
      const generation = animationGenerationRef.current;
      const runSteppedPath = async () => {
        if (job.delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, job.delayMs));
          if (generation !== animationGenerationRef.current) return;
        }
        for (const nextPosition of job.path) {
          await new Promise((resolve) => setTimeout(resolve, job.stepDelayMs));
          if (generation !== animationGenerationRef.current) return;
          updateRenderedPosition(job.playerId, nextPosition);
        }
        if (generation === animationGenerationRef.current) finishJob();
      };
      runSteppedPath();
      return;
    }

    doNextHop();
  }, [onMoveDone, onStepSound, updateRenderedPosition]);

  const enqueuePath = useCallback((playerId, seat, path, fromPosition, {
    notifyMoveDone = false,
    stepped = false,
    delayMs = 0,
    stepDelayMs = 180
  } = {}) => {
    if (!path.length) return;
    const normalizedPath = path.map((position) => ((position % boardSize) + boardSize) % boardSize);
    queueRef.current.push({
      playerId,
      seat,
      path: normalizedPath,
      fromPosition,
      notifyMoveDone,
      stepped,
      delayMs,
      stepDelayMs
    });
    plannedPositionsRef.current = {
      ...plannedPositionsRef.current,
      [playerId]: normalizedPath[normalizedPath.length - 1]
    };
    animatingPlayersRef.current[playerId] = true;
    startNextJob();
  }, [boardSize, startNextJob]);

  const animateMove = useCallback((seat, fromPos, steps) => {
    if (steps <= 0) {
      onMoveDone?.(seat, fromPos % boardSize);
      return;
    }
    const playerId = playerKeysRef.current[seat] ?? seat;
    const path = Array.from({ length: steps }, (_, index) => (fromPos + index + 1) % boardSize);
    enqueuePath(playerId, seat, path, fromPos, { notifyMoveDone: true });
  }, [boardSize, enqueuePath, onMoveDone]);

  const animateToPosition = useCallback((playerId, targetPosition, {
    seat,
    teleport: shouldTeleport = false,
    delayMs = 850,
    stepDelayMs = 180
  } = {}) => {
    const target = ((targetPosition % boardSize) + boardSize) % boardSize;
    const playerSeat = seat ?? playerId;
    const plannedPosition = plannedPositionsRef.current[playerId];
    const fromPosition = plannedPosition ?? renderedPositionsRef.current[playerId] ?? target;
    if (fromPosition === target) return;

    if (shouldTeleport) {
      queueRef.current.push({
        playerId,
        seat: playerSeat,
        teleport: true,
        position: target,
        delayMs: Math.max(0, delayMs)
      });
      plannedPositionsRef.current = { ...plannedPositionsRef.current, [playerId]: target };
      animatingPlayersRef.current[playerId] = true;
      startNextJob();
      return;
    }

    const steps = (target - fromPosition + boardSize) % boardSize;
    const path = Array.from({ length: steps }, (_, index) => (fromPosition + index + 1) % boardSize);
    enqueuePath(playerId, playerSeat, path, fromPosition, {
      stepped: true,
      delayMs,
      stepDelayMs
    });
  }, [boardSize, enqueuePath, startNextJob]);

  // ── Instant snap (Go to Jail, Chance teleport, game start) ──────────────────
  const teleport = useCallback((seat, pos) => {
    const playerId = playerKeysRef.current[seat] ?? seat;
    const target = ((pos % boardSize) + boardSize) % boardSize;
    plannedPositionsRef.current = { ...plannedPositionsRef.current, [playerId]: target };
    updateRenderedPosition(playerId, target);
  }, [boardSize, updateRenderedPosition]);

  // ── Snap all tokens to starting positions (match start / play again) ─────────
  const initPositions = useCallback((players) => {
    cancelAll();
    setActiveHopState(null);
    setIsMoving(false);
    const positions = {};
    const playerKeys = {};
    players.forEach((p) => {
      if (!p) return;
      const playerId = p.id ?? p.seat;
      positions[playerId] = ((p.position % boardSize) + boardSize) % boardSize;
      playerKeys[p.seat] = playerId;
    });
    playerKeysRef.current = playerKeys;
    renderedPositionsRef.current = positions;
    plannedPositionsRef.current = { ...positions };
    setRenderedPositions(positions);
  }, [boardSize, cancelAll]);

  return {
    renderedPositions,
    activeHopState,   // { seat, hopY, scaleY } | null
    isMoving,
    animateMove,
    animateToPosition,
    getRenderedPosition,
    animatingPlayersRef,
    teleport,
    initPositions,
  };
}
