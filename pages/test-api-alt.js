// pages/test-api-alt.js
import { useState } from 'react';
import Head from 'next/head';

export default function TestApiAlt() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [response, setResponse] = useState(null);
  const [query, setQuery] = useState(`SELECT 1 as test;`);
  const [method, setMethod] = useState('torii_sql');
  const [endpoint, setEndpoint] = useState('https://api.cartridge.gg/x/eternum-game-mainnet-27/torii/sql');
  
  const testMethods = [
    'torii_sql', 
    'sql', 
    'query', 
    'execute'
  ];
  
  const testEndpoints = [
    'https://api.cartridge.gg/x/eternum-game-mainnet-27/torii/sql',
    'https://api.cartridge.gg/x/eternum/torii/sql',
    'https://api.cartridge.gg/x/eternum-game/torii/sql'
  ];
  
  const testApi = async () => {
    setLoading(true);
    setError('');
    setResponse(null);
    
    try {
      // Correctly formatted JSON-RPC request
      const jsonRpcRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: method,
        params: {
          query: query
        }
      };
      
      console.log('Sending JSON-RPC request:', JSON.stringify(jsonRpcRequest, null, 2));
      console.log('To endpoint:', endpoint);
      
      // Make the direct API request
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonRpcRequest),
      });
      
      const data = await response.json();
      console.log('API response:', data);
      
      if (data.error) {
        throw new Error(`API Error: ${data.error.message || JSON.stringify(data.error)}`);
      }
      
      setResponse({
        status: response.status,
        data: data
      });
    } catch (err) {
      console.error('Test error:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Try a different approach - URL with parameters
  const testDirectGet = async () => {
    setLoading(true);
    setError('');
    setResponse(null);
    
    try {
      // Try a direct GET request with parameters
      const encodedQuery = encodeURIComponent(query);
      const getUrl = `${endpoint}?query=${encodedQuery}`;
      
      console.log('Trying GET request to:', getUrl);
      
      const response = await fetch(getUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      const data = await response.json();
      console.log('GET response:', data);
      
      setResponse({
        status: response.status,
        data: data
      });
    } catch (err) {
      console.error('GET test error:', err);
      setError(`GET Error: ${err.message || 'An unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <Head>
        <title>Alternative API Tests</title>
      </Head>
      
      <h1>Alternative API Tests</h1>
      <p>This page tests different API methods and endpoints to find one that works.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px' }}>
          API Endpoint:
        </label>
        <select 
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '8px',
            backgroundColor: '#333',
            color: 'white'
          }}
        >
          {testEndpoints.map(ep => (
            <option key={ep} value={ep}>{ep}</option>
          ))}
        </select>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px' }}>
          JSON-RPC Method:
        </label>
        <select 
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '8px',
            backgroundColor: '#333',
            color: 'white'
          }}
        >
          {testMethods.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px' }}>
          SQL Query:
        </label>
        <textarea 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ 
            width: '100%', 
            height: '100px', 
            padding: '8px',
            backgroundColor: '#333',
            color: 'white',
            fontFamily: 'monospace'
          }}
        />
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={testApi}
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#c0a86e',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Testing...' : 'Test POST with JSON-RPC'}
        </button>
        
        <button 
          onClick={testDirectGet}
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#6e95c0',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Testing...' : 'Test GET with Query Params'}
        </button>
      </div>
      
      {error && (
        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          border: '1px solid red',
          borderRadius: '4px',
          color: 'red'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {response && (
        <div style={{ marginTop: '20px' }}>
          <h2>API Response</h2>
          <div style={{ marginBottom: '10px' }}>
            <strong>Status:</strong> {response.status}
          </div>
          
          <div>
            <strong>Response Data:</strong>
            <pre style={{ 
              backgroundColor: '#111',
              color: '#f0f0f0',
              padding: '15px',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '400px'
            }}>
              {JSON.stringify(response.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
      
      <div style={{ marginTop: '40px', borderTop: '1px solid #444', paddingTop: '20px' }}>
        <h2>Check Browser Console</h2>
        <p>Open your browser's developer tools (F12) and check the Console tab for detailed logs and any CORS errors.</p>
      </div>
    </div>
  );
}
