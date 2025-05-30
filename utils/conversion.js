/**
 * Enhanced utility functions for converting Eternum data
 */

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
    const multiplier = getResourceMultiplier(category, hexValue);
    
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

/**
 * Get multiplier for a resource category with enhanced logic
 * @param {string} category - Resource category
 * @param {string} hexValue - Original hex value for context
 * @returns {number} - Multiplier value
 */
function getResourceMultiplier(category, hexValue) {
  // Enhanced multipliers based on category
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
  
  // Resource-specific overrides
  const resourceSpecificMultipliers = {
    'FISH': 16,
    'KNIGHT_T2': 16,
    'KNIGHT_T3': 64,
    'PALADIN_T1': 16,
    'PALADIN_T2': 64,
    'PALADIN_T3': 256,
    'ARCHER_T2': 16,
    'ARCHER_T3': 64,
    'CROSSBOWMAN_T2': 16,
    'CROSSBOWMAN_T3': 64
  };
  
  // Check if the hex value corresponds to a specific resource
  // This is just a basic implementation - would need to be expanded
  for (const [resourceName, specificMultiplier] of Object.entries(resourceSpecificMultipliers)) {
    if (hexValue && hexValue.includes(resourceName.toLowerCase())) {
      return specificMultiplier;
    }
  }
  
  // Fall back to category-based multiplier
  return multipliers[category] || 1;
}

/**
 * Decode hex realm name to text with enhanced error handling
 * @param {string} hexValue - Hex realm name
 * @returns {string} - Decoded realm name
 */
export function decodeRealmName(hexValue) {
  if (!hexValue) {
    return 'Unknown Realm';
  }
  
  try {
    // For non-hex values, return as is
    if (!hexValue.startsWith('0x')) {
      return hexValue;
    }
    
    // Remove '0x' prefix and leading zeros
    const cleanHex = hexValue.replace(/^0x0+/, '');
    
    // If empty after cleaning, return default
    if (!cleanHex) {
      return 'Unknown Realm';
    }
    
    // Convert hex to ASCII text
    let realmName = '';
    for (let i = 0; i < cleanHex.length; i += 2) {
      const hexChar = cleanHex.substr(i, 2);
      const decimalValue = parseInt(hexChar, 16);
      
      // Only include printable ASCII characters
      if (decimalValue >= 32 && decimalValue <= 126) {
        realmName += String.fromCharCode(decimalValue);
      }
    }
    
    // If empty after filtering, return default
    return realmName || 'Unknown Realm';
  } catch (error) {
    console.error('Error decoding realm name:', error);
    return 'Unknown Realm';
  }
}

/**
 * Format number for display with appropriate units
 * @param {number} value - Numeric value to format
 * @returns {string} - Formatted value
 */
export function formatResourceValue(value) {
  if (typeof value !== 'number') return '0';
  
  // For very large numbers, use K/M/B notation
  if (value >= 1000000000) {
    return (value / 1000000000).toFixed(2) + 'B';
  } else if (value >= 1000000) {
    return (value / 1000000).toFixed(2) + 'M';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(2) + 'K';
  }
  
  // For smaller numbers, show with up to 2 decimal places
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2
  });
}

/**
 * Format resource name for display
 * @param {string} name - Raw resource name
 * @returns {string} - Formatted name
 */
export function formatResourceName(name) {
  if (!name) return 'Unknown';
  
  // Remove common suffixes
  const cleanName = name.replace(/_BALANCE$/, '').replace(/_PRODUCTION$/, '');
  
  // Replace underscores with spaces and capitalize properly
  return cleanName
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, txt => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}
