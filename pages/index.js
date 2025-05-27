import { useState } from 'react';
import Head from 'next/head';
import RealmForm from '../components/RealmForm';
import ResourceList from '../components/ResourceList';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [realmData, setRealmData] = useState(null);

  const handleSubmit = async (realmId) => {
    setLoading(true);
    setError('');
    
    try {
      // Step 1: Get entity ID and realm info
      const entityQuery = `
        SELECT id, entity_id, realm_name, owner_name
        FROM "s1_eternum-SettleRealmData"
        WHERE id = ${realmId};
      `;
      
      const entityResponse = await fetch('/api/query-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: entityQuery }),
      });
      
      const entityData = await entityResponse.json();
      
      if (!entityData.data || entityData.data.length === 0) {
        throw new Error(`Realm with ID ${realmId} not found.`);
      }
      
      const realm = entityData.data[0];
      const entityId = realm.entity_id;
      
      // Step 2: Get realm level
      const levelQuery = `
        SELECT "base.level" as level
        FROM "s1_eternum-Structure"
        WHERE entity_id = ${entityId};
      `;
      
      const levelResponse = await fetch('/api/query-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: levelQuery }),
      });
      
      const levelData = await levelResponse.json();
      const realmLevel = levelData.data && levelData.data.length > 0 ? levelData.data[0].level : 1;
      
      // Step 3: Get resource data
      const resourceQuery = `
        SELECT 
          entity_id,
          WOOD_BALANCE, STONE_BALANCE, COAL_BALANCE, COPPER_BALANCE, OBSIDIAN_BALANCE,
          SILVER_BALANCE, GOLD_BALANCE, IRONWOOD_BALANCE, COLD_IRON_BALANCE,
          LABOR_BALANCE, WHEAT_BALANCE, FISH_BALANCE, DONKEY_BALANCE, LORDS_BALANCE
        FROM "s1_eternum-Resource"
        WHERE entity_id = ${entityId};
      `;
      
      const resourceResponse = await fetch('/api/query-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: resourceQuery }),
      });
      
      const resourceData = await resourceResponse.json();
      
      if (!resourceData.data || resourceData.data.length === 0) {
        throw new Error(`No resources found for realm with ID ${realmId}.`);
      }
      
      // Set the combined data
      setRealmData({
        id: realmId,
        entityId,
        level: realmLevel,
        name: realm.realm_name,
        ownerName: realm.owner_name,
        resources: resourceData.data[0]
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch realm data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Eternum Resource Viewer</title>
        <meta name="description" content="View resources for your Eternum realm" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>Eternum Resource Viewer</h1>
        
        <RealmForm onSubmit={handleSubmit} loading={loading} />
        
        {error && <div className="error">{error}</div>}
        
        {loading && <div className="loading">Loading...</div>}
        
        {realmData && <ResourceList realmData={realmData} />}
      </main>
    </div>
  );
}
