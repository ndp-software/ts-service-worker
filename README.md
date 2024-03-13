Automate the build of a complex, strongly-typed service worker.

# Goals

- provide declarative support for the most common caching strategies
- supports easy integration of multiple caching strategies
- produces a `service-worker.js` that requires no additional transcompilation
- avoids nesting and promise chains
- is written in fully-typed Typescript
- can scan your disk for resources to cache
- provides built-in debug logging
- provides clear and simple cache purging rules

Copyright (c) 2023-2024 Andrew J. Peterson, dba NDP Software  All Rights Reserved.

#### NOTICE
This is in testing... It works on two very different projects. I'd love people to try it out and provide feedback.

## Overview
The idea is simple. You provide TS-Service-Worker with a **Plan** (and options), and it outputs a functional Javascript file that can be sent to the browser. The **Plan** is a series of caching strategies to be applied, along with the paths they should be applied to.

## Examples

The very simplest service worker might provide an offline backup of the whole site:
```ts
import {requestHandler} from "ts-service-worker";

export const plan: Plan = [
  {paths: /.*/, strategy: "networkFirst"}
]
app.get('/service-worker.js', requestHandler(plan))
```
This plan says, "intercept all the requests, and serve them from the network if available; otherwise, serve from the cache." This is just one of the example caching strategies, and demonstrates the declarative configuration-- and how a simple caching strategy like this is insufficient-- even though almost every single example implementation uses strategies like this. (shrug)

Some of the deficiencies of this strategy:
- it only caches paths that have been visited
- provides no way to update cached files
- caches everything fetched, even unimportant resources

A real caching plan requires more complexity and nuance. Here is part of a slightly more realistic plan:
```ts
export const plan: Plan = 
  [
    {strategy: 'networkOnly', paths: ['/open-search.xml']},
    {strategy: 'staleWhileRevalidate', path: ['/my-data.json']},
    {strategy: 'staticOfflineBackup', path: [/.*\.html/], backup: '/networkDown.html'}
  ]
```
Here, we see multiple strategies working in consort. Each request is evaluated (sequentially) against the paths, and the first matching strategy is applied. If no strategy matches, the resource is fetched as normal. Therefore, in this example:
  - The path `open-search.xml` will never be cached, 
  - `/my-data.json` will be served from the cache and re-fetched in the background, available for a later access. 
  - Finally, the file `/networkDown.html` will be cached, and served as a replacement for other HTML pages when fetching fails.

Another example: a common strategy is to pre-cache some resources when the service worker initializes. The paths of these resources can be explicitly listed, or dynamically determined from glob matches of files on disk:
```ts
  {
    strategy: 'cache-on-install',
    files: {
      dir: 'src/assets/images', // Root of search
      glob: '*.png',            // match
      prefix: '/img'}           // pre-pended to matched relative path
  }
```
These are just a few examples of a caching plan. Each application is different and requires careful consideration and crafting. **TS-Service-Worker** makes developing a custom caching service worker easy and error-free.

## Usage

After npm installing, there are several ways to use this:

### Within Express

This package exports a request handler called, `requestHandle`.  So using directly within Express (or equivalent) is convenient and provides good Typescript type hints.
 This request handler builder is a function that accepts a **plan** and **options** and returns a function that can be used as a route handler. Here's an example of how to use it in an Express app:

```ts
import { requestHandler } from 'ts-service-worker'
// ...
app.get('/service-worker.js', requestHandler([
    { strategy: 'networkFirst', paths: Origin }
     //       ...
  ]))
```
Note: you may want to manage your own caching of this, although the generation of the service worker is fast.

### As a script

You can use the library to make a script in your build process. Although it will require you integrate this
in your build process, this is nice because it's declarative, and can provide full typing.

To do this, create a file like `service-worker-build.ts` and use the `generateServiceWorker()` function. Here's an example:

```ts
import type { Plan } from 'ts-service-worker'
import { generateServiceWorker } from 'ts-service-worker'


const plan: Plan = [
    {
        "strategy": "cache-on-install",
        "paths": [
            "images/splash.png",
            //..
        ]
    },
    {
        "strategy": "networkFirst",
        "paths": [
            "/src/site.css",
            "/src/index.css"
        ]
    },
    {
        "strategy": 'staticOfflineBackup',
        'paths': ["/", "/index.html"],
        "backup": "/index.html"
    },
    // etc.
];

const options = {
    "version": "5.0.0",
    "skipWaiting": true,
    "debug": true
}

console.log(generateServiceWorker(plan, options))
```
The integration may be a simple as a line in your `package.json` file,

    "build:sw": "ts-node service-worker-build.ts > serviceWorker.js"

or it may be more complex.

### CLI

The CLI will generate the Javascript file from the specifications in a JSON file. This is nice because it's declarative, but lacks the typing of a Typescript solution.

1. Create a `sw-plan.json` file with `plan` and `options`. See below for available properties.
2. Run `> npx ts-service-worker sw-plan.json >dist/service-worker.js`
3. Serve the resultant file (`dist/service-worker.js`) as your service worker, and reference it in your HTML head.
4. Editing the JSON file and regenerate as needed.

