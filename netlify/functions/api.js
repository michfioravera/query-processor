// functions/api.js
exports.handler = async (event, context) => {
  try {
    // 1. Parser avanzato che replica ESATTAMENTE il comportamento di index.html
    const params = {};
    const seenPairs = new Set();
    
    event.rawQuery.split('&').forEach(pair => {
      if (seenPairs.has(pair)) return; // Evita di processare duplicati identici
      seenPairs.add(pair);
      
      const [key, value] = pair.split('=').map(decodeURIComponent);
      if (!key || value === undefined) return;
      
      const normalizedValues = value.split(',').map(v => v.trim());
      
      if (!params[key]) {
        params[key] = normalizedValues;
      } else {
        params[key] = [...params[key], ...normalizedValues];
      }
    });

    // 2. Analisi IDENTICA a index.html
    const result = {
      timestamp: new Date().toISOString(),
      parameters: {},
      summary: {
        totalParameters: 0,
        numericParameters: 0,
        booleanParameters: 0,
        arrayParameters: 0,
        multiValueParameters: 0
      }
    };

    for (const [key, values] of Object.entries(params)) {
      const uniqueValues = [...new Set(values)]; // Rimozione duplicati
      const analyses = uniqueValues.map(v => analyzeValue(v));
      const type = determineType(analyses, uniqueValues);
      
      result.parameters[key] = {
        value: uniqueValues.length === 1 ? uniqueValues[0] : uniqueValues,
        values: uniqueValues,
        type: type,
        occurrences: uniqueValues.length,
        analyses: analyses,
        hadDuplicates: values.length !== uniqueValues.length
      };

      // Aggiornamento summary come in index.html
      result.summary.totalParameters++;
      if (type.includes('number')) result.summary.numericParameters++;
      if (type.includes('boolean')) result.summary.booleanParameters++;
      if (uniqueValues.length > 1) result.summary.multiValueParameters++;
      if (type.includes('array')) result.summary.arrayParameters++;
    }

    // 3. Formattazione IDENTICA alla UI
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
        expectedBehavior: "This endpoint should exactly match index.html's processing",
        fixHint: "Compare with parseParameters() in index.html"
      })
    };
  }
};

// Funzioni COPIATE DIRETTAMENTE da index.html
function analyzeValue(value) {
  const num = Number(value);
  const isNum = !isNaN(num) && value !== '' && !isNaN(parseFloat(value));
  const isBool = value.toLowerCase() === 'true' || value.toLowerCase() === 'false';
  const isDate = !isNaN(Date.parse(value)) && value.match(/\d{4}-\d{2}-\d{2}/);

  return {
    originalValue: value,
    isNumber: isNum,
    isBoolean: isBool,
    isDate: isDate,
    numericValue: isNum ? num : null,
    booleanValue: isBool ? value.toLowerCase() === 'true' : null
  };
}

function determineType(analyses, values) {
  const allNumbers = analyses.every(a => a.isNumber);
  const allBooleans = analyses.every(a => a.isBoolean);
  
  if (values.length > 1) {
    if (allNumbers) return 'number[]';
    if (allBooleans) return 'boolean[]';
    return 'mixed[]';
  } else {
    const analysis = analyses[0];
    if (analysis.isNumber) return 'number';
    if (analysis.isBoolean) return 'boolean';
    if (analysis.isDate) return 'date';
    return 'text';
  }
}
