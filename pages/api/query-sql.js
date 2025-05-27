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
    // Attempt to connect to the API
    const response = await axios.post(apiEndpoint, {
      query
    }, {
      // Increased timeout for slow responses
      timeout: 10000,
      // Log request details for debugging
      headers: {
        'Content-Type': 'application/json',
        // Some APIs require a user-agent
        'User-Agent': 'Eternum-Resource-Viewer/1.0'
      }
    });
    
    console.log('API response status:', response.status);
    
    // Check if we received valid data
    if (response.data === undefined) {
      return res.status(500).json({ 
        error: 'API returned undefined data',
        endpoint: apiEndpoint
      });
    }
    
    return res.status(200).json({ data: response.data });
  } catch (error) {
    console.error('Error executing SQL query:');
    
    // Log detailed error information
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      console.error(`Status: ${error.response.status}`);
      console.error('Headers:', error.response.headers);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
    }
    
    // More specific error messages based on error type
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Could not connect to the Eternum API server',
        details: 'The API server refused the connection. The service might be down or the endpoint URL might have changed.',
        endpoint: apiEndpoint
      });
    }
    
    if (error.code === 'ETIMEDOUT') {
      return res.status(504).json({
        error: 'Connection to Eternum API timed out',
        details: 'The API server took too long to respond. This could be due to server load or network issues.',
        endpoint: apiEndpoint
      });
    }
    
    if (error.response?.status === 404) {
      return res.status(404).json({
        error: 'Eternum API endpoint not found',
        details: 'The API endpoint URL might have changed. Try a different endpoint URL.',
        endpoint: apiEndpoint
      });
    }
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      return res.status(error.response.status).json({
        error: 'Authentication required for Eternum API',
        details: 'The API now requires authentication. You may need to update your app to include auth tokens.',
        endpoint: apiEndpoint
      });
    }
    
    // Generic error response with as much detail as possible
    return res.status(500).json({ 
      error: 'Failed to execute query',
      message: error.message,
      code: error.code,
      details: error.response?.data || 'No additional details',
      endpoint: apiEndpoint
    });
  }
}
