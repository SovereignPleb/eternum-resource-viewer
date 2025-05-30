// pages/api/query-sql.js
import axios from 'axios';

// Define a list of available API endpoints to try if the primary one fails
const API_ENDPOINTS = [
  'https://api.cartridge.gg/x/eternum-game-mainnet-27/torii/sql',
  'https://api.cartridge.gg/x/eternum-game-mainnet-25/torii/sql',
  'https://api.cartridge.gg/x/eternum-game/torii/sql'
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
  
  // Try each endpoint in order until one works
  for (const apiEndpoint of API_ENDPOINTS) {
    try {
      // URL-encode the query and use it as a parameter
      const encodedQuery = encodeURIComponent(query);
      const fullUrl = `${apiEndpoint}?query=${encodedQuery}`;
      
      console.log(`Trying API endpoint: ${apiEndpoint}`);
      console.log('Query:', query.substring(0, 100) + (query.length > 100 ? '...' : ''));
      
      const response = await axios.get(fullUrl, {
        headers: { 'Accept': 'application/json' },
        timeout: 15000 // Increased timeout for larger queries
      });
      
      console.log(`Successful response from ${apiEndpoint}`);
      
      // The response should be a direct array of results
      if (Array.isArray(response.data)) {
        return res.status(200).json({ 
          data: response.data,
          endpoint: apiEndpoint // Include which endpoint worked
        });
      } else {
        // Handle JSON-RPC format if that's what the API returns
        if (response.data && response.data.result) {
          return res.status(200).json({ 
            data: response.data.result,
            endpoint: apiEndpoint
          });
        } else if (response.data && response.data.error) {
          lastError = {
            message: 'API returned an error',
            details: response.data.error,
            endpoint: apiEndpoint
          };
          // Continue to try next endpoint
          continue;
        } else {
          // Unexpected but successful response format
          return res.status(200).json({ 
            data: response.data,
            endpoint: apiEndpoint,
            note: 'Unexpected response format, treating as successful'
          });
        }
      }
    } catch (error) {
      console.error(`Error with endpoint ${apiEndpoint}:`, error.message);
      
      lastError = {
        message: error.message,
        endpoint: apiEndpoint,
        details: error.response?.data || null
      };
      
      // Continue to next endpoint
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
