requirejs.config({
    baseUrl: 'scripts',
    urlArgs: (location.search.match(/\bdebug\b|\bdisable_cache\b/g)) ? "time=" + Date.now() : '',
});

define(function() {
    requirejs(['scripts/main.js']);
});