### Other
There are other ways to incorporate this into your build cycle. The library exposes a method `generateServiceWorker()` which accepts a plan and options and generates the necessary Javascript (text). Let me know how you do it! 

Note that the output of this tool needs _no_ post-processing, so DON'T DO IT. If the code output isn't compatible with a browser, 
let me know and I'll fix it right away.

### Options

The following may be provided as `options` for any of the usage methods, and they affect the generation of the Javascript code:

* `version` – semantic version of the worker. Major or minor version bump means to reset the cache, but otherwise this is for you.
* `skipWaiting` – executes the normal skip waiting logic, and allows your service worker to come into play without all the browser windows being closed.
* `debug` – outputs log messages as files are fetched. This is too noisy for production, but may be useful to figure out what is going on with your service worker.

## Paths

Paths expressions, used for most strategies, will match URLs requested from your website. The path property can be:
- **a string URL path**. This is interpreted as the meaning the full path to the resource. 
- **a RegExp**, matching the full URL. This is useful for matching a set of URLs, such as all the images in a directory.
- **an array** of strings or RegExps, following the rules above
- **the imported symbol `OriginAndBelow`**, which matches everything under the service worker's domain.
- **the imported symbol `ScopeAndBelow`**, which matches everything under the service worker's scope, which is the URL of the service worker code (overrideable).

## Strategies

These are the currently implemented strategies.

### cacheFirst

This strategy is ideal for CSS, images, fonts, JS, templates… basically anything you'd consider static to that "version" of your site. Per [https://web.dev/learn/pwa/serving/#cache-first](https://web.dev/learn/pwa/serving/#cache-first):
>> Using this strategy, the service worker looks for the matching request in the cache and returns the corresponding Response if it's cached. Otherwise it retrieves the response from the network (~~optionally,~~ updating the cache for future calls). If there is neither a cache response nor a network response, the request will error. Since serving assets without going to the network tends to be faster, this strategy prioritizes performance over freshness.

