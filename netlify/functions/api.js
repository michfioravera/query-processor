// netlify/functions/api.js
const ParamProcessor = require('../../paramProcessor.js');

exports.handler = async (event, context) => {
  try {
    // Registra il tempo di inizio per le performance
    const startTime = performance.now();
    
    // Usa il parser condiviso per i parametri dalla query string
    const urlParams = new URLSearchParams(event.rawQuery);
    const params = ParamProcessor.parseParametersFromQuery(urlParams.entries());

    // Usa l'analizzatore condiviso con startTime (come in index.html)
    const result = ParamProcessor.analyzeParameters(params, startTime);

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*'
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
        expected: "Identical behavior to index.html parameter processing"
      })
    };
  }
};