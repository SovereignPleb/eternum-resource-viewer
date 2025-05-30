// pages/api/query-sql.js
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  // Use URL parameter approach for SQL query
  const apiEndpoint = 'https://api.cartridge.gg/x/eternum-game-mainnet-27/torii/sql';
  
  console.log('Executing query:', query);

  try {
    // URL-encode the query and use it as a parameter
    const encodedQuery = encodeURIComponent(query);
    const fullUrl = `${apiEndpoint}?query=${encodedQuery}`;
    
    console.log('Making GET request to:', fullUrl);
    
    const response = await axios.get(fullUrl, {
      headers: {
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('Response status:', response.status);
    
    // The response should be a direct array of results
    if (Array.isArray(response.data)) {
      return res.status(200).json({ data: response.data });
    } else {
      // Handle JSON-RPC format if that's what the API returns
      if (response.data && response.data.result) {
        return res.status(200).json({ data: response.data.result });
      } else if (response.data && response.data.error) {
        return res.status(400).json({ 
          error: 'API returned an error',
          details: response.data.error
        });
      } else {
        // Unexpected response format
        return res.status(500).json({ 
          error: 'Unexpected API response format',
          data: response.data
        });
      }
    }
  } catch (error) {
    console.error('Error executing SQL query:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    }
    
    return res.status(500).json({ 
      error: 'Failed to execute query',
      message: error.message,
      details: error.response?.data || 'No additional details'
    });
  }
}
