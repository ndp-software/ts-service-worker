// Copyright (c) 2023 Andrew J. Peterson, dba NDP Software
import {filesSpecToPaths, FilesSpec} from "./filesSpecToPaths.mjs";


/**
 * Preload and cache any number of files enumerated from disk using globs.
 *  Implies 'cacheFirst'.
  */
export type CacheFileOnInstall = {
  strategy: 'cache-on-install',
  files: FilesSpec
}

export function isCacheFileOnInstall(s: { strategy: string }): s is CacheFileOnInstall {
  return s.strategy === 'cache-on-install' && 'files' in s
}


/**
 *  Preload and cache enumerated paths (not files)
 *  Implies 'cacheFirst'.
 */
export type CachePathOnInstall = {
  strategy: 'cache-on-install',
  paths: string | Array<string>
}

export function isCachePathOnInstall(s: { strategy: string }): s is CachePathOnInstall {
  return s.strategy === 'cache-on-install' && 'paths' in s
}

/**
 Serve from the cache if available, otherwise go to the network.
 Ideal for: CSS, images, fonts, JS, templates… basically anything you'd consider static to that "version" of your site.
 @see https://web.dev/learn/pwa/serving/#cache-first
 On its own implies no update to the cache file, so only useful
 for immutable resources.
 https://web.dev/offline-cookbook/#on-network-response
 if retrieved via network, gets cached
 */
export type CacheFirstStrategy<Paths> = {
  readonly strategy: 'cacheFirst'
  readonly paths: Paths
}

/**
 * If the network connection is not available, use
 * the cached version.
 * Files are cached in the background as they are fetched.
 * @see https://web.dev/learn/pwa/serving/#network-first
 */
export type NetworkFirstStrategy<Paths> = {
  strategy: 'networkFirst'
  paths: Paths
}

/**
 * Serve files from the cache, and then in the background update
 * with a fresh version.
 * Useful for potentially slow and non-time-sensitive resources.
 * @see https://web.dev/learn/pwa/serving/#stale-while-revalidate
 */
export type StaleWhileRevalidateStrategy<Paths> = {
  strategy: 'staleWhileRevalidate'
  paths: Paths
}

/**
 * Serve normally (from network) unless not available. If
 * network is down, use the response from the backup path.
 * The backup path is cached on service worker installation.
 */
export type StaticOfflineBackupStrategy<Paths> = {
  strategy: 'staticOfflineBackup',
  paths: Paths
  backup: string
}

export function isStaticOfflineBackup(s: {
  strategy: string,
  paths?: unknown,
  backup?: string}): s is StaticOfflineBackupStrategy<unknown> {
  return s.strategy === 'staticOfflineBackup' && !!s.paths && !!s.backup
}

/**
 * Serve from the network only. No caching.
 * https://web.dev/learn/pwa/serving/#network-only
 */
export type NetworkOnlyStrategy<Paths> = {
  strategy: 'networkOnly'
  paths: Paths
}

export type RoutableStrategy<Paths> = CacheFirstStrategy<Paths>
  | NetworkFirstStrategy<Paths>
  | StaleWhileRevalidateStrategy<Paths>
  | NetworkOnlyStrategy<Paths>
  | StaticOfflineBackupStrategy<Paths>

export type CacheOnInstallStrategy = CachePathOnInstall
  | CacheFileOnInstall

export type InputCacheStrategy = RoutableStrategy<InputPaths> | CacheOnInstallStrategy
export type InputCacheStrategyAsPaths = RoutableStrategy<InputPaths> | CachePathOnInstall

/**
 * Indicator for all file paths routed from the same origin
 * as the service worker is served from.
 */
export const OriginAndBelow = Symbol.for('origin-and-below')

/**
 * Indicator for all files served within the service worker's
 * scope. Usually you will want `Origin`, but this is included
 * for completeness.
 */
export const ScopeAndBelow = Symbol.for('scope-and-below')

/*
Users may specify paths to be cached in a variety of ways.
 */
export type InputPaths =
  RegExp | string | OutputPaths | typeof OriginAndBelow | typeof ScopeAndBelow

/*
`OutputPaths` are the paths included in the service worker. All
the variety of expression included in `InputPaths` have been converted
to a simple array that can be iterated.
 */
export type OutputPaths = Array<string | RegExp>

export function isRoutableStrategy<Paths>(x: { strategy: string }): x is RoutableStrategy<Paths> {
  return x.strategy === 'cacheFirst'
    || x.strategy === 'networkFirst'
    || x.strategy === 'networkOnly'
    || x.strategy === 'staleWhileRevalidate'
    || x.strategy === 'staticOfflineBackup'
}

export function convertPreloadFilesToPaths(strategy: CacheFileOnInstall): CachePathOnInstall {
  const paths = filesSpecToPaths(strategy.files)
  return {
    strategy: 'cache-on-install',
    paths
  }
}

/**
 * Converts paths specified by scanning the disk to the paths
 * that are the result of that scan.
 * Users may specific some paths as "files", which are
 * then determined by scanning the disk (with glob patterns.)
 * Obviously this is useful for certain static resources,
 * where it might be tedious to keep the service worker spec
 * up-to-date with resources in a folder.
 * The downside of this are that it can pick up extra files
 * without the developer being aware, so it's important to
 * review either the generated service worker code, or the
 * cache created in the browser.
 */
export function convertPreloadFiles(strategy: InputCacheStrategy): InputCacheStrategyAsPaths {
  if (isCacheFileOnInstall(strategy))
    return convertPreloadFilesToPaths(strategy)
  else
    return strategy
}

/**
 * Run through all the strategies in a plan and extract all
 * the paths that should be "preloaded" on service worker
 * installation. This includes explicit preload paths,
 * preload-files (which have been converted to paths before
 * this call), and offline backup paths.
 */
export function extractAllPreloadPaths(plan: Array<{ strategy: string; }>): OutputPaths {

  const cacheOnInstallPaths = plan
    .filter(isCachePathOnInstall)
    .map(s => s.paths)
    .flat();

  const backupPaths = plan
    .filter(isStaticOfflineBackup)
    .map((s: StaticOfflineBackupStrategy<unknown>) => s.backup)

  cacheOnInstallPaths.push(...backupPaths)

  return cacheOnInstallPaths.sort() as OutputPaths
}

export function convertPreloadPathsToCacheFirst(spec: Array<InputCacheStrategyAsPaths>):
    Array<RoutableStrategy<InputPaths>> {
  return spec.map(s =>
    isRoutableStrategy<InputPaths>(s)
      ? s
      : {
        strategy: 'cacheFirst',
        paths: s.paths
      } satisfies CacheFirstStrategy<InputPaths>)
}


export function convertAllFilesToPaths(spec: Array<InputCacheStrategy>): Array<InputCacheStrategyAsPaths> {
  return spec.map(convertPreloadFiles);
}
