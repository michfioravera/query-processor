// api.js - Netlify Function

exports.handler = async (event, context) => {
  const merged = {};
  
  // In Netlify, i parametri multipli con lo stesso nome vengono già gestiti come array
  // ma dobbiamo anche gestire i valori separati da virgola
  const params = event.queryStringParameters || {};
  
  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;
    
    // Raccogli tutti i valori
    const allValues = [];
    
    // Se il valore contiene virgole, dividilo
    const values = value.split(',').map(v => v.trim()).filter(v => v);
    allValues.push(...values);
    
    // Rimuovi duplicati
    merged[key] = [...new Set(allValues)].join(',');
  }

  // Gestisci anche multiValueQueryStringParameters per parametri duplicati nell'URL
  const multiParams = event.multiValueQueryStringParameters || {};
  
  for (const [key, values] of Object.entries(multiParams)) {
    if (!values || values.length === 0) continue;
    
    const allValues = [];
    
    // Processa ogni valore (potrebbe contenere virgole)
    for (const value of values) {
      const subValues = value.split(',').map(v => v.trim()).filter(v => v);
      allValues.push(...subValues);
    }
    
    // Rimuovi duplicati e sovrascrivi il valore precedente
    merged[key] = [...new Set(allValues)].join(',');
  }

  return {
    statusCode: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    },
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      parameters: merged,
      _debug: {
        queryStringParameters: event.queryStringParameters,
        multiValueQueryStringParameters: event.multiValueQueryStringParameters
      }
    })
  };
};
