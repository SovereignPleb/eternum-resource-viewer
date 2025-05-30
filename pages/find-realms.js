// pages/find-realms.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import LoadingIndicator from '../components/LoadingIndicator';
import { decodeRealmName } from '../utils/conversion';

export default function FindRealms() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [realms, setRealms] = useState([]);
  const [minId, setMinId] = useState(1);
  const [maxId, setMaxId] = useState(1000);
  const [limit, setLimit] = useState(20);
  const [searchType, setSearchType] = useState('recent'); // 'range' or 'recent'
  const [lastUsedQuery, setLastUsedQuery] = useState(null);

  // Helper function to format realm data
  const formatRealmData = (apiData) => {
    if (!apiData || !Array.isArray(apiData)) return [];
    
    return apiData.map(realm => ({
      id: realm.id,
      entity_id: realm.entity_id,
      name: realm.realm_name,
      owner_name: realm.owner_name,
      decoded_name: decodeRealmName(realm.realm_name)
    }));
  };

  const findRealms = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      let query;
      
      if (searchType === 'range') {
        // Search within ID range
        query = `
          SELECT id, entity_id, realm_name, owner_name
          FROM "s1_eternum-SettleRealmData"
          WHERE id BETWEEN ${minId} AND ${maxId}
          ORDER BY id
          LIMIT ${limit};
        `;
      } else {
        // Get most recent realms
        query = `
          SELECT id, entity_id, realm_name, owner_name
          FROM "s1_eternum-SettleRealmData"
          ORDER BY id DESC
          LIMIT ${limit};
        `;
      }
      
      setLastUsedQuery(query);
      
      const response = await fetch('/api/query-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to find realms: ${data.error || 'Unknown error'}`);
      }
      
      if (!data.data || data.data.length === 0) {
        setError(`No realms found ${searchType === 'range' ? 'in the specified range' : 'in the database'}.`);
        setRealms([]);
        return;
      }
      
      setRealms(formatRealmData(data.data));
    } catch (err) {
      console.error('Error finding realms:', err);
      setError(err.message || 'Failed to find realms.');
    } finally {
      setLoading(false);
    }
  };

  // Find the most recent realms when the page loads
  useEffect(() => {
    setSearchType('recent');
    findRealms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Retry the last query if there was an error
  const handleRetry = () => {
    if (!lastUsedQuery) return;
    setLoading(true);
    setError('');
    
    fetch('/api/query-sql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: lastUsedQuery }),
    })
      .then(response => response.json())
      .then(data => {
        if (!data.data || data.data.length === 0) {
          setError(`No realms found ${searchType === 'range' ? 'in the specified range' : 'in the database'}.`);
          setRealms([]);
          return;
        }
        
        setRealms(formatRealmData(data.data));
      })
      .catch(err => {
        console.error('Error retrying query:', err);
        setError(err.message || 'Failed to retry query.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="container">
      <Head>
        <title>Find Eternum Realms</title>
        <meta name="description" content="Find valid realm IDs for Eternum Resource Viewer" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>Find Eternum Realms</h1>
        
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: 'var(--color-primary)' }}>
            &larr; Back to Resource Viewer
          </Link>
          <Link href="/realms-explorer" style={{ color: 'var(--color-primary)' }}>
            Realms Explorer →
          </Link>
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <p>Use this tool to find valid realm IDs that you can use in the Resource Viewer.</p>
          <p>For a more advanced search experience, try the <Link href="/realms-explorer" style={{ color: 'var(--color-primary)' }}>Realms Explorer</Link>.</p>
        </div>
        
        <div className="card">
          <form onSubmit={findRealms}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Search Type:
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label>
                  <input
                    type="radio"
                    name="searchType"
                    value="range"
                    checked={searchType === 'range'}
                    onChange={() => setSearchType('range')}
                  />
                  {' '}Search by ID Range
                </label>
                <label>
                  <input
                    type="radio"
                    name="searchType"
                    value="recent"
                    checked={searchType === 'recent'}
                    onChange={() => setSearchType('recent')}
                  />
                  {' '}Most Recent Realms
                </label>
              </div>
            </div>
            
            {searchType === 'range' && (
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="minId" style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Min ID:
                  </label>
                  <input
                    type="number"
                    id="minId"
                    value={minId}
                    onChange={(e) => setMinId(Number(e.target.value))}
                    min="1"
                    disabled={loading}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="maxId" style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Max ID:
                  </label>
                  <input
                    type="number"
                    id="maxId"
                    value={maxId}
                    onChange={(e) => setMaxId(Number(e.target.value))}
                    min={minId}
                    disabled={loading}
                  />
                </div>
              </div>
            )}
            
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="limit" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Limit (max results):
              </label>
              <select
                id="limit"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                disabled={loading}
                style={{ 
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text)',
                  border: '1px solid #444',
                  borderRadius: '4px'
                }}
              >
                <option value={10}>10 realms</option>
                <option value={20}>20 realms</option>
                <option value={50}>50 realms</option>
                <option value={100}>100 realms</option>
              </select>
            </div>
            
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Searching...' : 'Find Realms'}
            </button>
          </form>
        </div>
        
        {error && (
          <div className="error">
            <p>{error}</p>
            <button 
              onClick={handleRetry} 
              disabled={loading || !lastUsedQuery}
              style={{ 
                marginTop: '0.5rem',
                backgroundColor: 'var(--color-secondary)'
              }}
            >
              Try Again
            </button>
          </div>
        )}
        
        {loading && <LoadingIndicator message="Searching for realms..." />}
        
        {realms.length > 0 && (
          <div>
            <h2>Found {realms.length} Realms</h2>
            <p>Click on a realm ID to view its resources.</p>
            
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem',
              marginTop: '1rem'
            }}>
              {realms.map((realm) => (
                <Link 
                  href={`/?realm=${realm.id}`} 
                  key={realm.id}
                >
                  <div className="card" style={{ 
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                        Realm #{realm.id}
                      </div>
                      <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                        Entity ID: {realm.entity_id}
                      </div>
                      <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                        Name: {realm.decoded_name || 'Unknown'}
                      </div>
                      {realm.owner_name && (
                        <div style={{ fontSize: '0.9rem' }}>
                          Owner: {realm.owner_name}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ 
                      marginTop: '1rem', 
                      textAlign: 'center', 
                      padding: '0.25rem',
                      backgroundColor: 'rgba(192, 168, 110, 0.2)',
                      borderRadius: '4px',
                      fontSize: '0.85rem'
                    }}>
                      View Resources
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {!loading && !error && realms.length === 0 && (
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center',
            backgroundColor: 'var(--color-secondary)',
            borderRadius: '4px',
            marginTop: '1rem'
          }}>
            <p>No realms found. Try adjusting your search parameters.</p>
          </div>
        )}
      </main>
    </div>
  );
}
