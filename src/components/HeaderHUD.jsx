import React from 'react';
import SettingsModal from './SettingsModal';
import { ArrowLeft, Wifi, PauseCircle, Clock } from 'lucide-react';
import { playSound } from '../audio/soundEngine';

export default function HeaderHUD({ 
  inGame = false, 
  roomCode = null, 
  round = 1, 
  timeLeft = null, 
  onLeave = null 
}) {
  return (
    <header className="w-full flex items-center justify-between gap-2 px-1 py-1.5 select-none text-xs">
      {/* Left pill cluster: ROUND, Turn timer, Status */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {inGame && onLeave && (
          <button
            type="button"
            className="ib flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all shadow-md shrink-0"
            aria-label="Leave room"
            onClick={() => {
              playSound("click");
              onLeave();
            }}
          >
            <ArrowLeft className="w-4 h-4 text-purple-200" />
          </button>
        )}

        {inGame && (
          <div className="flex items-center gap-1.5 bg-[#1e103f]/85 border border-purple-500/25 px-2.5 py-1.5 rounded-full shadow-lg backdrop-blur-md shrink-0">
            <span className="font-extrabold uppercase text-[11px] tracking-wider text-amber-300">
              ROUND {round}
            </span>
            <span className="w-1 h-1 rounded-full bg-purple-400/40" />
            <span className="font-mono font-bold text-[11px] text-emerald-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-400/80" />
              {timeLeft || "44:54"}
            </span>
          </div>
        )}

        {inGame && (
          <div className="hidden sm:flex items-center gap-1 bg-[#180b33]/70 border border-white/10 px-2 py-1 rounded-full text-purple-300/80 font-medium text-[10.5px] shrink-0">
            <PauseCircle className="w-3 h-3 text-amber-400/80" />
            <span>Paused - 4:54</span>
          </div>
        )}

        {inGame && roomCode && (
          <span className="hidden md:inline-block font-mono font-bold text-[10px] uppercase px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/40 shrink-0">
            #{roomCode}
          </span>
        )}
      </div>

      <div className="flex-1" />

      {/* Right pill cluster: Latency badge + Settings Gear */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 bg-[#1a0c3b]/85 border border-white/10 px-2.5 py-1 rounded-full text-[11px] font-mono text-emerald-400 shadow-md">
          <Wifi className="w-3 h-3 text-emerald-400" />
          <span>185ms</span>
        </div>

        <SettingsModal />
      </div>
    </header>
  );
}


