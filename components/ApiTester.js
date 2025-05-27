// components/ApiTester.js
import { useState } from 'react';

export default function ApiTester() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [response, setResponse] = useState(null);
  const [apiEndpoint, setApiEndpoint] = useState('https://api.cartridge.gg/x/eternum-game-mainnet-25/torii/sql');
  const [query, setQuery] = useState(`
SELECT id, entity_id, realm_name, owner_name
FROM "s1_eternum-SettleRealmData"
LIMIT 5;
  `.trim());

  // Known API endpoints to try
  const knownEndpoints = [
    'https://api.cartridge.gg/x/eternum-game-mainnet-25/torii/sql',
    'https://api.cartridge.gg/x/eternum-game/torii/sql', // Without mainnet-25
    'https://api.cartridge.gg/x/eternum/torii/sql', // Even simpler path
  ];

  const testApi = async () => {
    setLoading(true);
    setError('');
    setResponse(null);
    
    try {
      // Format request using JSON-RPC 2.0 protocol
      const jsonRpcRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "torii_sql",
        params: {
          query: query
        }
      };
      
      console.log('Testing with JSON-RPC request:', JSON.stringify(jsonRpcRequest, null, 2));
      
      // Try direct fetch to the API endpoint
      const directResponse = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonRpcRequest),
      });
      
      let data;
      try {
        data = await directResponse.json();
      } catch (err) {
        data = { error: 'Failed to parse response as JSON', text: await directResponse.text() };
      }
      
      setResponse({
        success: directResponse.ok,
        status: directResponse.status,
        statusText: directResponse.statusText,
        headers: Object.fromEntries([...directResponse.headers.entries()]),
        data
      });
      
      if (!directResponse.ok) {
        throw new Error(`API request failed with status ${directResponse.status}: ${directResponse.statusText}`);
      }
    } catch (err) {
      console.error('API test error:', err);
      setError(err.message || 'Failed to test API endpoint.');
      
      // Try proxy approach as fallback
      try {
        console.log('Trying API proxy as fallback...');
        const proxyResponse = await fetch('/api/query-sql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });
        
        const proxyData = await proxyResponse.json();
        
        setResponse({
          note: 'This is via your API proxy, not direct API access',
          success: proxyResponse.ok,
          status: proxyResponse.status,
          statusText: proxyResponse.statusText,
          data: proxyData
        });
      } catch (proxyErr) {
        console.error('API proxy fallback failed:', proxyErr);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #444', borderRadius: '4px' }}>
      <h2>API Connection Tester</h2>
      <p>Use this tool to test the Eternum API connection directly.</p>
      
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="apiEndpoint" style={{ display: 'block', marginBottom: '0.5rem' }}>
          API Endpoint:
        </label>
        <input
          type="text"
          id="apiEndpoint"
          value={apiEndpoint}
          onChange={(e) => setApiEndpoint(e.target.value)}
          style={{ width: '100%' }}
          disabled={loading}
        />
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Try known endpoints:
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {knownEndpoints.map(endpoint => (
            <button
              key={endpoint}
              type="button"
              onClick={() => setApiEndpoint(endpoint)}
              disabled={loading}
              style={{ 
                padding: '0.25rem 0.5rem',
                backgroundColor: endpoint === apiEndpoint ? 'var(--color-primary)' : 'var(--color-secondary)'
              }}
            >
              {endpoint.split('/').slice(-4).join('/')}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="query" style={{ display: 'block', marginBottom: '0.5rem' }}>
          SQL Query:
        </label>
        <textarea
          id="query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={5}
          style={{ width: '100%', backgroundColor: 'var(--color-secondary)', color: 'var(--color-text)', padding: '0.5rem' }}
          disabled={loading}
        />
      </div>
      
      <button 
        onClick={testApi} 
        disabled={loading}
        style={{ marginBottom: '1rem' }}
      >
        {loading ? 'Testing...' : 'Test API Connection'}
      </button>
      
      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {response && (
        <div style={{ marginTop: '1rem' }}>
          <h3>API Response</h3>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Status:</strong> {response.status} {response.statusText}
          </div>
          
          {response.note && (
            <div style={{ 
              marginBottom: '1rem',
              padding: '0.5rem',
              backgroundColor: 'rgba(255, 193, 7, 0.2)',
              borderLeft: '4px solid #ffc107'
            }}>
              <strong>Note:</strong> {response.note}
            </div>
          )}
          
          <div style={{ marginBottom: '1rem' }}>
            <strong>Response Headers:</strong>
            <pre style={{ 
              backgroundColor: '#111',
              padding: '0.5rem',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '150px',
              fontSize: '0.8rem'
            }}>
              {JSON.stringify(response.headers, null, 2)}
            </pre>
          </div>
          
          <div>
            <strong>Response Data:</strong>
            <pre style={{ 
              backgroundColor: '#111',
              padding: '0.5rem',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '300px',
              fontSize: '0.8rem'
            }}>
              {JSON.stringify(response.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
      
      <div style={{ marginTop: '1.5rem' }}>
        <h3>Debugging Tips</h3>
        <ul style={{ paddingLeft: '1.5rem' }}>
          <li>If you see CORS errors, you'll need to use the API proxy instead of direct access.</li>
          <li>If the API returns a 404, the endpoint URL might have changed.</li>
          <li>If you get authentication errors, the API might now require auth tokens.</li>
          <li>If the query fails with syntax errors, the database schema might have changed.</li>
        </ul>
      </div>
    </div>
  );
}
