// components/ResourceList.js
import { useState, useEffect } from 'react';
import { convertHexToGameValue, decodeRealmName } from '../utils/conversion';

export default function ResourceList({ realmData, onRefresh }) {
  const [resources, setResources] = useState([]);
  const [realmName, setRealmName] = useState('');
  const [resourceError, setResourceError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showTooltips, setShowTooltips] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  useEffect(() => {
    try {
      // Decode realm name if it's in hex format
      if (realmData.name && realmData.name.startsWith('0x')) {
        setRealmName(decodeRealmName(realmData.name));
      } else {
        setRealmName(realmData.name || `Realm #${realmData.id}`);
      }
      
      // Convert and organize resources
      const resourceArray = [];
      const resourceData = realmData.resources;
      const level = realmData.level || 1;
      
      if (!resourceData) {
        throw new Error('No resource data available');
      }
      
      for (const [key, value] of Object.entries(resourceData)) {
        if (key.endsWith('_BALANCE') && value && value !== '0x0' && 
            value !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
          try {
            const resourceName = key.replace('_BALANCE', '');
            const category = getSimplifiedCategory(getResourceCategory(key));
            const gameValue = convertHexToGameValue(value, getResourceCategory(key), level);
            
            if (gameValue > 0) {
              resourceArray.push({
                name: resourceName,
                category,
                sortOrder: getCategorySortOrder(category),
                rawCategory: getResourceCategory(key),
                value: gameValue,
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
      
      {resources.length === 0 ? (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center',
          backgroundColor: 'var(--color-secondary)',
          borderRadius: '4px'
        }}>
          <p>No resources found for this realm.</p>
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
              <thead>
                <tr style={{ backgroundColor: 'var(--color-secondary)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #444' }}>
                    Resource
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #444' }}>
                    Category
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #444' }}>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredResources.map((resource, index) => (
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
                      {formatNumberWithCommas(resource.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666', padding: '0.5rem', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>
            <p>Note: Resource values are calculated from hex data using conversion formulas. Realm level affects resource calculation for common/uncommon resources.</p>
          </div>
        </>
      )}
    </div>
  );
}

function formatResourceName(name) {
  return name
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, txt => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}

function formatNumberWithCommas(value) {
  // For very small decimals, round to 2 decimal places
  let formattedValue = value < 1 ? value.toFixed(2) : Math.round(value);
  
  // Add commas for thousands
  return formattedValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
