// Copyright (c) 2023 Andrew J. Peterson, dba NDP Software
import {globSync} from "glob";


/*
 * A somewhat messy enumeration of files found on disk
 */
export type FilesSpec =
  string
  | Array<string>
  | {
  glob: string | Array<string>
  dir?: string, // default '.'
  prefix?: string // prefix of URL path, default /
}

/**
 * Convert a messy file spec into an array of paths.
 */
export function filesSpecToPaths(files: FilesSpec): Array<string> {
  let prefix = ''
  let dir = ''
  let globs: Array<string>
  if (typeof files === 'string') {
    globs = [files]
  } else if (Array.isArray(files)) {
    globs = files
  } else {
    globs = Array.isArray(files.glob) ? files.glob : [files.glob]
    prefix = files.prefix || ''
    dir = (files.dir) || dir
  }
  if (prefix[0] !== '/') prefix = '/' + prefix
  if (prefix.substring(-1) !== '/') prefix += '/'

  const options = {
    cwd: dir,
    dotRelative: true,
    nodir: true,
  };

  return globs.map(g => {
    const names = globSync(g, options);
    if (names.length === 0) throw `No files match glob pattern "${g}" in "${dir}"`
    return names.map(n => n.replace(/^\.[/\\]/, '')) // "./file.jpg"
      .map(n => `${prefix}${n}`)
  }).flat()
}

