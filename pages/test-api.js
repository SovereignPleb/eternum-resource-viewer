// Copy this entire file and save it as pages/test-api.js

import { useState } from 'react';
import Head from 'next/head';

export default function TestApiPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [response, setResponse] = useState(null);
  const [query, setQuery] = useState(`SELECT id, entity_id FROM "s1_eternum-SettleRealmData" LIMIT 5;`);
  
  const testDirectApi = async () => {
    setLoading(true);
    setError('');
    setResponse(null);
    
    try {
      // Correctly formatted JSON-RPC request
      const jsonRpcRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "torii_sql",
        params: {
          query: query
        }
      };
      
      console.log('Sending JSON-RPC request:', JSON.stringify(jsonRpcRequest, null, 2));
      
      // Make the direct API request
      const response = await fetch('https://api.cartridge.gg/x/eternum-game-mainnet-25/torii/sql', {
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
  
  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <Head>
        <title>Direct API Test</title>
      </Head>
      
      <h1>Direct API Test</h1>
      <p>This page tests connecting directly to the Eternum API using JSON-RPC format.</p>
      
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
      
      <button 
        onClick={testDirectApi}
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
        {loading ? 'Testing...' : 'Test Direct API Connection'}
      </button>
      
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
        <h2>Instructions</h2>
        <ol style={{ paddingLeft: '20px', lineHeight: '1.5' }}>
          <li>This page makes direct API requests using the JSON-RPC format that the Eternum API requires.</li>
          <li>If you see a CORS error in the console, you'll need to use a server-side API proxy instead.</li>
          <li>If you get a successful response, copy the JSON-RPC format into your main application.</li>
          <li>You might need to update both your API proxy and frontend code to use this format.</li>
        </ol>
        
        <h3 style={{ marginTop: '20px' }}>API Proxy Code</h3>
        <p>Here's the code you should use for your API proxy (pages/api/query-sql.js):</p>
        
        <pre style={{ 
          backgroundColor: '#111',
          color: '#f0f0f0',
          padding: '15px',
          borderRadius: '4px',
          overflow: 'auto',
          maxHeight: '400px',
          fontSize: '14px'
        }}>
{`import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const apiEndpoint = 'https://api.cartridge.gg/x/eternum-game-mainnet-25/torii/sql';
  
  try {
    // Format the request using JSON-RPC 2.0 protocol
    const jsonRpcRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "torii_sql",
      params: {
        query: query
      }
    };

    // Send properly formatted JSON-RPC request
    const response = await axios.post(apiEndpoint, jsonRpcRequest, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Check for JSON-RPC response format
    if (response.data && response.data.result) {
      // Success case: return the result property from JSON-RPC response
      return res.status(200).json({ data: response.data.result });
    } else if (response.data && response.data.error) {
      // Error case: API returned a JSON-RPC error
      return res.status(400).json({ 
        error: 'API returned an error',
        details: response.data.error
      });
    } else {
      // Unexpected response format
      return res.status(500).json({ 
        error: 'Unexpected API response format',
        data: response.data
      });
    }
  } catch (error) {
    console.error('Error executing SQL query:', error.message);
    
    return res.status(500).json({ 
      error: 'Failed to execute query',
      message: error.message,
      code: error.code,
      details: error.response?.data || 'No additional details'
    });
  }
}`}
        </pre>
      </div>
    </div>
  );
}
