/**
 * usePieceAnimation.js  —  v2 (Active-Token-Only Bounce)
 * ─────────────────────────────────────────────────────────────────────────────
 * Responsibilities
 * ────────────────
 * • Only the ACTIVE player's token is ever animated.  Inactive tokens sit still
 *   at their logical positions — no state churn, no spurious re-renders.
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
 *   anim.animateMove(seat, fromPos, steps)   – start animation for active token
 *   anim.teleport(seat, pos)                 – instant snap (jail, chance)
 *   anim.initPositions(players)             – reset on match start
 *
 *   anim.displayPositions   { [seat]: number }  — tile index to render at
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

  // Per-seat tile positions (what gets rendered for all tokens)
  const [displayPositions, setDisplayPositions] = useState({});

  // Live hop transform — only exists while ONE seat is animating
  // Shape: { seat: number, hopY: number, scaleY: number } | null
  const [activeHopState, setActiveHopState] = useState(null);

  // Global "is any piece moving" flag
  const [isMoving, setIsMoving] = useState(false);

  // ── Internal refs (don't trigger renders) ───────────────────────────────────
  const rafRef    = useRef(null);  // current requestAnimationFrame handle
  const timerRef  = useRef(null);  // current setTimeout handle
  const stateRef  = useRef(null);  // { seat, fromPos, steps, currentStep, startTime, hopDur }

  // ── Cancel any in-flight animation ──────────────────────────────────────────
  const cancelAll = useCallback(() => {
    if (rafRef.current)   cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    rafRef.current   = null;
    timerRef.current = null;
    stateRef.current = null;
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
  // After arc finishes, advances displayPositions[seat] then runs squish.
  function runHop(seat, fromPos, nextPos, dur, onHopEnd) {
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
        setDisplayPositions((prev) => ({ ...prev, [seat]: nextPos }));
        // Run squish then notify caller
        runSquish(seat, onHopEnd, nextPos, hasCenters ? toCenter : {});
      }
    }
    rafRef.current = requestAnimationFrame(frame);
  }

  // ── Main sequence controller ─────────────────────────────────────────────────
  const animateMove = useCallback((seat, fromPos, steps) => {
    cancelAll();

    if (steps <= 0) {
      onMoveDone?.(seat, fromPos % boardSize);
      return;
    }

    setIsMoving(true);
    setActiveHopState({ seat, hopY: 0, scaleY: 1 });

    let currentStep = 0;

    function doNextHop() {
      currentStep += 1;
      const nextPos = (fromPos + currentStep) % boardSize;
      const dur     = hopDuration(currentStep - 1, steps);
      const isLast  = currentStep === steps;

      // Play step tick on every hop except the final landing
      if (!isLast) onStepSound?.();

      runHop(seat, (fromPos + currentStep - 1) % boardSize, nextPos, dur, () => {
        if (isLast) {
          // Finished — clear active hop state, unlock input, fire tile action
          timerRef.current = setTimeout(() => {
            setActiveHopState(null);
            setIsMoving(false);
            onMoveDone?.(seat, nextPos);
          }, SETTLE_MS);
        } else {
          // Schedule next hop after a tiny gap so the squish is visible
          timerRef.current = setTimeout(doNextHop, 30);
        }
      });
    }

    // Kick off immediately
    doNextHop();
  }, [boardSize, cancelAll, getTileCenterCoordinates, onStepSound, onMoveDone]);

  // ── Instant snap (Go to Jail, Chance teleport, game start) ──────────────────
  const teleport = useCallback((seat, pos) => {
    cancelAll();
    setActiveHopState(null);
    setIsMoving(false);
    setDisplayPositions((prev) => ({ ...prev, [seat]: pos % boardSize }));
  }, [boardSize, cancelAll]);

  // ── Snap all tokens to starting positions (match start / play again) ─────────
  const initPositions = useCallback((players) => {
    cancelAll();
    setActiveHopState(null);
    setIsMoving(false);
    const positions = {};
    players.forEach((p) => { if (p) positions[p.seat] = p.position; });
    setDisplayPositions(positions);
  }, [cancelAll]);

  return {
    displayPositions,
    activeHopState,   // { seat, hopY, scaleY } | null
    isMoving,
    animateMove,
    teleport,
    initPositions,
  };
}
