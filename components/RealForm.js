import { useState } from 'react';

export default function RealmForm({ onSubmit, loading }) {
  const [realmId, setRealmId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (realmId) {
      onSubmit(realmId);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="realmId" style={{ display: 'block', marginBottom: '0.5rem' }}>
          Enter Realm ID:
        </label>
        <input
          type="text"
          id="realmId"
          value={realmId}
          onChange={(e) => setRealmId(e.target.value)}
          placeholder="e.g. 691"
          disabled={loading}
        />
      </div>
      <button type="submit" disabled={loading || !realmId}>
        {loading ? 'Loading...' : 'View Resources'}
      </button>
    </form>
  );
}
