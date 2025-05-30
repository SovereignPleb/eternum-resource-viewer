// components/EnhancedRealmSearch.js
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { decodeRealmName } from '../utils/conversion';

export default function EnhancedRealmSearch({ onSubmit, loading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [allRealms, setAllRealms] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [resultCount, setResultCount] = useState(0);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Load all realms data once on component mount
  useEffect(() => {
    fetchAllRealms();
    
    // Add click outside listener to close dropdown
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch all realms for searching
  const fetchAllRealms = async () => {
    setSearchLoading(true);
    setSearchError('');
    
    try {
      const query = `
        SELECT id, entity_id, realm_name
        FROM "s1_eternum-SettleRealmData"
        ORDER BY id;
      `;
      
      const response = await fetch('/api/query-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to fetch realm data: ${data.error || 'Unknown error'}`);
      }
      
      if (!data.data || data.data.length === 0) {
        throw new Error('No realms found in database.');
      }
      
      // Transform the API data to our format with decoded names
      const transformedRealms = data.data.map(realm => ({
        entity_id: realm.entity_id,
        realm_id: realm.id,
        realm_name: realm.realm_name,
        decoded_name: decodeRealmName(realm.realm_name)
      }));
      
      setAllRealms(transformedRealms);
      setDataLoaded(true);
    } catch (err) {
      console.error('Error fetching all realms:', err);
      setSearchError(err.message || 'Failed to load realms data.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Search when the search term changes
  useEffect(() => {
    if (!dataLoaded || !searchTerm) {
      setSearchResults([]);
      setShowResults(false);
      setResultCount(0);
      return;
    }
    
    // Filter realms based on search term
    const searchLower = searchTerm.toLowerCase();
    const filtered = allRealms.filter(realm => {
      return (
        realm.decoded_name.toLowerCase().includes(searchLower) ||
        realm.realm_id.toString().includes(searchTerm) ||
        realm.entity_id.toString().includes(searchTerm)
      );
    });
    
    // Update count of total matches
    setResultCount(filtered.length);
    
    // Limit to first 10 results for dropdown
    const limitedResults = filtered.slice(0, 10);
    
    setSearchResults(limitedResults);
    setShowResults(limitedResults.length > 0);
  }, [searchTerm, allRealms, dataLoaded]);

  // Handle search submission
  const handleSubmit = () => {
    if (!searchTerm) return;
    
    // If search is a direct realm ID match, submit that
    const directIdMatch = allRealms.find(realm => 
      realm.realm_id.toString() === searchTerm
    );
    
    if (directIdMatch) {
      onSubmit(directIdMatch.realm_id);
      setShowResults(false);
      setSearchTerm(''); // Clear search after submission
      return;
    }
    
    // If it's an entity ID match, submit the corresponding realm ID
    const entityIdMatch = allRealms.find(realm => 
      realm.entity_id.toString() === searchTerm
    );
    
    if (entityIdMatch) {
      onSubmit(entityIdMatch.realm_id);
      setShowResults(false);
      setSearchTerm(''); // Clear search after submission
      return;
    }
    
    // If there's at least one name match in results, submit the first one
    if (searchResults.length > 0) {
      onSubmit(searchResults[0].realm_id);
      setShowResults(false);
      setSearchTerm(''); // Clear search after submission
      return;
    }
    
    // Last resort - try to submit as a realm ID if it's numeric
    if (/^\d+$/.test(searchTerm)) {
      onSubmit(searchTerm);
      setShowResults(false);
      setSearchTerm(''); // Clear search after submission
    } else {
      setSearchError('No matching realms found. Try a different search term.');
    }
  };

  // Handle key press for Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      // Close dropdown on escape key
      setShowResults(false);
    }
  };

  // Select a realm from the results dropdown
  const selectRealm = (realmId) => {
    onSubmit(realmId);
    setShowResults(false);
    setSearchTerm(''); // Clear search after selection
  };

  // Handle input change
  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setSearchError(''); // Clear any previous errors
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (searchTerm && searchResults.length > 0) {
      setShowResults(true);
    }
  };

  return (
    <div ref={searchRef} style={{ position: 'relative', marginBottom: '2rem' }}>
      {/* Main search box */}
      <div style={{ 
        padding: '1.5rem', 
        backgroundColor: 'var(--color-secondary)', 
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        border: '1px solid #444'
      }}>
        <div>
          <label htmlFor="realmSearch" style={{ 
            display: 'block', 
            marginBottom: '0.75rem', 
            fontWeight: 'bold',
            fontSize: '1.1rem',
            color: 'var(--color-primary)'
          }}>
            Search for a Realm:
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              ref={inputRef}
              type="text"
              id="realmSearch"
              value={searchTerm}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              onFocus={handleInputFocus}
              placeholder="Enter realm name, ID, or entity ID..."
              disabled={loading || searchLoading}
              style={{ 
                flex: 1, 
                padding: '0.75rem',
                fontSize: '1rem',
                backgroundColor: 'var(--color-background)',
                border: '1px solid #555',
                borderRadius: '4px'
              }}
            />
            <button 
              onClick={handleSubmit}
              disabled={loading || searchLoading || !searchTerm}
              style={{ 
                whiteSpace: 'nowrap',
                padding: '0 1.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                height: 'auto'
              }}
            >
              {loading ? 'Loading...' : 'Search'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Help text */}
      {!dataLoaded && !searchError && (
        <div style={{ 
          fontSize: '0.9rem', 
          color: 'var(--color-primary)', 
          marginTop: '0.75rem',
          textAlign: 'center',
          padding: '0.5rem',
          backgroundColor: 'rgba(192, 168, 110, 0.1)',
          borderRadius: '4px'
        }}>
          <div className="loading-spinner" style={{ 
            width: '20px', 
            height: '20px',
            borderWidth: '2px',
            display: 'inline-block',
            marginRight: '0.5rem',
            verticalAlign: 'middle'
          }}></div>
          Loading realms data...
        </div>
      )}
      
      {searchError && (
        <div style={{ 
          fontSize: '0.9rem', 
          color: 'var(--color-error)', 
          marginTop: '0.75rem',
          padding: '0.5rem',
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          borderRadius: '4px',
          borderLeft: '3px solid var(--color-error)'
        }}>
          {searchError}
        </div>
      )}
      
      {dataLoaded && !searchError && (
        <div style={{ 
          fontSize: '0.9rem', 
          color: '#999', 
          marginTop: '0.75rem',
          textAlign: 'center'
        }}>
          Search by realm name, realm ID, or entity ID
        </div>
      )}
      
      {/* Result count display */}
      {searchTerm && resultCount > 0 && (
        <div style={{ 
          fontSize: '0.9rem',
          color: 'var(--color-primary)',
          marginTop: '0.75rem',
          marginBottom: showResults ? '0' : '0.75rem',
          fontWeight: 'bold'
        }}>
          Found {resultCount} matching {resultCount === 1 ? 'realm' : 'realms'}
        </div>
      )}
      
      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <div 
          style={{ 
            position: 'absolute', 
            top: 'auto', // Position below the result count instead of the search box
            left: 0, 
            right: 0, 
            zIndex: 100, // Higher z-index to ensure it appears above other content
            backgroundColor: 'var(--color-background)',
            border: '1px solid #555',
            borderRadius: '8px',
            marginTop: '0.5rem',
            maxHeight: '400px',
            overflowY: 'auto',
            boxShadow: '0 6px 12px rgba(0,0,0,0.3)'
          }}
        >
          {searchResults.map((realm) => (
            <div 
              key={realm.entity_id}
              onClick={() => selectRealm(realm.realm_id)}
              style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid #333',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-secondary)';
                e.currentTarget.style.transform = 'translateX(5px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <div style={{ fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '1.05rem' }}>
                {realm.decoded_name || 'Unknown Realm'}
              </div>
              <div style={{ 
                display: 'flex', 
                gap: '1.5rem', 
                fontSize: '0.9rem', 
                marginTop: '0.5rem',
                color: '#ccc' 
              }}>
                <div>Realm ID: <span style={{ color: 'white', fontWeight: 'bold' }}>{realm.realm_id}</span></div>
                <div>Entity ID: <span style={{ color: 'white' }}>{realm.entity_id}</span></div>
              </div>
            </div>
          ))}
          
          {resultCount > 10 && (
            <div style={{ 
              padding: '0.75rem', 
              textAlign: 'center',
              borderTop: '1px solid #444',
              fontSize: '0.9rem',
              backgroundColor: 'var(--color-secondary)'
            }}>
              <Link href="/realms-explorer" style={{ 
                color: 'var(--color-primary)',
                fontWeight: 'bold',
                display: 'block',
                padding: '0.5rem'
              }}>
                View all {resultCount} matching realms in Explorer →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
