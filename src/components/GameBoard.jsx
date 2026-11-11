import React, { useRef, useEffect, useLayoutEffect, useCallback, useState } from "react";
import Tile from "./Tile";
import PieceToken from "./PieceToken";
import { BOARD_SPACES, getTileGridArea, getPositionPercent } from "../data/boardData";
import { LogoCrown } from "./Icons";
import { CircleHelp, TrendingUp } from "lucide-react";
import { playSound } from "../audio/soundEngine";
import { GAME_CONSTANTS, formatRupee } from "../data/constants";

// ─── Coordinate mapping ───────────────────────────────────────────────────────
/**
 * tileToPercent(index, boardSize)
 * Maps a board tile index to { left, top } CSS percentage coordinates
 * for the token layer overlay.
 *
 * Board perimeter (13×13 grid, corners at 0, 12, 24, 36):
 *   0–12  : bottom row  → row 13, col decreasing (13 → 1)
 *   12–24 : left col    → col 1,  row decreasing (13 → 1)
 *   24–36 : top row     → row 1,  col increasing (1 → 13)
 *   36–47 : right col   → col 13, row increasing (1 → 13)
 */
function tileToPercent(index) {
  const { row, col } = getTileGridArea(index);
  return {
    left: getPositionPercent(col),
    top: getPositionPercent(row)
  };
}

/**
 * tokenOffset(playerIndex, totalOnTile)
 * Returns a small { dx, dy } pixel nudge so stacked tokens don't overlap.
 * Tokens are arranged in a tight cluster around the tile centre.
 */
function tokenOffset(playerIndex, totalOnTile) {
  if (totalOnTile <= 1) return { dx: 0, dy: 0 };
  // Spread offsets: up to 4 players in a 2×2 pattern, more in a ring
  const offsets = [
    { dx: -8, dy: -8 },
    { dx:  8, dy: -8 },
    { dx: -8, dy:  8 },
    { dx:  8, dy:  8 },
    { dx:  0, dy: -8 },
    { dx:  8, dy:  0 },
    { dx:  0, dy:  8 },
    { dx: -8, dy:  0 },
  ];
  return offsets[playerIndex % offsets.length] ?? { dx: 0, dy: 0 };
}

// Skyline architectural SVG silhouettes along the board inner edges
function SkylineArt() {
  return (
    <>
      {/* Bottom Skyline */}
      <span className="sky s-bottom" style={{ "--sa": "#8B5A2B", "--sb": "#6CC8F5" }}>
        <svg viewBox="0 0 400 60" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
          <path className="bk" d="M0 60V42h30V26h22v16h38V34h18v8h34V22h24v20h42V32h20v10h34V20h26v22h32V30h24v12h46V40h10v20z" />
          <rect className="fr" x="40" y="24" width="16" height="36" />
          <rect className="fr" x="140" y="20" width="20" height="40" />
          <path className="fr" d="M230 60V16l12-8 12 8v44z" />
          <rect className="fr" x="320" y="28" width="18" height="32" />
        </svg>
      </span>

      {/* Top Skyline */}
      <span className="sky s-top" style={{ "--sa": "#FFD21F", "--sb": "#2FB457" }}>
        <svg viewBox="0 0 400 60" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
          <path className="bk" d="M0 60V40h24V28h28v14h36V30h20v12h32V24h26v18h38V32h22v10h36V22h24v20h40V34h18v8h36V38h20v22z" />
          <rect className="fr" x="50" y="26" width="18" height="34" />
          <rect className="fr" x="160" y="22" width="22" height="38" />
          <path className="fr" d="M260 60V14l10-6 10 6v46z" />
          <rect className="fr" x="340" y="30" width="16" height="30" />
        </svg>
      </span>

      {/* Left Skyline */}
      <span className="sky s-left" style={{ "--sa": "#FF8A1F", "--sb": "#E5383B" }}>
        <svg viewBox="0 0 400 60" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
          <path className="bk" d="M0 60V45h28V32h20v13h34V26h24v19h32V35h18v10h36V20h22v25h38V30h26v15h40V38h22v7h30V40h30v20z" />
          <rect className="fr" x="45" y="28" width="16" height="32" />
          <rect className="fr" x="135" y="18" width="20" height="42" />
          <path className="fr" d="M225 60V15l10-7 10 7v45z" />
          <rect className="fr" x="315" y="26" width="18" height="34" />
        </svg>
      </span>

      {/* Right Skyline */}
      <span className="sky s-right" style={{ "--sa": "#2456D6", "--sb": "#8E3FD9" }}>
        <svg viewBox="0 0 400 60" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
          <path className="bk" d="M0 60V44h24V34h18v12h26V28h20v16h30V36h24v10h28V30h22v14h36V38h26v8h30V32h24v14h30V40h42v20z" />
          <rect className="fr" x="36" y="20" width="16" height="40" />
          <path className="fr" d="M86 60V24l9-9 9 9v36z" />
          <rect className="fr" x="180" y="24" width="16" height="36" />
          <path className="fr" d="M306 60V18h8V8h2v10h8v42z" />
        </svg>
      </span>
    </>
  );
}

