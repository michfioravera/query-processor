// shared/paramProcessor.js
export function parseParameters(input) {
  const params = {};
  
  if (typeof input === 'string') {
    // Elaborazione da stringa (per API)
    input.split('&').forEach(pair => {
      const [key, value] = pair.split('=').map(decodeURIComponent);
      if (key && value !== undefined) {
        processKeyValue(params, key, value);
      }
    });
  } else if (input instanceof URLSearchParams) {
    // Elaborazione da URLSearchParams (per frontend)
    for (const [key, value] of input.entries()) {
      processKeyValue(params, key, value);
    }
  }

  return params;
}

function processKeyValue(params, key, value) {
  const values = value.split(',').map(v => v.trim());
  
  if (!params[key]) {
    params[key] = [...new Set(values)]; // Rimuove duplicati immediati
  } else {
    const merged = [...new Set([...params[key], ...values])];
    params[key] = merged;
  }
}

function analyzeValue(value) {
  const parts = value.split(',').map(p => p.trim());
  
  if (parts.length === 1) {
    const num = Number(value);
    const bool = value.toLowerCase() === 'true' || value.toLowerCase() === 'false';
    const date = !isNaN(Date.parse(value)) && value.match(/\d{4}-\d{2}-\d{2}/);
    
    return {
      originalValue: value,
      isNumber: !isNaN(num) && value !== '' && !isNaN(parseFloat(value)),
      isBoolean: bool,
      isDate: date,
      isArray: false,
      numericValue: !isNaN(num) && value !== '' && !isNaN(parseFloat(value)) ? num : null,
      booleanValue: bool ? value.toLowerCase() === 'true' : null,
      arrayValues: null
    };
  }
  
  const numbers = parts.map(p => Number(p));
  const allNumbers = numbers.every(n => !isNaN(n));
  const booleans = parts.map(p => p.toLowerCase() === 'true' || p.toLowerCase() === 'false');
  const allBooleans = booleans.every(b => b);
  
  return {
    originalValue: value,
    isNumber: false,
    isBoolean: false,
    isArray: true,
    numericValue: null,
    arrayValues: allNumbers ? numbers : (allBooleans ? parts.map(p => p.toLowerCase() === 'true') : parts),
    isNumericArray: allNumbers,
    isBooleanArray: allBooleans
  };
}

function generateResult(params, startTime) {
  const result = {
    timestamp: new Date().toISOString(),
    parameters: {},
    summary: {
      totalParameters: 0,
      numericParameters: 0,
      arrayParameters: 0,
      booleanParameters: 0,
      multiValueParameters: 0
    },
    performance: {
      responseTime: `${(Date.now() - startTime).toFixed(2)}ms`,
      timestamp: new Date().toLocaleString(),
      parameterCount: 0
    }
  };

  for (const [key, values] of Object.entries(params)) {
    const combinedValue = values.join(',');
    const analysis = analyzeValue(combinedValue);
    
    result.parameters[key] = {
      value: combinedValue,
      values: [combinedValue],
      type: determineType(analysis, combinedValue),
      occurrences: 1,
      analysis: {
        isMultiValue: false,
        isNumber: analysis.isNumber,
        isBoolean: analysis.isBoolean,
        isArray: analysis.isArray,
        length: values.length
      }
    };

    if (analysis.isArray && analysis.isNumericArray) {
      result.parameters[key].elements = analysis.arrayValues;
      result.parameters[key].statistics = calculateStats(analysis);
    }

    result.summary.totalParameters++;
    if (analysis.isArray) result.summary.arrayParameters++;
    if (analysis.isNumber && !analysis.isArray) result.summary.numericParameters++;
    if (analysis.isBoolean && !analysis.isArray) result.summary.booleanParameters++;
  }

  result.performance.parameterCount = result.summary.totalParameters;
  return result;
}

function determineType(analysis, value) {
  if (analysis.isArray) {
    if (analysis.isNumericArray) return 'numeric array';
    if (analysis.isBooleanArray) return 'boolean array';
    return 'array';
  }
  if (analysis.isNumber) return 'number';
  if (analysis.isBoolean) return 'boolean';
  if (analysis.isDate) return 'date';
  return 'text';
}

function calculateStats(analysis) {
  if (!analysis.isArray || !analysis.isNumericArray) return null;
  
  const numbers = analysis.arrayValues;
  const sum = numbers.reduce((a, b) => a + b, 0);
  const avg = sum / numbers.length;
  const sorted = [...numbers].sort((a, b) => a - b);
  const median = sorted.length % 2 === 0 
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  
  return {
    count: numbers.length,
    sum: sum,
    average: avg,
    median: median,
    min: Math.min(...numbers),
    max: Math.max(...numbers),
    range: Math.max(...numbers) - Math.min(...numbers),
    standardDeviation: Math.sqrt(numbers.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / numbers.length)
  };
}

// CommonJS exports for Node.js
module.exports = {
  parseParameters,
  analyzeValue,
  generateResult,
  calculateStats
};