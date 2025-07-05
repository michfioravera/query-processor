exports.handler = async (event, context) => {
  try {
    // SOLUZIONE UNIVERSALE: funziona sia in locale che in produzione
    const queryParams = event.queryStringParameters || {};
    const multiParams = parseMultiParams(event.multiValueQueryStringParameters || {});
    
    // Unisci i parametri (prevalgono quelli multi-value)
    const params = { ...queryParams, ...multiParams };

    // Resto del codice rimane uguale...
    const result = analyzeParameters(params);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Parameter processing error",
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};

// Nuova funzione di supporto
function parseMultiParams(multiValueParams) {
  const result = {};
  for (const [key, values] of Object.entries(multiValueParams)) {
    if (values.length > 0) {
      result[key] = values.length > 1 ? values : values[0];
    }
  }
  return result;
}

// (Mantieni le altre funzioni helper come analyzeValue, determineType, etc.)
