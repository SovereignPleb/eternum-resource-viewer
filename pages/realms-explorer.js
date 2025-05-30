// pages/realms-explorer.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { decodeRealmName } from '../utils/conversion';

export default function RealmsExplorer() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [realms, setRealms] = useState([]);
  const [showHex, setShowHex] = useState(false);
  const [sortField, setSortField] = useState('realm_id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState(50);
  const [queryType, setQueryType] = useState('recent'); // 'recent' or 'range'
  const [minId, setMinId] = useState(1);
  const [maxId, setMaxId] = useState(1000);

  // Function to fetch realms data
  const fetchRealms = async () => {
    setLoading(true);
    setError('');
    
    try {
      let query;
      
      if (queryType === 'recent') {
        // Get most recent realms
        query = `
          SELECT id, entity_id, realm_name, owner_name
          FROM "s1_eternum-SettleRealmData"
          ORDER BY id DESC
          LIMIT ${limit};
        `;
      } else {
        // Search within ID range
        query = `
          SELECT id, entity_id, realm_name, owner_name
          FROM "s1_eternum-SettleRealmData"
          WHERE id BETWEEN ${minId} AND ${maxId}
          ORDER BY id
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
        throw new Error(`Failed to fetch realms: ${data.error || 'Unknown error'}`);
      }
      
      if (!data.data || data.data.length === 0) {
        setError(`No realms found ${queryType === 'range' ? 'in the specified range' : ''}.`);
        setRealms([]);
        return;
      }
      
      // Transform the API data to our format
      const transformedRealms = data.data.map(realm => ({
        entity_id: realm.entity_id,
        realm_id: realm.id,
        realm_name: realm.realm_name,
        owner_name: realm.owner_name,
        decoded_name: decodeRealmName(realm.realm_name)
      }));
      
      setRealms(transformedRealms);
    } catch (err) {
      console.error('Error fetching realms:', err);
      setError(err.message || 'Failed to fetch realms data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch realms on initial load
  useEffect(() => {
    fetchRealms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle sort column click
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort realms
  const filteredAndSortedRealms = realms
    .filter(realm => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        realm.decoded_name.toLowerCase().includes(searchLower) ||
        realm.realm_id.toString().includes(searchTerm) ||
        realm.entity_id.toString().includes(searchTerm) ||
        (realm.owner_name && realm.owner_name.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      let valueA = a[sortField];
      let valueB = b[sortField];
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

  return (
    <div className="container">
      <Head>
        <title>Eternum Realms Explorer</title>
        <meta name="description" content="Explore realms in the Eternum game" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>Eternum Realms Explorer</h1>
        
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/" style={{ color: 'var(--color-primary)' }}>
            &larr; Back to Resource Viewer
          </Link>
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <p>Explore and search realms in the Eternum game. Click on a realm ID to view its resources.</p>
        </div>
        
        {/* Query Controls */}
        <div style={{ 
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: 'var(--color-secondary)',
          borderRadius: '4px'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="radio"
                  name="queryType"
                  value="recent"
                  checked={queryType === 'recent'}
                  onChange={() => setQueryType('recent')}
                />
                Most Recent Realms
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="radio"
                  name="queryType"
                  value="range"
                  checked={queryType === 'range'}
                  onChange={() => setQueryType('range')}
                />
                Search by ID Range
              </label>
            </div>
            
            {queryType === 'range' && (
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Min ID:
                  </label>
                  <input
                    type="number"
                    value={minId}
                    onChange={(e) => setMinId(Number(e.target.value))}
                    min="1"
                    style={{ width: '100%' }}
                    disabled={loading}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Max ID:
                  </label>
                  <input
                    type="number"
                    value={maxId}
                    onChange={(e) => setMaxId(Number(e.target.value))}
                    min={minId}
                    style={{ width: '100%' }}
                    disabled={loading}
                  />
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Limit Results:
                </label>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  style={{ 
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)',
                    border: '1px solid #444',
                    borderRadius: '4px'
                  }}
                  disabled={loading}
                >
                  <option value={10}>10 realms</option>
                  <option value={25}>25 realms</option>
                  <option value={50}>50 realms</option>
                  <option value={100}>100 realms</option>
                  <option value={200}>200 realms</option>
                </select>
              </div>
              
              <button
                onClick={fetchRealms}
                disabled={loading}
                style={{ padding: '0.5rem 1rem' }}
              >
                {loading ? 'Loading...' : 'Fetch Realms'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Search and Display Controls */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <div style={{ flex: 1, maxWidth: '400px' }}>
            <input
              type="text"
              placeholder="Search by name, ID, or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <button
              onClick={() => setShowHex(!showHex)}
              style={{ 
                backgroundColor: 'var(--color-secondary)',
                padding: '0.5rem 1rem'
              }}
            >
              {showHex ? 'Hide Hex Names' : 'Show Hex Names'}
            </button>
          </div>
        </div>
        
        {/* Error Display */}
        {error && <div className="error">{error}</div>}
        
        {/* Loading Display */}
        {loading && (
          <div className="loading">
            Loading realms data...
          </div>
        )}
        
        {/* Results Display */}
        {!loading && filteredAndSortedRealms.length > 0 && (
          <div style={{ 
            overflowX: 'auto',
            marginBottom: '2rem',
            border: '1px solid #444',
            borderRadius: '4px'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-secondary)' }}>
                  <th 
                    style={{ 
                      padding: '0.75rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderBottom: '1px solid #444'
                    }}
                    onClick={() => handleSort('realm_id')}
                  >
                    Realm ID
                    {sortField === 'realm_id' && (
                      <span style={{ marginLeft: '0.25rem' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    style={{ 
                      padding: '0.75rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderBottom: '1px solid #444'
                    }}
                    onClick={() => handleSort('entity_id')}
                  >
                    Entity ID
                    {sortField === 'entity_id' && (
                      <span style={{ marginLeft: '0.25rem' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    style={{ 
                      padding: '0.75rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderBottom: '1px solid #444'
                    }}
                    onClick={() => handleSort('decoded_name')}
                  >
                    Realm Name
                    {sortField === 'decoded_name' && (
                      <span style={{ marginLeft: '0.25rem' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    style={{ 
                      padding: '0.75rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderBottom: '1px solid #444'
                    }}
                    onClick={() => handleSort('owner_name')}
                  >
                    Owner
                    {sortField === 'owner_name' && (
                      <span style={{ marginLeft: '0.25rem' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    style={{ 
                      padding: '0.75rem',
                      textAlign: 'center',
                      borderBottom: '1px solid #444'
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedRealms.map((realm) => (
                  <tr 
                    key={realm.entity_id}
                    style={{ 
                      borderBottom: '1px solid #333',
                      backgroundColor: 'transparent',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-secondary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '0.75rem' }}>
                      <Link 
                        href={`/?realm=${realm.realm_id}`}
                        style={{ 
                          color: 'var(--color-primary)',
                          fontWeight: 'bold'
                        }}
                      >
                        {realm.realm_id}
                      </Link>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{realm.entity_id}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <div>{realm.decoded_name || 'Unknown'}</div>
                      {showHex && realm.realm_name && (
                        <div style={{ 
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          color: '#888',
                          marginTop: '0.25rem',
                          wordBreak: 'break-all'
                        }}>
                          {realm.realm_name}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>{realm.owner_name || 'Unknown'}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <Link 
                        href={`/?realm=${realm.realm_id}`}
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          backgroundColor: 'var(--color-primary)',
                          color: '#000',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                          fontSize: '0.875rem'
                        }}
                      >
                        View Resources
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && filteredAndSortedRealms.length === 0 && !error && (
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center',
            backgroundColor: 'var(--color-secondary)',
            borderRadius: '4px',
            marginBottom: '2rem'
          }}>
            <p>No realms found matching your criteria.</p>
            <button 
              onClick={fetchRealms}
              style={{ marginTop: '1rem' }}
            >
              Reset Search
            </button>
          </div>
        )}
        
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem',
          backgroundColor: 'var(--color-secondary)',
          borderRadius: '4px',
          fontSize: '0.875rem'
        }}>
          <h3 style={{ marginBottom: '0.5rem' }}>About Realm Data</h3>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '0' }}>
            <li>Realm IDs are the public identifiers shown in-game</li>
            <li>Entity IDs are internal database identifiers used to link resources</li>
            <li>Realm names are stored as hexadecimal values on the blockchain</li>
            <li>Owner names may not be available for all realms</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
