export const TEMPLATE: string = `
"use strict";
const ORIGIN_MATCHER = new RegExp(\`^\${regexEscape(self.origin)}.*\`, "i");
const SCOPE_MATCHER = new RegExp(\`^\${regexEscape(self.registration.scope)}.*\`, "i");

// VARIABLES

self.addEventListener('install', function (event) {
    event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
        return cache.addAll(PRELOAD_PATHS)
            .then(x => {
            log(\`Preloaded paths: \${PRELOAD_PATHS.length}\`);
            return x;
        })
            .then(() => SKIP_WAITING && self.skipWaiting());
    }));
});
self.addEventListener('activate', function (event) {
    event.waitUntil(caches.keys()
        .then(cacheNames => Promise.all(cacheNames
        .filter(cacheName => cacheName !== CACHE_NAME)
        .map(cacheName => {
        log(\`Clearing cache \${cacheName}\`);
        return caches.delete(cacheName);
    }))));
});
self.addEventListener('fetch', function (event) {
    
    const url = event.request.url.replace(/#.*$/, '');
    
    // Cache http and https only, skip unsupported chrome-extension:// and file://...
    if (!url.startsWith('http'))
        return;
    // Find the first route that matches and emit the response.
    ROUTES.reduce((done, [fn, paths, opts]) => done || respondIfMatch(fn, paths, opts), false);
    function respondIfMatch(fn, paths, opts) {
        if (matches(paths)) {
            event.respondWith(fn(event, opts));
            return true;
        }
        else
            return false;
    }
    function matches(paths) {
        return paths &&
            paths.some(path => path instanceof RegExp ?
                path.exec(url) : url === path);
    }
});
// Caching strategies
function staleWhileRevalidate(event) {
    return fromCache(event)
        .then(function (response) {
        var fetchPromise = fetchAndCache(event)
            .then(r => {
            logEvent(event, 'staleWhileRevalidate revalidated ', event);
            return r;
        });
        logEvent(event, \`staleWhileRevalidate returning \${response ? '[stale?]' : '[fresh]'}\`);
        return response || fetchPromise;
    });
}

function staticOfflineBackup(event, opts) {
    logEvent(event, 'staticOfflineBackup');
    return fetchRequest(event)
      .then(response => response)
      .catch((e) => fileFromCache(opts))
      /* "A fetch() promise only rejects when a network error is encountered" 
       https://developer.mozilla.org/en-US/docs/Web/API/fetch */
}

function cacheFirst(event) {
    logEvent(event, 'cacheFirst');
    return fromCache(event)
        .then(response => response || fetchAndCache(event));
}
function networkFirst(event) {
    logEvent(event, 'networkFirst');
    return fetchAndCache(event)
        .then(response => response || fromCache(event))
        .catch(() => fromCache(event));
}
function networkOnly(event) {
    logEvent(event, 'networkOnly');
    return fetchRequest(event);
}
// Low-level helpers
function fetchRequest(event) {
    return fetch(event.request);
}
function fetchAndCache(event) {
    return fetchRequest(event)
        .then(response => {
          return toCache(event, response).catch(e => {
            log(\`  - unable to cache \${event.request.url}  \${e}\`);
            return response;
          })
        })
        .catch(e => {
          log(\`  - unable to fetch \${event.request.url}  \${e}\`);
          throw e
       });
}
function fromCache(event) {
    return caches.open(CACHE_NAME).then(cache => cache.match(event.request));
}
function fileFromCache(name) {
    return caches.open(CACHE_NAME).then(cache => cache.match(name));
}
function toCache(event, response) {
    if (!response.ok) {
        log(\`skipping cache of failed request \${event.request.url} with status \${response.status} \${response.statusText}\`);
        return response;
    }
    return caches.open(CACHE_NAME)
        .then(function (cache) {
        cache.put(event.request, response.clone());
        return response;
    });
}
function logEvent(event, action) {
    log(\`\${action} for \` + event.request.url);
}
function log(s) {
    if (DEBUG)
        console.log('[SW] ' + s);
}
function regexEscape(s) {
    return s.replace(/([/.])/g, '\\\\$&');
}

function withOrigin(path) {
    if (path.match(/https?:\\/\\//)) return path
    if (path.startsWith('/')) return self.origin + path
    return self.origin + '/' + path
}
`
