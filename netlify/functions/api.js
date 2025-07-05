exports.handler = async (event, context) => {
  try {
    // Step 1: Parse parameters with duplicate handling
    const params = {};
    const rawParams = event.rawQuery.split('&');
    
    rawParams.forEach(pair => {
      const [key, value] = pair.split('=').map(decodeURIComponent);
      if (key && value !== undefined) {
        if (!params[key]) {
          params[key] = [value]; // Always store as array initially
        } else if (!params[key].includes(value)) {
          params[key].push(value); // Only add if not already present
        }
      }
    });

    // Step 2: Analyze parameters
    const result = {
      timestamp: new Date().toISOString(),
      parameters: {},
      summary: {
        totalParameters: Object.keys(params).length,
        numericParameters: 0,
        arrayParameters: 0,
        booleanParameters: 0,
        multiValueParameters: 0
      }
    };

    // Step 3: Process each parameter
    for (const [key, values] of Object.entries(params)) {
      const uniqueValues = [...new Set(values)]; // Ensure uniqueness
      const isMultiValue = uniqueValues.length > 1;
      
      // Perform type analysis
      const analyses = uniqueValues.map(v => analyzeValue(v));
      const types = analyses.map(a => determineType(a));
      const mainType = determineMainType(types, isMultiValue);

      result.parameters[key] = {
        value: isMultiValue ? uniqueValues : uniqueValues[0],
        values: uniqueValues,
        type: mainType,
        occurrences: uniqueValues.length,
        analyses: analyses,
        isMultiValue: isMultiValue
      };

      // Update summary counts
      if (mainType.includes('number')) result.summary.numericParameters++;
      if (mainType.includes('boolean')) result.summary.booleanParameters++;
      if (isMultiValue) result.summary.multiValueParameters++;
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
        message: error.message
      })
    };
  }
};

// Helper functions
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

function determineType(analysis) {
  if (analysis.isNumber) return 'number';
  if (analysis.isBoolean) return 'boolean';
  if (analysis.isDate) return 'date';
  return 'text';
}

function determineMainType(types, isMultiValue) {
  if (isMultiValue) {
    const uniqueTypes = [...new Set(types)];
    if (uniqueTypes.length === 1) return `${uniqueTypes[0]}[]`;
    return 'mixed[]';
  }
  return types[0];
}
