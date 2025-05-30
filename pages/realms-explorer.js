// pages/realms-explorer.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { decodeRealmName } from '../utils/conversion';

export default function RealmsExplorer() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allRealms, setAllRealms] = useState([]); // Store all realms
  const [showHex, setShowHex] = useState(false);
  const [sortField, setSortField] = useState('realm_id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [totalRealmCount, setTotalRealmCount] = useState(0);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Function to fetch all realms data at once
  const fetchAllRealms = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Simple query to get all realms
      const query = `
        SELECT id, entity_id, realm_name
        FROM "s1_eternum-SettleRealmData"
        ORDER BY id;
      `;
      
      const response = await fetch('/api/query-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to fetch realms: ${data.error || 'Unknown error'}`);
      }
      
      if (!data.data || data.data.length === 0) {
        setError('No realms found in the database.');
        setAllRealms([]);
        return;
      }
      
      // Set total count
      setTotalRealmCount(data.data.length);
      
      // Transform the API data to our format with decoded names
      const transformedRealms = data.data.map(realm => ({
        entity_id: realm.entity_id,
        realm_id: realm.id,
        realm_name: realm.realm_name,
        decoded_name: decodeRealmName(realm.realm_name)
      }));
      
      setAllRealms(transformedRealms);
    } catch (err) {
      console.error('Error fetching realms:', err);
      setError(err.message || 'Failed to fetch realms data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all realms on initial load
  useEffect(() => {
    fetchAllRealms();
  }, []);

  // Handle sort column click
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Filter and sort realms
  const filteredAndSortedRealms = allRealms
    .filter(realm => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        realm.decoded_name.toLowerCase().includes(searchLower) ||
        realm.realm_id.toString().includes(searchTerm) ||
        realm.entity_id.toString().includes(searchTerm)
      );
    })
    .sort((a, b) => {
      let valueA = a[sortField];
      let valueB = b[sortField];
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

  // Calculate pagination
  const totalPages = Math.ceil(filteredAndSortedRealms.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRealms = filteredAndSortedRealms.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll back to top of table
    const tableElement = document.getElementById('realms-table');
    if (tableElement) {
      window.scrollTo({ top: tableElement.offsetTop - 20, behavior: 'smooth' });
    }
  };

  // Generate pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    
    // Calculate range of buttons to show
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Adjust start if end range is maxed out
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }
    
    // Always show first page
    if (startPage > 1) {
      buttons.push(
        <button 
          key={1} 
          onClick={() => handlePageChange(1)}
          className="pagination-button"
        >
          1
        </button>
      );
      
      if (startPage > 2) {
        buttons.push(<span key="ellipsis1">...</span>);
      }
    }
    
    // Add page buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button 
          key={i} 
          onClick={() => handlePageChange(i)}
          className={`pagination-button ${currentPage === i ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }
    
    // Always show last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="ellipsis2">...</span>);
      }
      
      buttons.push(
        <button 
          key={totalPages} 
          onClick={() => handlePageChange(totalPages)}
          className="pagination-button"
        >
          {totalPages}
        </button>
      );
    }
    
    return buttons;
  };

  return (
    <div className="container">
      <Head>
        <title>Eternum Realms Explorer</title>
        <meta name="description" content="Explore realms in the Eternum game" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>Eternum Realms Explorer</h1>
        
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/" style={{ color: 'var(--color-primary)' }}>
            &larr; Back to Resource Viewer
          </Link>
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <p>Explore and search realms in the Eternum game. Click on a realm ID to view its resources.</p>
          {totalRealmCount > 0 && (
            <p style={{ color: 'var(--color-primary)' }}>
              Total realms in database: <strong>{totalRealmCount.toLocaleString()}</strong>
            </p>
          )}
        </div>
        
        {/* Search and Display Controls */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%' }}
            />
            {searchTerm && (
              <div style={{ 
                marginTop: '0.5rem', 
                fontSize: '0.8rem',
                color: 'var(--color-primary)'
              }}>
                Found {filteredAndSortedRealms.length} realms matching "{searchTerm}"
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1); // Reset to first page
                }}
                style={{ 
                  padding: '0.5rem',
                  backgroundColor: 'var(--color-secondary)',
                  color: 'var(--color-text)',
                  border: '1px solid #444',
                  borderRadius: '4px'
                }}
              >
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
                <option value={250}>250 per page</option>
                <option value={500}>500 per page</option>
                <option value={1000}>1000 per page</option>
              </select>
            </div>
            
            <button
              onClick={() => setShowHex(!showHex)}
              style={{ 
                backgroundColor: 'var(--color-secondary)',
                padding: '0.5rem 1rem'
              }}
            >
              {showHex ? 'Hide Hex Names' : 'Show Hex Names'}
            </button>
          </div>
        </div>
        
        {/* Stats Display */}
        {filteredAndSortedRealms.length > 0 && (
          <div style={{ 
            marginBottom: '1rem', 
            fontSize: '0.9rem',
            color: '#999',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredAndSortedRealms.length)} of {filteredAndSortedRealms.length} realms
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
            
            {totalPages > 1 && (
              <div className="pagination" style={{ margin: 0 }}>
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  &lt;
                </button>
                {renderPaginationButtons()}
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  &gt;
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="error">
            <p>{error}</p>
            <button
              onClick={fetchAllRealms}
              style={{ 
                marginTop: '0.5rem',
                backgroundColor: 'var(--color-secondary)'
              }}
            >
              Try Again
            </button>
          </div>
        )}
        
        {/* Loading Display */}
        {loading && (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading all realms data...</p>
          </div>
        )}
        
        {/* Results Display */}
        {!loading && currentRealms.length > 0 && (
          <div 
            id="realms-table"
            style={{ 
              overflowX: 'auto',
              marginBottom: '2rem',
              border: '1px solid #444',
              borderRadius: '4px'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-secondary)' }}>
                  <th 
                    style={{ 
                      padding: '0.75rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderBottom: '1px solid #444'
                    }}
                    onClick={() => handleSort('realm_id')}
                  >
                    Realm ID
                    {sortField === 'realm_id' && (
                      <span style={{ marginLeft: '0.25rem' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    style={{ 
                      padding: '0.75rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderBottom: '1px solid #444'
                    }}
                    onClick={() => handleSort('entity_id')}
                  >
                    Entity ID
                    {sortField === 'entity_id' && (
                      <span style={{ marginLeft: '0.25rem' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    style={{ 
                      padding: '0.75rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderBottom: '1px solid #444'
                    }}
                    onClick={() => handleSort('decoded_name')}
                  >
                    Realm Name
                    {sortField === 'decoded_name' && (
                      <span style={{ marginLeft: '0.25rem' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    style={{ 
                      padding: '0.75rem',
                      textAlign: 'center',
                      borderBottom: '1px solid #444'
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentRealms.map((realm) => (
                  <tr 
                    key={realm.entity_id}
                    style={{ 
                      borderBottom: '1px solid #333',
                      backgroundColor: 'transparent',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-secondary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '0.75rem' }}>
                      <Link 
                        href={`/?realm=${realm.realm_id}`}
                        style={{ 
                          color: 'var(--color-primary)',
                          fontWeight: 'bold'
                        }}
                      >
                        {realm.realm_id}
                      </Link>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{realm.entity_id}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <div>{realm.decoded_name || 'Unknown'}</div>
                      {showHex && realm.realm_name && (
                        <div style={{ 
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          color: '#888',
                          marginTop: '0.25rem',
                          wordBreak: 'break-all'
                        }}>
                          {realm.realm_name}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <Link 
                        href={`/?realm=${realm.realm_id}`}
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          backgroundColor: 'var(--color-primary)',
                          color: '#000',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                          fontSize: '0.875rem'
                        }}
                      >
                        View Resources
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Bottom Pagination */}
        {!loading && filteredAndSortedRealms.length > itemsPerPage && (
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '2rem'
          }}>
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                &lt;
              </button>
              {renderPaginationButtons()}
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-button"
              >
                &gt;
              </button>
            </div>
          </div>
        )}
        
        {!loading && filteredAndSortedRealms.length === 0 && !error && (
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center',
            backgroundColor: 'var(--color-secondary)',
            borderRadius: '4px',
            marginBottom: '2rem'
          }}>
            <p>No realms found matching your search criteria.</p>
            <button 
              onClick={() => setSearchTerm('')}
              style={{ marginTop: '1rem' }}
            >
              Clear Search
            </button>
          </div>
        )}
        
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem',
          backgroundColor: 'var(--color-secondary)',
          borderRadius: '4px',
          fontSize: '0.875rem'
        }}>
          <h3 style={{ marginBottom: '0.5rem' }}>About Realm Data</h3>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '0' }}>
            <li>Realm IDs are the public identifiers shown in-game</li>
            <li>Entity IDs are internal database identifiers used to link resources</li>
            <li>Realm names are stored as hexadecimal values on the blockchain</li>
            <li>All {totalRealmCount} realms are loaded for instant search and filtering</li>
          </ul>
        </div>
      </main>
      
      <style jsx>{`
        .pagination {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .pagination-button {
          padding: 0.25rem 0.5rem;
          min-width: 2rem;
          text-align: center;
          background-color: var(--color-secondary);
          border: none;
          border-radius: 4px;
          color: var(--color-text);
          cursor: pointer;
        }
        
        .pagination-button.active {
          background-color: var(--color-primary);
          color: #000;
          font-weight: bold;
        }
        
        .pagination-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
