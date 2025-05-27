import { useState, useEffect } from 'react';
import { convertHexToGameValue, decodeRealmName } from '../utils/conversion';

export default function ResourceList({ realmData }) {
  const [resources, setResources] = useState([]);
  const [realmName, setRealmName] = useState('');
  
  useEffect(() => {
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
    
    for (const [key, value] of Object.entries(resourceData)) {
      if (key.endsWith('_BALANCE') && value && value !== '0x0' && 
          value !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
        const resourceName = key.replace('_BALANCE', '');
        const category = getResourceCategory(key);
        const gameValue = convertHexToGameValue(value, category, level);
        
        if (gameValue > 0) {
          resourceArray.push({
            name: resourceName,
            category,
            value: gameValue,
            rawValue: value
          });
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
    
    setResources(sortedResources);
  }, [realmData]);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>{realmName}</h2>
        <p>
          <strong>Realm ID:</strong> {realmData.id} | 
          <strong> Entity ID:</strong> {realmData.entityId} |
          <strong> Level:</strong> {realmData.level || 1}
        </p>
      </div>
      
      {resources.map(category => (
        <div key={category.category} style={{ marginBottom: '2rem' }}>
          <h3>{category.category}</h3>
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
              >
                <span>{formatResourceName(resource.name)}</span>
                <span>{formatNumber(resource.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
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
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2
  });
}

function getResourceCategory(resourceKey) {
  const categories = {
    WOOD_BALANCE: 'Common',
    STONE_BALANCE: 'Common',
    COAL_BALANCE: 'Common',
    COPPER_BALANCE: 'Common',
    OBSIDIAN_BALANCE: 'Common',
    
    SILVER_BALANCE: 'Uncommon',
    GOLD_BALANCE: 'Uncommon',
    IRONWOOD_BALANCE: 'Uncommon',
    COLD_IRON_BALANCE: 'Uncommon',
    
    LABOR_BALANCE: 'Labor',
    WHEAT_BALANCE: 'Food',
    FISH_BALANCE: 'Food',
    DONKEY_BALANCE: 'Transport',
    LORDS_BALANCE: 'Lords',
    
    KNIGHT_T1_BALANCE: 'Military',
    KNIGHT_T2_BALANCE: 'Military',
    KNIGHT_T3_BALANCE: 'Military',
    PALADIN_T1_BALANCE: 'Military',
    PALADIN_T2_BALANCE: 'Military',
    PALADIN_T3_BALANCE: 'Military',
    CROSSBOWMAN_T1_BALANCE: 'Military',
    CROSSBOWMAN_T2_BALANCE: 'Military',
    CROSSBOWMAN_T3_BALANCE: 'Military'
  };
  
  return categories[resourceKey] || 'Other';
}
