import React from 'react';
import { Share, Copy, Crown, Users, Play, Bot, MapPin } from 'lucide-react';
import PieceToken from './PieceToken';
import { playSound } from '../audio/soundEngine';
import { showToast } from './Toaster';
import { formatLength, formatMisses } from '../data/constants';
import { STATE_REGIONS } from '../data/stateBoardData';

export default function Lobby({
  room,
  mySeat,
  isHost,
  selectedState = "maharashtra",
  onChangeState = null,
  onStartMatch,
  onAddBot,
  onKickPlayer
}) {
  const handleCopyCode = () => {
    playSound("click");
    navigator.clipboard.writeText(room.code);
    showToast(`Room code ${room.code} copied to clipboard!`, "good");
  };

  const handleShare = () => {
    playSound("click");
    if (navigator.share) {
      navigator.share({
        title: "Join Big Business Game",
        text: `Join my Big Business room with code ${room.code}!`,
        url: window.location.href
      }).catch(() => {});
    } else {
      handleCopyCode();
    }
  };

  const filledCount = room.players.filter(Boolean).length;
  const canStart = filledCount >= 2;
  const currentStateData = STATE_REGIONS[selectedState] || STATE_REGIONS.maharashtra;

  return (
    <div className="flex flex-col gap-4 w-full max-w-[420px] mx-auto text-[#f6f1ff]">
      {/* Room Ticket Banner */}
      <div className="ticket bg-[#23154d] border-2 border-amber-400/40 rounded-2xl p-4 flex flex-col items-center gap-2 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-400/10 to-transparent pointer-events-none" />
        <span className="text-xs uppercase tracking-wider text-purple-300 font-bold">
          Room Code
        </span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-3xl font-extrabold tracking-widest text-amber-300 bg-[#160c33] px-4 py-1.5 rounded-xl border border-amber-400/30 shadow-inner">
            {room.code}
          </span>
          <button
            type="button"
            className="ib bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 p-2.5 rounded-xl transition-all"
            aria-label="Copy code"
            onClick={handleCopyCode}
          >
            <Copy className="lu w-5 h-5" />
          </button>
          <button
            type="button"
            className="ib bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/40 p-2.5 rounded-xl transition-all"
            aria-label="Share invite"
            onClick={handleShare}
          >
            <Share className="lu w-5 h-5" />
          </button>
        </div>
        <p className="small text-xs text-purple-300 text-center mt-1">
          Share this 6-character code with your friends to play together!
        </p>
      </div>

      {/* Selected Region / State Box */}
      <div className="bg-[#24134e] border border-amber-400/30 rounded-xl p-2.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-black text-xs">
            {currentStateData.badge}
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-purple-300">Region Board</span>
            <span className="text-xs font-bold text-white">{currentStateData.name}</span>
          </div>
        </div>

        {isHost && onChangeState ? (
          <select
            className="bg-[#1b0d3d] text-amber-300 border border-amber-400/40 text-xs py-1 px-2 rounded-lg font-semibold focus:outline-none cursor-pointer"
            value={selectedState}
            onChange={(e) => {
              playSound("click");
              onChangeState(e.target.value);
            }}
          >
            {Object.values(STATE_REGIONS).map((reg) => (
              <option key={reg.id} value={reg.id} className="bg-[#1b0d3d] text-white">
                {reg.badge} - {reg.name.split(" ")[0]}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/30">
            Selected
          </span>
        )}
      </div>

      {/* Match Configuration Specs */}
      <div className="facts bg-[#23154d]/70 rounded-xl p-3 border border-white/10 flex justify-around text-center text-xs">
        <div>
          <span className="text-purple-300 block">Seats</span>
          <b className="text-sm text-white">{room.players.length} seats</b>
        </div>
        <div className="w-px bg-white/10" />
        <div>
          <span className="text-purple-300 block">Match Length</span>
          <b className="text-sm text-white">{formatLength(room.minutes)}</b>
        </div>
        <div className="w-px bg-white/10" />
        <div>
          <span className="text-purple-300 block">Miss Limit</span>
          <b className="text-sm text-white">{formatMisses(room.missLimit)}</b>
        </div>
      </div>

      {/* Player Slots */}
      <div className="slots flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs uppercase font-bold text-purple-300 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-400" />
            Players ({filledCount}/{room.players.length})
          </span>
          {isHost && filledCount < room.players.length && (
            <button
              type="button"
              className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1 font-semibold"
              onClick={() => {
                playSound("click");
                onAddBot();
              }}
            >
              <Bot className="w-3.5 h-3.5" />
              + Add Bot
            </button>
          )}
        </div>

        {room.players.map((player, idx) => {
          if (!player) {
            return (
              <div
                key={idx}
                className="slot empty flex items-center justify-between p-3 rounded-xl border border-dashed border-white/20 bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/40 text-xs font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-white/40 italic">Waiting for player...</span>
                </div>
                {isHost && (
                  <button
                    type="button"
                    className="gbtn sm gold"
                    onClick={() => {
                      playSound("click");
                      onAddBot();
                    }}
                  >
                    Add AI
                  </button>
                )}
              </div>
            );
          }

          const isMe = idx === mySeat;
          const isPlayerHost = idx === 0;

          return (
            <div
              key={idx}
              className={`slot flex items-center justify-between p-2.5 px-3 rounded-xl border ${
                isMe ? "border-amber-400/60 bg-[#2e1c66]" : "border-white/10 bg-[#1e1142]"
              } shadow-md`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`av sm ${player.photo ? "ph" : ""}`}
                  style={{ "--c": player.color, "--ci": "#ffffff" }}
                >
                  {player.photo ? (
                    <img src={player.photo} alt="" draggable={false} />
                  ) : (
                    (player.name[0] || "?").toUpperCase()
                  )}
                </span>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white">{player.name}</span>
                    {isMe && (
                      <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-400/40">
                        YOU
                      </span>
                    )}
                    {isPlayerHost && (
                      <Crown className="w-3.5 h-3.5 text-amber-400 inline" title="Host" />
                    )}
                    {player.isBot && (
                      <span className="text-[10px] bg-purple-400/20 text-purple-300 font-bold px-1.5 py-0.2 rounded border border-purple-400/40">
                        BOT
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-purple-300">
                    Piece: {player.token}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-6 h-8">
                  <PieceToken color={player.color} kind={player.token} />
                </div>
                {isHost && !isMe && (
                  <button
                    type="button"
                    className="text-xs text-red-400 hover:text-red-300 px-1 py-0.5"
                    onClick={() => onKickPlayer(idx)}
                    title="Remove player"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Host Controls or Waiting Notice */}
      <div className="mt-2">
        {isHost ? (
          <button
            type="button"
            className="gbtn green big w-full shadow-lg"
            disabled={!canStart}
            onClick={() => {
              playSound("start");
              onStartMatch();
            }}
          >
            <Play className="w-5 h-5 inline mr-1" />
            {canStart ? "Start Match" : "Need at least 2 players"}
          </button>
        ) : (
          <div className="waiting flex items-center justify-center gap-3 p-3 rounded-xl bg-black/20 border border-white/10 text-purple-200">
            <span className="spin sm" />
            <span className="text-sm font-semibold">Waiting for host to start match...</span>
          </div>
        )}
      </div>
    </div>
  );
}
