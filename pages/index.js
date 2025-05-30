// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import EnhancedRealmSearch from '../components/EnhancedRealmSearch';
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
    
    // Check cache first
    if (realmCache[realmId]) {
      console.log('Using cached data for realm:', realmId);
      setRealmData(realmCache[realmId]);
      setLoading(false);
      return;
    }
    
    try {
      // Step 1: Combined query to get both entity info and level in one request
      const combinedQuery = `
        SELECT 
          r.id, r.entity_id, r.realm_name, r.owner_name,
          s."base.level" as level
        FROM "s1_eternum-SettleRealmData" r
        LEFT JOIN "s1_eternum-Structure" s ON r.entity_id = s.entity_id
        WHERE r.id = ${realmId};
      `;
      
      console.log('Executing combined query for realm ID:', realmId);
      
      const combinedResponse = await fetchWithRetry('/api/query-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: combinedQuery }),
      }, 3);
      
      const combinedData = await combinedResponse.json();
      setApiResponses(prev => ({ ...prev, combinedQuery: combinedData }));
      
      if (!combinedResponse.ok) {
        throw new Error(`Failed to fetch realm data: ${combinedData.error || 'Unknown error'}`);
      }
      
      // Check if we have data in the expected format
      if (!combinedData.data || !Array.isArray(combinedData.data) || combinedData.data.length === 0) {
        throw new Error(`Realm with ID ${realmId} not found. The realm might not exist or there could be an issue with the API connection.`);
      }
      
      const realm = combinedData.data[0];
      const entityId = realm.entity_id;
      const realmLevel = realm.level || 1;
      
      console.log('Found realm with entity ID:', entityId, 'and level:', realmLevel);
      
      // Step 2: Get resource data
      const resourceQuery = `
        SELECT 
          entity_id,
          WOOD_BALANCE, STONE_BALANCE, COAL_BALANCE, COPPER_BALANCE, OBSIDIAN_BALANCE,
          SILVER_BALANCE, GOLD_BALANCE, IRONWOOD_BALANCE, COLD_IRON_BALANCE,
          LABOR_BALANCE, WHEAT_BALANCE, FISH_BALANCE, DONKEY_BALANCE, LORDS_BALANCE,
          KNIGHT_T1_BALANCE, KNIGHT_T2_BALANCE, KNIGHT_T3_BALANCE,
          PALADIN_T1_BALANCE, PALADIN_T2_BALANCE, PALADIN_T3_BALANCE,
          CROSSBOWMAN_T1_BALANCE, CROSSBOWMAN_T2_BALANCE, CROSSBOWMAN_T3_BALANCE
        FROM "s1_eternum-Resource"
        WHERE entity_id = ${entityId};
      `;
      
      console.log('Executing resource query for entity ID:', entityId);
      
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
      
      // Create the realm data object
      const newRealmData = {
        id: realmId,
        entityId,
        level: realmLevel,
        name: realm.realm_name,
        ownerName: realm.owner_name,
        resources: resourceData.data[0],
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
        
        {/* Enhanced search component */}
        <EnhancedRealmSearch onSubmit={handleSubmit} loading={loading} />
        
        {/* Navigation links - displayed below search results to avoid overlap */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/realms-explorer" style={{ color: 'var(--color-primary)' }}>
            Realms Explorer →
          </Link>
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
              <Link href="/find-realms">
                <button style={{ backgroundColor: 'var(--color-secondary)' }}>
                  Find Valid Realm IDs
                </button>
              </Link>
            </div>
          </div>
        )}
        
        {loading && <LoadingIndicator message="Loading realm data..." />}
        
        {realmData && <ResourceList realmData={realmData} />}
        
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
