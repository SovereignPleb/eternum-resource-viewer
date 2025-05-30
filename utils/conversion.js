/**
 * Convert hex resource value to game display value with improved handling
 * @param {string} hexValue - Hex value from database
 * @param {string} category - Resource category
 * @param {number} realmLevel - Realm level
 * @returns {number} - In-game display value
 */
export function convertHexToGameValue(hexValue, category, realmLevel = 1) {
  // Better handling of empty/null values
  if (!hexValue || 
      hexValue === "0x0" || 
      hexValue === "0x0000000000000000000000000000000000000000000000000000000000000000") {
    return 0;
  }
  
  try {
    // Remove 0x prefix
    hexValue = hexValue.replace(/^0x/, '');
    
    // Convert to decimal (use BigInt for large numbers)
    const decimalValue = BigInt(`0x${hexValue}`);
    
    // Base conversion factor
    const baseFactor = BigInt(4000000000000);
    
    // Display multiplier
    const displayMultiplier = BigInt(1000000);
    
    // Get resource-specific multiplier
    const multiplier = getResourceMultiplier(category);
    
    // Level adjustment (for level 2+ realms)
    let levelAdjustment = BigInt(1);
    if (realmLevel > 1 && (category === 'Common' || category === 'Uncommon')) {
      levelAdjustment = BigInt(63);
    }
    
    // Calculate game value
    const gameValue = Number(
      (decimalValue * displayMultiplier * BigInt(multiplier)) / 
      (baseFactor * levelAdjustment)
    );
    
    return gameValue;
  } catch (error) {
    console.error(`Error converting hex value (${hexValue}) to game value:`, error);
    return 0; // Return 0 on error instead of breaking
  }
}
