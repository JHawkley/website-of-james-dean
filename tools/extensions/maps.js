/**
 * Creates a new map by applying the given `transformationFn` to each key-value-pair in this map.  If the
 * `transformationFn` produces multiple values for the same key, only the last value will be in the result.
 *
 * @export
 * @template K1,V1,K2,V2
 * @this {Map<K1, V1>}
 * @param {function([K1, V1]): [K2,V2]} transformationFn The transformation function.
 * @returns {Map<K2, V2>} The transformed map.
 */
export function map(transformationFn) {
  const result = new Map();
  for (const kvp of this) {
    const [key, value] = transformationFn(kvp);
    result.set(key, value);
  }
  return result;
}

/**
 * Creates a new map by applying the given `transformationFn` to each value in this map.  The `transformationFn`
 * is provided the value followed by the key as arguments.
 *
 * @export
 * @template K,V1,V2
 * @this {Map<K, V1>}
 * @param {function(V1, K): V2} transformationFn The transformation function.
 * @returns {Map<K, V2>} The transformed map.
 */
export function mapValues(transformationFn) {
  const result = new Map();
  for (const [key, value] of this)
    result.set(key, transformationFn(value, key));
  return result;
}

/**
 * Converts this map to an array by applying `transformationFn` to each key-value-pair then adds its return
 * value to an array.
 *
 * @export
 * @template K,V,T
 * @this {Map<K, V>}
 * @param {function([K,V]): T} transformationFn The transformation function.
 * @returns {T[]} The array of values produced by `transformationFn`.
 */
export function mapToArray(transformationFn) {
  const result = [];
  for (const kvp of this)
    result.push(transformationFn(kvp));
  return result;
}

/**
 * Produces a new map that contains only the key-value-pairs that passed the given `predicateFn`.
 *
 * @export
 * @template K,V
 * @this {Map<K, V>}
 * @param {function([K, V]): boolean} predicateFn The predicate function.
 * @returns {Map<K, V>} A new map.
 */
export function filter(predicateFn) {
  const result = new Map();
  for (const kvp of this)
    if (predicateFn(kvp))
      result.set(kvp[0], kvp[1]);
  return result;
}

/**
 * Creates a copy of this map, then adds the given `key` and `value` pair to it.
 *
 * @export
 * @template K,V
 * @this {Map<K, V>}
 * @param {K} key The key.
 * @param {V} value The value to associate with `key`.
 * @returns {Map<K, V>}
 */
export function added(key, value) {
  const result = new Map(this);
  result.set(key, value);
  return result;
}

/**
 * Creates a copy of this map, then removes the given `key` and its value from it.
 *
 * @export
 * @template K,V
 * @this {Map<K, V>}
 * @param {K} key The key to remove.
 * @returns {Map<K, V>}
 */
export function without(key) {
  const result = new Map(this);
  result.delete(key);
  return result;
}