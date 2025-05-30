// pages/test-simple.js
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function TestSimple() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const runSimpleTest = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      // Use our server-side API endpoint to avoid CORS issues
      const response = await fetch('/api/simple-test-query', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`API error: ${data.error || 'Unknown error'}`);
      }
      
      setResult(data);
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
        <title>Simple API Test</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main>
        <h1>Simple API Test</h1>
        
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/" style={{ color: 'var(--color-primary)' }}>
            &larr; Back to Home
          </Link>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <p>This page will test a very simple query to make sure we can connect to the Eternum API.</p>
          <p>Click the button below to run a test query <code>SELECT 1 as test</code>.</p>
        </div>
        
        <button 
          onClick={runSimpleTest} 
          disabled={loading}
          style={{ marginBottom: '1rem' }}
        >
          {loading ? 'Testing...' : 'Run Simple Test Query'}
        </button>
        
        {error && <div className="error">{error}</div>}
        
        {result && (
          <div>
            <h2>Test Result</h2>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Status:</strong> {result.success ? 'Success!' : 'Failed'}
            </div>
            
            <div>
              <strong>Response Data:</strong>
              <pre style={{ 
                backgroundColor: '#111',
                padding: '1rem',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '400px'
              }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
