exports.handler = async (event, context) => {
  try {
    // Custom parameter parsing to match index.html behavior
    const rawParams = event.rawQuery.split('&');
    const params = {};

    rawParams.forEach(pair => {
      const [key, ...valueParts] = pair.split('=');
      const value = valueParts.join('=').trim();
      
      if (key && value) {
        const decodedKey = decodeURIComponent(key);
        const decodedValue = decodeURIComponent(value);
        const newValues = decodedValue.split(',').map(v => v.trim());

        if (params[decodedKey]) {
          // Merge with existing values
          const existingValues = Array.isArray(params[decodedKey]) 
            ? params[decodedKey]
            : [params[decodedKey]];
          const merged = [...existingValues, ...newValues];
          params[decodedKey] = [...new Set(merged)]; // Remove duplicates
        } else {
          params[decodedKey] = newValues.length > 1 ? newValues : newValues[0];
        }
      }
    });

    // Perform the same analysis as in index.html
    const result = {
      timestamp: new Date().toISOString(),
      parameters: {},
      summary: {
        totalParameters: 0,
        numericParameters: 0,
        arrayParameters: 0,
        booleanParameters: 0,
        multiValueParameters: 0
      }
    };

    // Analyze each parameter
    for (const [key, values] of Object.entries(params)) {
      const valueArray = Array.isArray(values) ? values : [values];
      
      const analyses = valueArray.map(value => analyzeValue(value));
      const parameterType = determineParameterType(analyses, valueArray);

      result.parameters[key] = {
        value: valueArray.length === 1 ? valueArray[0] : valueArray,
        values: valueArray,
        type: parameterType,
        occurrences: valueArray.length,
        analysis: {
          isMultiValue: valueArray.length > 1,
          isNumber: analyses.every(a => a.isNumber) && valueArray.length === 1,
          isBoolean: analyses.every(a => a.isBoolean) && valueArray.length === 1,
          isArray: analyses.every(a => a.isArray) && valueArray.length === 1,
          length: valueArray.length
        }
      };

      if (valueArray.length === 1) {
        const analysis = analyses[0];
        
        if (analysis.isNumber) {
          result.parameters[key].numericValue = analysis.numericValue;
          result.summary.numericParameters++;
        }

        if (analysis.isBoolean) {
          result.parameters[key].booleanValue = analysis.booleanValue;
          result.summary.booleanParameters++;
        }

        if (analysis.isArray) {
          result.parameters[key].elements = analysis.arrayValues;
          result.summary.arrayParameters++;
          if (analysis.isNumericArray) {
            result.parameters[key].statistics = calculateStats(analysis);
          }
        }
      } else {
        result.parameters[key].analyses = analyses.map((analysis, index) => ({
          originalValue: valueArray[index],
          isNumber: analysis.isNumber,
          isBoolean: analysis.isBoolean,
          isDate: analysis.isDate,
          isArray: analysis.isArray,
          numericValue: analysis.numericValue,
          booleanValue: analysis.booleanValue,
          arrayValues: analysis.arrayValues,
          isNumericArray: analysis.isNumericArray,
          isBooleanArray: analysis.isBooleanArray
        }));
        
        result.summary.multiValueParameters++;
      }
      
      result.summary.totalParameters++;
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Helper functions from index.html
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

function determineParameterType(analyses, values) {
  const allNumbers = analyses.every(a => a.isNumber);
  const allBooleans = analyses.every(a => a.isBoolean);
  const allArrays = analyses.every(a => a.isArray);
  
  if (values.length > 1) {
    if (allNumbers) return 'number[]';
    else if (allBooleans) return 'boolean[]';
    else if (allArrays) return 'array[]';
    else return 'mixed[]';
  } else {
    const analysis = analyses[0];
    if (analysis.isNumber) return 'number';
    else if (analysis.isBoolean) return 'boolean';
    else if (analysis.isDate) return 'date';
    else if (analysis.isArray) {
      if (analysis.isNumericArray) return 'numeric array';
      else if (analysis.isBooleanArray) return 'boolean array';
      else return 'array';
    } else return 'text';
  }
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
