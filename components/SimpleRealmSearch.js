// components/SimpleRealmSearch.js
import { useState, useEffect } from 'react';
import { decodeRealmName } from '../utils/conversion';

export default function SimpleRealmSearch({ onSubmit, loading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [allRealms, setAllRealms] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Load all realms data once on component mount
  useEffect(() => {
    fetchAllRealms();
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

  // Handle search submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!searchTerm) return;
    
    // If search is a number, try it as a realm ID
    if (/^\d+$/.test(searchTerm)) {
      onSubmit(searchTerm);
      setSearchTerm(''); // Clear search after submission
      return;
    }
    
    // Check if search matches any realm name
    const nameMatch = allRealms.find(realm => 
      realm.decoded_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (nameMatch) {
      onSubmit(nameMatch.realm_id);
      setSearchTerm(''); // Clear search after submission
      return;
    }
    
    // No matches found
    setSearchError('No matching realms found. Try a different search term or use the Realms Explorer.');
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
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
            placeholder="e.g. 691 or Nutnut"
            disabled={loading}
            style={{ flex: 1 }}
          />
          <button type="submit" disabled={loading || !searchTerm}>
            {loading ? 'Loading...' : 'View Resources'}
          </button>
        </div>
      </form>
      
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
