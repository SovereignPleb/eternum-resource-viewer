// pages/manual-test.js
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function ManualTest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [sqlQuery, setSqlQuery] = useState('SELECT 1 as test');
  const [rawResponse, setRawResponse] = useState('');
  
  const runManualTest = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    setRawResponse('');
    
    try {
      // Define the API endpoint
      const apiEndpoint = 'https://api.cartridge.gg/x/eternum-game-mainnet-27/torii/sql';
      
      // Format the request properly using JSON-RPC 2.0 protocol
      const jsonRpcRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "torii_sql",
        params: {
          query: sqlQuery
        }
      };
      
      console.log('Sending request:', JSON.stringify(jsonRpcRequest));
      
      // Make the request - use fetch directly to avoid any middleware issues
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonRpcRequest)
      });
      
      // Get the raw text response first
      const responseText = await response.text();
      setRawResponse(responseText);
      
      // Try to parse the response as JSON
      try {
        const responseData = JSON.parse(responseText);
        setResult({
          status: response.status,
          data: responseData
        });
      } catch (parseError) {
        setError(`Failed to parse response as JSON: ${parseError.message}`);
      }
    } catch (err) {
      console.error('Error testing API:', err);
      setError(err.message || 'An error occurred while testing the API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Manual SQL Test</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main>
        <h1>Manual SQL Test</h1>
        
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/" style={{ color: 'var(--color-primary)' }}>
            &larr; Back to Home
          </Link>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <p>This page allows you to directly test SQL queries with the Eternum API.</p>
          <p>Enter an SQL query below and click "Run Test" to see the response.</p>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="sqlQuery" style={{ display: 'block', marginBottom: '0.5rem' }}>
            SQL Query:
          </label>
          <textarea
            id="sqlQuery"
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            rows={4}
            style={{ 
              width: '100%', 
              padding: '0.5rem',
              backgroundColor: 'var(--color-secondary)',
              color: 'var(--color-text)',
              fontFamily: 'monospace'
            }}
            disabled={loading}
          />
        </div>
        
        <button 
          onClick={runManualTest} 
          disabled={loading}
          style={{ marginBottom: '1rem' }}
        >
          {loading ? 'Running...' : 'Run Test'}
        </button>
        
        {error && <div className="error">{error}</div>}
        
        {loading && <div className="loading">Testing query, please wait...</div>}
        
        {rawResponse && (
          <div style={{ marginTop: '1.5rem' }}>
            <h2>Raw API Response</h2>
            <pre style={{ 
              backgroundColor: '#111',
              padding: '1rem',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '200px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {rawResponse}
            </pre>
          </div>
        )}
        
        {result && (
          <div style={{ marginTop: '1.5rem' }}>
            <h2>Parsed Response</h2>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Status:</strong> {result.status}
            </div>
            
            <div>
              <strong>Response Data:</strong>
              <pre style={{ 
                backgroundColor: '#111',
                padding: '1rem',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '300px'
              }}>
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          </div>
        )}
        
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#222', borderRadius: '4px' }}>
          <h3>Troubleshooting Tips</h3>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li>If you're seeing CORS errors, the browser is preventing direct access to the API. You'll need to use a server-side proxy.</li>
            <li>Try very simple queries first, like <code>SELECT 1</code> or <code>SELECT 1 as test</code>.</li>
            <li>If you're seeing SQLite errors, try different SQL syntax or quoting styles.</li>
            <li>If successful, try a real query like <code>SELECT name FROM sqlite_master WHERE type='table' LIMIT 1</code> to see table names.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
