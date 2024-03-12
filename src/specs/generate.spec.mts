import {describe, mock, test} from "node:test";
import {cacheName, pathToJS} from "../generate.mjs";
import assert from "node:assert/strict";
import {OriginAndBelow, ScopeAndBelow} from "../strategies.mjs";

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
