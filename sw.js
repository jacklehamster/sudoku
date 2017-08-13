var CACHE_NAME = 'my-site-cache-v1';
var urlsToCache = [
    '',
    'sw.js',
    'style.css',
    'scripts/main.js',
    'scripts/solveworker.js',
    'scripts/sudoku.js',
    'scripts/sudoku.wasm',
    'scripts/sudokucsolver.js',
    'scripts/sudokusolver.js',
    'https://unpkg.com/react@15/dist/react.min.js',
    'https://unpkg.com/react-dom@15/dist/react-dom.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.3/require.min.js',
];

self.addEventListener('install', function(event) {
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                // IMPORTANT: Clone the request. A request is a stream and
                // can only be consumed once. Since we are consuming this
                // once by cache and once by the browser for fetch, we need
                // to clone the response.
                var fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(
                    function(response) {
                        // Check if we received a valid response
                        if(!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // IMPORTANT: Clone the response. A response is a stream
                        // and because we want the browser to consume the response
                        // as well as the cache consuming the response, we need
                        // to clone it so we have two streams.
                        var responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(function(cache) {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});