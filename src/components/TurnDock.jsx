import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft,
  Hammer,
  CircleDollarSign,
  Pickaxe,
  Dices,
  Check,
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
  onPayJailBail
}) {
  const isInJail = myPlayer?.jail > 0;
  const canAffordBail = (myPlayer?.cash || 0) >= GAME_CONSTANTS.JAIL_BAIL_AMOUNT;
  const controlsLocked = isBotTurn || isTurnResolving || isActionModalActive || isMoving || isRolling;
  const activePlayers = players.filter(Boolean).sort((a, b) => a.seat - b.seat);
  const leftPlayers = activePlayers.filter((player) => player.seat % 2 === 0);
  const rightPlayers = activePlayers.filter((player) => player.seat % 2 === 1);

  const [turnSeconds, setTurnSeconds] = useState(40);

  useEffect(() => {
    if (!isMyTurn) {
      setTurnSeconds(40);
      return;
    }
    if (isActionModalActive) return undefined;
    const interval = setInterval(() => {
      setTurnSeconds((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isMyTurn, gameState.turnPhase, isActionModalActive]);

  const renderPlayerCard = (player) => {
    const isActive = turnPlayer?.seat === player.seat;
    const isLocal = myPlayer?.seat === player.seat;

    return (
      <div
        key={player.id || player.seat}
        className={`game-player-card${isActive ? ' active' : ''}`}
      >
        <div
          className="game-player-avatar"
          style={{ backgroundColor: player.color || '#5B8DEF' }}
        >
          {player.photo ? (
            <img src={player.photo} alt="" />
          ) : (
            (player.name?.[0] || '?').toUpperCase()
          )}
        </div>
        <div className="game-player-copy">
          <div className="game-player-name">
            {player.name || `Player ${player.seat + 1}`}
            {isLocal ? ' (you)' : player.isBot ? ' (Bot)' : ''}
          </div>
          <div className="game-player-cash">{formatRupee(player.cash ?? 0)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="game-turn-dock w-full mx-auto select-none">
      <div className="game-action-buttons">
        <button
          type="button"
          disabled={controlsLocked}
          className="gbtn-action trade"
          onClick={() => {
            playSound('click');
            onOpenTrade?.();
          }}
        >
          <ArrowRightLeft aria-hidden="true" />
          <span>Trade</span>
        </button>
        <button
          type="button"
          disabled={controlsLocked}
          className="gbtn-action build"
          onClick={() => {
            playSound('click');
            onOpenBuild?.();
          }}
        >
          <Hammer aria-hidden="true" />
          <span>Build</span>
        </button>
        <button
          type="button"
          disabled={controlsLocked}
          className="gbtn-action sell"
          onClick={() => {
            playSound('click');
            onOpenSell?.();
          }}
        >
          <CircleDollarSign aria-hidden="true" />
          <span>Sell</span>
        </button>
        <button
          type="button"
          disabled={controlsLocked}
          className="gbtn-action mine"
          onClick={() => {
            playSound('click');
            onOpenMine?.();
          }}
        >
          <Pickaxe aria-hidden="true" />
          <span>Mine</span>
        </button>
      </div>

      <section className="game-control-panel" aria-label="Player and turn controls">
        <div className="game-player-stack">
          {leftPlayers.map(renderPlayerCard)}
        </div>

        <div className="game-roll-center">
          <div className="game-turn-timer" aria-label={`${turnSeconds} seconds remaining`}>
            <span>⏱ {turnSeconds}s</span>
          </div>

          <div className="game-dice-slot">
            <Dice3D dice={dice} isRolling={isRolling} />
          </div>

          {isMyTurn && gameState.extraRolls > 0 && !isInJail && (
            <div className="doubles-roll-badge" role="status">
              Doubles! Roll Again
            </div>
          )}

          <div className="game-roll-actions">
            {isInJail ? (
              <>
                <button
                  type="button"
                  className="gbtn sm green"
                  disabled={!canAffordBail || controlsLocked}
                  onClick={onPayJailBail}
                >
                  Pay Bail
                </button>
                {isMyTurn && gameState.turnPhase === 'action' ? (
                  <button
                    type="button"
                    className="gbtn sm gold"
                    disabled={controlsLocked}
                    onClick={onEndTurn}
                  >
                    End Turn
                  </button>
                ) : (
                  <button
                    type="button"
                    className="gbtn sm blue"
                    disabled={!isMyTurn || controlsLocked}
                    onClick={onRollDice}
                  >
                    Roll
                  </button>
                )}
              </>
            ) : isMyTurn ? (
              gameState.turnPhase === 'roll' ? (
                <button
                  type="button"
                  disabled={controlsLocked}
                  className="gbtn green game-roll-button"
                  onClick={onRollDice}
                >
                  {isRolling ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Rolling…
                    </>
                  ) : isTurnResolving && !isMoving ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Landed…
                    </>
                  ) : isMoving ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Moving…
                    </>
                  ) : (
                    <>
                      <Dices />
                      Roll
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={controlsLocked}
                  className="gbtn gold game-roll-button"
                  onClick={gameState.extraRolls > 0 ? onRollDice : onEndTurn}
                >
                  {gameState.extraRolls > 0 ? (
                    <>
                      <Dices />
                      Roll Again
                    </>
                  ) : (
                    <>
                      <Check />
                      End Turn
                    </>
                  )}
                </button>
              )
            ) : (
              <div className="game-waiting-status" aria-live="polite">
                {turnPlayer?.isBot
                  ? `${turnPlayer.name} (Bot) is ${botStatus === 'rolling' ? 'rolling' : botStatus === 'building' ? 'building' : 'thinking'}…`
                  : turnPlayer?.name
                    ? `${turnPlayer.name}'s turn`
                    : 'Waiting…'}
              </div>
            )}
          </div>
        </div>

        <div className="game-player-stack">
          {rightPlayers.map(renderPlayerCard)}
        </div>
      </section>
    </div>
  );
}
