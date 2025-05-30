// pages/api/latest-eternum.js
import axios from 'axios';

export default async function handler(req, res) {
  console.log('Testing latest Eternum API endpoints');
  
  // Try various potential new endpoints
  const endpoints = [
    'https://api.eternum.io/api/v1/realms',
    'https://api.eternum.io/api/realms',
    'https://api.cartridge.gg/eternum/api/realms',
    'https://api.cartridge.gg/x/eternum/api/realms',
    'https://api.cartridge.gg/x/eternum-game-mainnet-27/api/realms',
    'https://api.cartridge.gg/x/eternum-game/api/realms',
    'https://api.eternum.game/api/realms',
    'https://torii-api.cartridge.gg/x/eternum/graphql'
  ];
  
  const results = [];
  
  // Try each endpoint
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing endpoint: ${endpoint}`);
      
      const response = await axios.get(endpoint, { 
        timeout: 5000,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      results.push({
        endpoint,
        success: true,
        status: response.status,
        data: response.data
      });
      
      console.log(`Success with endpoint: ${endpoint}`);
    } catch (error) {
      results.push({
        endpoint,
        success: false,
        status: error.response?.status,
        error: error.message
      });
      
      console.error(`Error with endpoint: ${endpoint}`);
      console.error(`Error: ${error.message}`);
    }
  }
  
  // Also try a GraphQL query to see if the API has moved to GraphQL
  try {
    const graphqlEndpoint = 'https://api.cartridge.gg/x/eternum/graphql';
    const graphqlQuery = {
      query: `
        query {
          realms(first: 5) {
            id
            name
            owner
          }
        }
      `
    };
    
    const graphqlResponse = await axios.post(graphqlEndpoint, graphqlQuery, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 5000
    });
    
    results.push({
      endpoint: 'GraphQL API',
      success: true,
      status: graphqlResponse.status,
      data: graphqlResponse.data
    });
  } catch (error) {
    results.push({
      endpoint: 'GraphQL API',
      success: false,
      status: error.response?.status,
      error: error.message
    });
  }
  
  return res.status(200).json({
    message: 'Latest API tests completed',
    results
  });
}
