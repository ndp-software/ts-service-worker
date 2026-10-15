import {describe, test} from "node:test";
import {cacheName, generateServiceWorker, pathToJS, pathsToJS, Plan} from "../generate.mjs";
import assert from "node:assert/strict";
import {OriginAndBelow, ScopeAndBelow} from "../strategies.mjs";

describe('generateServiceWorker', () => {

  test('uses default options for an empty plan', () => {
    const actual = generateServiceWorker([], {compact: true})

    assert.match(actual, /const DEBUG = false;/)
    assert.match(actual, /const SKIP_WAITING = false;/)
    assert.match(actual, /const VERSION = '0\.0';/)
    assert.match(actual, /const CACHE_NAME = '0\.0';/)
    assert.match(actual, /const PRELOAD_PATHS = \[\]\.map\(withOrigin\);/)
    assert.match(actual, /const ROUTES = \[\n  \];/)
    assert.match(actual, /self\.addEventListener\('install'/)
    assert.match(actual, /self\.addEventListener\('fetch'/)
  })

  test('generates preload paths, routes, and configured options', () => {
    const plan = [
      {strategy: 'cache-on-install', paths: ['index.html', 'assets/app.js']},
      {strategy: 'staticOfflineBackup', paths: '/', backup: '/offline.html'},
      {strategy: 'networkOnly', paths: '/api'}
    ] satisfies Plan

    const actual = generateServiceWorker(plan, {
      version: '1.2.3',
      debug: true,
      skipWaiting: true,
      compact: true
    })

    assert.match(actual, /const DEBUG = true;/)
    assert.match(actual, /const SKIP_WAITING = true;/)
    assert.match(actual, /const VERSION = '1\.2\.3';/)
    assert.match(actual, /const CACHE_NAME = '1\.2';/)
    assert.match(actual, /const PRELOAD_PATHS = \['\/offline\.html','assets\/app\.js','index\.html'\]\.map\(withOrigin\);/)
    assert.match(actual, /\[cacheFirst, \['assets\/app\.js','index\.html'\]\.map\(withOrigin\)\]/)
    assert.match(actual, /\[staticOfflineBackup, \['\/'\]\.map\(withOrigin\), '\/offline\.html'\]/)
    assert.match(actual, /\[networkOnly, \['\/api'\]\.map\(withOrigin\)\]/)
  })

  test('Non-compact has JS line comments/headers', () => {
    const plan = [{strategy: 'networkOnly', paths: '/api'}] satisfies Plan

    const actual = generateServiceWorker(plan, {
      compact: false
    })

    assert.match(actual, /\/\/ Caching strategies \(public API\)/)
    assert.match(actual, /\/\/ General Utilities/)
  })

  test('compact has no JS line comments', () => {
    const plan = [{strategy: 'networkOnly', paths: '/api'}] satisfies Plan

    const actual = generateServiceWorker(plan, {
      compact: true
    })

    assert.doesNotMatch(actual, /^\/\/.*$/mg, 'has line comments')
  })

  test('compact has no empty lines', () => {
    const plan = [{strategy: 'networkOnly', paths: '/api'}] satisfies Plan

    const actual = generateServiceWorker(plan, {
      compact: true
    })

    assert.doesNotMatch(actual, /\n\s*\n/, 'has empty lines')
  })

})

describe('pathsToJS', () => {

  test('wraps a single path in an array and adds the origin mapper', () => {
    const actual = pathsToJS('/index.html', true)

    assert.equal(actual, "['/index.html'].map(withOrigin)")
  })

  test('puts multiple paths on their own lines', () => {
    const actual = pathsToJS(['/index.html','/about.html'], false)

    assert.equal(actual, `[
    '/index.html',
    '/about.html'
    ].map(withOrigin)`)
  })

  test('serializes arrays, regular expressions, and matcher symbols', () => {
    const actual = pathsToJS(['/index.html', /\.js$/, OriginAndBelow, ScopeAndBelow], true)

    assert.equal(actual, "['/index.html',/\\.js$/,ORIGIN_MATCHER,SCOPE_MATCHER].map(withOrigin)")
  })
})

describe('pathToJS', () => {

  test('returns a string quoted', () => {
    const actual = pathToJS('astring')

    assert.equal(actual, "'astring'")
  })

  test('returns a RegExp raw', () => {
    const actual = pathToJS(/re/)

    assert.equal(actual, '/re/')
  })


  test('replaces Symbol.for("origin") with origin matcher', (t) => {
    const actual = pathToJS(OriginAndBelow)

    assert.equal(actual, 'ORIGIN_MATCHER')
  })

  test('replaces Symbol.for("scope") with scope matcher', (t) => {

    const actual = pathToJS(ScopeAndBelow)

    assert.equal(actual, 'SCOPE_MATCHER')
  })

})

describe('cacheName', () => {

  test('returns the first two parts of the version', () => {
    const actual = cacheName('1.2.3')
    assert.equal(actual, '1.2')
  })

  test('returns the whole version if just two parts', () => {
    const actual = cacheName('1.2')
    assert.equal(actual, '1.2')
  })

  test('handles large numbers', () => {
    const actual = cacheName('1234.567.890')
    assert.equal(actual, '1234.567')
  })

  test('adds a second number if its just one', () => {
    const actual = cacheName('34')
    assert.equal(actual, '34.0')
  })
  test('returns the first part of the version', () => {
    const actual = cacheName('')
    assert.equal(actual, '0.0')
  })
})
