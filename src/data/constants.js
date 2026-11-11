export const GAME_CONSTANTS = {
  START_CASH: 2000,
  FESTIVAL_CARDS: 4,
  FESTIVAL_CARD_EVERY_ROUNDS: 10,
  FESTIVAL_CARDS_MAX: 8,
  FESTIVAL_RENT_MULTIPLIER: 3,
  SALARY_STEP: 100, // Grows by ₹100 each lap: Lap 1: 200, Lap 2: 300, Lap 3: 400...
  PCT_MIN: 50,
  JAIL_PCT: 30,
  JAIL_TRIES: 3,
  DOUBLES_BONUS_PCT: 5,
  MAX_EXTRA_ROLLS: 2,
  MAX_HOUSES: 5, // 1 to 4 houses, 5 = hotel
  MORTGAGE_RATE: 0.5,
  REDEEM_RATE: 0.55,
  HOUSE_RESALE_RATE: 0.5,
  AUCTION_OPEN_RATE: 0.5,
  AUCTION_SECONDS: 20,
  BID_STEP: 5,
  LOAN_MAX_CASH_SHARE: 0.7,
  LOAN_MAX_INTEREST_PCT: 100,
  DEAL_MAX_LAPS: 6,
  MAX_LOANS_PER_PLAYER: 10,
  MAX_SPLITS: 3,
  MARKET_MIN_STAKE: 10,
  MARKET_MAX_STAKE: 1000,
  MARKET_LOSE_MAX: 5, // 2 to 5: lose stake
  MARKET_FLAT_MAX: 8, // 6 to 8: flat (nothing happens), 9 to 12: double stake!
  DEFAULT_MISS_LIMIT: 3,
  MISS_FINE_PCT: 5,
  TAX_PCT_PER_PROPERTY: 2,
  REPAIR_PCT_PER_HOUSE: 2,
  NAME_MAX: 12,
  MIN_SEATS: 2,
  MAX_SEATS: 6,
  LOG_LIMIT: 250,
  HOLD_TURN_SECONDS: 180,
  JAIL_BAIL_AMOUNT: 50
};

export const MATCH_LENGTH_OPTIONS = [30, 45, 60, 0]; // 0 means 'No limit'
export const MISS_LIMIT_OPTIONS = [2, 3, 5];

export const TOKEN_KINDS = [
  "pawn",
  "crown",
  "rocket",
  "auto",
  "gem",
  "star",
  "kite",
  "chai"
];

export const TOKEN_NAMES = {
  pawn: "Pawn",
  crown: "Crown",
  rocket: "Rocket",
  auto: "Auto",
  gem: "Gem",
  star: "Star",
  kite: "Kite",
  chai: "Chai"
};

export const COLOR_SETS = {
  brown: { name: "Brown", color: "#8B5A2B", text: "#FFFFFF", house: 50, rentMultiplier: 1.5 },
  sky: { name: "Sky", color: "#6CC8F5", text: "#2A1B4D", house: 50 },
  pink: { name: "Pink", color: "#FF7EB6", text: "#2A1B4D", house: 50 },
  orange: { name: "Orange", color: "#FF8A1F", text: "#2A1B4D", house: 100 },
  red: { name: "Red", color: "#E5383B", text: "#FFFFFF", house: 100 },
  yellow: { name: "Yellow", color: "#FFD21F", text: "#2A1B4D", house: 150 },
  green: { name: "Green", color: "#2FB457", text: "#FFFFFF", house: 150 },
  blue: { name: "Blue", color: "#2456D6", text: "#FFFFFF", house: 200 },
  purple: { name: "Purple", color: "#8E3FD9", text: "#FFFFFF", house: 200 },
  black: { name: "Black", color: "#1E1B26", text: "#FFC83D", house: 200 }
};

export const VILLAGE_SETS = ["brown", "sky", "pink"];

export const PLAYER_COLORS = [
  "#FFC83D", // Gold
  "#34D27B", // Green
  "#49A6FF", // Blue
  "#FF5568", // Red
  "#B55FE6", // Purple
  "#FF8A1F"  // Orange
];

export function formatRupee(amount) {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

export function formatLength(minutes) {
  if (minutes === 0) return "No limit";
  if (minutes === 60) return "1 hour";
  return `${minutes} min`;
}

export function formatMisses(misses) {
  return `${misses} turns`;
}

