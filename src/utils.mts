export function deDup<P>(paths: P): P {
    if (!Array.isArray(paths)) return paths
    return [...new Set(paths)].sort() as P // sort not necessary, but makes deterministic
}