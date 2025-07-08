// paramProcessor.js - Modulo condiviso per l'analisi dei parametri

/**
 * Analizza un singolo valore per determinarne il tipo e le proprietà
 */
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

/**
 * Calcola statistiche per array numerici
 */
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

/**
 * Determina il tipo di un parametro basato sull'analisi
 */
function determineType(analysis, valueLength = 1) {
    if (valueLength > 1) {
        const allNumbers = analysis.every ? analysis.every(a => a.isNumber) : false;
        const allBooleans = analysis.every ? analysis.every(a => a.isBoolean) : false;
        const allArrays = analysis.every ? analysis.every(a => a.isArray) : false;
        
        if (allNumbers) return 'number[]';
        else if (allBooleans) return 'boolean[]';
        else if (allArrays) return 'array[]';
        else return 'mixed[]';
    }
    
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

/**
 * Processa parametri da una stringa di input (formato key=value)
 */
function parseParametersFromInput(inputText) {
    const params = {};
    const lines = inputText.split('\n');

    lines.forEach(line => {
        line = line.trim();
        if (line && line.includes('=')) {
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=').trim();
            if (key.trim() && value) {
                const trimmedKey = key.trim();
                const newValues = value.split(',').map(v => v.trim());

                if (params[trimmedKey]) {
                    const existingValues = params[trimmedKey].split(',').map(v => v.trim());
                    const merged = [...new Set([...existingValues, ...newValues])];
                    params[trimmedKey] = merged.join(',');
                } else {
                    const unique = [...new Set(newValues)];
                    params[trimmedKey] = unique.join(',');
                }
            }
        }
    });

    return params;
}

/**
 * Processa parametri da una query string URL
 */
function parseParametersFromQuery(queryParams) {
    const params = {};
    
    for (let [key, value] of queryParams) {
        if (params[key]) {
            const isArrayValue = value.includes(',');
            const existingIsArray = params[key].includes(',');
            
            if (isArrayValue && existingIsArray) {
                const existingValues = params[key].split(',').map(v => v.trim());
                const newValues = value.split(',').map(v => v.trim());
                const mergedValues = [...new Set([...existingValues, ...newValues])];
                params[key] = mergedValues.join(',');
            } else {
                if (!Array.isArray(params[key])) {
                    params[key] = [params[key]];
                }
                params[key].push(value);
            }
        } else {
            params[key] = value;
        }
    }
    
    return params;
}

/**
 * Analizza completamente i parametri e genera il risultato
 */
function analyzeParameters(params, startTime = performance.now()) {
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

    for (let [key, values] of Object.entries(params)) {
        const valueArray = Array.isArray(values) ? values : [values];
        const analyses = valueArray.map(value => analyzeValue(value));
        
        let parameterType = 'mixed';
        const allNumbers = analyses.every(a => a.isNumber);
        const allBooleans = analyses.every(a => a.isBoolean);
        const allArrays = analyses.every(a => a.isArray);
        
        if (valueArray.length > 1) {
            if (allNumbers) parameterType = 'number[]';
            else if (allBooleans) parameterType = 'boolean[]';
            else if (allArrays) parameterType = 'array[]';
            else parameterType = 'mixed[]';
        } else {
            parameterType = determineType(analyses[0]);
        }
        
        result.parameters[key] = {
            value: valueArray.length === 1 ? valueArray[0] : valueArray,
            values: valueArray,
            type: parameterType,
            occurrences: valueArray.length,
            analysis: {
                isMultiValue: valueArray.length > 1,
                isNumber: allNumbers && valueArray.length === 1,
                isBoolean: allBooleans && valueArray.length === 1,
                isArray: allArrays && valueArray.length === 1,
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
                value: valueArray[index],
                type: analysis.isNumber ? 'number' : 
                      analysis.isBoolean ? 'boolean' : 
                      analysis.isArray ? 'array' : 'text',
                ...(analysis.isArray && {
                    elements: analysis.arrayValues,
                    ...(analysis.isNumericArray && {
                        statistics: calculateStats(analysis)
                    })
                })
            }));
            
            result.summary.multiValueParameters++;
        }
        
        result.summary.totalParameters++;
    }
    
    const endTime = performance.now();
    result.performance = {
        responseTime: `${(endTime - startTime).toFixed(2)}ms`,
        timestamp: new Date().toLocaleString(),
        parameterCount: Object.keys(result.parameters).length
    };
    
    return result;
}

// Create the module object
const ParamProcessorModule = {
    analyzeValue,
    calculateStats,
    determineType,
    parseParametersFromInput,
    parseParametersFromQuery,
    analyzeParameters
};

// Export per diversi ambienti
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = ParamProcessorModule;
} else if (typeof self !== 'undefined') {
    // Service Worker environment
    if (!self.ParamProcessor) {
        self.ParamProcessor = ParamProcessorModule;
    }
} else if (typeof window !== 'undefined') {
    // Browser environment
    if (!window.ParamProcessor) {
        window.ParamProcessor = ParamProcessorModule;
    }
}