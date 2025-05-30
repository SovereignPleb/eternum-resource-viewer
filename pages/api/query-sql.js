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

  const apiEndpoint = 'https://api.cartridge.gg/x/eternum-game-mainnet-27/torii/sql';
  
  console.log('Executing query:', query);

  try {
    // Format the request properly using JSON-RPC 2.0 protocol
    const jsonRpcRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "torii_sql",
      params: {
        query: query
      }
    };

    console.log('Sending request:', JSON.stringify(jsonRpcRequest));

    const response = await axios.post(apiEndpoint, jsonRpcRequest, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    // Check for JSON-RPC response format
    if (response.data && response.data.result) {
      // Success case: return the result property from JSON-RPC response
      return res.status(200).json({ data: response.data.result });
    } else if (response.data && response.data.error) {
      // Error case: API returned a JSON-RPC error
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
