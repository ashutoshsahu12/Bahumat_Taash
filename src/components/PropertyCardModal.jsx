import React from 'react';
import { COLOR_SETS, formatRupee } from '../data/constants';
import { playSound } from '../audio/soundEngine';
import { HouseIcon, HotelIcon } from './Icons';
import { hasFullColorSet } from '../data/checkColorSetOwnership';

export default function PropertyCardModal({
  space,
  propertyState = null,
  ownerPlayer = null,
  mySeat = 0,
  boardSpaces = [],
  properties = {},
  isMyTurn = false,
  canBuyNow = false,
  onBuy = null,
  onBuildHouse = null,
  onMortgage = null,
  onUnmortgage = null,
  onClose
}) {
  const { name, kind, price, set, rent } = space;
  const colorSet = set ? COLOR_SETS[set] : null;
  const isOwned = Boolean(propertyState?.owner !== undefined);
  const isMine = isOwned && propertyState?.owner === mySeat;
  const houses = propertyState?.houses || 0;
  const isMortgaged = propertyState?.mortgaged || false;
  const houseCost = colorSet?.house || 100;
  const mortgageValue = Math.round((price || 0) * 0.5);
  const unmortgageCost = Math.round(mortgageValue * 1.1);

  // Check if player owns full color set for building
  const fullSetOwned = hasFullColorSet(mySeat, set, boardSpaces, properties);

  return (
    <div className="pop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pop-card max-w-[340px] p-0 overflow-hidden rounded-2xl border-2 border-white/20 shadow-2xl bg-[#1e143f]">
        {/* Deed Title Header */}
        <div
          className="p-3 text-center border-b-2 border-black/30 flex flex-col items-center justify-center relative"
          style={{
            backgroundColor: colorSet?.color || "#3d297a",
            color: colorSet?.text || "#ffffff"
          }}
        >
          <span className="text-[10px] uppercase tracking-widest font-extrabold opacity-80">
            {kind === "rail" ? "Railway Toll Station" : kind === "utility" ? "Utility Service" : "Title Deed"}
          </span>
          <h3 className="text-xl font-black tracking-wide uppercase drop-shadow">
            {name}
          </h3>
          <span className="text-xs font-bold mt-0.5 opacity-90">
            Price: {formatRupee(price)}
          </span>
        </div>

        {/* Content Body */}
        <div className="p-4 flex flex-col gap-3 text-xs text-purple-100">
          {kind === "city" && rent && (
            <div className="flex flex-col gap-1.5 bg-black/20 p-2.5 rounded-xl border border-white/5">
              <div className="flex justify-between items-center py-0.5 border-b border-white/10 font-bold">
                <span>Base Rent</span>
                <span className="text-emerald-400 font-bold">{formatRupee(rent[0])}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-white/10">
                <span className="flex items-center gap-1">
                  <HouseIcon /> With 1 House
                </span>
                <span>{formatRupee(rent[1])}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-white/10">
                <span className="flex items-center gap-1">
                  <HouseIcon /><HouseIcon /> With 2 Houses
                </span>
                <span>{formatRupee(rent[2])}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-white/10">
                <span className="flex items-center gap-1">
                  <HouseIcon /><HouseIcon /><HouseIcon /> With 3 Houses
                </span>
                <span>{formatRupee(rent[3])}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-white/10">
                <span className="flex items-center gap-1">
                  <HouseIcon /><HouseIcon /><HouseIcon /><HouseIcon /> With 4 Houses
                </span>
                <span>{formatRupee(rent[4])}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 font-bold text-amber-300">
                <span className="flex items-center gap-1">
                  <HotelIcon /> With Hotel
                </span>
                <span>{formatRupee(rent[5])}</span>
              </div>
            </div>
          )}

          {kind === "rail" && (
            <div className="bg-black/20 p-2.5 rounded-xl border border-white/5 flex flex-col gap-1 text-xs">
              <p className="font-semibold text-purple-200">Railway Toll Schedule:</p>
              <div className="flex justify-between"><span>1 Railway owned:</span> <b>5% of visitor cash (min ₹50)</b></div>
              <div className="flex justify-between"><span>2 Railways owned:</span> <b>10% of visitor cash (min ₹50)</b></div>
              <div className="flex justify-between"><span>3 Railways owned:</span> <b>15% of visitor cash (min ₹50)</b></div>
              <div className="flex justify-between"><span>4 Railways owned:</span> <b>20% of visitor cash (min ₹50)</b></div>
            </div>
          )}

          {kind === "utility" && (
            <div className="bg-black/20 p-2.5 rounded-xl border border-white/5 flex flex-col gap-1 text-xs">
              <p className="font-semibold text-purple-200">Utility Charges:</p>
              <div>If 1 utility owned: <b>4× dice roll</b></div>
              <div>If both utilities owned: <b>10× dice roll</b></div>
            </div>
          )}

          {/* House Cost & Mortgage Specs */}
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-black/10 p-2 rounded-lg border border-white/5">
            <div>
              <span className="text-purple-300 block">House Cost:</span>
              <b>{formatRupee(houseCost)} each</b>
            </div>
            <div>
              <span className="text-purple-300 block">Mortgage Value:</span>
              <b>{formatRupee(mortgageValue)}</b>
            </div>
          </div>

          {/* Owner Status */}
          <div className="text-center py-1 rounded bg-black/30 font-semibold text-xs">
            {isOwned ? (
              <span>
                Owner:{" "}
                <b style={{ color: ownerPlayer?.color || "#FFC83D" }}>
                  {isMine ? "You" : ownerPlayer?.name || `Player ${propertyState.owner + 1}`}
                </b>{" "}
                {isMortgaged && <span className="text-red-400 font-bold">(Mortgaged)</span>}
              </span>
            ) : (
              <span className="text-emerald-400 font-bold">Unowned Property</span>
            )}
          </div>

          {/* Contextual Action Buttons */}
          <div className="flex flex-col gap-2 mt-1">
            {canBuyNow && onBuy && (
              <button
                type="button"
                className="gbtn green big w-full shadow"
                onClick={() => {
                  playSound("buy");
                  onBuy();
                  onClose();
                }}
              >
                Buy for {formatRupee(price)}
              </button>
            )}

            {isMine && !isMortgaged && kind === "city" && houses < 5 && onBuildHouse && (
              <div className="flex flex-col gap-1 w-full">
                <button
                  type="button"
                  disabled={!fullSetOwned}
                  className={`gbtn sm w-full ${
                    fullSetOwned 
                      ? "gold" 
                      : "bg-purple-900/40 text-purple-400 border border-purple-800/40 cursor-not-allowed"
                  }`}
                  onClick={() => {
                    playSound("build");
                    onBuildHouse(space.id);
                  }}
                >
                  Build {houses === 4 ? "Hotel" : "House"} ({formatRupee(houseCost)})
                </button>
                {!fullSetOwned && (
                  <span className="text-[10px] text-amber-400 text-center">
                    Must own all {set} properties to build
                  </span>
                )}
              </div>
            )}

            {isMine && !isMortgaged && onMortgage && (
              <button
                type="button"
                className="gbtn orange sm w-full"
                onClick={() => {
                  playSound("loan");
                  onMortgage(space.id);
                }}
              >
                Mortgage (+{formatRupee(mortgageValue)})
              </button>
            )}

            {isMine && isMortgaged && onUnmortgage && (
              <button
                type="button"
                className="gbtn green sm w-full"
                onClick={() => {
                  playSound("paidOff");
                  onUnmortgage(space.id);
                }}
              >
                Unmortgage (-{formatRupee(unmortgageCost)})
              </button>
            )}

            <button
              type="button"
              className="gbtn sm w-full mt-1"
              onClick={() => {
                playSound("click");
                onClose();
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

