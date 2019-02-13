import { memoize as memoizeFn } from "tools/functions";

/**
 * Creates a function that memoizes the last result of this function.  If the arguments are not identical
 * to the last call, this function will be called again and its arguments and result stored.
 *
 * @export
 * @this {Function} The function to have its result memoized.
 * @returns {Function} The new memoized function.
 */
export function memoize() {
  return memoizeFn(this);
}

/**
 * Creates a function that memoizes all the result of this function.  If `resolver` is provided, it determines the
 * cache key for storing the result based on the arguments provided to the memoized function.  By default, the
 * first argument provided to the memoized function is used as the map cache key. The function being memoized is
 * invoked with the `this` binding of the memoized function.
 * 
 * Note: based on the `memoize` function of lodash.
 *
 * @export
 * @this {Function} The function to have its result memoized.
 * @param {Function} [resolver] The function to resolve the cache key.
 * @returns {Function} The new memoized function.
 */
export function memoizeEach(resolver) {
  return memoize.each(this, resolver);
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
  try { return args.length === 0 ? this.call(thisArg) : this.apply(thisArg, args); }
  catch { return void 0; }
}

/**
 * Tries to apply this function, wrapping its execution in a try-catch.  If the function throws, `undefined`
 * will be returned instead.
 *
 * @export
 * @template T,U
 * @this {function(...U): T} The function to have its output memoized.
 * @param {*} [thisArg=null] The object to bind to the function.
 * @param {U[]} args The arguments to supply to the function.
 * @returns {T|undefined} The result of this function or `undefined`.
 */
export function tryApply(thisArg = null, args) {
  try { return args.length === 0 ? this.call(thisArg) : this.apply(thisArg, args); }
  catch { return void 0; }
}

/**
 * Creates a function that will only call this function once.  The result of the function is stored and
 * returned if another call is made.
 *
 * @export
 * @template T,U
 * @this {function(...U): T} The function to use as a basis.
 * @returns {function(...U): T} A function that will only execute once.
 */
export function callableOnce() {
  const fn = this;
  let doOnce = true;
  let result = void 0;
  
  const onceFn = function() {
    if (doOnce) {
      doOnce = false;
      result = fn.apply(this, arguments);
    }
    return result;
  }

  Object.defineProperties(onceFn, {
    name: { value: fn.name ? `callable once ${fn.name}` : "callable once anonymous" }
  });

  return onceFn;
}