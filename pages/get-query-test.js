// pages/get-query-test.js
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function GetQueryTest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [sqlQuery, setSqlQuery] = useState('SELECT 1 as test');
  
  const executeQuery = async () => {
    setLoading(true);
    setError('');
    setResults(null);
    
    try {
      const response = await fetch('/api/simple-get-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlQuery })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`API error: ${data.error || 'Unknown error'}`);
      }
      
      setResults(data);
    } catch (err) {
      console.error('Error executing query:', err);
      setError(err.message || 'An error occurred while executing the query');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <Head>
        <title>GET Query Test</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main>
        <h1>GET Query Test</h1>
        
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/" style={{ color: 'var(--color-primary)' }}>
            &larr; Back to Home
          </Link>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <p>This page tests using a GET request with a query parameter to access the SQL API.</p>
          <p>Enter your SQL query below and click "Execute Query" to see the results.</p>
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
          onClick={executeQuery} 
          disabled={loading}
          style={{ marginBottom: '1rem' }}
        >
          {loading ? 'Executing...' : 'Execute Query'}
        </button>
        
        {error && <div className="error">{error}</div>}
        
        {loading && <div className="loading">Executing query, please wait...</div>}
        
        {results && (
          <div style={{ marginTop: '1.5rem' }}>
            <h2>Query Results</h2>
            
            <div>
              <strong>Response Data:</strong>
              <pre style={{ 
                backgroundColor: '#111',
                padding: '1rem',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '400px'
              }}>
                {JSON.stringify(results.data, null, 2)}
              </pre>
            </div>
          </div>
        )}
        
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#222', borderRadius: '4px' }}>
          <h3>Next Steps</h3>
          <p>If this test is successful, we can update the main application to use this GET request approach instead of the previous JSON-RPC POST method.</p>
          <p>The steps would be:</p>
          <ol style={{ paddingLeft: '1.5rem' }}>
            <li>Update the main API handler (query-sql.js) to use this method</li>
            <li>Test the main application with a realm lookup</li>
            <li>If successful, cleanup the test/debug pages</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
