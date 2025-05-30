// pages/api/simple-test-query.js
import axios from 'axios';

export default async function handler(req, res) {
  console.log('Running simple test query with enhanced debugging');
  
  // Define the API endpoint
  const apiEndpoint = 'https://api.cartridge.gg/x/eternum-game-mainnet-27/torii/sql';
  
  try {
    // Use the simplest possible JSON-RPC request
    const jsonRpcRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "torii_sql",
      params: {
        query: "SELECT 1 as test"
      }
    };

    console.log('Sending request:', JSON.stringify(jsonRpcRequest));

    // Make the request with enhanced error handling
    let responseText = null;
    let responseData = null;
    let responseStatus = null;
    
    try {
      // Make the request
      const response = await axios.post(apiEndpoint, jsonRpcRequest, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000, // 10 second timeout
        validateStatus: function (status) {
          // Accept any status code to handle it ourselves
          return true;
        },
        responseType: 'text' // Get as text first to inspect
      });
      
      responseStatus = response.status;
      responseText = response.data;
      
      console.log('Response status:', response.status);
      console.log('Response headers:', JSON.stringify(response.headers));
      console.log('Response text (first 500 chars):', response.data.substring(0, 500));
      
      // Try to parse as JSON
      try {
        responseData = JSON.parse(response.data);
        console.log('Successfully parsed response as JSON');
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError.message);
      }
    } catch (requestError) {
      console.error('Request error:', requestError.message);
      
      if (requestError.response) {
        responseStatus = requestError.response.status;
        try {
          responseText = await requestError.response.data;
        } catch (e) {
          responseText = 'Could not read response data';
        }
      }
    }

    // Return detailed debugging information
    return res.status(200).json({
      debug: true,
      apiEndpoint,
      requestSent: jsonRpcRequest,
      responseStatus,
      responseText: responseText ? responseText.substring(0, 1000) : null, // First 1000 chars
      responseData,
      parseSuccess: responseData !== null
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
