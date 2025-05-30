// pages/api/working-query.js
import axios from 'axios';

export default async function handler(req, res) {
  console.log('Testing working query formats');
  
  const endpoint = 'https://api.cartridge.gg/x/eternum-game-mainnet-27/torii/sql';
  
  try {
    // Try SQL string with explicit escaping
    const jsonRpcRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "torii_sql",
      params: {
        query: "SELECT 1 as test"
      }
    };
    
    // Try formatting the SQL query to avoid syntax issues
    const wellFormattedQuery = {
      jsonrpc: "2.0",
      id: 1,
      method: "torii_sql",
      params: {
        query: `SELECT 1 as test`
      }
    };
    
    // Format with whitespace and no special characters
    const cleanQuery = {
      jsonrpc: "2.0",
      id: 1,
      method: "torii_sql",
      params: {
        query: "SELECT 1 AS test"
      }
    };
    
    // Make sure the request is sent as a properly formatted JSON string
    const requestText = JSON.stringify(cleanQuery);
    console.log('Sending request:', requestText);
    
    const response = await axios.post(endpoint, cleanQuery, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Got response:', JSON.stringify(response.data));
    
    // If successful, try a real query for Eternum data
    if (response.data && (response.data.result || response.data.data)) {
      console.log('First query succeeded, trying actual game data query');
      
      // Try to list tables
      const tablesQuery = {
        jsonrpc: "2.0",
        id: 2,
        method: "torii_sql",
        params: {
          query: "SELECT name FROM sqlite_master WHERE type='table' LIMIT 10"
        }
      };
      
      const tablesResponse = await axios.post(endpoint, tablesQuery, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Tables response:', JSON.stringify(tablesResponse.data));
      
      // Try a real realm query
      const realmsQuery = {
        jsonrpc: "2.0",
        id: 3,
        method: "torii_sql",
        params: {
          query: "SELECT id, entity_id FROM s1_eternum_SettleRealmData LIMIT 5"
        }
      };
      
      try {
        const realmsResponse = await axios.post(endpoint, realmsQuery, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Realms response:', JSON.stringify(realmsResponse.data));
        
        return res.status(200).json({
          success: true,
          simpleTestData: response.data,
          tablesData: tablesResponse.data,
          realmsData: realmsResponse.data
        });
      } catch (realmsError) {
        console.error('Error with realms query:', realmsError.message);
        
        // Try alternative table name formats
        const alternativeFormats = [
          "s1_eternum-SettleRealmData",
          "\"s1_eternum-SettleRealmData\"",
          "s1_eternum.SettleRealmData",
          "SettleRealmData",
          "Realms"
        ];
        
        const alternativeResults = {};
        
        for (const tableName of alternativeFormats) {
          try {
            const altQuery = {
              jsonrpc: "2.0",
              id: 4,
              method: "torii_sql",
              params: {
                query: `SELECT id, entity_id FROM ${tableName} LIMIT 5`
              }
            };
            
            console.log(`Trying alternative table name: ${tableName}`);
            
            const altResponse = await axios.post(endpoint, altQuery, {
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            alternativeResults[tableName] = {
              success: true,
              data: altResponse.data
            };
            
            console.log(`Success with table name: ${tableName}`);
          } catch (altError) {
            alternativeResults[tableName] = {
              success: false,
              error: altError.message
            };
            
            console.error(`Error with table name ${tableName}: ${altError.message}`);
          }
        }
        
        return res.status(200).json({
          success: true,
          simpleTestData: response.data,
          tablesData: tablesResponse.data,
          realmsError: realmsError.message,
          alternativeResults
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error with working query:', error.message);
    
    if (error.response?.data) {
      console.error('Error response data:', JSON.stringify(error.response.data));
    }
    
    // Try a completely different approach - formatted text
    try {
      console.log('Trying with text payload formatting');
      
      const textPayload = `{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "torii_sql",
  "params": {
    "query": "SELECT 1 AS test"
  }
}`;
      
      const textResponse = await axios.post(endpoint, textPayload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Text payload response:', JSON.stringify(textResponse.data));
      
      return res.status(200).json({
        success: true,
        approach: 'text-payload',
        data: textResponse.data
      });
    } catch (textError) {
      console.error('Text payload approach failed:', textError.message);
    }
    
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data || null
    });
  }
}
