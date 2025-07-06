// Funzioni di parsing e analisi condivise
export function parseParameters(input) {
    const params = {};
    const lines = input.split('\n').filter(line => line.includes('='));
    
    lines.forEach(line => {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        if (key.trim() && value) {
            const newValues = value.split(',').map(v => v.trim());
            const existing = params[key.trim()] ? params[key.trim()].split(',') : [];
            params[key.trim()] = [...new Set([...existing, ...newValues])].join(',');
        }
    });
    
    return params;
}

export function analyzeValue(value) {
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
            numericValue: !isNaN(num) ? num : null,
            booleanValue: bool ? value.toLowerCase() === 'true' : null
        };
    }
    
    const numbers = parts.map(p => Number(p));
    const allNumbers = numbers.every(n => !isNaN(n));
    
    return {
        originalValue: value,
        isNumber: false,
        isBoolean: false,
        isArray: true,
        isNumericArray: allNumbers,
        arrayValues: allNumbers ? numbers : parts
    };
}

export function calculateStats(analysis) {
    if (!analysis.isArray || !analysis.isNumericArray) return null;
    
    const numbers = analysis.arrayValues;
    const sum = numbers.reduce((a, b) => a + b, 0);
    const avg = sum / numbers.length;
    
    return {
        count: numbers.length,
        sum: sum,
        average: avg,
        min: Math.min(...numbers),
        max: Math.max(...numbers)
    };
}

export function generateResult(params, startTime) {
    const result = {
        timestamp: new Date().toISOString(),
        parameters: {},
        summary: {
            totalParameters: 0,
            numericParameters: 0,
            arrayParameters: 0,
            booleanParameters: 0
        },
        performance: {
            responseTime: `${(performance.now() - startTime).toFixed(2)}ms`,
            timestamp: new Date().toLocaleString()
        }
    };

    for (const [key, value] of Object.entries(params)) {
        const analysis = analyzeValue(value);
        const isArray = analysis.isArray;
        const isNumeric = analysis.isNumber;
        const isBoolean = analysis.isBoolean;
        
        result.parameters[key] = {
            value: value,
            type: determineType(analysis),
            analysis: analysis
        };

        if (isArray && analysis.isNumericArray) {
            result.parameters[key].statistics = calculateStats(analysis);
        }

        result.summary.totalParameters++;
        if (isNumeric) result.summary.numericParameters++;
        if (isBoolean) result.summary.booleanParameters++;
        if (isArray) result.summary.arrayParameters++;
    }

    return result;
}

function determineType(analysis) {
    if (analysis.isArray) return analysis.isNumericArray ? 'numeric array' : 'array';
    if (analysis.isNumber) return 'number';
    if (analysis.isBoolean) return 'boolean';
    if (analysis.isDate) return 'date';
    return 'text';
}
