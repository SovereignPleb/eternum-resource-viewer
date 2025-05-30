// pages/api/sql-format-tests.js
import axios from 'axios';

export default async function handler(req, res) {
  console.log('Testing specific SQL query formats');
  
  // Define the API endpoint
  const apiEndpoint = 'https://api.cartridge.gg/x/eternum-game-mainnet-27/torii/sql';
  
  // Define specific SQL queries to test
  const sqlQueries = [
    // Simple queries
    "SELECT 1 as test",
    "SELECT 1",
    "SELECT 1;",
    "select 1;",
    
    // Table info queries
    "SELECT name FROM sqlite_master WHERE type='table' LIMIT 1;",
    "PRAGMA table_info(sqlite_master);",
    ".tables",  // SQLite specific command
    
    // Quoted and backslash-escaped queries
    '"SELECT 1 as test"',
    "'SELECT 1 as test'",
    "\\SELECT 1 as test",
    
    // With line breaks and spacing
    `SELECT 
      1 as test`,
    "SELECT\n1\nas\ntest",
    
    // Different versions of double quotes/escaping
    "SELECT \"1\" as test",
    'SELECT "1" as test',
    'SELECT \'1\' as test',
    
    // Using LIMIT and other SQL keywords
    "SELECT 1 as test LIMIT 1",
    "SELECT 1 FROM (SELECT 1) LIMIT 1"
  ];
  
  try {
    const results = [];
    
    for (const sqlQuery of sqlQueries) {
      try {
        console.log('Testing SQL query:', sqlQuery);
        
        // Use the standard format but with different SQL queries
        const jsonRpcRequest = {
          jsonrpc: "2.0",
          id: 1,
          method: "torii_sql",
          params: {
            query: sqlQuery
          }
        };
        
        const response = await axios.post(apiEndpoint, jsonRpcRequest, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000,
          validateStatus: () => true // Accept any status code
        });
        
        console.log(`Query result (status ${response.status}):`, JSON.stringify(response.data).substring(0, 200));
        
        results.push({
          query: sqlQuery,
          status: response.status,
          data: response.data
        });
      } catch (queryError) {
        console.error('Error with query:', queryError.message);
        results.push({
          query: sqlQuery,
          error: queryError.message
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
