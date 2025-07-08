// sw.js
importScripts('paramProcessor.js');

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
        // Registra il tempo di inizio per le performance
        const startTime = performance.now();
        
        const url = new URL(request.url);
        const params = ParamProcessor.parseParametersFromQuery(url.searchParams.entries());
        
        // Usa l'analizzatore con startTime (come in index.html)
        const result = ParamProcessor.analyzeParameters(params, startTime);
        
        return new Response(JSON.stringify(result, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-store'
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            error: "Service Worker API Error",
            message: error.message,
            expected: "Identical behavior to index.html parameter processing"
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}