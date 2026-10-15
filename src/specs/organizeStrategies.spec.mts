import {describe, test} from "node:test";
import assert from "node:assert/strict";
import {organizeStrategies} from "../organizeStrategies.mjs";


describe('organizeStrategies', () => {

  test('smoke test', () => {
    const plan = [
      {
        strategy: "cache-on-install",
        paths: [
          '/Impact-Label-fontfacekit/Impact_label_reversed.css',
          '/Impact-Label-fontfacekit/Impact_label_reversed.css',
          '/Impact-Label-fontfacekit/Impact_label_reversed-webfont.woff ',
          '/Impact-Label-fontfacekit/Impact_label_reversed-webfont.woff'
        ]
      },
      {
        strategy: "cacheFirst",
        paths: [
          '/favicon.ico',
          '/symbola.css?wednesday',
          '/open-search-description.xml',
          /\/main\..*/   // main css and js
        ]
      },
      {
        strategy: "staleWhileRevalidate",
        paths: /\/data\/out\/.*\.json/
      }
    ]

    const result = organizeStrategies(plan)


    const expected =
      {
        preloadPaths: ['/Impact-Label-fontfacekit/Impact_label_reversed-webfont.woff', '/Impact-Label-fontfacekit/Impact_label_reversed-webfont.woff ', '/Impact-Label-fontfacekit/Impact_label_reversed.css'],
        routable: [{
          paths: ['/Impact-Label-fontfacekit/Impact_label_reversed-webfont.woff', '/Impact-Label-fontfacekit/Impact_label_reversed-webfont.woff ', '/Impact-Label-fontfacekit/Impact_label_reversed.css'],
          strategy: 'cacheFirst'
        }, {
          paths: [/\/main\..*/, '/favicon.ico', '/open-search-description.xml', '/symbola.css?wednesday'],
          strategy: 'cacheFirst'
        }, {paths: /\/data\/out\/.*\.json/, strategy: 'staleWhileRevalidate'}]
      }

    assert.deepEqual(result, expected)
  })

})