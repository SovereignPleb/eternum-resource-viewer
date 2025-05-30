// pages/api/simple-test-query-alt.js
import axios from 'axios';

export default async function handler(req, res) {
  console.log('Running simple test query with modified format');
  
  // Define the API endpoint
  const apiEndpoint = 'https://api.cartridge.gg/x/eternum-game-mainnet-27/torii/sql';
  
  try {
    // Try a few different formats for the request
    const formats = [
      // Format 1: SQL as direct string in params
      {
        jsonrpc: "2.0",
        id: 1,
        method: "torii_sql",
        params: "SELECT 1 as test"
      },
      
      // Format 2: Regular format we tried before
      {
        jsonrpc: "2.0",
        id: 1,
        method: "torii_sql",
        params: {
          query: "SELECT 1 as test"
        }
      },
      
      // Format 3: Array of parameters
      {
        jsonrpc: "2.0",
        id: 1,
        method: "torii_sql",
        params: ["SELECT 1 as test"]
      },
      
      // Format 4: Just the SQL
      "SELECT 1 as test"
    ];
    
    const results = [];
    
    for (const format of formats) {
      try {
        console.log('Trying format:', JSON.stringify(format));
        
        const response = await axios.post(apiEndpoint, format, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000,
          validateStatus: () => true // Accept any status code
        });
        
        console.log(`Format result (status ${response.status}):`, JSON.stringify(response.data).substring(0, 200));
        
        results.push({
          format: JSON.stringify(format),
          status: response.status,
          data: response.data
        });
      } catch (formatError) {
        console.error('Error with format:', formatError.message);
        results.push({
          format: JSON.stringify(format),
          error: formatError.message
        });
      }
    }

    // Return all test results
    return res.status(200).json({
      results
    });
  } catch (error) {
    console.error('Error in API handler:', error.message);
    
    return res.status(500).json({ 
      success: false,
      error: 'Failed to execute query',
      message: error.message,
      stack: error.stack
    });
  }
}
