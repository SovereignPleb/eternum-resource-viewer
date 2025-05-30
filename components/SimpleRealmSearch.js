// components/SimpleRealmSearch.js
import { useState, useEffect, useRef } from 'react';
import { decodeRealmName } from '../utils/conversion';

export default function SimpleRealmSearch({ onSubmit, loading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [allRealms, setAllRealms] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

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
      
      // Transform the API data to our format
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
    }
  };

  // Update search results when search term changes
  useEffect(() => {
    if (!searchTerm || !dataLoaded) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    
    // Filter realms based on search term
    const searchLower = searchTerm.toLowerCase();
    const filtered = allRealms.filter(realm => {
      return (
        // Match by name
        realm.decoded_name.toLowerCase().includes(searchLower) ||
        // Match by realm ID
        realm.realm_id.toString().includes(searchTerm) ||
        // Match by entity ID
        realm.entity_id.toString().includes(searchTerm)
      );
    });
    
    // Limit to first 10 results for dropdown
    const limitedResults = filtered.slice(0, 10);
    
    setSearchResults(limitedResults);
    setShowResults(limitedResults.length > 0);
  }, [searchTerm, allRealms, dataLoaded]);

  // Handle search submission
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    
    if (!searchTerm) return;
    
    // If there's exactly one match or it's a direct ID match, submit that
    if (searchResults.length === 1) {
      selectRealm(searchResults[0].realm_id);
      return;
    }
    
    // Try exact matches first
    const exactRealmIdMatch = searchResults.find(realm => 
      realm.realm_id.toString() === searchTerm
    );
    
    if (exactRealmIdMatch) {
      selectRealm(exactRealmIdMatch.realm_id);
      return;
    }
    
    const exactEntityIdMatch = searchResults.find(realm => 
      realm.entity_id.toString() === searchTerm
    );
    
    if (exactEntityIdMatch) {
      selectRealm(exactEntityIdMatch.realm_id);
      return;
    }
    
    // If there are multiple matches, keep the dropdown open
    if (searchResults.length > 0) {
      setShowResults(true);
    } else {
      // No matches found
      setSearchError('No matching realms found. Try a different search term or use the Realms Explorer.');
    }
  };

  // Handle selecting a realm from the dropdown
  const selectRealm = (realmId) => {
    onSubmit(realmId);
    setSearchTerm(''); // Clear search after submission
    setShowResults(false);
  };

  // Handle key press for navigation
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      // Close dropdown on escape key
      setShowResults(false);
    } else if (e.key === 'ArrowDown' && showResults && searchResults.length > 0) {
      // Let user navigate the dropdown with arrow keys
      e.preventDefault();
      document.querySelector('.search-result-item')?.focus();
    }
  };

  return (
    <div ref={searchRef} style={{ position: 'relative', marginBottom: '2rem' }}>
      <form onSubmit={handleSubmit} style={{ 
        padding: '1rem', 
        backgroundColor: '#3a3a3a', 
        borderRadius: '4px',
        marginBottom: '1rem'
      }}>
        <label htmlFor="realmSearch" style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontWeight: 'bold' 
        }}>
          Enter Realm ID or Name:
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            id="realmSearch"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSearchError('');
            }}
            onKeyDown={handleKeyPress}
            onFocus={() => {
              if (searchTerm && searchResults.length > 0) {
                setShowResults(true);
              }
            }}
            placeholder="e.g. 691, 763 (Entity ID), or Nutnut"
            disabled={loading}
            style={{ flex: 1 }}
          />
          <button type="submit" disabled={loading || !searchTerm}>
            {loading ? 'Loading...' : 'Search'}
          </button>
        </div>
      </form>
      
      {/* Search Results Dropdown - positioned relative to the form container */}
      {showResults && searchResults.length > 0 && (
        <div style={{ 
          position: 'relative', // Changed from absolute to relative
          width: '100%', 
          backgroundColor: 'var(--color-background)',
          border: '1px solid #555',
          borderRadius: '4px',
          zIndex: 10,
          maxHeight: '300px',
          overflowY: 'auto',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          marginBottom: '1rem', // Add margin to push content below
          marginTop: '-0.5rem' // Slight negative margin to connect with the form visually
        }}>
          {searchResults.map((realm) => (
            <div 
              className="search-result-item"
              tabIndex="0"
              key={realm.entity_id}
              onClick={() => selectRealm(realm.realm_id)}
              style={{
                padding: '0.75rem',
                borderBottom: '1px solid #333',
                cursor: 'pointer',
                outline: 'none' // Remove default focus outline
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') selectRealm(realm.realm_id);
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
                {realm.decoded_name || 'Unknown Realm'}
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                <div>Realm ID: {realm.realm_id}</div>
                <div>Entity ID: {realm.entity_id}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {searchError && (
        <div className="error">
          <p>{searchError}</p>
        </div>
      )}
      
      {!dataLoaded && (
        <div style={{ fontSize: '0.9rem', color: '#999', textAlign: 'center' }}>
          Loading realms data...
        </div>
      )}
    </div>
  );
}
