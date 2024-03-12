import {
  convertAllFilesToPaths,
  convertPreloadPathsToCacheFirst,
  extractAllPreloadPaths, InputPaths,
  RoutableStrategy
} from "./strategies.mjs";
import {deDup} from "./utils.mjs";
import {Plan} from "./generate.mjs";

export function organizeStrategies(inputPlan: Plan) {

    // The user may specify some paths as file paths, but these
    // will make no sense in a service worker. Convert all those
    // glob matches to URL matchable paths.
    const spec = convertAllFilesToPaths(inputPlan)

    // Search through all strategies and extract any paths that need
    // pre-loading.
    const preloadPaths = deDup(extractAllPreloadPaths(spec))

    // We left those specs in the plan, but conveniently we
    // convert them to be served from the cache, `cacheFirst`.
    const specWithoutPreloads = convertPreloadPathsToCacheFirst(spec)

    const routable = removeDuplicatePaths(specWithoutPreloads)
    return {preloadPaths, routable};
}


function removeDuplicatePaths<T extends RoutableStrategy<InputPaths>>(
    specs: Array<T>): Array<T>
{
  return specs
      .map(spec=> ({
        ...spec,
        paths: deDup(spec.paths)
      } as T) )
}
