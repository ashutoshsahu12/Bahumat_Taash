import React, { useState } from 'react';
import { ArrowRightLeft, X } from 'lucide-react';
import { COLOR_SETS, formatRupee } from '../data/constants';
import { playSound } from '../audio/soundEngine';

export default function TradeModal({
  boardSpaces = [],
  players = [],
  mySeat = 0,
  properties = {},
  onProposeTrade,
  onClose
}) {
  const otherPlayers = players.filter((_, i) => i !== mySeat);
  const [partnerSeat, setPartnerSeat] = useState(
    otherPlayers.length > 0 ? players.indexOf(otherPlayers[0]) : 0
  );
  const [myOfferProps, setMyOfferProps] = useState([]);
  const [myOfferCash, setMyOfferCash] = useState(0);
  const [theirOfferProps, setTheirOfferProps] = useState([]);
  const [theirOfferCash, setTheirOfferCash] = useState(0);

  const me = players[mySeat];
  const partner = players[partnerSeat];

  // Properties owned by me
  const myProperties = Object.entries(properties)
    .filter(([_, p]) => p.owner === mySeat && !p.mortgaged)
    .map(([id]) => boardSpaces[Number(id)])
    .filter(Boolean);

  // Properties owned by partner
  const theirProperties = Object.entries(properties)
    .filter(([_, p]) => p.owner === partnerSeat && !p.mortgaged)
    .map(([id]) => boardSpaces[Number(id)])
    .filter(Boolean);

  const toggleMyProp = (id) => {
    playSound("click");
    setMyOfferProps((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleTheirProp = (id) => {
    playSound("click");
    setTheirOfferProps((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handlePropose = () => {
    playSound("income");
    onProposeTrade({
      from: mySeat,
      to: partnerSeat,
      giveProps: myOfferProps,
      giveCash: myOfferCash,
      getProps: theirOfferProps,
      getCash: theirOfferCash
    });
    onClose();
  };

  return (
    <div className="pop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pop-card max-w-[440px] p-4 bg-[#1e133d] border-2 border-amber-400/50 rounded-2xl flex flex-col gap-3 shadow-2xl">
        <div className="flex justify-between items-center border-b border-white/10 pb-2">
          <div className="flex items-center gap-2 font-bold text-white text-base">
            <ArrowRightLeft className="w-5 h-5 text-amber-400" />
            Trade Properties & Cash
          </div>
          <button type="button" className="ib" onClick={onClose}>
            <X className="lu w-4 h-4" />
          </button>
        </div>

        {/* Partner Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-purple-300 font-semibold">Trade with:</span>
          <div className="flex gap-1.5 flex-1 overflow-x-auto">
            {otherPlayers.map((p) => {
              const seat = players.indexOf(p);
              const isSelected = partnerSeat === seat;
              return (
                <button
                  key={seat}
                  type="button"
                  className={`gbtn sm ${isSelected ? "gold" : "off"}`}
                  onClick={() => {
                    playSound("click");
                    setPartnerSeat(seat);
                    setTheirOfferProps([]);
                    setTheirOfferCash(0);
                  }}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Deal Columns */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* You Give */}
          <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-black/20 border border-white/10">
            <b className="text-amber-300">You Offer</b>
            <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto pr-1">
              {myProperties.length === 0 ? (
                <span className="text-[11px] text-purple-300/60 italic">No properties to trade</span>
              ) : (
                myProperties.map((sp) => {
                  const checked = myOfferProps.includes(sp.id);
                  const color = sp.set ? COLOR_SETS[sp.set]?.color : "#3d297a";
                  return (
                    <label
                      key={sp.id}
                      className={`flex items-center gap-1.5 p-1 rounded cursor-pointer ${
                        checked ? "bg-amber-400/20 text-white font-bold" : "text-purple-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMyProp(sp.id)}
                      />
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="truncate">{sp.name}</span>
                    </label>
                  );
                })
              )}
            </div>
            <div className="mt-1">
              <span className="text-[11px] text-purple-300 block">Cash: {formatRupee(myOfferCash)}</span>
              <input
                type="range"
                min={0}
                max={me?.cash || 0}
                step={25}
                value={myOfferCash}
                onChange={(e) => setMyOfferCash(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
          </div>

          {/* You Get */}
          <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-black/20 border border-white/10">
            <b className="text-emerald-400">You Ask For</b>
            <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto pr-1">
              {theirProperties.length === 0 ? (
                <span className="text-[11px] text-purple-300/60 italic">No properties owned</span>
              ) : (
                theirProperties.map((sp) => {
                  const checked = theirOfferProps.includes(sp.id);
                  const color = sp.set ? COLOR_SETS[sp.set]?.color : "#3d297a";
                  return (
                    <label
                      key={sp.id}
                      className={`flex items-center gap-1.5 p-1 rounded cursor-pointer ${
                        checked ? "bg-emerald-400/20 text-white font-bold" : "text-purple-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTheirProp(sp.id)}
                      />
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="truncate">{sp.name}</span>
                    </label>
                  );
                })
              )}
            </div>
            <div className="mt-1">
              <span className="text-[11px] text-purple-300 block">Cash: {formatRupee(theirOfferCash)}</span>
              <input
                type="range"
                min={0}
                max={partner?.cash || 0}
                step={25}
                value={theirOfferCash}
                onChange={(e) => setTheirOfferCash(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Propose Action */}
        <div className="flex gap-2 mt-2">
          <button type="button" className="gbtn red sm flex-1" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="gbtn green sm flex-1 font-bold"
            disabled={myOfferProps.length === 0 && myOfferCash === 0 && theirOfferProps.length === 0 && theirOfferCash === 0}
            onClick={handlePropose}
          >
            Propose Deal
          </button>
        </div>
      </div>
    </div>
  );
}
