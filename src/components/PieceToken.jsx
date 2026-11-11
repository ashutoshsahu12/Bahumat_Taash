import React from "react";

const STROKE_COLOR = "#150A3A";
const COMMON_STYLE = {
  stroke: STROKE_COLOR,
  strokeWidth: 1.7,
  strokeLinejoin: "round",
  strokeLinecap: "round"
};

const STAR_POINTS = Array.from({ length: 10 }, (_, t) => {
  const r = t % 2 ? 4.6 : 10.5;
  const s = -Math.PI / 2 + (t * Math.PI) / 5;
  return `${(12 + r * Math.cos(s)).toFixed(2)},${(17.5 + r * Math.sin(s)).toFixed(2)}`;
}).join(" ");

export const PIECES = {
  pawn: {
    draw: (color) => (
      <>
        <path d="M4.5 28.5c0-7 3.2-9.5 4.6-14.5h5.8c1.4 5 4.6 7.5 4.6 14.5z" fill={color} {...COMMON_STYLE} />
        <circle cx="12" cy="8.5" r="6" fill={color} {...COMMON_STYLE} />
      </>
    ),
    textCoords: [12, 11.4, 8.5]
  },
  crown: {
    draw: (color) => (
      <>
        <path d="M4 20 2.5 8.5l5.6 5L12 5l3.9 8.5 5.6-5L20 20z" fill={color} {...COMMON_STYLE} />
        <rect x="3.5" y="19.5" width="17" height="8.5" rx="2" fill={color} {...COMMON_STYLE} />
        <circle cx="2.6" cy="8.2" r="1.6" fill="#FFE98A" {...COMMON_STYLE} strokeWidth="1.1" />
        <circle cx="12" cy="4.6" r="1.8" fill="#FFE98A" {...COMMON_STYLE} strokeWidth="1.1" />
        <circle cx="21.4" cy="8.2" r="1.6" fill="#FFE98A" {...COMMON_STYLE} strokeWidth="1.1" />
      </>
    ),
    textCoords: [12, 26.4, 7]
  },
  rocket: {
    draw: (color) => (
      <>
        <path d="M9.2 23.5c.6 2.6 1.6 4 2.8 5.2 1.2-1.2 2.2-2.6 2.8-5.2z" fill="#FF9A2E" {...COMMON_STYLE} strokeWidth="1.2" />
        <path d="M8 16.5 3.5 22.5l1 2 4-1.5zM16 16.5l4.5 6-1 2-4-1.5z" fill={color} {...COMMON_STYLE} />
        <path d="M12 2.5c4.6 3.6 5.6 10 4.3 21H7.7C6.4 12.5 7.4 6.1 12 2.5z" fill={color} {...COMMON_STYLE} />
        <circle cx="12" cy="12.5" r="3.6" fill="#fff" {...COMMON_STYLE} strokeWidth="1.3" />
      </>
    ),
    textCoords: [12, 14.7, 5.6],
    onWhite: true
  },
  auto: {
    draw: (color) => (
      <>
        <path d="M2.5 26V17c0-4 2.6-6.5 6.5-6.5h6c3.6 0 5.6 2.4 6.3 6l.7 3.5V26z" fill={color} {...COMMON_STYLE} />
        <path d="M3.5 10.8c1.5-2.6 4-3.8 7.5-3.8h3.5c3 0 5 1.2 6.2 3.8z" fill="#FFD23F" {...COMMON_STYLE} />
        <path d="M15 12.5h2.6c1.4 0 2.3 1 2.6 2.7l.4 2.3H15z" fill="#fff" {...COMMON_STYLE} strokeWidth="1.2" />
        <circle cx="7" cy="26.6" r="2.9" fill="#2A1B4D" {...COMMON_STYLE} />
        <circle cx="18" cy="26.6" r="2.9" fill="#2A1B4D" {...COMMON_STYLE} />
      </>
    ),
    textCoords: [8.6, 21.6, 7]
  },
  gem: {
    draw: (color) => (
      <>
        <path d="M3.5 12 8 6h8l4.5 6L12 28z" fill={color} {...COMMON_STYLE} />
        <path d="M3.5 12h17M8 6l1.6 6L12 28M16 6l-1.6 6L12 28" fill="none" {...COMMON_STYLE} strokeWidth="1.1" />
        <path d="M9.6 7.4 8.7 10.6" stroke="rgba(255,255,255,.55)" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
    textCoords: [12, 18.6, 5.8]
  },
  star: {
    draw: (color) => (
      <polygon points={STAR_POINTS} fill={color} {...COMMON_STYLE} />
    ),
    textCoords: [12, 20.4, 7.2]
  },
  kite: {
    draw: (color) => (
      <>
        <path d="M12 21.5c-1.6 2-.4 3.4-1.8 5.6" fill="none" {...COMMON_STYLE} strokeWidth="1.3" />
        <path d="m9.3 26.2 1.1 2.4 1.9-1.7z" fill="#FF5568" {...COMMON_STYLE} strokeWidth="1" />
        <path d="M12 2.5 21 12l-9 9.5L3 12z" fill={color} {...COMMON_STYLE} />
        <path d="M12 2.5v19M3 12h18" fill="none" stroke={STROKE_COLOR} strokeWidth="1" opacity={0.55} />
      </>
    ),
    textCoords: [12, 14.6, 6.8]
  },
  chai: {
    draw: (color) => (
      <>
        <path d="M9 9.5c-1.4-1.6 1.2-2.8-.2-4.6M13.5 9.5c-1.4-1.6 1.2-2.8-.2-4.6" fill="none" stroke="rgba(255,255,255,.75)" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M17.5 15.5h1.6a3 3 0 0 1 0 6h-2" fill="none" {...COMMON_STYLE} strokeWidth="2" />
        <path d="M4.5 12h14l-1.8 15.5c-.1.9-.9 1.5-1.8 1.5H8.1c-.9 0-1.7-.6-1.8-1.5z" fill={color} {...COMMON_STYLE} />
        <path d="M5 15h13" stroke="rgba(255,255,255,.55)" strokeWidth="1.3" />
      </>
    ),
    textCoords: [11.5, 23.4, 7.4]
  }
};

export default function PieceToken({ color = "#FFC83D", label, kind = "pawn" }) {
  const piece = PIECES[kind] || PIECES.pawn;
  const [tx, ty, fs] = piece.textCoords;

  return (
    <svg viewBox="0 0 24 32" aria-hidden="true">
      <ellipse cx="12" cy="29.6" rx="9" ry="2.4" fill="rgba(0,0,0,.4)" />
      {piece.draw(color)}
      {label && (
        <text
          x={tx}
          y={ty}
          textAnchor="middle"
          fontSize={fs}
          fontWeight="800"
          fill={piece.onWhite ? "#2A1B4D" : "#ffffff"}
        >
          {label}
        </text>
      )}
    </svg>
  );
}

