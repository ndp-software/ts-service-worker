// Copyright (c) 2023 Andrew J. Peterson, dba NDP Software
import {describe, test} from "node:test";
import assert from "node:assert/strict";
import {filesSpecToPaths} from "../filesSpecToPaths.mjs";

describe('fileSpecsToPaths', () => {

  test('finds file', () => {
    const actual = filesSpecToPaths('src/specs/data/a.txt')
    assert.deepEqual(actual, ['/src/specs/data/a.txt'])
  })

  test('finds multiple files', () => {
    const actual = filesSpecToPaths(['src/specs/data/a.txt', 'src/specs/data/folder/b.txt'])
    assert.deepEqual(actual, ['/src/specs/data/a.txt', '/src/specs/data/folder/b.txt'])
  })

  test('finds wildcard file', () => {
    const actual = filesSpecToPaths('src/specs/data/*.txt')
    assert.deepEqual(actual, ['/src/specs/data/a.txt'])
  })

  test('finds glob file', () => {
    const actual = filesSpecToPaths({glob: 'src/specs/data/a.txt'})
    assert.deepEqual(actual, ['/src/specs/data/a.txt'])
  })

  test('finds file in folder', () => {
    const actual = filesSpecToPaths({glob: 'a.txt', dir: 'src/specs/data'})
    assert.deepEqual(actual, ['/a.txt'])
  })

  test('finds glob wildcard file', () => {
    const actual = filesSpecToPaths({glob: 'src/specs/data/*.txt'})
    assert.deepEqual(actual, ['/src/specs/data/a.txt'])
  })

  test('finds wildcard files in folders', () => {
    const actual = filesSpecToPaths({glob: '**/*.txt', dir: 'src/specs/data'})
    assert.deepEqual(actual, ['/a.txt', '/folder/b.txt'])
  })

  test('prefixes files', () => {
    const actual = filesSpecToPaths({glob: '**/*.txt', dir: 'src/specs/data', prefix: '/assets'})
    assert.deepEqual(actual, ['/assets/a.txt', '/assets/folder/b.txt'])
  })

  test('treats "/" as the null prefix', () => {
    const actual = filesSpecToPaths({glob: '**/*.txt', dir: 'src/specs/data', prefix: '/'})
    assert.deepEqual(actual, ['/a.txt', '/folder/b.txt'])
  })

  test('raises if no files match', () => {
    assert.throws(() => {
      filesSpecToPaths({glob: 'x.txt'})
    }, /No files match glob pattern/)
  })

})
