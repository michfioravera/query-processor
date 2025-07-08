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
        const url = new URL(request.url);
        const params = ParamProcessor.parseParametersFromQuery(url.searchParams.entries());
        
        const result = ParamProcessor.analyzeParameters(params);
        
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
// Le funzioni di analisi sono ora fornite da paramProcessor.js
