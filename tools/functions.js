import BadArgumentError from "lib/BadArgumentError";
import { is, allEq } from "tools/common";
import { identical } from "tools/array";

// Re-export extension methods.
export * as extensions from "tools/extensions/functions";

const $$unset = Symbol("memoize:unset");
const $$noArgs = Symbol("memoiziest:no-args");

/**
 * Creates a new function that wraps `fn` in a try-catch.  If `fn` throws an error, it will return `undefined`.
 * The function `fn` is invoked with the `this` binding of the returned, trial function.
 *
 * @export
 * @template T,U
 * @param {function(...U): T} fn The function to wrap in a try-catch.
 * @returns {function(...U): T|undefined} A new function.
 */
export const trial = (fn) => {
  const trialFn = function() {
    try { return arguments.length === 0 ? fn.call(this) : fn.apply(this, arguments); }
    catch { return void 0; }
  }

  Object.defineProperty(trialFn, "name", {
    value: fn.name ? `trial of ${fn.name}` : "trial of anonymous"
  });

  return trialFn;
}

/**
 * Creates a new function that memoizes the last result of the given function.  If the arguments or
 * `this` binding are not identical to the last call, the function will be called again and its
 * arguments and result stored.  The function `fn` is invoked with the `this` binding of the returned,
 * memoized function.
 * 
 * The last return value can be accessed via the function's `lastResult` property.  It will be `undefined`
 * until the function has been called at least once.
 *
 * @export
 * @param {Function} fn The function to have its result memoized.
 * @returns {Function} The new, memoized function.
 */
export const memoize = (fn) => {
  if (!fn::is.func())
    throw new BadArgumentError("must be a function", "fn", fn);

  let oldThis = $$unset;
  let oldArgs = $$unset;
  let oldResult = $$unset;

  const memoizedFn = function() {
    const newArgsLen = arguments.length;
    const oldArgsLen = oldArgs.length;
    let newArgs;
    switch (true) {
      case Object.is(oldResult, $$unset):
      case !Object.is(oldThis, this):
        newArgs = [...arguments];
        break;
      case allEq(0, newArgsLen, oldArgsLen):
        return oldResult;
      case allEq(1, newArgsLen, oldArgsLen):
        if (Object.is(arguments[0], oldArgs[0]))
          return oldResult;
        newArgs = [...arguments];
        break;
      default:
        // Do not leak `arguments` into `identical`.
        newArgs = [...arguments];
        if (identical(newArgs, oldArgs))
          return oldResult;
        break;
    }

    oldThis = this;
    oldArgs = newArgs;
    oldResult = fn.apply(this, arguments);
    return oldResult;
  };

  Object.defineProperties(memoizedFn, {
    name: { value: fn.name ? `memoized ${fn.name}` : "memoized anonymous" },
    lastResult: { get: () => Object.is(oldResult, $$unset) ? void 0 : oldResult }
  });

  return memoizedFn;
};

/**
 * Creates a function that memoizes all the results of the given function.  If `resolver` is provided, it determines
 * the cache key for storing the result based on the arguments provided to the memoized function.  By default, the
 * first argument provided to the memoized function is used as the map cache key. The function `fn` is invoked
 * with the `this` binding of the returned, memoized function.
 * 
 * Note: based on the `memoize` function of lodash.
 *
 * @export
 * @param {Function} resolver The function to resolve the cache key.
 * @returns {Function} The new, memoized function.
 */
memoize.each = (fn, resolver) => {
  if (!fn::is.func())
    throw new BadArgumentError("must be a function", "fn", fn);
  if (resolver::is.defined() && !resolver::is.func())
    throw new BadArgumentError("must be a function or `undefined`", "resolver", resolver);

  const memoizedFn = function() {
    const key =
      resolver ? resolver.apply(this, arguments) :
      arguments.length > 0 ? arguments[0] :
      $$noArgs;
    const cache = memoizedFn.cache;

    if (cache.has(key))
      return cache.get(key);

    const result = fn.apply(this, arguments);
    cache.set(key, result);
    return result;
  }

  Object.defineProperties(memoizedFn, {
    name: { value: fn.name ? `memoize.each of ${fn.name}` : "memoize.each of anonymous" },
    cache: { value: new Map() }
  });

  return memoizedFn;
};

/**
 * Creates a function that runs the given arity-1 side-effecting function once for each unique
 * argument provided to it.
 *
 * @export
 * @param {function(*): void} arity1SideEffectFn The function to wrap.
 * @returns {function(*): void}
 */
export const onceEach = (arity1SideEffectFn) => {
  const argsGiven = new Set();

  return (arg) => {
    if (argsGiven.has(arg)) return;
    argsGiven.add(arg);
    arity1SideEffectFn(arg);
  };
};