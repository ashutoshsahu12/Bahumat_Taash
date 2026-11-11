import React, { useState, useEffect } from 'react';
import { 
  ArrowRightLeft, 
  Hammer, 
  CircleDollarSign, 
  Pickaxe, 
  Dices, 
  Check, 
  Lock, 
  Clock, 
  Loader2 
} from 'lucide-react';
import { formatRupee, GAME_CONSTANTS } from '../data/constants';
import { playSound } from '../audio/soundEngine';
import Dice3D from './Dice3D';

export default function TurnDock({
  isMyTurn = false,
  turnPlayer,
  myPlayer,
  players = [],
  gameState,
  isBotTurn = false,
  botStatus = "",
  dice = [1, 1],
  isRolling = false,
  isTurnResolving = false,
  isActionModalActive = false,
  isMoving = false,
  onRollDice,
  onEndTurn,
  onOpenTrade,
  onOpenBuild,
  onOpenSell,
  onOpenMine,
  onPayJailBail,
  onUseJailCard
}) {
  const isInJail = myPlayer?.jail > 0;
  const hasJailCard = (myPlayer?.jailCards || 0) > 0;
  const canAffordBail = (myPlayer?.cash || 0) >= GAME_CONSTANTS.JAIL_BAIL_AMOUNT;
  const controlsLocked = isBotTurn || isTurnResolving || isActionModalActive || isMoving || isRolling;
  const player1 = myPlayer || players[0];
  const player2 = players.find((p) => p && p.seat !== (myPlayer?.seat ?? 0)) || players[1];

  // 40s Turn timer digital display countdown
  const [turnSeconds, setTurnSeconds] = useState(40);

  useEffect(() => {
    if (!isMyTurn) {
      setTurnSeconds(40);
      return;
    }
    if (isActionModalActive) return undefined;
    const interval = setInterval(() => {
      setTurnSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isMyTurn, gameState.turnPhase, isActionModalActive]);

  return (
    <div className="game-turn-dock w-full flex flex-col gap-2.5 max-w-[620px] mx-auto select-none">
      {/* ─── 1. Core 4 Horizontal Action Buttons (Trade, Build, Sell, Mine) ─── */}
      <div className="grid grid-cols-4 gap-2 w-full">
        {/* Trade (Teal Button) */}
        <button
          type="button"
          disabled={controlsLocked}
          className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl font-bold text-xs uppercase tracking-wider text-teal-950 bg-gradient-to-b from-teal-300 to-teal-400 border-b-2 border-teal-600 shadow-lg active:translate-y-0.5 active:shadow-sm hover:brightness-105 transition-all"
          onClick={() => {
            playSound("click");
            onOpenTrade?.();
          }}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Trade</span>
        </button>

        {/* Build (Gold/Yellow Button) */}
        <button
          type="button"
          disabled={controlsLocked}
          className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl font-bold text-xs uppercase tracking-wider text-amber-950 bg-gradient-to-b from-amber-300 to-amber-400 border-b-2 border-amber-600 shadow-lg active:translate-y-0.5 active:shadow-sm hover:brightness-105 transition-all"
          onClick={() => {
            playSound("click");
            onOpenBuild?.();
          }}
        >
          <Hammer className="w-3.5 h-3.5" />
          <span>Build</span>
        </button>

        {/* Sell (Pinkish-Red Button) */}
        <button
          type="button"
          disabled={controlsLocked}
          className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-b from-rose-400 to-rose-600 border-b-2 border-rose-800 shadow-lg active:translate-y-0.5 active:shadow-sm hover:brightness-105 transition-all"
          onClick={() => {
            playSound("click");
            onOpenSell?.();
          }}
        >
          <CircleDollarSign className="w-3.5 h-3.5" />
          <span>Sell</span>
        </button>

        {/* Mine (Blue Button) */}
        <button
          type="button"
          disabled={controlsLocked}
          className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-b from-sky-400 to-blue-600 border-b-2 border-blue-800 shadow-lg active:translate-y-0.5 active:shadow-sm hover:brightness-105 transition-all"
          onClick={() => {
            playSound("click");
            onOpenMine?.();
          }}
        >
          <Pickaxe className="w-3.5 h-3.5" />
          <span>Mine</span>
        </button>
      </div>

      {/* ─── 2. Center Roll / Turn Controls ─── */}
      <div className="flex items-center justify-between gap-2.5 bg-[#170c36]/90 border border-purple-500/25 rounded-2xl p-2.5 shadow-2xl backdrop-blur-md">
        {/* Player 1 Card (Left - Active Player) */}
        <div className={`flex items-center gap-2 p-2 rounded-xl border transition-all flex-1 min-w-0 ${
          isMyTurn
            ? "border-amber-400/80 bg-amber-400/10 shadow-[0_0_12px_rgba(251,191,36,0.18)]"
            : "border-white/10 bg-black/25"
        }`}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm text-white shadow-md shrink-0 border border-white/20"
            style={{ backgroundColor: player1?.color || "#5B8DEF" }}
          >
            {player1?.photo ? (
              <img src={player1.photo} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              (player1?.name?.[0] || "A").toUpperCase()
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-xs text-white truncate flex items-center gap-1">
              {player1?.name || "Player 1"}
              <span className="text-[9px] text-amber-300 font-normal">(you)</span>
            </span>
            <div className="flex items-center gap-1 text-[10px] text-purple-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="font-mono font-bold text-emerald-400">
                {formatRupee(player1?.cash ?? 2000)}
              </span>
            </div>
          </div>
        </div>

        {/* Center Roll / Turn Controls - Enforced Vertical Column with Dedicated Spacing */}
        <div className="flex flex-col items-center justify-center gap-3 shrink-0 px-1 py-1 z-10 w-[140px]">
          {/* Turn timer digital badge */}
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/60 border border-white/10 text-[10.5px] font-mono font-bold text-amber-300 shadow-sm">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>⏱ {turnSeconds}s</span>
          </div>

          {/* Dedicated 3D Dice Bounding Container (Fixed perspective viewport, no clipping) */}
          <div className="w-[110px] h-[52px] flex items-center justify-center relative">
            <Dice3D dice={dice} isRolling={isRolling} />
          </div>

          {/* Action Roll / End Turn Button Block */}
          <div className="w-full flex justify-center">
            {isInJail ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="gbtn sm green text-[10.5px] px-2 py-1"
                  disabled={!canAffordBail || controlsLocked}
                  onClick={onPayJailBail}
                >
                  Pay Bail
                </button>
                <button
                  type="button"
                  className="gbtn sm blue text-[10.5px] px-2 py-1"
                  disabled={controlsLocked}
                  onClick={onRollDice}
                >
                  Roll
                </button>
              </div>
            ) : isMyTurn ? (
              gameState.turnPhase === "roll" ? (
                <button
                  type="button"
                  disabled={controlsLocked}
                  className={`gbtn green sm w-[115px] py-2 font-black uppercase tracking-wider text-xs shadow-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all ${
                    isRolling ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                  onClick={onRollDice}
                >
                  {isRolling ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Rolling…
                    </>
                  ) : isTurnResolving && !isMoving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Landed…
                    </>
                  ) : isMoving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Moving…
                    </>
                  ) : (
                    <>
                      <Dices className="w-4 h-4" />
                      ROLL
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={controlsLocked}
                  className="gbtn gold sm w-[115px] py-2 font-black uppercase tracking-wider text-xs shadow-lg flex items-center justify-center gap-1.5 active:scale-95"
                  onClick={onEndTurn}
                >
                  <Check className="w-4 h-4" />
                  END TURN
                </button>
              )
            ) : (
              <div className="text-[10.5px] text-purple-300/80 font-medium px-2 py-1 text-center animate-pulse">
                {turnPlayer?.isBot
                  ? `${turnPlayer.name} (Bot) is ${botStatus === "rolling" ? "rolling" : botStatus === "building" ? "building" : "thinking"}...`
                  : turnPlayer?.name
                  ? `${turnPlayer.name}'s Turn`
                  : "Waiting…"}
              </div>
            )}
          </div>
        </div>

        {/* Player 2 Card (Right - Opponent) */}
        <div className={`flex items-center gap-2 p-2 rounded-xl border transition-all flex-1 min-w-0 justify-end ${
          turnPlayer?.seat === player2?.seat
            ? "border-amber-400/80 bg-amber-400/10 shadow-[0_0_12px_rgba(251,191,36,0.18)]"
            : "border-white/10 bg-black/25"
        }`}>
          <div className="flex flex-col min-w-0 text-right items-end">
            <span className="font-bold text-xs text-white truncate">
              {player2?.name || "Player 2"}
              {player2?.isBot && <span className="text-[9px] text-sky-300 ml-1">(Bot)</span>}
            </span>
            {player2?.isBot && turnPlayer?.seat === player2.seat && (
              <span className="text-[9px] text-amber-300 whitespace-nowrap" aria-live="polite">
                {botStatus === "rolling"
                  ? "is rolling..."
                  : botStatus === "building"
                  ? "is building..."
                  : "is thinking..."}
              </span>
            )}
            <div className="flex items-center gap-1 text-[10px] text-purple-300">
              <span className="font-mono font-bold text-emerald-400">
                {formatRupee(player2?.cash ?? 2000)}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm text-white shadow-md shrink-0 border border-white/20"
            style={{ backgroundColor: player2?.color || "#FF5568" }}
          >
            {player2?.photo ? (
              <img src={player2.photo} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              (player2?.name?.[0] || "T").toUpperCase()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
