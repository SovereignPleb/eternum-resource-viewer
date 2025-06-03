// pages/api/query-sql.js
import axios from 'axios';

// Define the primary API endpoint to use - updated to use mainnet-30
const PRIMARY_ENDPOINT = 'https://api.cartridge.gg/x/eternum-game-mainnet-30/torii/sql';

// Define a list of backup API endpoints to try if the primary one fails
const BACKUP_ENDPOINTS = [
  'https://api.cartridge.gg/x/eternum-game-mainnet-27/torii/sql',
  'https://api.cartridge.gg/x/eternum-game-mainnet-25/torii/sql'
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  // Prepare for retry logic with multiple endpoints
  let lastError = null;
  
  // First try the primary endpoint
  try {
    // URL-encode the query and use it as a parameter
    const encodedQuery = encodeURIComponent(query);
    const fullUrl = `${PRIMARY_ENDPOINT}?query=${encodedQuery}`;
    
    console.log(`Trying primary API endpoint: ${PRIMARY_ENDPOINT}`);
    console.log('Query:', query.substring(0, 100) + (query.length > 100 ? '...' : ''));
    
    const response = await axios.get(fullUrl, {
      headers: { 'Accept': 'application/json' },
      timeout: 15000 // Increased timeout for larger queries
    });
    
    console.log(`Successful response from ${PRIMARY_ENDPOINT}`);
    
    // The response should be a direct array of results
    if (Array.isArray(response.data)) {
      return res.status(200).json({ 
        data: response.data,
        endpoint: PRIMARY_ENDPOINT
      });
    } else {
      // Handle JSON-RPC format if that's what the API returns
      if (response.data && response.data.result) {
        return res.status(200).json({ 
          data: response.data.result,
          endpoint: PRIMARY_ENDPOINT
        });
      } else if (response.data && response.data.error) {
        throw new Error(JSON.stringify(response.data.error));
      } else {
        // Unexpected but successful response format
        return res.status(200).json({ 
          data: response.data,
          endpoint: PRIMARY_ENDPOINT,
          note: 'Unexpected response format, treating as successful'
        });
      }
    }
  } catch (primaryError) {
    console.error(`Error with primary endpoint ${PRIMARY_ENDPOINT}:`, primaryError.message);
    
    lastError = {
      message: primaryError.message,
      endpoint: PRIMARY_ENDPOINT,
      details: primaryError.response?.data || null
    };
    
    // If primary fails, try the backup endpoints
    for (const endpoint of BACKUP_ENDPOINTS) {
      try {
        // URL-encode the query and use it as a parameter
        const encodedQuery = encodeURIComponent(query);
        const fullUrl = `${endpoint}?query=${encodedQuery}`;
        
        console.log(`Trying backup API endpoint: ${endpoint}`);
        
        const response = await axios.get(fullUrl, {
          headers: { 'Accept': 'application/json' },
          timeout: 15000 // Increased timeout for larger queries
        });
        
        console.log(`Successful response from ${endpoint}`);
        
        // The response should be a direct array of results
        if (Array.isArray(response.data)) {
          return res.status(200).json({ 
            data: response.data,
            endpoint: endpoint
          });
        } else {
          // Handle JSON-RPC format if that's what the API returns
          if (response.data && response.data.result) {
            return res.status(200).json({ 
              data: response.data.result,
              endpoint: endpoint
            });
          } else if (response.data && response.data.error) {
            lastError = {
              message: 'API returned an error',
              details: response.data.error,
              endpoint: endpoint
            };
            // Continue to try next endpoint
            continue;
          } else {
            // Unexpected but successful response format
            return res.status(200).json({ 
              data: response.data,
              endpoint: endpoint,
              note: 'Unexpected response format, treating as successful'
            });
          }
        }
      } catch (error) {
        console.error(`Error with backup endpoint ${endpoint}:`, error.message);
        
        lastError = {
          message: error.message,
          endpoint: endpoint,
          details: error.response?.data || null
        };
        
        // Continue to next endpoint
      }
    }
  }
  
  // If we get here, all endpoints failed
  console.error('All API endpoints failed');
  
  return res.status(500).json({ 
    error: 'Failed to execute query on any available endpoint',
    lastError: lastError,
    message: 'The Eternum API may be temporarily unavailable or the query format may be incorrect.',
    query: query.substring(0, 100) + (query.length > 100 ? '...' : '')
  });
}
