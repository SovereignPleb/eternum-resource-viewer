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

  console.log('Executing query:', query);

  try {
    const response = await axios.post('https://api.cartridge.gg/x/eternum-game-mainnet-25/torii/sql', {
      query
    });
    
    console.log('API response:', JSON.stringify(response.data, null, 2));
    
    // Check if we received an empty result
    if (!response.data || response.data.length === 0) {
      return res.status(404).json({ 
        error: 'No data found',
        query: query
      });
    }
    
    return res.status(200).json({ data: response.data });
  } catch (error) {
    console.error('Error executing SQL query:', error.response?.data || error.message);
    
    // Enhanced error reporting
    return res.status(500).json({ 
      error: 'Failed to execute query',
      message: error.message,
      details: error.response?.data || 'No additional details',
      query: query,
      // Include the stack trace in development only
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
