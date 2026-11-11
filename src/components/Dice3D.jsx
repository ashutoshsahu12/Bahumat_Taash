import React, { useEffect, useState, useRef } from 'react';
import { Sparkles } from 'lucide-react';

/**
 * Standard dice pip layouts mapped onto a 3x3 grid (indices 0 to 8).
 * [0, 1, 2]
 * [3, 4, 5]
 * [6, 7, 8]
 */
const FACE_DOTS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8]
};

/**
 * Direct 3D rotational coordinates that bring the target face forward facing the camera.
 * Cube faces are positioned in 3D as:
 *   Face 1 (Front):  translateZ(18px)
 *   Face 2 (Right):  rotateY(90deg) translateZ(18px)  -> rotateY(-90deg) brings it front
 *   Face 3 (Top):    rotateX(90deg) translateZ(18px)  -> rotateX(-90deg) brings it front
 *   Face 4 (Bottom): rotateX(-90deg) translateZ(18px) -> rotateX(90deg) brings it front
 *   Face 5 (Left):   rotateY(-90deg) translateZ(18px) -> rotateY(90deg) brings it front
 *   Face 6 (Back):   rotateY(180deg) translateZ(18px) -> rotateX(180deg) brings it front
 */
export const TARGET_FACE_ANGLES = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
  5: { x: 0, y: 90 },
  6: { x: 180, y: 0 }
};

/**
 * Helper function to calculate 3D rotation angles for a die face with tumbling offset
 */
export function getDieRotationAngles(faceValue, extraSpins = 0, flip = 1) {
  const base = TARGET_FACE_ANGLES[faceValue] || TARGET_FACE_ANGLES[1];
  return {
    x: base.x + extraSpins * 360,
    y: base.y + extraSpins * 360 * flip
  };
}

function DieFace({ faceNumber }) {
  const activeDots = FACE_DOTS[faceNumber] || [4];
  return (
    <div className={`solid-cube-face face-${faceNumber}`}>
      <div className="face-grid">
        {Array.from({ length: 9 }, (_, idx) => (
          <span
            key={idx}
            className={`pip-dot ${activeDots.includes(idx) ? 'active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}

export function SingleDie({ value = 1, isRolling = false, dieIndex = 0 }) {
  const accumulatedSpins = useRef(0);
  const [currentTransform, setCurrentTransform] = useState(() => {
    const rot = getDieRotationAngles(value);
    return `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`;
  });

  useEffect(() => {
    let animFrame = null;
    const flip = dieIndex === 1 ? -1 : 1;

    if (isRolling) {
      const startTime = performance.now();
      const speedMultiplier = dieIndex === 0 ? 2.5 : 2.9;

      const tumble = (now) => {
        const elapsed = now - startTime;
        // High-energy 3D tumble physics during roll
        const rotX = (elapsed * speedMultiplier * 1.1) % 3600;
        const rotY = (elapsed * speedMultiplier * 1.3 * flip) % 3600;
        const rotZ = Math.sin(elapsed * 0.02) * 12;

        setCurrentTransform(`rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`);
        animFrame = requestAnimationFrame(tumble);
      };

      animFrame = requestAnimationFrame(tumble);
    } else {
      // Land cleanly on target face: add full 360° revolutions for smooth forward motion
      accumulatedSpins.current += 2;
      const target = getDieRotationAngles(value, accumulatedSpins.current, flip);
      setCurrentTransform(`rotateX(${target.x}deg) rotateY(${target.y}deg) rotateZ(0deg)`);
    }

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [value, isRolling, dieIndex]);

  return (
    <div className="die-viewport">
      <div
        className={`solid-cube ${isRolling ? 'cube-tumbling' : 'cube-settled'}`}
        role="img"
        aria-label={`Die ${value}`}
        style={{ transform: currentTransform }}
      >
        {/* All 6 distinct 3D cube faces */}
        {[1, 2, 3, 4, 5, 6].map((num) => (
          <DieFace key={num} faceNumber={num} />
        ))}
      </div>
    </div>
  );
}

export default function Dice3D({ dice = [1, 1], isRolling = false }) {
  const [d1, d2] = dice;
  const isDoubles = !isRolling && d1 === d2 && d1 > 0;

  return (
    <div className={`dice-dock-container ${isDoubles ? 'doubles-glow' : ''}`}>
      {/* Doubles Badge Indicator */}
      {isDoubles && (
        <div className="doubles-pill-badge animate-bounce">
          <Sparkles className="w-2.5 h-2.5 text-amber-300" />
          <span>DOUBLES {d1}+{d2}!</span>
        </div>
      )}

      {/* 3D Perspective Dice Pair */}
      <div className={`dice-row-viewport ${isRolling ? 'surface-shake' : ''}`}>
        <SingleDie value={d1} isRolling={isRolling} dieIndex={0} />
        <SingleDie value={d2} isRolling={isRolling} dieIndex={1} />
      </div>
    </div>
  );
}