export default function GameBoard({
  boardSpaces = BOARD_SPACES,
  players = [],
  properties = {},
  selectedTile = null,
  isTurnResolving = false,
  isMoving = false,
  displayPositions = {},   // { [seat]: tileIndex }
  activeHopState   = null, // { seat, hopY, scaleY } | null  — only the active token
  festivals = [],
  registerTileCenterGetter,
  onSelectTile,
  onOpenMarket,
  onOpenChance
}) {
  const boardAreaRef = useRef(null);
  const boardBoxRef = useRef(null);
  const tileCentersRef = useRef({});
  const [tileCenters, setTileCenters] = useState({});

  const getTileCenterCoordinates = useCallback((tileIndex) => {
    const cachedCenter = tileCentersRef.current[tileIndex];
    if (cachedCenter) return cachedCenter;

    const boardBox = boardBoxRef.current;
    const tile = boardBox?.querySelector(`[data-tile-index="${tileIndex}"]`);
    if (!boardBox || !tile) return null;

    const boardRect = boardBox.getBoundingClientRect();
    const tileRect = tile.getBoundingClientRect();
    const center = {
      x: tileRect.left - boardRect.left + tileRect.width / 2,
      y: tileRect.top - boardRect.top + tileRect.height / 2
    };
    tileCentersRef.current[tileIndex] = center;
    return center;
  }, []);

  useEffect(() => {
    registerTileCenterGetter?.(getTileCenterCoordinates);
    return () => registerTileCenterGetter?.(null);
  }, [getTileCenterCoordinates, registerTileCenterGetter]);

  useLayoutEffect(() => {
    const boardBox = boardBoxRef.current;
    if (!boardBox) return undefined;

    const updateTileCenters = () => {
      const boardRect = boardBox.getBoundingClientRect();
      const nextCenters = {};
      boardBox.querySelectorAll("[data-tile-index]").forEach((tile) => {
        const tileRect = tile.getBoundingClientRect();
        const tileIndex = Number(tile.dataset.tileIndex);
        nextCenters[tileIndex] = {
          x: tileRect.left - boardRect.left + tileRect.width / 2,
          y: tileRect.top - boardRect.top + tileRect.height / 2
        };
      });

      tileCentersRef.current = nextCenters;
      setTileCenters((previous) => {
        const unchanged = Object.keys(nextCenters).length === Object.keys(previous).length &&
          Object.keys(nextCenters).every((index) =>
            Math.abs(nextCenters[index].x - previous[index].x) < 0.25 &&
            Math.abs(nextCenters[index].y - previous[index].y) < 0.25
          );
        return unchanged ? previous : nextCenters;
      });
    };

    const observer = new ResizeObserver(updateTileCenters);
    observer.observe(boardBox);
    const boardGrid = boardBox.querySelector(".board");
    if (boardGrid) observer.observe(boardGrid);
    boardBox.querySelectorAll("[data-tile-index]").forEach((tile) => observer.observe(tile));
    window.addEventListener("resize", updateTileCenters);
    updateTileCenters();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateTileCenters);
    };
  }, [boardSpaces]);

  // Responsive unit scaling (--u)
  useEffect(() => {
    const el = boardAreaRef.current;
    if (!el) return;

    const updateUnit = () => {
      const minDimension = Math.min(el.clientWidth, el.clientHeight);
      if (minDimension) {
        el.style.setProperty("--u", `${minDimension / 100}px`);
        el.classList.toggle("bb-wide", minDimension >= 520);
      }
    };

    updateUnit();
    const observer = new ResizeObserver(updateUnit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="board-area" ref={boardAreaRef}>
      <div className="board-box" ref={boardBoxRef}>
        {/* Main 48-tile Grid */}
        <div className="board plain">
          {boardSpaces.map((space) => {
            const propState = properties[space.id];
            const owner = propState && propState.owner !== undefined ? players[propState.owner] : null;
            const hasFestival = festivals.includes(space.set);

            return (
              <Tile
                key={space.id}
                space={space}
                propertyState={propState}
                ownerPlayer={owner}
                ownerColor={owner?.color}
                isSelected={selectedTile === space.id}
                hasFestival={hasFestival}
                disabled={isTurnResolving}
                onSelect={onSelectTile}
              />
            );
          })}

          {/* Center Sky & Inner Arena */}
          <div className="centre">
            {/* Stars & Shooting Stars */}
            <span className="stars" aria-hidden="true">
              <i className="shoot" />
              <i className="shoot" />
            </span>

            {/* City Skylines */}
            <SkylineArt />

            {/* Big Business Centerpiece Logo */}
            <div className="flex flex-col items-center select-none pointer-events-none drop-shadow-lg mb-2">
              <LogoCrown style={{ width: "calc(20 * var(--u))", height: "calc(13.75 * var(--u))" }} />
              <div
                className="font-extrabold uppercase tracking-widest text-amber-300"
                style={{ fontSize: "calc(6.25 * var(--u))" }}
              >
                Big Business
              </div>
            </div>

            {/* Interactive Decks: Chance & Market */}
            <div className="decks">
              <button
                type="button"
                className="deck ch"
                disabled={isTurnResolving}
                onClick={() => {
                  playSound("click");
                  onOpenChance();
                }}
              >
                <CircleHelp className="w-4 h-4 inline mr-1 text-amber-300" />
                Chance
              </button>

              <button
                type="button"
                className="deck mk2"
                disabled={isTurnResolving}
                onClick={() => {
                  playSound("click");
                  onOpenMarket();
                }}
              >
                <span>
                  <TrendingUp className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
                  Market
                </span>
                <div className="odds">
                  <b className="bad">2–5 lose</b>
                  <b className="mid">6–8 flat</b>
                  <b className="good">9–12 double</b>
                </div>
              </button>
            </div>

            {/* Rules Strip */}
            <div className="rules">
              <span>Salary <b>+{formatRupee(GAME_CONSTANTS.SALARY_STEP)}</b> each lap</span>
              <span>Full set <b>3× rent</b></span>
              <span className="vil">
                <i /> Villages hold a <b>festival</b>
              </span>
            </div>
          </div>
        </div>

        {/* ── Tokens Layer ──────────────────────────────────────────────────── */}
        {/*  Active token: hop arc driven by activeHopState (rAF-based).        */}
        {/*  Inactive tokens: stationary CSS transition only, zero transform.   */}
        <div className="tlayer pointer-events-none">
          {(() => {
            // ── Pre-compute occupant slots using LOGICAL positions for
            //    stationary tokens and DISPLAY position for the active token.
            //    This ensures the landing offset is reserved before the piece
            //    even starts moving.
            const activeSeat = activeHopState?.seat ?? null;

            const slotMap = {};  // tileIndex → [seat, ...]
            players.forEach((p) => {
              if (!p || p.bankrupt) return;
              // Stationary tokens use logical position; active uses display
              const pos =
                p.seat === activeSeat
                  ? (displayPositions[p.seat] ?? p.position) % boardSpaces.length
                  : p.position % boardSpaces.length;
              if (!slotMap[pos]) slotMap[pos] = [];
              slotMap[pos].push(p.seat);
            });

            return players.map((p) => {
              if (!p || p.bankrupt) return null;

              const isActive = p.seat === activeSeat;

              // ── Position source ────────────────────────────────────────────
              const tilePos = isActive
                ? (displayPositions[p.seat] ?? p.position) % boardSpaces.length
                : p.position % boardSpaces.length;

              const isInJail = tilePos === 12 && p.jail > 0;
              const { left, top } = tileToPercent(tilePos);
              const center = tileCenters[tilePos];
              const activeCenter = isActive &&
                Number.isFinite(activeHopState?.x) &&
                Number.isFinite(activeHopState?.y)
                ? { x: activeHopState.x, y: activeHopState.y }
                : null;

              // ── Collision offset (slot reserved at target tile) ────────────
              const occupants = slotMap[tilePos] ?? [];
              const mySlot    = occupants.indexOf(p.seat);
              const { dx, dy } = tokenOffset(mySlot, occupants.length);

              const baseLeft = left + (isInJail ? 1.5 : 0);
              const baseTop  = top  + (isInJail ? 1.5 : 0);

              // ── Active token: apply rAF-driven hop transform ───────────────
              // Measured tile centers place the token; hopY adds the arc above
              // that interpolated path.
              const hopY   = isActive ? (activeHopState?.hopY   ?? 0) : 0;
              const scaleY = isActive ? (activeHopState?.scaleY ?? 1) : 1;

              // translateY(hopY px) — negative = upward
              const transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px + ${hopY}px)) scaleY(${scaleY.toFixed(3)})`;

              return (
                <span
                  key={p.seat}
                  className="tk"
                  style={{
                    left: center ? `${(activeCenter || center).x}px` : `${baseLeft}%`,
                    top: center ? `${(activeCenter || center).y}px` : `${baseTop}%`,
                    transform,
                    transformOrigin: "center center",
                    // Smooth lateral slide for stationary tokens (position changes
                    // only happen on logical updates, so no jitter).
                    // Active token's left/top also transitions between tiles —
                    // the rAF arc provides the Y offset on top.
                    transition: center
                      ? "none"
                      : isActive
                      ? "left 120ms cubic-bezier(0.25,0.46,0.45,0.94), top 120ms cubic-bezier(0.25,0.46,0.45,0.94)"
                      : "left 300ms ease-out, top 300ms ease-out",
                    zIndex:  isActive ? 30 : 10,
                    // Active token gets a glow to make it pop
                    filter: isActive
                      ? `drop-shadow(0 0 6px ${p.color || "#fff"}cc)`
                      : "none",
                    willChange: isActive ? "transform, left, top" : "auto",
                  }}
                >
                  <PieceToken
                    color={p.color}
                    label={(p.name[0] || "?").toUpperCase()}
                    kind={p.token || "pawn"}
                  />
                </span>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}
