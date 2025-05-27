// pages/diagnose.js
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ApiTester from '../components/ApiTester';

export default function DiagnosePage() {
  const [activeTab, setActiveTab] = useState('api-test');

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
        
        <div style={{ marginBottom: '1.5rem' }}>
          <Link href="/" style={{ color: 'var(--color-primary)' }}>
            &larr; Back to Resource Viewer
          </Link>
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <p>This page provides diagnostic tools to help troubleshoot issues with the Eternum Resource Viewer.</p>
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
              <p>The Eternum API endpoint may have changed. Here are some endpoints to try:</p>
              
              <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                <li><code>https://api.cartridge.gg/x/eternum-game-mainnet-25/torii/sql</code> (Original)</li>
                <li><code>https://api.cartridge.gg/x/eternum-game/torii/sql</code> (Without mainnet-25)</li>
                <li><code>https://api.cartridge.gg/x/eternum/torii/sql</code> (Simplified path)</li>
              </ul>
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
                <p>The Eternum API might have changed since this app was created. This could include:</p>
                <ul style={{ paddingLeft: '1.5rem' }}>
                  <li>New endpoint URL</li>
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
              
              <p>The schema might have changed since the app was created.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
