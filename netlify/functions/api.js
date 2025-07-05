// api.js - Versione completa con tutte le analisi

// Funzioni di analisi (le stesse del frontend)
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

function calculateStats(analysis) {
    if (!analysis.isArray || !analysis.isNumericArray) return null;
    
    const numbers = analysis.arrayValues;
    const sum = numbers.reduce((a, b) => a + b, 0);
    const avg = sum / numbers.length;
    const sorted = [...numbers].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0 
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];
    
    const variance = numbers.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / numbers.length;
    
    return {
        count: numbers.length,
        sum: sum,
        average: avg,
        median: median,
        min: Math.min(...numbers),
        max: Math.max(...numbers),
        range: Math.max(...numbers) - Math.min(...numbers),
        standardDeviation: Math.sqrt(variance)
    };
}

exports.handler = async (event, context) => {
    const startTime = Date.now();
    
    // Prima ottieni i parametri deduplicati
    const mergedParams = {};
    
    // Usa multiValueQueryStringParameters per Netlify
    const multiParams = event.multiValueQueryStringParameters || {};
    
    for (const [key, values] of Object.entries(multiParams)) {
        if (!values || !Array.isArray(values)) continue;
        
        const allValues = [];
        
        for (const value of values) {
            if (value) {
                const subValues = value.split(',').map(v => v.trim()).filter(v => v);
                allValues.push(...subValues);
            }
        }
        
        const uniqueValues = [...new Set(allValues)];
        
        if (uniqueValues.length > 0) {
            mergedParams[key] = uniqueValues.join(',');
        }
    }
    
    // Fallback se non ci sono multiValueQueryStringParameters
    if (Object.keys(mergedParams).length === 0 && event.queryStringParameters) {
        for (const [key, value] of Object.entries(event.queryStringParameters)) {
            if (value) {
                const allValues = value.split(',').map(v => v.trim()).filter(v => v);
                const uniqueValues = [...new Set(allValues)];
                
                if (uniqueValues.length > 0) {
                    mergedParams[key] = uniqueValues.join(',');
                }
            }
        }
    }
    
    // Ora esegui l'analisi completa
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
    
    for (const [key, value] of Object.entries(mergedParams)) {
        const analysis = analyzeValue(value);
        
        // Determina il tipo
        let parameterType = 'text';
        if (analysis.isNumber) parameterType = 'number';
        else if (analysis.isBoolean) parameterType = 'boolean';
        else if (analysis.isDate) parameterType = 'date';
        else if (analysis.isArray) {
            if (analysis.isNumericArray) parameterType = 'numeric array';
            else if (analysis.isBooleanArray) parameterType = 'boolean array';
            else parameterType = 'array';
        }
        
        result.parameters[key] = {
            value: value,
            type: parameterType,
            analysis: {
                isNumber: analysis.isNumber,
                isBoolean: analysis.isBoolean,
                isArray: analysis.isArray,
                isDate: analysis.isDate
            }
        };
        
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
        
        result.summary.totalParameters++;
    }
    
    const endTime = Date.now();
    
    // Aggiungi informazioni sulle performance
    result.performance = {
        responseTime: `${endTime - startTime}ms`,
        timestamp: new Date().toLocaleString(),
        parameterCount: Object.keys(result.parameters).length
    };
    
    return {
        statusCode: 200,
        headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(result, null, 2)
    };
};
