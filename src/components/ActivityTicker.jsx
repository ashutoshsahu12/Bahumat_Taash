import React, { useRef, useEffect } from 'react';
import { ScrollText } from 'lucide-react';

export default function ActivityTicker({ logs = [] }) {
  const scrollRef = useRef(null);

  // Automatically scroll to the newest log entry whenever an entry is added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [logs.length]);

  return (
    <div className="activity-feed-panel flex min-w-0 flex-1 flex-col bg-[#140a2c]/90 border border-white/10 rounded-2xl p-2.5 shadow-xl">
      <div className="flex items-center justify-between px-1 pb-1.5 border-b border-white/5 mb-1.5">
        <span className="text-[11px] font-bold tracking-wider uppercase text-purple-300/80 flex items-center gap-1.5">
          <ScrollText className="w-3.5 h-3.5 text-amber-400" />
          Live Activity Feed
        </span>
        <span className="text-[10px] text-purple-400 font-mono bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-800/40">
          {logs.length} events
        </span>
      </div>

      <div
        ref={scrollRef}
        className="max-h-[64px] overflow-y-auto flex flex-col gap-1.5 text-[11.5px] font-sans pr-1 scrollbar-thin scrollbar-thumb-purple-900/40"
      >
        {logs.length === 0 ? (
          <span className="text-purple-300/50 italic text-center py-2">
            Match started. Roll the dice to begin!
          </span>
        ) : (
          logs.map((entry, index) => (
            <div
              key={index}
              className="leading-snug flex items-start gap-2 py-0.5 px-1.5 rounded-lg transition-colors hover:bg-white/[0.03]"
            >
              {/* Optional Timestamp */}
              {entry.time && (
                <span className="text-[10px] font-mono text-purple-400/60 shrink-0 select-none pt-[1px]">
                  {entry.time}
                </span>
              )}

              {/* Player color avatar dot or bullet */}
              <span
                className="w-2 h-2 rounded-full mt-1 shrink-0"
                style={{
                  backgroundColor: entry.playerColor || (entry.isGood ? "#34d27b" : entry.isBad ? "#ff5568" : "#ffc83d"),
                  boxShadow: entry.playerColor ? `0 0 6px ${entry.playerColor}99` : 'none'
                }}
              />

              {/* Message text */}
              <span
                className={`break-words flex-1 ${
                  entry.isHighlight
                    ? "text-amber-300 font-semibold"
                    : entry.isBad
                    ? "text-red-300"
                    : entry.isGood
                    ? "text-emerald-300 font-medium"
                    : "text-purple-100"
                }`}
              >
                {entry.text}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
