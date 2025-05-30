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

  // Current API endpoint - easier to update if it changes again
  const apiEndpoint = 'https://api.cartridge.gg/x/eternum-game-mainnet-27/torii/sql';
  
  try {
    // URL-encode the query and use it as a parameter
    const encodedQuery = encodeURIComponent(query);
    const fullUrl = `${apiEndpoint}?query=${encodedQuery}`;
    
    const response = await axios.get(fullUrl, {
      headers: { 'Accept': 'application/json' },
      timeout: 15000 // Increased timeout for larger queries
    });
    
    // Return data directly without additional processing
    return res.status(200).json({ data: response.data });
  } catch (error) {
    console.error('Error executing SQL query:', error.message);
    
    // Improved error response with more details
    return res.status(500).json({ 
      error: 'Failed to execute query',
      message: error.message,
      details: error.response?.data || null,
      query: query.substring(0, 100) + (query.length > 100 ? '...' : '') // Include partial query for debugging
    });
  }
}
