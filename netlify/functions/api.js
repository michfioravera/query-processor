// netlify/functions/api.js
const ParamProcessor = require('../../paramProcessor.js');

exports.handler = async (event, context) => {
  try {
    // Usa il parser condiviso per i parametri dalla query string
    const urlParams = new URLSearchParams(event.rawQuery);
    const params = ParamProcessor.parseParametersFromQuery(urlParams.entries());

    // Usa l'analizzatore condiviso
    const result = ParamProcessor.analyzeParameters(params);

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
      body: JSON.stringify(result, null, 2)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "API Error",
        message: error.message,
        expected: "Identical behavior to index.html parameter processing"
      })
    };
  }
};