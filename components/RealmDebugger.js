// components/RealmDebugger.js
import { useState } from 'react';

export default function RealmDebugger() {
  const [realmId, setRealmId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [debugData, setDebugData] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  const testRealmId = async (e) => {
    e.preventDefault();
    if (!realmId) return;

    setLoading(true);
    setErrorMessage('');
    setDebugData(null);

    try {
      // Step 1: Test entity query
      const entityQuery = `
        SELECT id, entity_id, realm_name, owner_name
        FROM "s1_eternum-SettleRealmData"
        WHERE id = ${realmId};
      `;
      
      console.log('Testing entity query for realm ID:', realmId);
      
      const entityResponse = await fetch('/api/query-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: entityQuery
        }),
      });
      
      const entityData = await entityResponse.json();
      
      if (!entityResponse.ok) {
        throw new Error(`Entity query failed: ${entityData.error || 'Unknown error'}`);
      }
      
      if (!entityData.data || entityData.data.length === 0) {
        setDebugData({ 
          step: 'entity',
          message: `No realm found with ID ${realmId}`,
          query: entityQuery,
          response: entityData
        });
        return;
      }
      
      // If we got here, we found the realm
      setDebugData({
        step: 'entity',
        message: 'Realm found!',
        query: entityQuery,
        response: entityData,
        realm: entityData.data[0]
      });
      
    } catch (error) {
      console.error('Debug error:', error);
      setErrorMessage(error.message || 'An unknown error occurred');
      setDebugData({
        error: true,
        message: error.message,
        stack: error.stack
      });
    } finally {
      setLoading(false);
    }
  };

  // Try some suggested realm IDs
  const suggestedIds = [1, 42, 100, 200, 500, 1000];

  return (
    <div className="debug-container" style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #444', borderRadius: '4px' }}>
      <h2>Realm ID Debugger</h2>
      <p>Use this tool to test if a realm ID exists in the database.</p>
      
      <form onSubmit={testRealmId} style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <input
            type="text"
            value={realmId}
            onChange={(e) => setRealmId(e.target.value)}
            placeholder="Enter realm ID to test"
            disabled={loading}
            style={{ flex: 1 }}
          />
          <button type="submit" disabled={loading || !realmId}>
            {loading ? 'Testing...' : 'Test'}
          </button>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <p>Try suggested IDs:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {suggestedIds.map(id => (
              <button
                key={id}
                type="button"
                onClick={() => setRealmId(id.toString())}
                disabled={loading}
                style={{ 
                  padding: '0.25rem 0.5rem',
                  backgroundColor: 'var(--color-secondary)'
                }}
              >
                {id}
              </button>
            ))}
          </div>
        </div>
      </form>
      
      {errorMessage && (
        <div className="error">
          <strong>Error:</strong> {errorMessage}
        </div>
      )}
      
      {debugData && (
        <div className="debug-results">
          <h3>Results</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <strong>Status:</strong> {debugData.message}
          </div>
          
          {debugData.realm && (
            <div style={{ marginBottom: '1rem' }}>
              <h4>Realm Found</h4>
              <p><strong>Realm ID:</strong> {debugData.realm.id}</p>
              <p><strong>Entity ID:</strong> {debugData.realm.entity_id}</p>
              <p><strong>Realm Name:</strong> {debugData.realm.realm_name}</p>
              <p><strong>Owner:</strong> {debugData.realm.owner_name}</p>
            </div>
          )}
          
          <div>
            <button 
              onClick={() => setShowRaw(!showRaw)} 
              style={{ marginBottom: '0.5rem', backgroundColor: 'var(--color-secondary)' }}
            >
              {showRaw ? 'Hide Raw Data' : 'Show Raw Data'}
            </button>
            
            {showRaw && (
              <pre style={{ 
                backgroundColor: '#111',
                padding: '1rem',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '300px'
              }}>
                {JSON.stringify(debugData, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
