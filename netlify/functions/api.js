exports.handler = async (event, context) => {
  try {
    // 1. Parse parameters (supporting both Netlify production and local dev)
    const params = event.multiValueQueryStringParameters || 
                  Object.entries(event.queryStringParameters || {}).reduce((acc, [key, value]) => {
                    acc[key] = [value];
                    return acc;
                  }, {});

    // 2. Process and analyze parameters
    const result = {
      timestamp: new Date().toISOString(),
      parameters: {},
      summary: {
        totalParameters: 0,
        numericParameters: 0,
        arrayParameters: 0,
        booleanParameters: 0,
        multiValueParameters: 0,
        mergedArrayParameters: 0
      }
    };

    for (const [key, values] of Object.entries(params)) {
      const uniqueValues = [...new Set(values)]; // Remove duplicates
      const analyses = uniqueValues.map(value => analyzeValue(value));
      const parameterType = determineParameterType(analyses, uniqueValues);

      result.parameters[key] = {
        value: uniqueValues.length === 1 ? uniqueValues[0] : uniqueValues,
        type: parameterType,
        occurrences: uniqueValues.length,
        analyses: analyses
      };

      // Update summary
      result.summary.totalParameters++;
      if (parameterType.includes('number')) result.summary.numericParameters++;
      if (parameterType.includes('boolean')) result.summary.booleanParameters++;
      if (uniqueValues.length > 1) result.summary.multiValueParameters++;
      if (parameterType.includes('array')) result.summary.arrayParameters++;
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Parameter processing failed",
        message: error.message,
        stack: process.env.NETLIFY_DEV ? error.stack : undefined
      })
    };
  }
};

// Helper functions (must be included in the same file)
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

function determineParameterType(analyses, values) {
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
