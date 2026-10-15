import {describe, test} from "node:test";
import assert from "node:assert/strict";
import {organizeStrategies} from "../organizeStrategies.mjs";
import {Plan} from "../generate.mjs";


describe('organizeStrategies', () => {

  test('smoke test', () => {
    const plan = [
      {
        strategy: "cache-on-install",
        paths: [
          '/Impact-Label-fontfacekit/Impact_label_reversed.css',
          '/Impact-Label-fontfacekit/Impact_label_reversed-webfont.woff'
        ]
      },
      {strategy: "staticOfflineBackup", paths: '/b', backup: 'backup.txt'},
      {
        "strategy": "networkFirst",
        "paths": "Origin"
      },
      {
        paths: '/api/stuff.xml',
        strategy: 'networkOnly'
      },
      {
        strategy: "cacheFirst",
        paths: [
          '/favicon.ico',
          '/symbola.css?wednesday',
          '/open-search-description.xml',
          /\/main\..*/
        ]
      },
      {
        strategy: "staleWhileRevalidate",
        paths: /\/data\/out\/.*\.json/
      }
    ] satisfies Plan

    const result = organizeStrategies(plan)

    const expected =
      {
        preloadPaths: ['/Impact-Label-fontfacekit/Impact_label_reversed-webfont.woff', '/Impact-Label-fontfacekit/Impact_label_reversed.css', 'backup.txt'],
        routable: [
          {
            paths: ['/Impact-Label-fontfacekit/Impact_label_reversed-webfont.woff', '/Impact-Label-fontfacekit/Impact_label_reversed.css'],
            strategy: 'cacheFirst'
          },
          {
            backup: 'backup.txt',
            paths: '/b',
            strategy: 'staticOfflineBackup'
          },
          {
            paths: 'Origin',
            strategy: 'networkFirst'
          },
          {
            paths: '/api/stuff.xml',
            strategy: 'networkOnly'
          },
          {
            paths: [/\/main\..*/, '/favicon.ico', '/open-search-description.xml', '/symbola.css?wednesday'],
            strategy: 'cacheFirst'
          }, {paths: /\/data\/out\/.*\.json/, strategy: 'staleWhileRevalidate'}]
      }

    assert.deepEqual(result, expected)
  })

})