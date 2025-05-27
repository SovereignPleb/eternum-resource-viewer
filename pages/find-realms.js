// pages/find-realms.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function FindRealms() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [realms, setRealms] = useState([]);
  const [minId, setMinId] = useState(1);
  const [maxId, setMaxId] = useState(1000);
  const [limit, setLimit] = useState(20);
  const [searchType, setSearchType] = useState('range'); // 'range' or 'recent'

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
      
      setRealms(data.data);
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
        
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/" style={{ color: 'var(--color-primary)' }}>
            &larr; Back to Resource Viewer
          </Link>
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <p>Use this tool to find valid realm IDs that you can use in the Resource Viewer.</p>
        </div>
        
        <form onSubmit={findRealms} style={{ marginBottom: '2rem' }}>
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
            <input
              type="number"
              id="limit"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              min="1"
              max="100"
              disabled={loading}
              style={{ width: '100px' }}
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Find Realms'}
          </button>
        </form>
        
        {error && <div className="error">{error}</div>}
        
        {loading && <div className="loading">Searching for realms...</div>}
        
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
                  style={{
                    display: 'block',
                    padding: '1rem',
                    backgroundColor: 'var(--color-secondary)',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    color: 'var(--color-text)',
                    transition: 'transform 0.2s',
                    transform: 'translateY(0)',
                    hoverStyle: {
                      transform: 'translateY(-5px)'
                    }
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Realm #{realm.id}
                  </div>
                  <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    Entity ID: {realm.entity_id}
                  </div>
                  <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    Name: {formatRealmName(realm.realm_name)}
                  </div>
                  {realm.owner_name && (
                    <div style={{ fontSize: '0.9rem' }}>
                      Owner: {realm.owner_name}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function formatRealmName(name) {
  if (!name) return 'Unknown';
  if (name.startsWith('0x')) {
    // This is a hex encoded name that needs to be decoded
    // In a real app, you would decode this, but for simplicity
    // we'll just show it's a hex name
    return '[Hex encoded name]';
  }
  return name;
}
