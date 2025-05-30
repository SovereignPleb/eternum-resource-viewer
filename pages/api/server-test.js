// pages/api/server-test.js
import axios from 'axios';

export default async function handler(req, res) {
  // Log our test attempt
  console.log('Starting server-side API test');
  
  // Create an array of test configurations to try
  const testConfigs = [
    {
      endpoint: 'https://api.cartridge.gg/x/eternum-game-mainnet-27/torii/sql',
      method: 'torii_sql',
      format: 'json-rpc'
    },
    {
      endpoint: 'https://api.cartridge.gg/x/eternum/torii/sql',
      method: 'torii_sql',
      format: 'json-rpc'
    },
    {
      endpoint: 'https://api.cartridge.gg/x/eternum-game/torii/sql',
      method: 'torii_sql',
      format: 'json-rpc'
    },
    {
      endpoint: 'https://api.cartridge.gg/x/eternum-game-mainnet-27/torii/sql',
      method: 'sql',
      format: 'json-rpc'
    },
    {
      endpoint: 'https://api.cartridge.gg/x/eternum-game-mainnet-27/torii/sql',
      method: 'query',
      format: 'json-rpc'
    },
    {
      endpoint: 'https://api.cartridge.gg/x/eternum-game-mainnet-27/torii/sql',
      format: 'direct'
    }
  ];

  // Store results from each test
  const results = [];
  
  // Try each configuration
  for (const config of testConfigs) {
    try {
      console.log(`Testing config: ${JSON.stringify(config)}`);
      let response;
      
      if (config.format === 'json-rpc') {
        // JSON-RPC format
        const jsonRpcRequest = {
          jsonrpc: "2.0",
          id: 1,
          method: config.method,
          params: {
            query: "SELECT 1 as test;"
          }
        };
        
        response = await axios.post(config.endpoint, jsonRpcRequest, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000 // 5 second timeout
        });
      } else {
        // Direct format
        response = await axios.post(config.endpoint, {
          query: "SELECT 1 as test;"
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        });
      }
      
      results.push({
        config,
        success: true,
        status: response.status,
        data: response.data
      });
      
      console.log(`Success with config: ${JSON.stringify(config)}`);
      console.log(`Response: ${JSON.stringify(response.data)}`);
    } catch (error) {
      results.push({
        config,
        success: false,
        error: error.message,
        details: error.response?.data || null
      });
      
      console.error(`Error with config: ${JSON.stringify(config)}`);
      console.error(`Error: ${error.message}`);
      if (error.response?.data) {
        console.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
  
  // Also try a simple GET request to the API endpoint
  try {
    const getResponse = await axios.get('https://api.cartridge.gg/x/eternum-game-mainnet-27/torii/sql?query=SELECT%201%20as%20test');
    results.push({
      config: { method: 'GET', endpoint: 'https://api.cartridge.gg/x/eternum-game-mainnet-27/torii/sql' },
      success: true,
      status: getResponse.status,
      data: getResponse.data
    });
  } catch (error) {
    results.push({
      config: { method: 'GET', endpoint: 'https://api.cartridge.gg/x/eternum-game-mainnet-27/torii/sql' },
      success: false,
      error: error.message
    });
  }
  
  // Return all results
  return res.status(200).json({
    message: 'API tests completed',
    results: results
  });
}
