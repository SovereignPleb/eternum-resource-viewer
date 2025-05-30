// pages/api/simple-get-query.js
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    // Based on the network request we observed, the API uses a GET request with query parameter
    const apiUrl = `https://api.cartridge.gg/x/eternum-game-mainnet-27/torii/sql?query=${encodeURIComponent(query)}`;
    
    console.log('Executing query using GET request:', apiUrl);
    
    const response = await axios.get(apiUrl, {
      headers: {
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('Response status:', response.status);
    
    // Return the response data
    return res.status(200).json({
      data: response.data
    });
  } catch (error) {
    console.error('Error executing SQL query:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else {
      console.error(error.message);
    }
    
    return res.status(500).json({ 
      error: 'Failed to execute query',
      message: error.message,
      details: error.response?.data || 'No additional details'
    });
  }
}
