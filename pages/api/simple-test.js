// pages/api/simple-test.js
import axios from 'axios';

export default async function handler(req, res) {
  console.log('Running simplified SQL test');
  
  const endpoint = 'https://api.cartridge.gg/x/eternum-game-mainnet-27/torii/sql';
  
  try {
    // Try with a simpler format - the raw SQL as a string
    const jsonRpcRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "torii_sql",
      params: "SELECT 1 as test"  // Just a string, not an object
    };
    
    console.log('Testing simplified format:', JSON.stringify(jsonRpcRequest));
    
    const response = await axios.post(endpoint, jsonRpcRequest, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    return res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error with simplified test:', error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data));
    }
    
    // Now try with a raw SQL string without JSON-RPC
    try {
      console.log('Trying raw SQL string');
      
      const rawResponse = await axios.post(endpoint, "SELECT 1 as test", {
        headers: { 'Content-Type': 'text/plain' }
      });
      
      return res.status(200).json({
        success: true,
        approach: 'raw',
        data: rawResponse.data
      });
    } catch (rawError) {
      console.error('Error with raw SQL:', rawError.message);
      if (rawError.response?.data) {
        console.error('Raw response data:', JSON.stringify(rawError.response.data));
      }
    }
    
    // Try the simplest possible JSON-RPC format
    try {
      console.log('Trying minimal JSON-RPC');
      
      const minimalRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "torii_sql"
      };
      
      const minimalResponse = await axios.post(endpoint, minimalRequest, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      return res.status(200).json({
        success: true,
        approach: 'minimal',
        data: minimalResponse.data
      });
    } catch (minError) {
      console.error('Error with minimal request:', minError.message);
      if (minError.response?.data) {
        console.error('Minimal response data:', JSON.stringify(minError.response.data));
      }
    }
    
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data || null
    });
  }
}
