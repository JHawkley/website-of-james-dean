/**
 * Creates a function that memoizes the result of this function.  If `resolver` is provided, it determines the cache key
 * for storing the result based on the arguments provided to the memoized function.  By default, the first argument
 * provided to the memoized function is used as the map cache key. The function being memoized is invoked with the
 * `this` binding of the memoized function.
 * 
 * Note: based on the `memoize` function of lodash.
 *
 * @export
 * @this {Function} The function to have its output memoized.
 * @param {Function} resolver The function to resolve the cache key.
 * @returns {Function} The new memoized function.
 */
export function memoize(resolver) {
  const func = this;
  if (typeof func != 'function' || (resolver != null && typeof resolver != 'function'))
    throw new TypeError('Expected a function');

  const memoized = function(...args) {
    const key = resolver ? resolver.apply(this, args) : args[0];
    const cache = memoized.cache;

    if (cache.has(key))
      return cache.get(key);

    const result = func.apply(this, args);
    cache.set(key, result);
    return result;
  }
  
  memoized.cache = new Map();
  return memoized;
}

/**
 * Tries to call this function, wrapping its execution in a try-catch.  If the function throws, `undefined`
 * will be returned instead.
 *
 * @export
 * @template T,U
 * @this {function(...U): T} The function to have its output memoized.
 * @param {*} [thisArg=null] The object to bind to the function.
 * @param {...U} args The arguments to supply to the function.
 * @returns {T|undefined} The result of this function or `undefined`.
 */
export function tryCall(thisArg = null, ...args) {
  try { return args.length === 0 ? thisArg::this() : thisArg::this(...args); }
  catch { return void 0; }
}