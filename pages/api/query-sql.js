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
    const response = await axios.post('https://api.cartridge.gg/x/eternum-game-mainnet-25/torii/sql', {
      query
    });
    
    return res.status(200).json({ data: response.data });
  } catch (error) {
    console.error('Error executing SQL query:', error.response?.data || error.message);
    return res.status(500).json({ 
      error: 'Failed to execute query',
      details: error.response?.data || error.message
    });
  }
}
