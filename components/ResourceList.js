// components/ResourceList.js
import { useState, useEffect } from 'react';
import { convertHexToGameValue, decodeRealmName } from '../utils/conversion';

export default function ResourceList({ realmData }) {
  const [resources, setResources] = useState([]);
  const [realmName, setRealmName] = useState('');
  const [resourceError, setResourceError] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [showTooltips, setShowTooltips] = useState(true);
  
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
            const category = getResourceCategory(key);
            const gameValue = convertHexToGameValue(value, category, level);
            
            if (gameValue > 0) {
              resourceArray.push({
                name: resourceName,
                category,
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
      
      // Group by category and sort by value
      const groupedResources = resourceArray.reduce((acc, resource) => {
        if (!acc[resource.category]) {
          acc[resource.category] = [];
        }
        acc[resource.category].push(resource);
        return acc;
      }, {});
      
      // Sort categories by importance
      const orderedCategories = [
        'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 
        'Labor', 'Food', 'Transport', 'Lords', 'Military'
      ];
      
      const sortedResources = [];
      orderedCategories.forEach(category => {
        if (groupedResources[category]) {
          // Sort resources within category by value (descending)
          const sorted = [...groupedResources[category]].sort((a, b) => b.value - a.value);
          sortedResources.push({
            category,
            resources: sorted
          });
        }
      });
      
      // Add any categories not in our ordered list at the end
      Object.keys(groupedResources).forEach(category => {
        if (!orderedCategories.includes(category)) {
          sortedResources.push({
            category,
            resources: [...groupedResources[category]].sort((a, b) => b.value - a.value)
          });
        }
      });
      
      setResources(sortedResources);
      setResourceError(null);
    } catch (err) {
      console.error('Error processing realm resources:', err);
      setResourceError(err.message || 'Failed to process realm resources');
    }
  }, [realmData]);

  // Toggle category expansion
  const toggleCategory = (category) => {
    if (expandedCategory === category) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(category);
    }
  };

  // Get total resource count
  const getTotalResourceCount = () => {
    return resources.reduce((total, category) => total + category.resources.length, 0);
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
        <div>
          <button 
            onClick={() => setShowTooltips(!showTooltips)}
            className="btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
          >
            {showTooltips ? 'Hide Details' : 'Show Details'}
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
          <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#999' }}>
            Found {getTotalResourceCount()} resources across {resources.length} categories
          </div>
          
          {resources.map(category => (
            <div key={category.category} style={{ marginBottom: '2rem' }}>
              <div 
                onClick={() => toggleCategory(category.category)}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  backgroundColor: 'var(--color-secondary)',
                  borderRadius: '4px',
                  marginBottom: '0.5rem'
                }}
              >
                <h3 style={{ margin: 0 }}>{category.category} Resources ({category.resources.length})</h3>
                <span>{expandedCategory === category.category ? '▼' : '►'}</span>
              </div>
              
              <div style={{ 
                display: expandedCategory === category.category ? 'block' : 'none',
                transition: 'all 0.3s ease'
              }}>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {category.resources.map(resource => (
                    <li 
                      key={resource.name} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        padding: '0.5rem 0',
                        borderBottom: '1px solid #333'
                      }}
                      className="tooltip"
                    >
                      <span>{formatResourceName(resource.name)}</span>
                      <span style={{ fontWeight: 'bold' }}>{formatNumber(resource.value)}</span>
                      
                      {showTooltips && (
                        <span className="tooltip-text">
                          Raw value: {resource.rawValue}<br />
                          Category: {resource.category}<br />
                          Length: {resource.hexLength} chars
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
          
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

function formatNumber(value) {
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