There is no way to remove files from the cache individually. For this reason, use only for immutable resources (certain images and fingerprinted assets). If these do need to be updated, you will need to [rebuild the cache (see below)](#clearing-the-cache).

### networkFirst
This is most useful to provide the user with a backup in case the network isn't available. Per [https://web.dev/learn/pwa/serving/#network-first](https://web.dev/learn/pwa/serving/#network-first):

> This strategy is the mirror of the Cache First strategy; it checks if the request can be fulfilled from the network and, if it can't, tries to retrieve it from the cache. If there is neither a network response nor a cache response, the request will error. Getting the response from the network is usually slower than getting it from the cache, this strategy prioritizes updated content instead of performance.

### staleWhileRevalidate

This is useful for resources that could be slow to fetch and whose freshness is not critical. Per [https://web.dev/learn/pwa/serving/#stale-while-revalidate](https://web.dev/learn/pwa/serving/#stale-while-revalidate):

> The stale while revalidate strategy returns a cached response immediately, then checks the network for an update, replacing the cached response if one is found. This strategy always makes a network request, because even if a cached resource is found, it will try to update what was in the cache with what was received from the network, to use the updated version in the next request. This strategy, therefore, provides a way for you to benefit from the quick serving of the cache first strategy and update the cache in the background.

> With this strategy, the assets are updated in the background. This means your users won't get the new version of the assets until the next time that path is requested. At that time the strategy will again check if a new version exists and the cycle repeats.

### networkOnly

Per [https://web.dev/learn/pwa/serving/#network-only](https://web.dev/learn/pwa/serving/#network-only):

> The network only strategy is similar to how browsers behave without a service worker or the Cache Storage API. Requests will only return a resource if it can be fetched from the network. This is often useful for resources like online-only API requests.

### staticOfflineBackup

Use this strategy to provide a backup for a resource to be used only when a site is offline. This may be a "sorry" page, or could provide some reasonable alternative. This is commonly used for placeholder images or other content.

The backup resource is loaded _on service worker install_. If it is stale, you will need to invalidate the whole cache.

Note: this currently doesn't support inline SVGs that you see in some examples, but requires using a separate file.

Note: If this backup URL is also a regular resource on the site, you can configure its behavior separately from `staticOfflineBackup`. It does **not** serve the "backup" URL from cache by default. If it's a normal app in the URL and you want it cached, also include a strategy like `networkFirst` in combination. 

### cache-on-install

Cache specific paths when the service worker installs. Because it needs to know specific resources, _path matching wildcards and regular expression will not work._ For example, you can't pre-cache all files that end in `.png`-- there's no way for the service worker to know what they are! You must use FULL paths.

But! This strategy has an extra feature that other strategies do not:  it can **scan directories for resources.** In some cases this, such as when you have a whole directory of files to pre-cache, this will be the easiest to maintain: use glob patterns to identify these as shown below. Here's one example:

```ts
plan: Plan = [
  {
    strategy: 'cache on install',
    files: {
      glob: '**/*.png',
      dir: 'src/images',  // where to start searching
      prefix: '/assets'   // prefix applied to any matches
    },
  }
]
```
The globs are evaluated _when the `service-worker.js` file is created_, so updating resources will require rebuilding the service worker file.

## Cache and Versioning of Service Workers

When developing service workers, it can take a while to learn service worker behavior, and understanding when it re-installs and activates service workers and rebuilds caches. This is worth understanding, but **TS-Service-Worker** aims to provide the appropriate controls.

#### Clearing the Cache
There are two components that relevant here:

- the service worker
- the cached files (or "responses")

When building your service worker, provide a `version` string in the options, following semvar conventions. If you change this version at all, the service worker itself will be re-installed (because it has changed). This re-installation in itself, however, will _not_ affect the cached responses. 

But, if the _major or minor version_ changes, the cache (of responses) will be deleted and a complete new cache created. _With this library, the way to reset the cache in users' browsers is to bump the major or minor version number._ (To test locally, instead, use the browser's developer tools.) 

That being said, you're not in complete control. Browsers will manage the actual response cache, removing items if it becomes too large, or perhaps stale. From my testing, though, I have not seen this happen.

Some of the strategies will replace older assets with newer ones when found; some won't. This should be documented above or obvious.

#### Skip Waiting

Service workers themselves will re-install when they have changed-- based on the browsers' rules but typically a checksum of the `service-worker.js` code itself. This can be confusing at first, though, as new service workers doesn't come into play until it is activated. The default behavior for service workers is to wait until all the windows associated with the service worker to close, and only then activate the new service worker. 

If this isn't what you want, you can accelerate this by passing `skipWaiting: true` in the options. This will activate the service worker as soon as it is downloaded-- but still will not be available as the page first loads. Usually this means it will be ready on the next reload.

## Why TS-Service-Worker?

Service workers are a powerful tool for developers to improve the user experience, providing for fine-grained caching, offline usage and progressive web apps (PWAs). It replaced the coarse-grained _AppCache_, which proved quite hard to use (and was retired). 

Unfortunately, the service worker API is also hard to use as well, as it is quite low-level. It requires a series of nested promise chains, and quickly grows complicated. In the documentation contains good examples describing single specific strategies. While these are readable, they are minimally useful because real-world usage requires integrating several of these strategies at the same time. This can be error-prone and hard to follow. And as anyone who has developed service workers knows, they are tedious to test because of the complex lifecycle.

And since service workers run in the browser, they must be written in the browser's version Javascript. This likely involves transcompilation, which will requiring additional complexity in the build process to produce a separate artifact. It can be quite challenging in a Typescript and JS-bundling project (most projects). Typically the service-worker will require a different build path than the rest of your code because it must be distributed as a separate resource.

There are [other libraries](#other-libraries) designed to help, which may be useful to you. **TS-Service-Worker** aims to solve specific challenges.

## TODO
1. Other matching mechanisms, like mime-type.
2. https://web.dev/learn/pwa/serving/#cache-only
3. filter/only strategy: to process only certain types, eg. `{ strategy: 'filter', paths: ' /https?:.*/ }`. This is weird semantically, so I'm still thinking.
5. https://web.dev/learn/pwa/workbox/#offline-fallback
   https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers#recovering_failed_requests  
6. offline SVG: https://github.com/veiss-com/sw-tools#offline
6. https://github.com/veiss-com/sw-tools#limiting-the-cache-size
7. expiring cache / expirations on cached items

## References
These are the basics of how service workers function:
- https://web.dev/learn/pwa/serving/
- https://web.dev/offline-cookbook/
- Interesting reference showing the complexities: https://adactio.com/serviceworker.js and https://adactio.medium.com/cache-limiting-in-service-workers-d6741361ca19
- The complexities of testing service workers: [https://medium.com/dev-channel/testing-service-workers-318d7b016b19]
- Service worker mocking library: [https://github.com/zackargyle/service-workers/tree/master/packages/service-worker-mock]
- See the service workers generated with this tool: 
  - <a href="https://amp-what.com/service-worker.js" nofollow noindex>https://amp-what.com/service-worker.js</a>
  - <a href="https://www.gotomyhead.site/serviceWorker.js" nofollow noindex>https://www.gotomyhead.site/serviceWorker.js</a>

## Other Libraries (The comp-e-ti-tion)
- https://web.dev/learn/pwa/workbox/ -- popular and very cool tool. This will work for many projects, but I was looking for something where I had a little more control.
- https://vite-pwa-org.netlify.app/frameworks/sveltekit.html
- https://github.com/veiss-com/sw-tools#offline -- very specific features
- https://github.com/TalAter/UpUp/ -- single use case: provides a "backup" of your site if it's offline

## License

Copyright (c) 2023-2024 Andrew J. Peterson, dba NDP Software  All Rights Reserved.

Available for licensing at reasonable rate. Please contact NDP Software.
