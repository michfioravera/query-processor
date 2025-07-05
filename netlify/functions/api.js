// api.js - Approccio alternativo con parsing manuale

exports.handler = async (event, context) => {
  const merged = {};
  
  // Funzione per parsare manualmente la query string
  function parseQueryString(url) {
    const params = {};
    
    try {
      // Estrai la query string dall'URL
      const queryStart = url.indexOf('?');
      if (queryStart === -1) return params;
      
      const queryString = url.substring(queryStart + 1);
      const pairs = queryString.split('&');
      
      for (const pair of pairs) {
        if (!pair) continue;
        
        const [key, value] = pair.split('=').map(decodeURIComponent);
        
        if (!key) continue;
        
        if (!params[key]) {
          params[key] = [];
        }
        
        if (value) {
          params[key].push(value);
        }
      }
    } catch (e) {
      console.error('Error parsing query string:', e);
    }
    
    return params;
  }
  
  // Prova prima con rawUrl
  let allParams = {};
  
  if (event.rawUrl) {
    allParams = parseQueryString(event.rawUrl);
  } else if (event.path && event.path.includes('?')) {
    // Fallback al path se contiene query string
    allParams = parseQueryString(event.path);
  } else if (event.multiValueQueryStringParameters) {
    // Usa multiValueQueryStringParameters di Netlify
    allParams = event.multiValueQueryStringParameters;
  }
  
  // Processa i parametri
  for (const [key, values] of Object.entries(allParams)) {
    const allValues = [];
    const valueArray = Array.isArray(values) ? values : [values];
    
    for (const value of valueArray) {
      if (value) {
        // Gestisci valori separati da virgola
        const subValues = value.split(',').map(v => v.trim()).filter(v => v);
        allValues.push(...subValues);
      }
    }
    
    // Rimuovi duplicati
    if (allValues.length > 0) {
      merged[key] = [...new Set(allValues)].join(',');
    }
  }

  return {
    statusCode: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      parameters: merged
    })
  };
};
