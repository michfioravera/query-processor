// sw.js
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installazione in corso');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Attivazione in corso');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('/api')) {
        event.respondWith(handleApiRequest(event.request));
    }
});

async function handleApiRequest(request) {
    try {
        const url = new URL(request.url);
        const params = {};
        
        // Estrai tutti i parametri dalla query string
        for (let [key, value] of url.searchParams.entries()) {
            if (key in params) {
                // Gestisci valori multipli
                const isArrayValue = value.includes(',');
                const existingIsArray = params[key].includes(',');
                
                if (isArrayValue && existingIsArray) {
                    // Entrambi sono array, uniscili rimuovendo i duplicati
                    const existingValues = params[key].split(',').map(v => v.trim());
                    const newValues = value.split(',').map(v => v.trim());
                    const mergedValues = [...new Set([...existingValues, ...newValues])];
                    params[key] = mergedValues.join(',');
                } else {
                    // Altrimenti mantieni come array di valori separati
                    if (!Array.isArray(params[key])) {
                        params[key] = [params[key]];
                    }
                    params[key].push(value);
                }
            } else {
                params[key] = value;
            }
        }

        // Resto del codice rimane uguale...
        const result = {
            timestamp: new Date().toISOString(),
            parameters: {},
            summary: {
                totalParameters: 0,
                numericParameters: 0,
                arrayParameters: 0,
                booleanParameters: 0,
                mergedArrayParameters: 0
            }
        };

        for (let [key, values] of Object.entries(params)) {
            const valueArray = Array.isArray(values) ? values : [values];
            const analyses = valueArray.map(value => analyzeValue(value));
            
            // Determina il tipo
            let parameterType = 'mixed';
            const allNumbers = analyses.every(a => a.isNumber);
            const allBooleans = analyses.every(a => a.isBoolean);
            const allArrays = analyses.every(a => a.isArray);
            
            if (valueArray.length === 1) {
                const analysis = analyses[0];
                if (analysis.isNumber) parameterType = 'number';
                else if (analysis.isBoolean) parameterType = 'boolean';
                else if (analysis.isDate) parameterType = 'date';
                else if (analysis.isArray) {
                    parameterType = analysis.isNumericArray ? 'numeric array' : 'array';
                    // Conta se è un array risultante da merge
                    if (params[key].includes(',') && !Array.isArray(params[key])) {
                        result.summary.mergedArrayParameters++;
                    }
                }
            } else {
                if (allNumbers) parameterType = 'number[]';
                else if (allBooleans) parameterType = 'boolean[]';
                else if (allArrays) parameterType = 'array[]';
            }
            
            result.parameters[key] = {
                value: valueArray.length === 1 ? valueArray[0] : valueArray,
                type: parameterType,
                occurrences: valueArray.length,
                analyses: analyses
            };

            // Aggiorna contatori
            result.summary.totalParameters++;
            if (allNumbers && valueArray.length === 1) result.summary.numericParameters++;
            if (allArrays) result.summary.arrayParameters++;
            if (allBooleans && valueArray.length === 1) result.summary.booleanParameters++;
        }

        return new Response(JSON.stringify(result, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            error: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
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
