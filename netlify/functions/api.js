exports.handler = async (event, context) => {
  try {
    // Parse raw query string to properly handle duplicate parameters
    const rawParams = event.rawQuery.split('&');
    const params = {};

    rawParams.forEach(pair => {
      const [key, value] = pair.split('=').map(decodeURIComponent);
      if (key && value !== undefined) {
        if (!params[key]) {
          params[key] = value;
        } else {
          params[key] = Array.isArray(params[key]) 
            ? [...params[key], value]
            : [params[key], value];
        }
      }
    });

    // Analyze parameters
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

    for (const [key, value] of Object.entries(params)) {
      const values = Array.isArray(value) ? value : [value];
      const isMultiValue = values.length > 1;
      
      result.parameters[key] = {
        value: isMultiValue ? values : values[0],
        type: isMultiValue ? 'mixed[]' : 'text',
        occurrences: values.length,
        values: values
      };

      if (isMultiValue) {
        result.summary.multiValueParameters++;
      }
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
        error: "Internal Server Error",
        message: error.message,
        details: error.stack 
      })
    };
  }
};
