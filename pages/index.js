// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import RealmForm from '../components/RealmForm';
import ResourceList from '../components/ResourceList';
import RealmDebugger from '../components/RealmDebugger';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [realmData, setRealmData] = useState(null);
  const [showDebugger, setShowDebugger] = useState(false);
  const [apiResponses, setApiResponses] = useState({});
  
  // Check for realm ID in URL when component mounts
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const realmId = params.get('realm');
    
    if (realmId) {
      handleSubmit(realmId);
    }
  }, []);

  const handleSubmit = async (realmId) => {
    setLoading(true);
    setError('');
    setApiResponses({});
    
    try {
      // Step 1: Get entity ID and realm info
      const entityQuery = `
        SELECT id, entity_id, realm_name, owner_name
        FROM "s1_eternum-SettleRealmData"
        WHERE id = ${realmId};
      `;
      
      console.log('Executing entity query for realm ID:', realmId);
      
      const entityResponse = await fetch('/api/query-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: entityQuery }),
      });
      
      const entityData = await entityResponse.json();
      setApiResponses(prev => ({ ...prev, entityQuery: entityData }));
      
      if (!entityResponse.ok) {
        throw new Error(`Failed to fetch realm data: ${entityData.error || 'Unknown error'}`);
      }
      
      // Check if we have data in the expected format
      if (!entityData.data || !Array.isArray(entityData.data) || entityData.data.length === 0) {
        throw new Error(`Realm with ID ${realmId} not found. The realm might not exist or there could be an issue with the API connection.`);
      }
      
      const realm = entityData.data[0];
      const entityId = realm.entity_id;
      
      console.log('Found realm with entity ID:', entityId);
      
      // Step 2: Get realm level
      const levelQuery = `
        SELECT "base.level" as level
        FROM "s1_eternum-Structure"
        WHERE entity_id = ${entityId};
      `;
      
      console.log('Executing level query for entity ID:', entityId);
      
      const levelResponse = await fetch('/api/query-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: levelQuery }),
      });
      
      const levelData = await levelResponse.json();
      setApiResponses(prev => ({ ...prev, levelQuery: levelData }));
      
      let realmLevel = 1;
      if (levelResponse.ok && levelData.data && Array.isArray(levelData.data) && levelData.data.length > 0) {
        realmLevel = levelData.data[0].level || 1;
      } else {
        console.warn('Level query failed or returned no data, defaulting to level 1');
      }
      
      // Step 3: Get resource data
      const resourceQuery = `
        SELECT 
          entity_id,
          WOOD_BALANCE, STONE_BALANCE, COAL_BALANCE, COPPER_BALANCE, OBSIDIAN_BALANCE,
          SILVER_BALANCE, GOLD_BALANCE, IRONWOOD_BALANCE, COLD_IRON_BALANCE,
          LABOR_BALANCE, WHEAT_BALANCE, FISH_BALANCE, DONKEY_BALANCE, LORDS_BALANCE
        FROM "s1_eternum-Resource"
        WHERE entity_id = ${entityId};
      `;
      
      console.log('Executing resource query for entity ID:', entityId);
      
      const resourceResponse = await fetch('/api/query-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: resourceQuery }),
      });
      
      const resourceData = await resourceResponse.json();
      setApiResponses(prev => ({ ...prev, resourceQuery: resourceData }));
      
      if (!resourceResponse.ok) {
        throw new Error(`Failed to fetch resource data: ${resourceData.error || 'Unknown error'}`);
      }
      
      if (!resourceData.data || !Array.isArray(resourceData.data) || resourceData.data.length === 0) {
        throw new Error(`No resources found for realm with ID ${realmId} (entity ID: ${entityId}).`);
      }
      
      // Set the combined data
      setRealmData({
        id: realmId,
        entityId,
        level: realmLevel,
        name: realm.realm_name,
        ownerName: realm.owner_name,
        resources: resourceData.data[0]
      });
    } catch (err) {
      console.error('Error fetching realm data:', err);
      setError(err.message || 'Failed to fetch realm data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Eternum Resource Viewer</title>
        <meta name="description" content="View resources for your Eternum realm" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>Eternum Resource Viewer</h1>
        
        <RealmForm onSubmit={handleSubmit} loading={loading} />
        
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
          <Link href="/find-realms" style={{ color: 'var(--color-primary)' }}>
            Find Valid Realm IDs →
          </Link>
          <Link href="/diagnose" style={{ color: 'var(--color-primary)' }}>
            Diagnostic Tools →
          </Link>
        </div>
        
        {error && (
          <div className="error">
            <p>{error}</p>
            <button 
              onClick={() => setShowDebugger(!showDebugger)}
              style={{ 
                marginTop: '0.5rem', 
                backgroundColor: 'transparent',
                border: '1px solid var(--color-error)',
                color: 'var(--color-error)',
                padding: '0.25rem 0.5rem'
              }}
            >
              {showDebugger ? 'Hide Debugger' : 'Show Debugger'}
            </button>
          </div>
        )}
        
        {loading && <div className="loading">Loading...</div>}
        
        {realmData && <ResourceList realmData={realmData} />}
        
        {showDebugger && (
          <div style={{ marginTop: '2rem' }}>
            <h3>Debug Information</h3>
            <p>API responses for troubleshooting:</p>
            <pre style={{ 
              backgroundColor: '#111',
              padding: '1rem',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '300px'
            }}>
              {JSON.stringify(apiResponses, null, 2)}
            </pre>
          </div>
        )}
        
        <div style={{ marginTop: '3rem', borderTop: '1px solid #333', paddingTop: '1rem' }}>
          <button 
            onClick={() => setShowDebugger(!showDebugger)} 
            style={{ backgroundColor: 'var(--color-secondary)' }}
          >
            {showDebugger ? 'Hide Debug Tools' : 'Show Debug Tools'}
          </button>
          
          {showDebugger && <RealmDebugger />}
        </div>
      </main>
    </div>
  );
}
