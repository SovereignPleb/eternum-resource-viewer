// components/ResourceList.js
import { useState, useEffect } from 'react';
import { convertHexToGameValue, decodeRealmName } from '../utils/conversion';

export default function ResourceList({ realmData, onRefresh }) {
  const [resources, setResources] = useState([]);
  const [realmName, setRealmName] = useState('');
  const [resourceError, setResourceError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalWeight, setTotalWeight] = useState(0);
  const [maxWeight, setMaxWeight] = useState(0);
  const [rawData, setRawData] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('desc');
  
  useEffect(() => {
    try {
      // Save raw data for debugging
      setRawData(realmData.resources);
      
      // Decode realm name if it's in hex format
      if (realmData.name && realmData.name.startsWith('0x')) {
        setRealmName(decodeRealmName(realmData.name));
      } else {
        setRealmName(realmData.name || `Realm #${realmData.id}`);
      }
      
      // Set weight capacity if available
      if (realmData.resources && realmData.resources["weight.capacity"]) {
        const capacityHex = realmData.resources["weight.capacity"];
        // Convert capacity from hex using a scaling factor of 250,000,000
        // to get to millions of kg as expected (6M kg)
        const capacityValue = convertHexToNumber(capacityHex) / 250000000;
        setMaxWeight(Math.round(capacityValue));
      }
      
      // Convert and organize resources
      const resourceArray = [];
      const resourceData = realmData.resources;
      const level = realmData.level || 1;
      let weightSum = 0;
      
      if (!resourceData) {
        throw new Error('No resource data available');
      }
      
      for (const [key, value] of Object.entries(resourceData)) {
        // Process resource balances
        if (key.endsWith('_BALANCE') && value && value !== '0x0' && 
            value !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
          try {
            const resourceName = key.replace('_BALANCE', '');
            const rawCategory = getResourceCategory(key);
            const category = getSimplifiedCategory(rawCategory);
            const gameValue = convertHexToGameValue(value, rawCategory, level);
            
            // Get production rate and pending resources if available
            const productionRateKey = `${resourceName}_PRODUCTION.production_rate`;
            const pendingResourcesKey = `${resourceName}_PRODUCTION.output_amount_left`;
            
            let productionRate = 0;
            let pendingResources = 0;
            
            if (resourceData[productionRateKey]) {
              productionRate = convertHexToGameValue(resourceData[productionRateKey], rawCategory, level);
            }
            
            if (resourceData[pendingResourcesKey]) {
              pendingResources = convertHexToGameValue(resourceData[pendingResourcesKey], rawCategory, level);
            }
            
            if (gameValue > 0 || productionRate > 0 || pendingResources > 0) {
              // Calculate weight based on resource type
              const weightPerUnit = getResourceWeight(key);
              const weight = gameValue * weightPerUnit;
              weightSum += weight;
              
              resourceArray.push({
                name: resourceName,
                category,
                sortOrder: getCategorySortOrder(category),
                rawCategory,
                value: gameValue,
                productionRate,
                pendingResources,
                weight,
                weightPerUnit,
                rawValue: value,
                hexLength: value.length
              });
            }
          } catch (resourceError) {
            console.error(`Error processing resource ${key}:`, resourceError);
            // Continue with other resources rather than failing completely
          }
        }
      }
      
      // Set total weight
      setTotalWeight(weightSum);
      
      // Sort resources by our custom sort order, then by value within category
      const sortedResources = resourceArray.sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          // First by custom category order
          return a.sortOrder - b.sortOrder;
        }
        // Then by value (descending) within category
        return b.value - a.value;
      });
      
      setResources(sortedResources);
      setResourceError(null);
      setIsRefreshing(false);
    } catch (err) {
      console.error('Error processing realm resources:', err);
      setResourceError(err.message || 'Failed to process realm resources');
      setIsRefreshing(false);
    }
  }, [realmData]);

  // Helper function to convert hex to number for weight calculations
  function convertHexToNumber(hexValue) {
    if (!hexValue || hexValue === '0x0') return 0;
    
    // Remove 0x prefix
    hexValue = hexValue.replace(/^0x/, '');
    
    // Convert to decimal (use BigInt for large numbers)
    return Number(BigInt(`0x${hexValue}`));
  }
  
  // Helper function to format coordinates for display
  function formatCoordinate(coord) {
    if (coord === undefined || coord === null) return '?';
    
    // Adjust the coordinates to match the game's display
    // The raw values are around 2147483646, need to be converted to display values
    if (coord > 2147483600) {
      // This is a negative coordinate in the game's coordinate system
      return (coord - 2147483647 - 1);
    } else {
      // This is a positive coordinate
      return coord;
    }
  }

  // Get all unique categories (ordered by our sort order)
  const categories = ['all', ...new Set(resources.map(r => r.category))].sort((a, b) => {
    if (a === 'all') return -1;
    if (b === 'all') return 1;
    return getCategorySortOrder(a) - getCategorySortOrder(b);
  });

  // Filter resources by selected category
  const filteredResources = selectedCategory === 'all' 
    ? resources 
    : resources.filter(r => r.category === selectedCategory);
  
  // Apply sorting if a sort field is selected
  const sortedResources = sortField 
    ? [...filteredResources].sort((a, b) => {
        let valueA = a[sortField];
        let valueB = b[sortField];
        
        // For string values, use case-insensitive comparison
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          valueA = valueA.toLowerCase();
          valueB = valueB.toLowerCase();
        }
        
        // Apply sort direction
        return sortDirection === 'asc' 
          ? (valueA > valueB ? 1 : -1) 
          : (valueA < valueB ? 1 : -1);
      })
    : filteredResources;
  
  // Calculate filtered weight total
  const filteredWeight = selectedCategory === 'all' 
    ? totalWeight 
    : sortedResources.reduce((sum, resource) => sum + resource.weight, 0);

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      // If already sorting by this field, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Otherwise, sort by the new field in descending order by default
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      onRefresh(realmData.id);
    }
  };

  if (resourceError) {
    return (
      <div className="error">
        <p>Error displaying resources: {resourceError}</p>
        <p>Please try refreshing the page or select a different realm.</p>
      </div>
    );
  }

  // Calculate weight percentage for the progress bar
  const weightPercentage = maxWeight > 0 ? Math.min(100, Math.round((totalWeight / maxWeight) * 100)) : 0;
  const weightBarColor = weightPercentage > 90 ? '#ff6b6b' : weightPercentage > 75 ? '#ffd166' : '#06d6a0';

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }} className="card-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>{realmName}</h2>
            <p>
              <strong>Realm ID:</strong> {realmData.id} | 
              <strong> Entity ID:</strong> {realmData.entityId} |
              <strong> Level:</strong> {realmData.level || 1}
              {realmData.ownerName && (
                <> | <strong>Owner:</strong> {realmData.ownerName}</>
              )}
            </p>
            {/* Add geographical details - simplified version */}
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#aaa' }}>
              <strong>Coordinates:</strong> ({formatCoordinate(realmData.x)}, {formatCoordinate(realmData.y)}) | 
              <strong> Wonder:</strong> {realmData.wonder ? 'Yes' : 'No'}
            </p>
          </div>
          <button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--color-secondary)',
              padding: '0.5rem 1rem'
            }}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh Resources'}
            {isRefreshing && (
              <div className="loading-spinner" style={{ 
                width: '16px', 
                height: '16px',
                borderWidth: '2px',
                marginLeft: '0.25rem'
              }}></div>
            )}
          </button>
        </div>
      </div>
      
      {/* Weight capacity indicator */}
      {maxWeight > 0 && (
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--color-secondary)', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <strong>Resource Weight</strong>
            <span>{addCommas(Math.round(totalWeight))} / {addCommas(maxWeight)} kg ({weightPercentage}%)</span>
          </div>
          <div style={{ 
            width: '100%', 
            height: '8px', 
            backgroundColor: '#444', 
            borderRadius: '4px', 
            overflow: 'hidden' 
          }}>
            <div style={{ 
              width: `${weightPercentage}%`, 
              height: '100%', 
              backgroundColor: weightBarColor,
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>
      )}
      
      {resources.length === 0 ? (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center',
          backgroundColor: 'var(--color-secondary)',
          borderRadius: '4px'
        }}>
          <p>No resources found for this realm.</p>
          
          {/* Show raw data if debug is on */}
          {rawData && (
            <div style={{ marginTop: '1rem', textAlign: 'left' }}>
              <p>Raw resource data was found but couldn't be processed. Here's what was returned:</p>
              <pre style={{ 
                backgroundColor: '#111',
                padding: '0.5rem',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '200px',
                fontSize: '0.8rem',
                textAlign: 'left'
              }}>
                {JSON.stringify(rawData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <>
          <div style={{ 
            marginBottom: '1rem', 
            display: 'flex', 
            gap: '0.5rem', 
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.9rem' }}>Filter: </span>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  backgroundColor: selectedCategory === category ? 'var(--color-primary)' : 'var(--color-secondary)',
                  color: selectedCategory === category ? '#000' : 'var(--color-text)',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.9rem',
                  borderRadius: '4px',
                }}
              >
                {category === 'all' ? 'All' : category}
                {category === 'all' && ` (${resources.length})`}
                {category !== 'all' && ` (${resources.filter(r => r.category === category).length})`}
              </button>
            ))}
          </div>
          
          <div style={{ 
            overflowX: 'auto',
            marginBottom: '2rem',
            border: '1px solid #444',
            borderRadius: '4px'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr style={{ backgroundColor: 'var(--color-secondary)' }}>
                  <th 
                    style={{ 
                      padding: '0.75rem', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #444',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSort('name')}
                  >
                    Resource
                    {sortField === 'name' && (
                      <span style={{ marginLeft: '0.25rem' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    style={{ 
                      padding: '0.75rem', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #444',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSort('category')}
                  >
                    Category
                    {sortField === 'category' && (
                      <span style={{ marginLeft: '0.25rem' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    style={{ 
                      padding: '0.75rem', 
                      textAlign: 'right', 
                      borderBottom: '1px solid #444',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSort('value')}
                  >
                    Amount
                    {sortField === 'value' && (
                      <span style={{ marginLeft: '0.25rem' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    style={{ 
                      padding: '0.75rem', 
                      textAlign: 'right', 
                      borderBottom: '1px solid #444',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSort('productionRate')}
                  >
                    Production
                    {sortField === 'productionRate' && (
                      <span style={{ marginLeft: '0.25rem' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    style={{ 
                      padding: '0.75rem', 
                      textAlign: 'right', 
                      borderBottom: '1px solid #444',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSort('pendingResources')}
                  >
                    Pending
                    {sortField === 'pendingResources' && (
                      <span style={{ marginLeft: '0.25rem' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    style={{ 
                      padding: '0.75rem', 
                      textAlign: 'right', 
                      borderBottom: '1px solid #444',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSort('weight')}
                  >
                    Weight (kg)
                    {sortField === 'weight' && (
                      <span style={{ marginLeft: '0.25rem' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Weight Subtotal Row */}
                <tr style={{ 
                  backgroundColor: 'rgba(192, 168, 110, 0.15)',
                  fontWeight: 'bold'
                }}>
                  <td colSpan="5" style={{ 
                    padding: '0.75rem', 
                    borderBottom: '1px solid #444',
                    textAlign: 'right'
                  }}>
                    <strong>Total Weight:</strong>
                  </td>
                  <td style={{ 
                    padding: '0.75rem', 
                    borderBottom: '1px solid #444',
                    textAlign: 'right',
                    color: 'var(--color-primary)'
                  }}>
                    {addCommas(Math.round(filteredWeight))}
                  </td>
                </tr>
                
                {/* Resource Rows */}
                {sortedResources.map((resource, index) => (
                  <tr 
                    key={resource.name} 
                    style={{
                      backgroundColor: index % 2 === 0 ? 'var(--color-background)' : 'rgba(58, 58, 58, 0.3)'
                    }}
                  >
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #333' }}>
                      {formatResourceName(resource.name)}
                    </td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #333' }}>
                      {resource.category}
                    </td>
                    <td style={{ 
                      padding: '0.75rem', 
                      textAlign: 'right', 
                      fontWeight: 'bold',
                      borderBottom: '1px solid #333' 
                    }}>
                      {addCommas(Math.round(resource.value))}
                    </td>
                    <td style={{ 
                      padding: '0.75rem', 
                      textAlign: 'right',
                      borderBottom: '1px solid #333',
                      color: resource.productionRate > 0 ? '#06d6a0' : '#666'
                    }}>
                      {resource.productionRate > 0 
                        ? `+${formatRate(resource.productionRate)}/h` 
                        : '-'}
                    </td>
                    <td style={{ 
                      padding: '0.75rem', 
                      textAlign: 'right',
                      borderBottom: '1px solid #333',
                      color: resource.pendingResources > 0 ? '#ffd166' : '#666'
                    }}>
                      {resource.pendingResources > 0 
                        ? addCommas(Math.round(resource.pendingResources)) 
                        : '-'}
                    </td>
                    <td style={{ 
                      padding: '0.75rem', 
                      textAlign: 'right',
                      borderBottom: '1px solid #333',
                      color: resource.weight > 0 ? 'inherit' : '#666'
                    }}>
                      {resource.weight > 0 
                        ? addCommas(Math.round(resource.weight)) 
                        : '0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{ 
            marginTop: '1rem', 
            fontSize: '0.8rem', 
            color: '#666', 
            padding: '0.5rem', 
            backgroundColor: 'rgba(0,0,0,0.1)', 
            borderRadius: '4px' 
          }}>
            <p>Weight calculation: Resources = 1kg/unit, Military = 5kg/unit, Food & Fragments = 0.1kg/unit, Lords & Donkeys = 0kg/unit</p>
            <p>Click on column headers to sort the table by that column.</p>
          </div>
        </>
      )}
    </div>
  );
}

// Format resource production rate with K/M/B notation
function formatRate(value) {
  if (value >= 1000000000) {
    return (value / 1000000000).toFixed(1) + 'B';
  } else if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toFixed(0);
}

// Get weight per unit based on resource type
function getResourceWeight(resourceKey) {
  // Military units (5kg per unit)
  if (resourceKey.includes('KNIGHT_') || 
      resourceKey.includes('PALADIN_') || 
      resourceKey.includes('CROSSBOWMAN_') || 
      resourceKey.includes('ARCHER_')) {
    return 5;
  }
  
  // Food and fragments (0.1kg per unit)
  if (resourceKey.includes('WHEAT_') || 
      resourceKey.includes('FISH_') || 
      resourceKey.includes('FRAGMENT')) {
    return 0.1;
  }
  
  // Lords and transport have no weight
  if (resourceKey.includes('LORDS_') || resourceKey.includes('DONKEY_')) {
    return 0;
  }
  
  // Default weight for resources (1kg per unit)
  return 1;
}

function formatResourceName(name) {
  return name
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, txt => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}

// Function to add commas to numbers
function addCommas(value) {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Original category assignment
function getResourceCategory(resourceKey) {
  const categories = {
    // Common resources
    WOOD_BALANCE: 'Common',
    STONE_BALANCE: 'Common',
    COAL_BALANCE: 'Common',
    COPPER_BALANCE: 'Common',
    OBSIDIAN_BALANCE: 'Common',
    
    // Uncommon resources
    SILVER_BALANCE: 'Uncommon',
    GOLD_BALANCE: 'Uncommon',
    IRONWOOD_BALANCE: 'Uncommon',
    COLD_IRON_BALANCE: 'Uncommon',
    
    // Rare resources
    MITHRAL_BALANCE: 'Rare',
    DEEP_CRYSTAL_BALANCE: 'Rare',
    RUBY_BALANCE: 'Rare',
    DIAMONDS_BALANCE: 'Rare',
    SAPPHIRE_BALANCE: 'Rare',
    
    // Epic resources
    HARTWOOD_BALANCE: 'Epic',
    IGNIUM_BALANCE: 'Epic',
    TRUE_ICE_BALANCE: 'Epic',
    TWILIGHT_QUARTZ_BALANCE: 'Epic',
    
    // Legendary resources
    ADAMANTINE_BALANCE: 'Legendary',
    ETHEREAL_SILICA_BALANCE: 'Legendary',
    DRAGONHIDE_BALANCE: 'Legendary',
    
    // Special resources
    LABOR_BALANCE: 'Labor',
    WHEAT_BALANCE: 'Food',
    FISH_BALANCE: 'Food',
    DONKEY_BALANCE: 'Transport',
    LORDS_BALANCE: 'Lords',
    ANCIENT_FRAGMENT_BALANCE: 'Ancient Fragment',
    
    // Alchemical resources
    ALCHEMICAL_SILVER_BALANCE: 'Rare',
    ALCHEMICAL_GOLD_BALANCE: 'Rare',
    
    // Military units
    KNIGHT_T1_BALANCE: 'Military',
    KNIGHT_T2_BALANCE: 'Military',
    KNIGHT_T3_BALANCE: 'Military',
    PALADIN_T1_BALANCE: 'Military',
    PALADIN_T2_BALANCE: 'Military',
    PALADIN_T3_BALANCE: 'Military',
    CROSSBOWMAN_T1_BALANCE: 'Military',
    CROSSBOWMAN_T2_BALANCE: 'Military',
    CROSSBOWMAN_T3_BALANCE: 'Military',
    ARCHER_T1_BALANCE: 'Military',
    ARCHER_T2_BALANCE: 'Military',
    ARCHER_T3_BALANCE: 'Military'
  };
  
  // If the resource is not explicitly defined, try to categorize it based on name patterns
  if (!categories[resourceKey]) {
    if (resourceKey.includes('_T1_BALANCE') || 
        resourceKey.includes('_T2_BALANCE') || 
        resourceKey.includes('_T3_BALANCE')) {
      return 'Military';
    } else if (resourceKey.includes('ICE_BALANCE')) {
      return 'Epic'; // TRUE_ICE_BALANCE is explicitly defined, but this catches any other ice types
    } else if (resourceKey.includes('WOOD_BALANCE') && !resourceKey.includes('IRON')) {
      return 'Common';
    } else if (resourceKey.includes('ALCHEMICAL_')) {
      return 'Rare'; // Categorize all alchemical resources as Rare
    }
  }
  
  return categories[resourceKey] || 'Other';
}

// Simplified categories as requested
function getSimplifiedCategory(originalCategory) {
  const simplifiedMap = {
    'Common': 'Resources',
    'Uncommon': 'Resources',
    'Rare': 'Resources',
    'Epic': 'Resources',
    'Legendary': 'Resources',
    'Labor': 'Special',
    'Lords': 'Special',
    'Transport': 'Special',
    'Ancient Fragment': 'Special',
    'Food': 'Food',
    'Military': 'Military',
    'Other': 'Other'
  };
  
  return simplifiedMap[originalCategory] || originalCategory;
}

// Define category sort order: Special, Military, Food, Resources
function getCategorySortOrder(category) {
  const orderMap = {
    'Special': 1,
    'Military': 2,
    'Food': 3,
    'Resources': 4,
    'Other': 5
  };
  
  return orderMap[category] || 99; // Default to end for unknown categories
}
