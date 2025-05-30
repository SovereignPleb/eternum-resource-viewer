// pages/test-debug.js
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function TestDebug() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const runDebugTest = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      // Get raw response to inspect
      const fetchResponse = await fetch('/api/simple-test-query', {
        method: 'POST',
      });
      
      let responseText;
      try {
        responseText = await fetchResponse.text();
        console.log("Raw response text:", responseText);
      } catch (e) {
        console.error("Failed to get response text:", e);
        responseText = "Failed to read response text";
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("JSON parse error:", e);
        throw new Error(`Failed to parse JSON response: ${e.message}. Raw response: ${responseText.substring(0, 100)}...`);
      }
      
      if (!fetchResponse.ok && !data.debug) {
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
        <title>API Debug Test</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main>
        <h1>API Debug Test</h1>
        
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/" style={{ color: 'var(--color-primary)' }}>
            &larr; Back to Home
          </Link>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <p>This page will test the Eternum API connection with enhanced debugging.</p>
          <p>Click the button below to run a test with full debugging information.</p>
        </div>
        
        <button 
          onClick={runDebugTest} 
          disabled={loading}
          style={{ marginBottom: '1rem' }}
        >
          {loading ? 'Testing...' : 'Run Debug Test'}
        </button>
        
        {error && (
          <div className="error" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>
            {error}
          </div>
        )}
        
        {result && (
          <div>
            <h2>Test Result</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <strong>API Endpoint:</strong> {result.apiEndpoint}
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <strong>Request Sent:</strong>
              <pre style={{ 
                backgroundColor: '#111',
                padding: '1rem',
                borderRadius: '4px',
                overflow: 'auto'
              }}>
                {JSON.stringify(result.requestSent, null, 2)}
              </pre>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <strong>Response Status:</strong> {result.responseStatus}
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <strong>Response Text (first 1000 chars):</strong>
              <pre style={{ 
                backgroundColor: '#111',
                padding: '1rem',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '300px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {result.responseText || 'No text response'}
              </pre>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <strong>Parsed Response Data:</strong>
              <pre style={{ 
                backgroundColor: '#111',
                padding: '1rem',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '300px'
              }}>
                {result.parseSuccess 
                  ? JSON.stringify(result.responseData, null, 2) 
                  : 'Failed to parse response as JSON'}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
