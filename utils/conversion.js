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
    
    // Get resource-specific multiplier and divisor
    const { multiplier, divisor } = getResourceScaleFactor(category, hexValue);
    
    // Level adjustment (for level 2+ realms)
    let levelAdjustment = BigInt(1);
    if (realmLevel > 1 && (category === 'Common' || category === 'Uncommon')) {
      levelAdjustment = BigInt(63);
    }
    
    // Calculate game value
    let gameValue = Number(
      (decimalValue * displayMultiplier * BigInt(multiplier)) / 
      (baseFactor * levelAdjustment)
    );
    
    // Apply divisor for resources that need to be scaled down
    gameValue = gameValue / divisor;
    
    return gameValue;
  } catch (error) {
    console.error(`Error converting hex value (${hexValue}) to game value:`, error);
    return 0; // Return 0 on error instead of breaking
  }
}

/**
 * Get multiplier and divisor for a resource category with enhanced logic
 * @param {string} category - Resource category
 * @param {string} hexValue - Original hex value for context
 * @returns {Object} - Object with multiplier and divisor values
 */
function getResourceScaleFactor(category, hexValue) {
  // Default values
  const result = {
    multiplier: 1,
    divisor: 1  // New parameter to scale down values when needed
  };
  
  // Resource category base multipliers
  switch(category) {
    case 'Common':
    case 'Uncommon':
    case 'Rare':
    case 'Epic':
    case 'Legendary':
      result.multiplier = 1;
      break;
    case 'Labor':
      result.multiplier = 64;
      result.divisor = 16000; // Scale down labor by 16000 to match in-game values
      break;
    case 'Lords':
      result.multiplier = 64;
      result.divisor = 16000; // Scale down lords by 16000 to match in-game values
      break;
    case 'Military':
      result.multiplier = 4;
      result.divisor = 1000; // Scale down military units by 1000
      break;
    case 'Transport':
      result.multiplier = 4;
      result.divisor = 1000; // Scale down transport (donkeys) by 1000
      break;
    case 'Food':
      // Check if this is fish which has a different multiplier
      if (hexValue && hexValue.toLowerCase().includes('fish')) {
        result.multiplier = 16;
      } else {
        result.multiplier = 1;
      }
      result.divisor = 250; // Scale down food by 250 to match in-game values (verified)
      break;
    default:
      result.multiplier = 1;
  }
  
  // Resource-specific overrides
  if (hexValue) {
    const resourceKey = hexValue.toLowerCase();
    
    // Military unit adjustments
    if (resourceKey.includes('knight_t2') || resourceKey.includes('paladin_t1')) {
      result.multiplier = 16;
    } else if (resourceKey.includes('knight_t3') || resourceKey.includes('paladin_t2')) {
      result.multiplier = 64;
    } else if (resourceKey.includes('paladin_t3')) {
      result.multiplier = 256;
    }
  }
  
  return result;
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
