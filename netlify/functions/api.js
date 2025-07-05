// api.js - Soluzione corretta per Netlify

exports.handler = async (event, context) => {
  const merged = {};
  
  // Usa multiValueQueryStringParameters che contiene tutti i valori
  const multiParams = event.multiValueQueryStringParameters || {};
  
  for (const [key, values] of Object.entries(multiParams)) {
    if (!values || !Array.isArray(values)) continue;
    
    const allValues = [];
    
    // Processa ogni valore
    for (const value of values) {
      if (value) {
        // Se il valore contiene virgole, dividilo
        const subValues = value.split(',').map(v => v.trim()).filter(v => v);
        allValues.push(...subValues);
      }
    }
    
    // IMPORTANTE: Rimuovi i duplicati usando Set
    const uniqueValues = [...new Set(allValues)];
    
    if (uniqueValues.length > 0) {
      merged[key] = uniqueValues.join(',');
    }
  }
  
  // Se non ci sono multiValueQueryStringParameters, usa queryStringParameters come fallback
  if (Object.keys(merged).length === 0 && event.queryStringParameters) {
    for (const [key, value] of Object.entries(event.queryStringParameters)) {
      if (value) {
        const allValues = value.split(',').map(v => v.trim()).filter(v => v);
        const uniqueValues = [...new Set(allValues)];
        
        if (uniqueValues.length > 0) {
          merged[key] = uniqueValues.join(',');
        }
      }
    }
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
      parameters: merged
    })
  };
};
