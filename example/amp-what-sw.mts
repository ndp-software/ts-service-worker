// Copyright (c) 2023 Andrew J. Peterson, dba NDP Software

import {generateServiceWorker, Plan} from "../src/generate.mjs";

const plan: Plan = [
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
];

const js = generateServiceWorker(plan, {debug: true, skipWaiting: true, version: '1.0.4'});

console.log(js)

