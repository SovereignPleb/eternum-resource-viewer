// pages/api/final-diagnostic.js
import axios from 'axios';

export default async function handler(req, res) {
  console.log('Running final diagnostic tool');
  
  const endpoint = 'https://api.cartridge.gg/x/eternum-game-mainnet-27/torii/sql';
  
  // Try various SQL strings and formats to see if any work
  const testQueries = [
    { format: 'string', sql: 'SELECT 1' },
    { format: 'string', sql: 'SELECT 1 as test' },
    { format: 'string', sql: 'SELECT * FROM realms LIMIT 1' },
    { format: 'string', sql: 'SELECT * FROM s1_eternum_SettleRealmData LIMIT 1' },
    { format: 'string', sql: 'SELECT * FROM "s1_eternum_SettleRealmData" LIMIT 1' },
    { format: 'string', sql: 'SELECT * FROM s1_eternum-SettleRealmData LIMIT 1' },
    { format: 'string', sql: 'SELECT * FROM "s1_eternum-SettleRealmData" LIMIT 1' },
    { format: 'string', sql: 'SHOW TABLES' },
    { format: 'string', sql: '.tables' }, // SQLite command
    { format: 'string', sql: 'SELECT name FROM sqlite_master WHERE type="table"' }, // SQLite metadata query
    
    // Try different parameter formats for JSON-RPC
    { format: 'object', sql: { query: 'SELECT 1 as test' } },
    { format: 'object', sql: { q: 'SELECT 1 as test' } },
    { format: 'object', sql: { statement: 'SELECT 1 as test' } },
    { format: 'object', sql: { sql: 'SELECT 1 as test' } },
    { format: 'array', sql: ['SELECT 1 as test'] }
  ];
  
  const results = [];
  
  // Test each query format
  for (const test of testQueries) {
    try {
      console.log(`Testing ${test.format} format with SQL: ${JSON.stringify(test.sql)}`);
      
      let jsonRpcRequest;
      
      if (test.format === 'string') {
        jsonRpcRequest = {
          jsonrpc: "2.0",
          id: 1,
          method: "torii_sql",
          params: test.sql
        };
      } else if (test.format === 'object') {
        jsonRpcRequest = {
          jsonrpc: "2.0",
          id: 1,
          method: "torii_sql",
          params: test.sql
        };
      } else if (test.format === 'array') {
        jsonRpcRequest = {
          jsonrpc: "2.0",
          id: 1,
          method: "torii_sql",
          params: test.sql
        };
      }
      
      const response = await axios.post(endpoint, jsonRpcRequest, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });
      
      results.push({
        test,
        success: true,
        response: response.data
      });
      
      console.log(`Success with test: ${JSON.stringify(test)}`);
      console.log(`Response: ${JSON.stringify(response.data)}`);
    } catch (error) {
      let errorDetails = null;
      
      if (error.response?.data) {
        errorDetails = error.response.data;
        console.error(`Error response: ${JSON.stringify(error.response.data)}`);
      }
      
      results.push({
        test,
        success: false,
        error: error.message,
        details: errorDetails
      });
      
      console.error(`Error with test: ${JSON.stringify(test)}`);
      console.error(`Error message: ${error.message}`);
    }
  }
  
  return res.status(200).json({
    message: 'Final diagnostic completed',
    results
  });
}
