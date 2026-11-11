/**
 * checkColorSetOwnership.js
 * 
 * Helper functions to check Monopoly color-set completeness and calculate
 * rents with full color set multipliers and house tiers.
 */

/**
 * Returns true if the player owns ALL properties in the specified color set.
 *
 * @param {Object|number} player - The player object or player's seat index
 * @param {string} propertyColor - The color group identifier (e.g., 'yellow', 'brown', 'blue')
 * @param {Array} boardSpaces - The array of all 48 board spaces
 * @param {Object} properties - Map of spaceId -> { owner, houses, mortgaged }
 * @returns {boolean}
 */
export function hasFullColorSet(player, propertyColor, boardSpaces, properties) {
  if (!propertyColor || !boardSpaces || !properties) return false;
  const seat = typeof player === "object" && player !== null ? player.seat : player;
  if (seat === undefined || seat === null) return false;

  // Find all purchasable properties belonging to this color set on the board
  const setSpaces = boardSpaces.filter(
    (space) => space && space.kind === "city" && space.set === propertyColor
  );

  if (setSpaces.length === 0) return false;

  // Check if every single space in this set is owned by this player and not mortgaged
  return setSpaces.every((space) => {
    const prop = properties[space.id];
    return prop && prop.owner === seat && !prop.mortgaged;
  });
}

/**
 * Returns detailed status of a color set for a player:
 * { ownedCount, totalCount, isComplete, missingNames }
 */
export function getColorSetStatus(player, propertyColor, boardSpaces, properties) {
  const seat = typeof player === "object" && player !== null ? player.seat : player;
  const setSpaces = boardSpaces.filter(
    (space) => space && space.kind === "city" && space.set === propertyColor
  );

  const totalCount = setSpaces.length;
  const ownedSpaces = setSpaces.filter((space) => {
    const prop = properties[space.id];
    return prop && prop.owner === seat;
  });

  const missingSpaces = setSpaces.filter((space) => {
    const prop = properties[space.id];
    return !prop || prop.owner !== seat;
  });

  return {
    ownedCount: ownedSpaces.length,
    totalCount,
    isComplete: totalCount > 0 && ownedSpaces.length === totalCount,
    missingNames: missingSpaces.map((s) => s.name)
  };
}

