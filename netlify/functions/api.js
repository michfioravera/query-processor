// netlify/functions/api.js
import { parseParameters, generateResult } from '../../src/lib/paramProcessor.js';

export const handler = async (event, context) => {
  try {
    const startTime = Date.now();
    const params = parseParameters(event.rawQuery);
    const result = generateResult(params, startTime);

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
        message: error.message
      })
    };
  }
};
