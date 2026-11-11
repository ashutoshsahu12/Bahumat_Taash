import React from 'react';
import { Hammer, X, Building2, Home, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatRupee, COLOR_SETS } from '../data/constants';
import { playSound } from '../audio/soundEngine';
import { getColorSetStatus } from '../data/checkColorSetOwnership';

export default function BuildModal({
  isOpen,
  onClose,
  boardSpaces = [],
  properties = {},
  mySeat = 0,
  playerCash = 0,
  onBuildHouse
}) {
  if (!isOpen) return null;

  // Find all properties owned by mySeat
  const ownedCityProps = Object.entries(properties)
    .filter(([spaceId, prop]) => prop.owner === mySeat && !prop.mortgaged)
    .map(([spaceId, prop]) => ({
      spaceId: Number(spaceId),
      space: boardSpaces[Number(spaceId)],
      prop
    }))
    .filter((item) => item.space && item.space.kind === "city");

  const buildCost = 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1b0d38] border-2 border-amber-400/50 rounded-2xl w-full max-w-lg p-4 shadow-2xl flex flex-col gap-3 text-white">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300">
              <Hammer className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-extrabold uppercase tracking-wide text-amber-300">
                Build Structures
              </h2>
              <p className="text-[11px] text-purple-300">
                Rule: Must own <b>ALL</b> properties of a color set to build • Cost: {formatRupee(buildCost)} • Cash: <b className="text-emerald-400">{formatRupee(playerCash)}</b>
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

        <div className="max-h-80 overflow-y-auto flex flex-col gap-2.5 pr-1 scrollbar-thin">
          {ownedCityProps.length === 0 ? (
            <div className="text-center py-8 text-purple-300/70 text-xs">
              You do not own any buildable city estates yet! Buy properties by landing on them first.
            </div>
          ) : (
            ownedCityProps.map(({ spaceId, space, prop }) => {
              const houses = prop.houses || 0;
              const isMax = houses >= 5;

              // Monopoly Rule Enforcer: Check color set ownership
              const setStatus = getColorSetStatus(mySeat, space.set, boardSpaces, properties);
              const hasMonopoly = setStatus.isComplete;
              const canAfford = playerCash >= buildCost && !isMax;
              const canBuild = hasMonopoly && canAfford;

              const colorInfo = space.set ? COLOR_SETS[space.set] : null;

              return (
                <div
                  key={spaceId}
                  className={`flex flex-col gap-2 p-3 rounded-xl border transition-all ${
                    hasMonopoly 
                      ? "bg-purple-950/50 border-amber-400/30 hover:border-amber-400/60" 
                      : "bg-black/30 border-white/5 opacity-85"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Color indicator pill */}
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20 shadow-sm"
                        style={{ backgroundColor: colorInfo?.color || "#5B8DEF" }}
                      />
                      <span className="font-bold text-sm text-white truncate">
                        {space.name}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/40 text-purple-200 shrink-0">
                        {space.set} ({setStatus.ownedCount}/{setStatus.totalCount})
                      </span>
                    </div>

                    {/* Build Button */}
                    <button
                      type="button"
                      disabled={!canBuild}
                      className={`gbtn sm font-bold text-xs px-3 py-1.5 rounded-xl shrink-0 transition-all ${
                        isMax
                          ? "bg-gray-600/40 text-gray-400 cursor-not-allowed"
                          : !hasMonopoly
                          ? "bg-purple-900/30 text-purple-400 border border-purple-800/40 cursor-not-allowed"
                          : canBuild
                          ? "gold shadow-md hover:scale-105 active:scale-95"
                          : "bg-purple-900/40 text-purple-400 cursor-not-allowed"
                      }`}
                      onClick={() => {
                        onBuildHouse(spaceId);
                      }}
                    >
                      {isMax ? "Maxed (Hotel)" : `+ ${houses === 4 ? "Hotel" : "House"} (₹100)`}
                    </button>
                  </div>

                  {/* Status & Validation Message */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
                    <div className="flex items-center gap-1">
                      {hasMonopoly ? (
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Full Set Owned (3× Rent Eligible)
                        </span>
                      ) : (
                        <span className="text-amber-400/90 font-normal flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-400" />
                          Need {setStatus.missingNames.join(", ")} to build
                        </span>
                      )}
                    </div>

                    <div className="text-purple-200 font-mono text-[10.5px]">
                      {houses === 0 && "0 Houses"}
                      {houses > 0 && houses < 5 && `${houses} Houses`}
                      {houses === 5 && <span className="text-amber-300 font-bold">1 Hotel</span>}
                    </div>
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
          Done
        </button>
      </div>
    </div>
  );
}
