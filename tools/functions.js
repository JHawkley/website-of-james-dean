import { is } from "tools/common";
import { identical } from "tools/array";

// Re-export extension methods.
export * as extensions from "tools/extensions/functions";

/**
 * Creates a new function that wraps `fn` in a try-catch.  If `fn` throws an error, it will return `undefined`.
 *
 * @export
 * @template T,U
 * @param {function(...U): T} fn The function to wrap in a try-catch.
 * @param {*} [thisArg=null] The object to bind to `fn`, when it is called.
 * @returns {function(...U): T|undefined} A new function.
 */
export function trial(fn, thisArg = null) {
  return function(...args) {
    try { return args.length === 0 ? thisArg::fn() : thisArg::fn(...args); }
    catch { return void 0; }
  }
}

/**
 * Creates a function that memoizes the last result of the given function.  If the arguments are not identical
 * to the last call, the function will be called again and its arguments and result stored.
 *
 * @export
 * @param {Function} fn The function to have its result memoized.
 * @returns {Function} The memoized function.
 */
export function memoize(fn) {
  if (!fn::is.func())
    throw new TypeError('expected `fn` to be a function');

  let oldArgs = [];
  let oldResult = void 0;

  return function(...newArgs) {
    // Short-circuit for empty arguments.
    if (newArgs.length === 0 && oldArgs.length === 0) {
      if (oldResult::is.undefined()) oldResult = fn();
      return oldResult;
    }

    if (identical(newArgs, oldArgs))
      return oldResult;

    oldArgs = newArgs;
    oldResult = fn.apply(null, newArgs);
    return oldResult;
  };
}

/**
 * Creates a function that memoizes all the result of the given function.  If `resolver` is provided, it determines
 * the cache key for storing the result based on the arguments provided to the memoized function.  By default, the
 * first argument provided to the memoized function is used as the map cache key. The function being memoized is
 * invoked with the `this` binding of the memoized function.
 * 
 * Note: based on the `memoize` function of lodash.
 *
 * @export
 * @this {Function} The function to have its result memoized.
 * @param {Function} resolver The function to resolve the cache key.
 * @returns {Function} The new memoized function.
 */
export function memoiziest(fn, resolver) {
  if (!fn::is.func())
    throw new TypeError('expected `fn` to be a function');
  if (resolver::is.defined() && !resolver::is.func())
    throw new TypeError('expected `resolver` to be a function');

  const memoized = function(...args) {
    const key = resolver ? resolver.apply(this, args) : args[0];
    const cache = memoized.cache;

    if (cache.has(key))
      return cache.get(key);

    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  }
  
  memoized.cache = new Map();
  return memoized;
}