import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import Dice3D from './Dice3D';
import { GAME_CONSTANTS, formatRupee } from '../data/constants';
import { playSound } from '../audio/soundEngine';

export default function MarketModal({ playerCash = 2000, onResolve, onClose }) {
  const [stake, setStake] = useState(100);
  const [isRolling, setIsRolling] = useState(false);
  const [rolledDice, setRolledDice] = useState([1, 1]);
  const [result, setResult] = useState(null); // { sum, won, payout, message }

  const maxStake = Math.min(playerCash, GAME_CONSTANTS.MARKET_MAX_STAKE);

  const handleRoll = () => {
    if (isRolling || result) return;
    playSound("dice");
    setIsRolling(true);

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const sum = d1 + d2;

    setTimeout(() => {
      setRolledDice([d1, d2]);
      setIsRolling(false);

      if (sum <= GAME_CONSTANTS.MARKET_LOSE_MAX) {
        playSound("lose");
        setResult({
          sum,
          won: false,
          payout: -stake,
          message: `Rolled ${sum}: You lost your stake of ${formatRupee(stake)}.`
        });
        onResolve(-stake);
      } else if (sum <= GAME_CONSTANTS.MARKET_FLAT_MAX) {
        playSound("chime");
        setResult({
          sum,
          won: null,
          payout: 0,
          message: `Rolled ${sum}: Flat market! Your stake is returned safely.`
        });
        onResolve(0);
      } else {
        playSound("win");
        setResult({
          sum,
          won: true,
          payout: stake,
          message: `Rolled ${sum}: Jackpot! You doubled your stake to ${formatRupee(stake * 2)}!`
        });
        onResolve(stake);
      }
    }, 1200);
  };

  return (
    <div className="pop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pop-card max-w-[340px] text-center flex flex-col gap-3">
        <div className="flex items-center justify-center gap-2 text-emerald-400 font-extrabold text-lg">
          <TrendingUp className="w-5 h-5" />
          <span>Market Speculation</span>
        </div>

        <p className="text-xs text-purple-200">
          Roll 2 dice to speculate on the market. High stakes, instant payoff!
        </p>

        {/* Odds Box */}
        <div className="grid grid-cols-3 gap-1.5 text-[11px] p-2 bg-black/30 rounded-xl border border-white/10">
          <div className="text-red-400">
            <b>2–5</b>
            <span className="block text-[10px] text-purple-300">Lose Stake</span>
          </div>
          <div className="text-amber-300">
            <b>6–8</b>
            <span className="block text-[10px] text-purple-300">No Change</span>
          </div>
          <div className="text-emerald-400">
            <b>9–12</b>
            <span className="block text-[10px] text-purple-300">Double!</span>
          </div>
        </div>

        {/* Stake Selector */}
        {!result && (
          <div className="flex flex-col gap-2 my-2">
            <div className="flex justify-between items-center text-xs">
              <span>Your Stake:</span>
              <b className="text-amber-300 font-mono text-sm">{formatRupee(stake)}</b>
            </div>
            <input
              type="range"
              min={GAME_CONSTANTS.MARKET_MIN_STAKE}
              max={maxStake}
              step={10}
              value={stake}
              disabled={isRolling}
              onChange={(e) => setStake(Number(e.target.value))}
              className="accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between gap-1">
              {[50, 100, 250, 500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  className="gbtn sm gold py-0.5 text-[11px] flex-1"
                  disabled={amt > maxStake || isRolling}
                  onClick={() => setStake(amt)}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dice Area */}
        <div className="my-2 py-2 flex justify-center">
          <Dice3D dice={rolledDice} isRolling={isRolling} spin={isRolling ? 3 : 0} />
        </div>

        {/* Result Message */}
        {result && (
          <div
            className={`p-2.5 rounded-xl text-xs font-bold ${
              result.won === true
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                : result.won === false
                ? "bg-red-500/20 text-red-300 border border-red-400/40"
                : "bg-amber-500/20 text-amber-300 border border-amber-400/40"
            }`}
          >
            {result.message}
          </div>
        )}

        {/* Action Button */}
        {!result ? (
          <button
            type="button"
            className="gbtn green big w-full"
            disabled={isRolling || stake > playerCash}
            onClick={handleRoll}
          >
            {isRolling ? "Rolling…" : `Roll Dice (${formatRupee(stake)})`}
          </button>
        ) : (
          <button
            type="button"
            className="gbtn green big w-full"
            onClick={() => {
              playSound("click");
              onClose();
            }}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}

