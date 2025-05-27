/**
 * Convert hex resource value to game display value
 * @param {string} hexValue - Hex value from database
 * @param {string} category - Resource category
 * @param {number} realmLevel - Realm level
 * @returns {number} - In-game display value
 */
export function convertHexToGameValue(hexValue, category, realmLevel = 1) {
  if (!hexValue || hexValue === "0x0" || hexValue === "0x0000000000000000000000000000000000000000000000000000000000000000") {
    return 0;
  }
  
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
  
  // Calculate game value: (decimalValue × displayMultiplier × multiplier) ÷ (baseFactor × levelAdjustment)
  const gameValue = Number(
    (decimalValue * displayMultiplier * BigInt(multiplier)) / 
    (baseFactor * levelAdjustment)
  );
  
  return gameValue;
}

/**
 * Get multiplier for a resource category
 * @param {string} category - Resource category
 * @returns {number} - Multiplier value
 */
function getResourceMultiplier(category) {
  const multipliers = {
    'Common': 1,
    'Uncommon': 1,
    'Rare': 1,
    'Epic': 1,
    'Legendary': 1,
    'Labor': 64,
    'Lords': 64,
    'Military': 4, // Default, some military resources may use different multipliers
    'Transport': 4,
    'Food': 1 // Default, Fish uses a different multiplier
  };
  
  return multipliers[category] || 1;
}

/**
 * Decode hex realm name to text
 * @param {string} hexValue - Hex realm name
 * @returns {string} - Decoded realm name
 */
export function decodeRealmName(hexValue) {
  if (!hexValue || !hexValue.startsWith('0x')) {
    return 'Unknown Realm';
  }
  
  try {
    // Remove '0x' prefix and leading zeros
    const cleanHex = hexValue.replace(/^0x0+/, '');
    
    // Convert hex to ASCII text
    let realmName = '';
    for (let i = 0; i < cleanHex.length; i += 2) {
      const hexChar = cleanHex.substr(i, 2);
      const decimalValue = parseInt(hexChar, 16);
      if (decimalValue > 0) { // Skip null characters
        realmName += String.fromCharCode(decimalValue);
      }
    }
    
    return realmName || 'Unknown Realm';
  } catch (error) {
    console.error('Error decoding realm name:', error);
    return 'Unknown Realm';
  }
}
