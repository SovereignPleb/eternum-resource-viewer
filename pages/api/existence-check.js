// pages/api/existence-check.js
import axios from 'axios';

export default async function handler(req, res) {
  console.log('Checking if Eternum API exists');
  
  // Base URLs to test
  const baseUrls = [
    'https://api.cartridge.gg',
    'https://cartridge.gg',
    'https://eternum.io',
    'https://api.eternum.io',
    'https://torii-api.cartridge.gg'
  ];
  
  const results = [];
  
  // First, check if the base domains are even accessible
  for (const url of baseUrls) {
    try {
      console.log(`Testing base URL: ${url}`);
      
      const response = await axios.get(url, { 
        timeout: 5000,
        validateStatus: function (status) {
          return status < 500; // Accept any non-server error status
        }
      });
      
      results.push({
        url,
        accessible: true,
        status: response.status,
        headers: response.headers
      });
      
      console.log(`Base URL ${url} is accessible with status ${response.status}`);
    } catch (error) {
      results.push({
        url,
        accessible: false,
        error: error.message
      });
      
      console.error(`Base URL ${url} is not accessible: ${error.message}`);
    }
  }
  
  // Check if the Eternum game website exists
  try {
    const gameResponse = await axios.get('https://eternum.io', {
      timeout: 5000,
      validateStatus: function (status) {
        return status < 500; // Accept any non-server error status
      }
    });
    
    results.push({
      url: 'https://eternum.io (Game Website)',
      accessible: true,
      status: gameResponse.status,
      isGameActive: gameResponse.status === 200
    });
  } catch (error) {
    results.push({
      url: 'https://eternum.io (Game Website)',
      accessible: false,
      error: error.message
    });
  }
  
  // Check for API documentation
  try {
    const docsResponse = await axios.get('https://docs.cartridge.gg', {
      timeout: 5000,
      validateStatus: function (status) {
        return status < 500;
      }
    });
    
    results.push({
      url: 'https://docs.cartridge.gg (API Documentation)',
      accessible: true,
      status: docsResponse.status
    });
  } catch (error) {
    results.push({
      url: 'https://docs.cartridge.gg (API Documentation)',
      accessible: false,
      error: error.message
    });
  }
  
  return res.status(200).json({
    message: 'API existence check completed',
    results: results
  });
}
