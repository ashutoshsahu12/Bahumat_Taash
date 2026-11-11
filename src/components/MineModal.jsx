import React, { useState } from 'react';
import { Pickaxe, Sparkles, X, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatRupee } from '../data/constants';
import { playSound } from '../audio/soundEngine';

export default function MineModal({
  isOpen,
  onClose,
  playerCash = 0,
  mineLevel = 0,
  onMineAction
}) {
  if (!isOpen) return null;

  const [mining, setMining] = useState(false);
  const [mineResult, setMineResult] = useState(null);

  const mineCost = 150;
  const upgradeCost = 400 * (mineLevel + 1);
  const canAffordMine = playerCash >= mineCost;

  const handleMine = () => {
    if (!canAffordMine || mining) return;
    setMining(true);
    setMineResult(null);
    playSound("dice");

    setTimeout(() => {
      // Mining outcome: 60% chance to yield ₹200 - ₹500, 20% jackpot (₹600 - ₹1000), 20% cave-in/hazard (₹50)
      const roll = Math.random();
      let yieldAmount = 0;
      let outcomeType = "normal";

      if (roll < 0.20) {
        yieldAmount = 50 + mineLevel * 25;
        outcomeType = "low";
        playSound("lose");
      } else if (roll < 0.80) {
        yieldAmount = Math.floor(Math.random() * 250 + 200) + mineLevel * 60;
        outcomeType = "good";
        playSound("income");
      } else {
        yieldAmount = Math.floor(Math.random() * 400 + 600) + mineLevel * 100;
        outcomeType = "jackpot";
        playSound("salary");
      }

      const netProfit = yieldAmount - mineCost;
      setMineResult({ yieldAmount, netProfit, outcomeType });
      onMineAction({ cost: mineCost, yieldAmount, netProfit });
      setMining(false);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#130b2c] border-2 border-sky-400/50 rounded-2xl w-full max-w-md p-4 shadow-2xl flex flex-col gap-3.5 text-white">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-300">
              <Pickaxe className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-extrabold uppercase tracking-wide text-sky-300">
                Resource Mine
              </h2>
              <p className="text-[11px] text-purple-300">
                Mine ores & gemstones for immediate cash yield
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-full hover:bg-white/10 text-purple-300 hover:text-white"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats card */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-purple-950/40 border border-white/10 rounded-xl p-2.5">
            <span className="text-[10px] uppercase font-bold text-purple-400 block">Your Cash</span>
            <span className="text-base font-bold font-mono text-emerald-400">{formatRupee(playerCash)}</span>
          </div>
          <div className="bg-purple-950/40 border border-white/10 rounded-xl p-2.5">
            <span className="text-[10px] uppercase font-bold text-purple-400 block">Mine Depth</span>
            <span className="text-base font-bold font-mono text-sky-400">Level {mineLevel + 1}</span>
          </div>
        </div>

        {/* Result banner */}
        {mineResult && (
          <div
            className={`p-3 rounded-xl border text-center animate-popin ${
              mineResult.outcomeType === "jackpot"
                ? "bg-amber-500/20 border-amber-400 text-amber-200"
                : mineResult.outcomeType === "good"
                ? "bg-emerald-500/20 border-emerald-400 text-emerald-200"
                : "bg-red-500/20 border-red-400 text-red-200"
            }`}
          >
            <span className="text-xs font-bold block">
              {mineResult.outcomeType === "jackpot"
                ? "💎 GEMSTONE MOTHERLODE STRIKE!"
                : mineResult.outcomeType === "good"
                ? "⛏️ ORE EXTRACTED!"
                : "⚠️ Low-yield shaft!"}
            </span>
            <span className="text-base font-mono font-extrabold block my-0.5">
              +{formatRupee(mineResult.yieldAmount)}
            </span>
            <span className="text-[10.5px] opacity-80">
              Net Profit: {mineResult.netProfit >= 0 ? `+${formatRupee(mineResult.netProfit)}` : formatRupee(mineResult.netProfit)}
            </span>
          </div>
        )}

        {/* Mine action button */}
        <button
          type="button"
          disabled={!canAffordMine || mining}
          className={`gbtn blue big w-full py-3 text-sm font-extrabold uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg ${
            mining ? "opacity-75 cursor-wait" : ""
          }`}
          onClick={handleMine}
        >
          <Pickaxe className={`w-4 h-4 ${mining ? "animate-bounce" : ""}`} />
          {mining ? "Digging Shovel…" : `Mine Shaft (-${formatRupee(mineCost)})`}
        </button>

        <p className="text-[10.5px] text-center text-purple-300/70">
          Costs {formatRupee(mineCost)} per dig. Expected return: {formatRupee(200)}–{formatRupee(1000)}.
        </p>
      </div>
    </div>
  );
}

