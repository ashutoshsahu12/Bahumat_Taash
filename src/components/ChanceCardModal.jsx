import React from 'react';
import { CircleHelp } from 'lucide-react';
import { playSound } from '../audio/soundEngine';

export default function ChanceCardModal({ card, onAccept }) {
  if (!card) return null;

  return (
    <div className="pop">
      <div className="pop-card max-w-[340px] text-center flex flex-col items-center gap-3 p-5 bg-[#25154d] border-2 border-amber-400/50 shadow-2xl rounded-2xl">
        <div className="w-12 h-12 rounded-full bg-amber-400/20 border border-amber-400 flex items-center justify-center text-amber-300">
          <CircleHelp className="w-7 h-7" />
        </div>

        <span className="rib">Chance</span>

        <h3 className="text-lg font-bold text-white drop-shadow">
          {card.title}
        </h3>

        <p className="text-xs text-purple-200 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">
          {card.desc}
        </p>

        <button
          type="button"
          className="gbtn green big w-full mt-2"
          onClick={() => {
            playSound("click");
            onAccept();
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}

