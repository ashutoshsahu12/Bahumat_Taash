import React from 'react';
import { getTileGridArea, getTileSide } from '../data/boardData';
import { COLOR_SETS, VILLAGE_SETS, formatRupee } from '../data/constants';
import { BOARD_ICONS, HouseIcon, HotelIcon, PropertyMarker } from './Icons';
import { playSound } from '../audio/soundEngine';

export default function Tile({
  space,
  propertyState = null,
  ownerPlayer = null, // { name, color, token, seat }
  ownerColor = null,
  isSelected = false,
  isDim = false,
  isLaunching = false,
  hasFestival = false,
  disabled = false,
  onSelect
}) {
  const { id, kind, name, price, set, icon } = space;
  const { row, col } = getTileGridArea(id);
  const side = getTileSide(id);
  const colorSet = set ? COLOR_SETS[set] : null;
  const IconComponent = icon ? BOARD_ICONS[icon] : null;
  const houses = propertyState?.houses || 0;
  const isMortgaged = propertyState?.mortgaged || false;
  const isVillage = set && VILLAGE_SETS.includes(set);

  // Determine owner styling
  const effectiveOwnerColor = ownerPlayer?.color || ownerColor;
  const ownerInitial = (ownerPlayer?.name?.[0] || "").toUpperCase();
  const isOwned = Boolean(propertyState && propertyState.owner !== undefined && effectiveOwnerColor);

  const handleClick = () => {
    playSound("click");
    if (onSelect) onSelect(id);
  };

  return (
    <button
      type="button"
      className={[
        "tile",
        side,
        `k-${kind}`,
        isSelected ? "sel" : "",
        isDim ? "dim" : "",
        isMortgaged ? "mort" : "",
        houses > 0 ? "built" : "",
        isVillage ? "village" : "",
        hasFestival ? "festival" : "",
        isLaunching && id === 0 ? "go" : "",
        name.length > 8 ? "long" : ""
      ].filter(Boolean).join(" ")}
      style={{ gridArea: `${row} / ${col}` }}
      data-tile-index={id}
      aria-label={price ? `${name}, ${formatRupee(price)}` : name}
      disabled={disabled}
      onClick={handleClick}
    >
      {/* ── Visual Property Ownership Badge (Instant update on Buy/Trade/Sell) ── */}
      {isOwned && price !== undefined && (
        <span
          className="tile-owner-badge rounded-full px-1.5 py-0.5 border border-white/60 text-white font-extrabold flex items-center gap-0.5 shadow-md"
          style={{
            backgroundColor: effectiveOwnerColor,
            fontSize: "calc(1.9 * var(--u, 4px))",
            lineHeight: 1
          }}
          title={`Owned by ${ownerPlayer?.name || "Player"}`}
        >
          {/* Owner Avatar Initial */}
          <span className="font-mono tracking-tighter drop-shadow-sm">
            {ownerInitial || "★"}
          </span>
        </span>
      )}

      {/* City or Purchasable Tile */}
      {price !== undefined ? (
        <>
          {kind === "city" ? (
            <span
              className="band"
              style={{
                background: colorSet?.color || "#241A3D",
                borderBottom: isOwned ? `2.5px solid ${effectiveOwnerColor}` : undefined
              }}
            >
              {houses > 0 && (
                <span className={`bh ${houses >= 5 ? "hotel" : ""}`}>
                  {houses >= 5 ? (
                    <HotelIcon />
                  ) : (
                    Array.from({ length: houses }, (_, i) => <HouseIcon key={i} />)
                  )}
                </span>
              )}
            </span>
          ) : (
            <span
              className="band sign"
              style={{
                borderBottom: isOwned ? `2.5px solid ${effectiveOwnerColor}` : undefined
              }}
            >
              {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
            </span>
          )}

          <span className="pic">
            <span className="lbl">
              <span className="nm">{name}</span>
              <span className="px">{formatRupee(price)}</span>
            </span>
          </span>
        </>
      ) : kind === "jail" ? (
        /* Jail Corner */
        <span className="jailbox">
          <span className="cellroom">
            {IconComponent && <IconComponent className="ticon" />}
            <span className="cn">Jail</span>
          </span>
          <span className="walkway">Visiting</span>
        </span>
      ) : side === "corner" ? (
        /* Corners: Launch, Take a Break, Go to Jail */
        <span className="body">
          <span className="halo">
            {IconComponent && <IconComponent className="ticon" />}
          </span>
          <span className="cn">{name}</span>
          {space.subtitle && <span className="sub">{space.subtitle}</span>}
        </span>
      ) : (
        /* Special Action Tiles: Chance, Market, Tax */
        <>
          <span className="pic sp">
            {IconComponent && <IconComponent className="ticon" />}
            <span className="lbl">
              <span className="nm">{name}</span>
              {space.desc && <span className="px">{space.desc}</span>}
            </span>
          </span>
        </>
      )}
    </button>
  );
}
