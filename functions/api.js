// netlify/functions/api.js
const { parseParameters, generateResult } = require('../../shared/paramProcessor.js');

exports.handler = async (event, context) => {
  try {
    const startTime = Date.now();
    
    // Parse query parameters from the URL
    const queryString = event.queryStringParameters ? 
      Object.entries(event.queryStringParameters)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&') : '';
    
    const params = parseParameters(queryString);
    const result = generateResult(params, startTime);

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify(result, null, 2)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: "API Error",
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};