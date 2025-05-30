// pages/diagnose.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ApiTester from '../components/ApiTester';

export default function DiagnosePage() {
  const [activeTab, setActiveTab] = useState('api-test');
  const [apiHealth, setApiHealth] = useState(null);
  const [testingApi, setTestingApi] = useState(false);

  // Check API health on page load
  useEffect(() => {
    checkApiHealth();
  }, []);

  // Test the API with a simple query
  const checkApiHealth = async () => {
    setTestingApi(true);
    
    try {
      const response = await fetch('/api/query-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'SELECT 1 as test' }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.data) {
        setApiHealth({
          status: 'healthy',
          endpoint: data.endpoint || 'unknown',
          message: 'API is responding normally',
          time: new Date().toLocaleTimeString()
        });
      } else {
        setApiHealth({
          status: 'warning',
          message: data.error || 'API returned an unexpected response',
          details: data,
          time: new Date().toLocaleTimeString()
        });
      }
    } catch (err) {
      console.error('API health check failed:', err);
      setApiHealth({
        status: 'error',
        message: err.message || 'Failed to connect to API',
        time: new Date().toLocaleTimeString()
      });
    } finally {
      setTestingApi(false);
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Eternum Resource Viewer - Diagnostics</title>
        <meta name="description" content="Diagnostic tools for Eternum Resource Viewer" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>Eternum Resource Viewer - Diagnostics</h1>
        
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: 'var(--color-primary)' }}>
            &larr; Back to Resource Viewer
          </Link>
          <Link href="/realms-explorer" style={{ color: 'var(--color-primary)' }}>
            Realms Explorer →
          </Link>
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <p>This page provides diagnostic tools to help troubleshoot issues with the Eternum Resource Viewer.</p>
          
          {/* API Health Status */}
          <div style={{ 
            marginTop: '1rem',
            padding: '1rem',
            borderRadius: '4px',
            backgroundColor: apiHealth?.status === 'healthy' ? 'rgba(0, 255, 0, 0.1)' : 
                             apiHealth?.status === 'warning' ? 'rgba(255, 165, 0, 0.1)' :
                             apiHealth?.status === 'error' ? 'rgba(255, 0, 0, 0.1)' : 
                             'var(--color-secondary)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>API Status</h3>
              <button 
                onClick={checkApiHealth} 
                disabled={testingApi}
                className="btn-outline"
                style={{ padding: '0.25rem 0.5rem' }}
              >
                {testingApi ? 'Testing...' : 'Test Now'}
              </button>
            </div>
            
            {apiHealth ? (
              <div style={{ marginTop: '0.5rem' }}>
                <p style={{ 
                  color: apiHealth.status === 'healthy' ? 'green' : 
                          apiHealth.status === 'warning' ? 'orange' : 
                          'var(--color-error)'
                }}>
                  <strong>Status:</strong> {apiHealth.status === 'healthy' ? 'Healthy' : 
                                           apiHealth.status === 'warning' ? 'Warning' : 
                                           'Error'}
                </p>
                <p><strong>Message:</strong> {apiHealth.message}</p>
                {apiHealth.endpoint && (
                  <p><strong>Endpoint:</strong> {apiHealth.endpoint}</p>
                )}
                <p><strong>Last Checked:</strong> {apiHealth.time}</p>
              </div>
            ) : (
              <p style={{ marginTop: '0.5rem' }}>
                {testingApi ? 'Testing API connection...' : 'API status unknown. Click "Test Now" to check.'}
              </p>
            )}
          </div>
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #444' }}>
            <button
              onClick={() => setActiveTab('api-test')}
              style={{ 
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                color: 'var(--color-text)',
                borderBottom: activeTab === 'api-test' ? '2px solid var(--color-primary)' : 'none',
                fontWeight: activeTab === 'api-test' ? 'bold' : 'normal'
              }}
            >
              API Connection Test
            </button>
            <button
              onClick={() => setActiveTab('api-info')}
              style={{ 
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                color: 'var(--color-text)',
                borderBottom: activeTab === 'api-info' ? '2px solid var(--color-primary)' : 'none',
                fontWeight: activeTab === 'api-info' ? 'bold' : 'normal'
              }}
            >
              API Information
            </button>
            <button
              onClick={() => setActiveTab('troubleshooting')}
              style={{ 
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                color: 'var(--color-text)',
                borderBottom: activeTab === 'troubleshooting' ? '2px solid var(--color-primary)' : 'none',
                fontWeight: activeTab === 'troubleshooting' ? 'bold' : 'normal'
              }}
            >
              Troubleshooting
            </button>
          </div>
        </div>
        
        {activeTab === 'api-test' && (
          <ApiTester />
        )}
        
        {activeTab === 'api-info' && (
          <div>
            <h2>Eternum API Information</h2>
            
            <div style={{ marginBottom: '2rem' }}>
              <h3>Known API Endpoints</h3>
              <p>The Eternum API endpoint may change over time as the game updates. Here are some endpoints to try:</p>
              
              <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                <li><code>https://api.cartridge.gg/x/eternum-game-mainnet-27/torii/sql</code> (Current - mainnet-27)</li>
                <li><code>https://api.cartridge.gg/x/eternum-game-mainnet-25/torii/sql</code> (Legacy - mainnet-25)</li>
                <li><code>https://api.cartridge.gg/x/eternum-game/torii/sql</code> (Without mainnet version)</li>
                <li><code>https://api.cartridge.gg/x/eternum/torii/sql</code> (Simplified path)</li>
              </ul>
              
              <p style={{ marginTop: '1rem', color: 'var(--color-primary)' }}>
                <strong>Note:</strong> The endpoint was updated from mainnet-25 to mainnet-27 in the latest version.
              </p>
            </div>
            
            <div style={{ marginBottom: '2rem' }}>
              <h3>Using the API</h3>
              <p>The Eternum API uses a GET request with a SQL query parameter:</p>
              
              <pre style={{ 
                backgroundColor: '#111',
                padding: '1rem',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '0.9rem'
              }}>
{`// Example URL
https://api.cartridge.gg/x/eternum-game-mainnet-27/torii/sql?query=SELECT%201%20as%20test

// In JavaScript
const query = 'SELECT id FROM "s1_eternum-SettleRealmData" LIMIT 5';
const url = \`\${apiEndpoint}?query=\${encodeURIComponent(query)}\`;
const response = await fetch(url);
const data = await response.json();`}
              </pre>
            </div>
            
            <div style={{ marginBottom: '2rem' }}>
              <h3>Common Issues</h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <h4>1. CORS Restrictions</h4>
                <p>Browser security prevents direct API access from frontend code. This is why we use a server-side API proxy.</p>
                <p>If you see errors like "Access-Control-Allow-Origin", this is a CORS issue.</p>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <h4>2. API Changes</h4>
                <p>The Eternum API might change over time. Common changes include:</p>
                <ul style={{ paddingLeft: '1.5rem' }}>
                  <li>New endpoint URL (like the update from mainnet-25 to mainnet-27)</li>
                  <li>Changed database schema</li>
                  <li>New authentication requirements</li>
                </ul>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <h4>3. Rate Limiting</h4>
                <p>The API might be rate-limiting requests. If you see 429 status codes, this is the issue.</p>
              </div>
            </div>
            
            <div style={{ marginBottom: '2rem' }}>
              <h3>Database Schema</h3>
              <p>Based on the original code, these table and column names were used:</p>
              
              <pre style={{ 
                backgroundColor: '#111',
                padding: '1rem',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '0.9rem'
              }}>
{`// Realm data
"s1_eternum-SettleRealmData"
  - id (realm ID)
  - entity_id
  - realm_name
  - owner_name

// Structure/level data
"s1_eternum-Structure"
  - entity_id
  - "base.level"

// Resource data
"s1_eternum-Resource"
  - entity_id
  - [RESOURCE_NAME]_BALANCE columns
  - [RESOURCE_NAME]_PRODUCTION.production_rate
  - [RESOURCE_NAME]_PRODUCTION.output_amount_left`}
              </pre>
              
              <p>The schema might change as the game evolves.</p>
            </div>
          </div>
        )}
        
        {activeTab === 'troubleshooting' && (
          <div>
            <h2>Troubleshooting Guide</h2>
            
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3>Common Error: "Realm not found"</h3>
              <p><strong>Symptoms:</strong> You enter a Realm ID but get an error saying the realm was not found.</p>
              <p><strong>Possible causes:</strong></p>
              <ul style={{ paddingLeft: '1.5rem' }}>
                <li>The Realm ID doesn't exist in the database</li>
                <li>The API endpoint has changed</li>
                <li>The database schema has changed</li>
              </ul>
              <p><strong>Solutions:</strong></p>
              <ol style={{ paddingLeft: '1.5rem' }}>
                <li>Use the <Link href="/find-realms" style={{ color: 'var(--color-primary)' }}>Find Valid Realm IDs</Link> tool to discover existing realms</li>
                <li>Check the API status at the top of this page</li>
                <li>Try clicking "Try Again" on the error message</li>
              </ol>
            </div>
            
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3>Common Error: "Failed to fetch resource data"</h3>
              <p><strong>Symptoms:</strong> The realm is found, but resources can't be loaded.</p>
              <p><strong>Possible causes:</strong></p>
              <ul style={{ paddingLeft: '1.5rem' }}>
                <li>Resource table schema has changed</li>
                <li>Network issue or API timeout</li>
                <li>The realm has no resources</li>
              </ul>
              <p><strong>Solutions:</strong></p>
              <ol style={{ paddingLeft: '1.5rem' }}>
                <li>Check your internet connection</li>
                <li>Try again later if it might be a temporary API issue</li>
                <li>Try a different realm to see if the issue persists</li>
              </ol>
            </div>
            
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3>Resource Values Look Incorrect</h3>
              <p><strong>Symptoms:</strong> Resources are displayed but the values seem too high or too low.</p>
              <p><strong>Possible causes:</strong></p>
              <ul style={{ paddingLeft: '1.5rem' }}>
                <li>Conversion formula might need adjusting</li>
                <li>Realm level is not being considered correctly</li>
                <li>Game mechanics have changed</li>
              </ul>
              <p><strong>Solutions:</strong></p>
              <ol style={{ paddingLeft: '1.5rem' }}>
                <li>Compare with in-game values if possible</li>
                <li>Check that the realm level is displaying correctly</li>
                <li>Turn on "Show Debug Tools" on the main page to see raw values</li>
              </ol>
            </div>
            
            <div style={{ marginTop: '1.5rem' }}>
              <h3>Still Having Issues?</h3>
              <p>If you're still experiencing problems:</p>
              <ol style={{ paddingLeft: '1.5rem' }}>
                <li>Try clearing your browser cache and refreshing</li>
                <li>Use the API Connection Test tab to run a custom query</li>
                <li>Check if the Eternum game or API has been updated recently</li>
                <li>Consider reporting the issue to the developers</li>
              </ol>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
