// pages/test-formats.js
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function TestFormats() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  const runFormatTests = async () => {
    setLoading(true);
    setError('');
    setResults(null);
    
    try {
      const response = await fetch('/api/simple-test-query-alt', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${errorText}`);
      }
      
      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      console.error('Error testing formats:', err);
      setError(err.message || 'An error occurred while testing different formats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <Head>
        <title>API Format Tests</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main>
        <h1>API Format Tests</h1>
        
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/" style={{ color: 'var(--color-primary)' }}>
            &larr; Back to Home
          </Link>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <p>This page will test different request formats to find one that works with the Eternum API.</p>
          <p>Click the button below to test all formats.</p>
        </div>
        
        <button 
          onClick={runFormatTests} 
          disabled={loading}
          style={{ marginBottom: '1rem' }}
        >
          {loading ? 'Testing...' : 'Test Different Formats'}
        </button>
        
        {error && <div className="error">{error}</div>}
        
        {loading && <div className="loading">Testing formats, please wait...</div>}
        
        {results && (
          <div>
            <h2>Format Test Results</h2>
            
            {results.map((result, index) => (
              <div key={index} style={{ 
                marginBottom: '2rem', 
                padding: '1rem', 
                border: '1px solid #444', 
                borderLeft: result.error ? '4px solid var(--color-error)' : '4px solid green',
                borderRadius: '4px'
              }}>
                <h3>Format #{index + 1}</h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Request:</strong>
                  <pre style={{ 
                    backgroundColor: '#111',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    overflow: 'auto'
                  }}>
                    {result.format}
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
                        maxHeight: '200px'
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
              <p>Look for a format that returns a successful response (status 200) and contains a "result" property in the response data.</p>
              <p>That format should be used in your main API handler.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
