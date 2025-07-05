// sw.js - Service Worker aggiornato
const CACHE_NAME = 'query-processor-v2';
const API_CACHE_NAME = 'api-cache-v1';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll([
                '/',
                '/index.html',
                '/styles.css',
                '/app.js'
            ]))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME && cache !== API_CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Gestione speciale per le API
    if (url.pathname.includes('/api')) {
        event.respondWith(handleApiRequest(event.request));
    } else {
        // Cache-first strategy per le altre risorse
        event.respondWith(
            caches.match(event.request)
                .then(response => response || fetch(event.request))
        );
    }
});

async function handleApiRequest(request) {
    const cache = await caches.open(API_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Se abbiamo una risposta in cache e siamo offline
    if (cachedResponse && !navigator.onLine) {
        return cachedResponse;
    }

    try {
        // Processa i parametri in modo coerente con l'API
        const url = new URL(request.url);
        const params = processQueryParams(url.searchParams);
        
        // Simula la stessa risposta dell'API
        const responseData = generateApiResponse(params);
        
        // Crea una nuova risposta
        const response = new Response(JSON.stringify(responseData), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'max-age=300'
            }
        });

        // Metti in cache la risposta
        await cache.put(request, response.clone());
        
        return response;
    } catch (error) {
        console.error('API handling error:', error);
        return new Response(JSON.stringify({
            error: 'API processing failed',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Funzione per processare i parametri in modo coerente
function processQueryParams(searchParams) {
    const params = {};
    
    for (const [key, value] of searchParams.entries()) {
        if (params[key]) {
            // Gestione valori multipli
            if (Array.isArray(params[key])) {
                params[key].push(value);
            } else {
                params[key] = [params[key], value];
            }
        } else {
            params[key] = value;
        }
    }
    
    // Rimuovi duplicati mantenendo l'ordine
    for (const key in params) {
        if (Array.isArray(params[key])) {
            params[key] = [...new Set(params[key])];
        }
    }
    
    return params;
}

// Genera una risposta identica all'API
function generateApiResponse(params) {
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

    for (const [key, values] of Object.entries(params)) {
        const valueArray = Array.isArray(values) ? values : [values];
        const analyses = valueArray.map(value => analyzeValue(value));
        const parameterType = determineParameterType(analyses, valueArray);

        result.parameters[key] = {
            value: valueArray.length === 1 ? valueArray[0] : valueArray,
            type: parameterType,
            occurrences: valueArray.length,
            analyses: analyses
        };

        // Aggiorna summary
        result.summary.totalParameters++;
        if (parameterType.includes('number')) result.summary.numericParameters++;
        if (parameterType.includes('boolean')) result.summary.booleanParameters++;
        if (valueArray.length > 1) result.summary.multiValueParameters++;
    }

    return result;
}

// Funzioni di analisi (identiche all'API)
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
