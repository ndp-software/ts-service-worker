// Copyright (c) 2023 Andrew J. Peterson, dba NDP Software

import {describe, test} from "node:test";
import assert from "node:assert/strict";
import {
  convertPreloadPathsToCacheFirst,
  extractAllPreloadPaths,
  InputCacheStrategy,
  InputCacheStrategyAsPaths
} from "../strategies.mjs";

describe('convertPreloadPathsToCacheFirst', () => {

  test('ignores other strategies', () => {
    const input = [
      {strategy: "cache-on-install", paths: 'a.txt'},
      {strategy: "staleWhileRevalidate", paths: '/w'},
    ] satisfies Array<InputCacheStrategy>

    const actual = convertPreloadPathsToCacheFirst(input)

    assert.deepEqual(actual, [
      {strategy: 'cacheFirst', paths: 'a.txt'},
      {strategy: 'staleWhileRevalidate', paths: '/w'},
    ])

  })

  test('converts to cacheFirst', () => {
    const input = [
      {strategy: "cache-on-install", paths: 'a.txt'},
      {strategy: "cache-on-install", paths: 'b.txt'},
    ] satisfies Array<InputCacheStrategy>

    const actual = convertPreloadPathsToCacheFirst(input)

    assert.deepEqual(actual, [
      {strategy: 'cacheFirst', paths: 'a.txt'},
      {strategy: 'cacheFirst', paths: 'b.txt'},
    ])
  })
})

describe('extractAllPreloadPaths', () => {

  test('returns a single strategy', () => {
    const input = [
      {strategy: "cache-on-install", paths: ['c']},
      {strategy: "cache-on-install", paths: ['a', 'b']}
    ] satisfies Array<InputCacheStrategyAsPaths>

    const actual = extractAllPreloadPaths(input)

    assert.deepEqual(actual, ['a', 'b', 'c'])
  })


  test('ignores other strategies', () => {
    const input = [
      {strategy: "cache-on-install", paths: 'a.txt'},
      {strategy: "cacheFirst", paths: '/a'},
      {strategy: "cache-on-install", paths: 'b.txt'},
    ] satisfies Array<InputCacheStrategyAsPaths>

    const actual = extractAllPreloadPaths(input)

    assert.deepEqual(actual,
      ['a.txt', 'b.txt'])
  })

  test('adds in back of staticOfflineBackup', () => {
    const input = [
      {strategy: "cache-on-install", paths: 'a.txt'},
      {strategy: "staticOfflineBackup", paths: '/b', backup: 'backup.txt'},
      {strategy: "cache-on-install", paths: 'b.txt'},
    ] satisfies Array<InputCacheStrategyAsPaths>

    const actual = extractAllPreloadPaths(input)

    assert.deepEqual(actual,
      ['a.txt', 'b.txt', 'backup.txt'])
  })

})
