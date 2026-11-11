import { generateBoardForState, STATE_REGIONS } from "./stateBoardData";

export { generateBoardForState, STATE_REGIONS };

// Default initial board (Maharashtra)
export const BOARD_SPACES = generateBoardForState("maharashtra");

// Helper to determine row/col in 13x13 grid
export function getTileGridArea(index) {
  if (index <= 12) {
    return { row: 13, col: 13 - index };
  } else if (index <= 24) {
    return { row: 13 - (index - 12), col: 1 };
  } else if (index <= 36) {
    return { row: 1, col: 1 + (index - 24) };
  } else {
    return { row: 1 + (index - 36), col: 13 };
  }
}

// Side classification
export function getTileSide(index) {
  if (index % 12 === 0) return "corner";
  if (index < 12) return "s-bottom";
  if (index < 24) return "s-left";
  if (index < 36) return "s-top";
  return "s-right";
}

// Position percentage calculator for smooth token animation
export function getPositionPercent(coordinate) {
  if (coordinate === 1) return 0.6 + 7.23038;
  if (coordinate === 13) return 92.16962;
  return 15.36076 + (coordinate - 2) * 6.32532 + 3.01266;
}
