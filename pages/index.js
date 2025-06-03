// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import SimpleRealmSearch from '../components/SimpleRealmSearch';
import ResourceList from '../components/ResourceList';
import RealmDebugger from '../components/RealmDebugger';
import LoadingIndicator from '../components/LoadingIndicator';

// Helper function to retry failed API calls
async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (retries <= 1) throw err;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, retries - 1, delay * 1.5);
  }
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [realmData, setRealmData] = useState(null);
  const [showDebugger, setShowDebugger] = useState(false);
  const [apiResponses, setApiResponses] = useState({});
  const [realmCache, setRealmCache] = useState({});
  const [currentRealmId, setCurrentRealmId] = useState(null);
  
  // Check for realm ID in URL when component mounts
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const realmId = params.get('realm');
    
    if (realmId) {
      setCurrentRealmId(realmId);
      handleSubmit(realmId);
    }
  }, []);

  // Update URL when a realm is viewed
  useEffect(() => {
    if (currentRealmId) {
      const url = new URL(window.location);
      url.searchParams.set('realm', currentRealmId);
      window.history.pushState({}, '', url);
    }
  }, [currentRealmId]);

  const handleSubmit = async (realmId) => {
    setLoading(true);
    setError('');
    setApiResponses({});
    setCurrentRealmId(realmId);
    
    // Clear cache for the current realm if we're refreshing it
    if (realmCache[realmId]) {
      const updatedCache = {...realmCache};
      delete updatedCache[realmId];
      setRealmCache(updatedCache);
    }
    
    try {
      // Step 1: Get all realm details including geographic data
      const realmQuery = `
        SELECT id, entity_id, realm_name, owner_name,
               x, y, regions, cities, harbors, rivers, wonder,
               internal_created_at, internal_executed_at
        FROM "s1_eternum-SettleRealmData"
        WHERE id = ${realmId};
      `;
      
      console.log('Executing realm query for realm ID:', realmId);
      
      const realmResponse = await fetchWithRetry('/api/query-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: realmQuery }),
      }, 3);
      
      const realmQueryData = await realmResponse.json();
      setApiResponses(prev => ({ ...prev, realmQuery: realmQueryData }));
      
      if (!realmResponse.ok) {
        throw new Error(`Failed to fetch realm data: ${realmQueryData.error || 'Unknown error'}`);
      }
      
      // Check if we have data in the expected format
      if (!realmQueryData.data || !Array.isArray(realmQueryData.data) || realmQueryData.data.length === 0) {
        throw new Error(`Realm with ID ${realmId} not found. The realm might not exist or there could be an issue with the API connection.`);
      }
      
      const realm = realmQueryData.data[0];
      const entityId = realm.entity_id;
      
      console.log('Found realm with entity ID:', entityId);
      
      // Step 2: Get realm level from the Structure table
      const levelQuery = `
        SELECT "base.level" as level
        FROM "s1_eternum-Structure"
        WHERE entity_id = ${entityId};
      `;
      
      console.log('Executing level query for entity ID:', entityId);
      
      const levelResponse = await fetchWithRetry('/api/query-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: levelQuery }),
      }, 3);
      
      const levelData = await levelResponse.json();
      setApiResponses(prev => ({ ...prev, levelQuery: levelData }));
      
      let realmLevel = 1; // Default level
      
      if (levelResponse.ok && levelData.data && levelData.data.length > 0) {
        realmLevel = levelData.data[0].level || 1;
      }
      
      console.log('Realm level:', realmLevel);
      
      // Step 3: Get resource data - Using a simpler query to avoid issues
      const resourceQuery = `
        SELECT *
        FROM "s1_eternum-Resource"
        WHERE entity_id = ${entityId};
      `;
      
      console.log('Executing resource query for entity ID:', entityId);
      
      // Use the same endpoint that worked for the first query
      const resourceResponse = await fetchWithRetry('/api/query-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: resourceQuery }),
      }, 3);
      
      const resourceData = await resourceResponse.json();
      setApiResponses(prev => ({ ...prev, resourceQuery: resourceData }));
      
      if (!resourceResponse.ok) {
        throw new Error(`Failed to fetch resource data: ${resourceData.error || 'Unknown error'}`);
      }
      
      if (!resourceData.data || !Array.isArray(resourceData.data) || resourceData.data.length === 0) {
        throw new Error(`No resources found for realm with ID ${realmId} (entity ID: ${entityId}).`);
      }
      
      // Create the realm data object with all the details
      const newRealmData = {
        id: realmId,
        entityId: entityId,
        level: realmLevel,
        name: realm.realm_name,
        ownerName: realm.owner_name,
        resources: resourceData.data[0],
        // Add geographic details
        x: realm.x,
        y: realm.y,
        regions: realm.regions,
        cities: realm.cities,
        harbors: realm.harbors,
        rivers: realm.rivers,
        wonder: realm.wonder,
        // Add timestamps
        createdAt: realm.internal_created_at,
        executedAt: realm.internal_executed_at,
        timestamp: Date.now()
      };
      
      // Set the data
      setRealmData(newRealmData);
      
      // Update cache (limit to 10 most recent realms)
      setRealmCache(prevCache => {
        const newCache = { ...prevCache, [realmId]: newRealmData };
        const cacheKeys = Object.keys(newCache);
        if (cacheKeys.length > 10) {
          // Find the oldest entry based on timestamp
          const oldestKey = cacheKeys.reduce((oldest, key) => {
            if (!oldest) return key;
            return newCache[key].timestamp < newCache[oldest].timestamp ? key : oldest;
          }, null);
          
          if (oldestKey) {
            delete newCache[oldestKey];
          }
        }
        return newCache;
      });
    } catch (err) {
      console.error('Error fetching realm data:', err);
      setError(err.message || 'Failed to fetch realm data.');
      // Always show debugger when there's an error
      setShowDebugger(true);
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
        
        {/* Simple search component */}
        <SimpleRealmSearch onSubmit={handleSubmit} loading={loading} />
        
        {/* Navigation links */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/realms-explorer" style={{ color: 'var(--color-primary)' }}>
            Realms Explorer →
          </Link>
          <Link href="/diagnose" style={{ color: 'var(--color-primary)' }}>
            Diagnostic Tools →
          </Link>
        </div>
        
        {error && (
          <div className="error">
            <p>{error}</p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button 
                onClick={() => currentRealmId && handleSubmit(currentRealmId)}
                style={{ backgroundColor: 'var(--color-secondary)' }}
              >
                Try Again
              </button>
              <button 
                onClick={() => setShowDebugger(!showDebugger)}
                style={{ 
                  backgroundColor: 'transparent',
                  border: '1px solid var(--color-error)',
                  color: 'var(--color-error)'
                }}
              >
                {showDebugger ? 'Hide Debug Info' : 'Show Debug Info'}
              </button>
            </div>
          </div>
        )}
        
        {loading && <LoadingIndicator message="Loading realm data..." />}
        
        {realmData && <ResourceList realmData={realmData} onRefresh={handleSubmit} />}
        
        {showDebugger && (
          <div style={{ marginTop: '2rem' }}>
            <h3>Debug Information</h3>
            <p>Cached Realms: {Object.keys(realmCache).join(', ') || 'None'}</p>
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
