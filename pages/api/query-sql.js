// pages/api/query-sql.js
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, endpoint } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  // Allow custom endpoint or use default
  const apiEndpoint = endpoint || 'https://api.cartridge.gg/x/eternum-game-mainnet-25/torii/sql';
  
  console.log('Executing query:', query);
  console.log('Using API endpoint:', apiEndpoint);

  try {
    // Format the request using JSON-RPC 2.0 protocol
    const jsonRpcRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "torii_sql",
      params: {
        query: query
      }
    };

    console.log('JSON-RPC request:', JSON.stringify(jsonRpcRequest, null, 2));

    // Send properly formatted JSON-RPC request
    const response = await axios.post(apiEndpoint, jsonRpcRequest, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Eternum-Resource-Viewer/1.0'
      },
      timeout: 10000
    });
    
    console.log('API response status:', response.status);
    
    // Check for JSON-RPC response format
    if (response.data && response.data.result) {
      // Success case: return the result property from JSON-RPC response
      return res.status(200).json({ data: response.data.result });
    } else if (response.data && response.data.error) {
      // Error case: API returned a JSON-RPC error
      return res.status(400).json({ 
        error: 'API returned an error',
        details: response.data.error,
        endpoint: apiEndpoint
      });
    } else {
      // Unexpected response format
      return res.status(500).json({ 
        error: 'Unexpected API response format',
        data: response.data,
        endpoint: apiEndpoint
      });
    }
  } catch (error) {
    console.error('Error executing SQL query:');
    
    // Log detailed error information
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Headers:', error.response.headers);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Request setup error:', error.message);
    }
    
    // Return appropriate error response
    return res.status(500).json({ 
      error: 'Failed to execute query',
      message: error.message,
      code: error.code,
      details: error.response?.data || 'No additional details',
      endpoint: apiEndpoint
    });
  }
}
