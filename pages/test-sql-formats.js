// pages/test-sql-formats.js
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function TestSqlFormats() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [successfulQuery, setSuccessfulQuery] = useState(null);

  const runSqlTests = async () => {
    setLoading(true);
    setError('');
    setResults(null);
    setSuccessfulQuery(null);
    
    try {
      const response = await fetch('/api/sql-format-tests', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${errorText}`);
      }
      
      const data = await response.json();
      setResults(data.results);
      
      // Check if any query was successful
      const successfulResult = data.results.find(result => 
        result.status === 200 && 
        result.data && 
        result.data.result
      );
      
      if (successfulResult) {
        setSuccessfulQuery(successfulResult.query);
      }
    } catch (err) {
      console.error('Error testing SQL formats:', err);
      setError(err.message || 'An error occurred while testing different SQL formats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <Head>
        <title>SQL Format Tests</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main>
        <h1>SQL Format Tests</h1>
        
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/" style={{ color: 'var(--color-primary)' }}>
            &larr; Back to Home
          </Link>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <p>This page will test different SQL query formats to find one that works with the Eternum API.</p>
          <p>Click the button below to test various SQL formats.</p>
        </div>
        
        <button 
          onClick={runSqlTests} 
          disabled={loading}
          style={{ marginBottom: '1rem' }}
        >
          {loading ? 'Testing...' : 'Test SQL Formats'}
        </button>
        
        {error && <div className="error">{error}</div>}
        
        {loading && <div className="loading">Testing SQL formats, please wait...</div>}
        
        {successfulQuery && (
          <div style={{ 
            marginBottom: '2rem', 
            padding: '1rem', 
            backgroundColor: 'rgba(0, 255, 0, 0.1)', 
            border: '1px solid green',
            borderRadius: '4px'
          }}>
            <h3>✅ Successful Query Format Found!</h3>
            <p>Use this SQL format in your API calls:</p>
            <pre style={{ 
              backgroundColor: '#111',
              padding: '0.5rem',
              borderRadius: '4px',
              overflow: 'auto'
            }}>
              {successfulQuery}
            </pre>
          </div>
        )}
        
        {results && (
          <div>
            <h2>SQL Format Test Results</h2>
            
            {results.map((result, index) => (
              <div key={index} style={{ 
                marginBottom: '1.5rem', 
                padding: '1rem', 
                border: '1px solid #444', 
                borderLeft: result.error ? '4px solid var(--color-error)' : 
                           (result.status === 200 && result.data?.result ? '4px solid green' : '4px solid orange'),
                borderRadius: '4px'
              }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>SQL Query:</strong>
                  <pre style={{ 
                    backgroundColor: '#111',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    overflow: 'auto'
                  }}>
                    {result.query}
                  </pre>
                </div>
                
                {result.error ? (
                  <div style={{ color: 'var(--color-error)' }}>
                    <strong>Error:</strong> {result.error}
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Status:</strong> {result.status}
                    </div>
                    
                    <div>
                      <strong>Response:</strong>
                      <pre style={{ 
                        backgroundColor: '#111',
                        padding: '0.5rem',
                        borderRadius: '4px',
                        overflow: 'auto',
                        maxHeight: '150px'
                      }}>
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  </>
                )}
              </div>
            ))}
            
            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#222', borderRadius: '4px' }}>
              <h3>Next Steps</h3>
              <p>Look for a SQL format that returns a successful response (status 200) and contains a "result" property in the response data.</p>
              <p>That SQL format should be used in your queries.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
