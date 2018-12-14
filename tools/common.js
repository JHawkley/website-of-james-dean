import { is } from "tools/extensions/common";

// Re-export extension methods.
export * as extensions from "tools/extensions/common";

/**
 * Compares the own-properties of two objects.
 *
 * @export
 * @param {!Object} left The first object.
 * @param {!Object} right The second object.
 * @returns {boolean} Whether the objects have equivalent own-properties.
 * @throws When any argument provided is not an object.
 * @throws When any argument provided was `null`.
 */
export function compareOwnProps(left, right) {
  if (!left::is.object())
    throw new Error("the `left` value must be an object reference");
  if (!right::is.object())
    throw new Error("the `right` value must be an object reference");
  if (left === right) return true;

  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys)
    if (left[key] !== right[key])
      return false;
  return true;
}

/**
 * Executes the given function and returns its result.  A helper for immediately-invoked function expressions.
 * 
 * @export
 * @template T
 * @param {function(): T} fn The function to immediately invoke.
 * @returns {T} The result of the function.
 */
export function dew(fn) {
  return fn();
}

/**
 * Executes the given function and returns its result.  If the function throws an exception, `undefined`
 * will be returned instead.
 *
 * @export
 * @template T,U
 * @param {function(...U): T} fn The function that may throw an exception.
 * @param {...U} args The arguments to provide to the function.
 * @returns {T|undefined} The result of `fn` or `undefined`.
 */
export function tryDew(fn, ...args) {
  try { return args.length === 0 ? fn() : fn(...args); }
  catch { return void 0; }
}

/**
 * Represents a no-operation function.
 *
 * @export
 */
export function noop() { return; }

/**
 * Represents the identity function.
 *
 * @export
 * @template T
 * @param {T} v Some value.
 * @returns {T} The same value as `v`.
 */
export function identityFn(v) { return v; }