import React, { useEffect } from 'react';
import { Crown, Trophy, RotateCcw, Home } from 'lucide-react';
import { formatRupee } from '../data/constants';
import { playSound } from '../audio/soundEngine';

export default function GameOverModal({ players = [], onPlayAgain, onBackHome }) {
  useEffect(() => {
    playSound("win");
  }, []);

  // Sort players by net worth
  const ranked = [...players].sort((a, b) => (b.netWorth || b.cash) - (a.netWorth || a.cash));
  const winner = ranked[0];

  return (
    <div className="pop">
      <div className="pop-card max-w-[380px] p-5 text-center flex flex-col items-center gap-3 bg-[#24134e] border-2 border-amber-400 rounded-3xl shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 animate-bounce">
          <Trophy className="w-9 h-9" />
        </div>

        <span className="rib">Match Over</span>

        <h2 className="text-2xl font-black text-white uppercase tracking-wide">
          {winner?.name} Wins!
        </h2>
        <p className="text-xs text-purple-200">
          Total Net Worth: <b className="text-amber-300 font-mono">{formatRupee(winner?.netWorth || winner?.cash || 0)}</b>
        </p>

        {/* Leaderboard Table */}
        <div className="w-full flex flex-col gap-1.5 bg-black/30 p-2.5 rounded-2xl border border-white/10 text-xs my-2">
          {ranked.map((p, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-2 rounded-xl ${
                idx === 0 ? "bg-amber-400/20 border border-amber-400/40 font-bold" : "bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-300 w-4">{idx + 1}.</span>
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span className="text-white">{p.name}</span>
                {idx === 0 && <Crown className="w-3.5 h-3.5 text-amber-400 inline" />}
              </div>
              <span className="font-mono text-emerald-400">
                {formatRupee(p.netWorth || p.cash)}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 w-full mt-2">
          <button
            type="button"
            className="gbtn sm gold flex-1 py-2.5"
            onClick={onBackHome}
          >
            <Home className="w-4 h-4 inline mr-1" />
            Home
          </button>
          <button
            type="button"
            className="gbtn green sm flex-1 py-2.5 font-bold"
            onClick={onPlayAgain}
          >
            <RotateCcw className="w-4 h-4 inline mr-1" />
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}

