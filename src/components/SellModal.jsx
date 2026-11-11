import React from 'react';
import { CircleDollarSign, X, AlertCircle } from 'lucide-react';
import { formatRupee } from '../data/constants';
import { playSound } from '../audio/soundEngine';

export default function SellModal({
  isOpen,
  onClose,
  boardSpaces = [],
  properties = {},
  mySeat = 0,
  onMortgage,
  onUnmortgage,
  onSellProperty
}) {
  if (!isOpen) return null;

  // Find all properties owned by mySeat
  const myProperties = Object.entries(properties)
    .filter(([spaceId, prop]) => prop.owner === mySeat)
    .map(([spaceId, prop]) => ({
      spaceId: Number(spaceId),
      space: boardSpaces[Number(spaceId)],
      prop
    }))
    .filter((item) => item.space);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1b0d38] border-2 border-pink-500/50 rounded-2xl w-full max-w-md p-4 shadow-2xl flex flex-col gap-3 text-white">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400">
              <CircleDollarSign className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-extrabold uppercase tracking-wide text-pink-300">
                Sell / Mortgage Assets
              </h2>
              <p className="text-[11px] text-purple-300">
                Sell back to Bank (70% value) or Mortgage for instant cash
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

        <div className="max-h-72 overflow-y-auto flex flex-col gap-2 pr-1 scrollbar-thin">
          {myProperties.length === 0 ? (
            <div className="text-center py-6 text-purple-300/70 text-xs">
              You do not have any properties in your portfolio to sell or mortgage.
            </div>
          ) : (
            myProperties.map(({ spaceId, space, prop }) => {
              const sellValue = Math.round((space.price || 100) * 0.7);
              const mortgageValue = Math.round((space.price || 100) * 0.5);

              return (
                <div
                  key={spaceId}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-purple-950/40 border border-white/10 hover:border-pink-400/40 transition-all gap-2"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm text-white truncate flex items-center gap-1.5">
                      {space.name}
                      {prop.mortgaged && (
                        <span className="text-[9px] bg-red-950/80 text-red-300 px-1.5 py-0.5 rounded border border-red-500/30">
                          MORTGAGED
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-purple-200">
                      Original: {formatRupee(space.price)} • Sell: <b className="text-emerald-400">{formatRupee(sellValue)}</b>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {prop.mortgaged ? (
                      <button
                        type="button"
                        className="gbtn sm gold text-[10.5px] px-2 py-1"
                        onClick={() => {
                          onUnmortgage(spaceId);
                        }}
                      >
                        Unmortgage
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="gbtn sm orange text-[10.5px] px-2 py-1"
                        onClick={() => {
                          onMortgage(spaceId);
                        }}
                      >
                        Mortgage (+{formatRupee(mortgageValue)})
                      </button>
                    )}

                    <button
                      type="button"
                      className="gbtn sm red text-[10.5px] px-2.5 py-1"
                      onClick={() => {
                        onSellProperty(spaceId);
                        playSound("paidOff");
                      }}
                    >
                      Sell (+{formatRupee(sellValue)})
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button
          type="button"
          className="gbtn sm blue w-full py-2 font-bold uppercase tracking-wider text-xs"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

