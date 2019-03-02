import BadArgumentError from "lib/BadArgumentError";
import { is, copyOwn } from "tools/extensions/common";

// Re-export extension methods.
export * as extensions from "tools/extensions/common";
// Also re-export `is`; it's just too useful.
export { is };

// Re-export classes.
export Composition from "tools/common/Composition";

/**
 * The global object.
 */
export const global = Function('return this')();

/**
 * An empty, immutable object.  Useful as `options` defaults.
 */
export const nil = Object.freeze({});

const hasOwn = Object.prototype.hasOwnProperty;

/**
 * Compares the own-properties of two objects.
 *
 * @export
 * @param {!Object} left The first object.
 * @param {!Object} right The second object.
 * @returns {boolean} Whether the objects have equivalent own-properties.
 */
export function compareOwnProps(left, right) {
  if (left === null || !left::is.refType()) return false;
  if (right === null || !right::is.refType()) return false;
  if (left === right) return true;

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) return false;

  for (let i = 0, len = leftKeys.length; i < len; i++) {
    const key = leftKeys[i];
    if (!right::hasOwn(key)) return false;
    if (!Object.is(left[key], right[key])) return false;
  }

  return true;
}

/**
 * Calculates the disjunctive-union of the two given object's own-properties; that is, it produces an
 * object that contains only the own-properties that are unique between each of the given objects.
 *
 * @export
 * @param {Object.<string, any>} left The first object.
 * @param {Object.<string, any>} right The second object.
 * @returns {Object.<string, any>} 
 */
export function disjunctiveUnion(left, right) {
  if (left === null || !left::is.refType()) return copyOf(right);
  if (right === null || !right::is.refType()) return left::copyOwn();
  if (left === right) return {};

  const result = {};
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  addDifference(result, left, leftKeys, new Set(rightKeys));
  addDifference(result, right, rightKeys, new Set(leftKeys));

  return result;
}

function copyOf(obj) {
  if (obj === null || !obj::is.refType()) return {};
  return obj::copyOwn();
}

function addDifference(target, source, sourceKeys, rejectSet) {
  for (let i = 0, len = sourceKeys.length; i < len; i++) {
    const k = sourceKeys[i];
    if (rejectSet.has(k)) continue;
    target[k] = source[k];
  }
  return target;
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

/**
 * Creates a function that will call `factory` only once, storing its return value in a closure and returning
 * it with each subsequent call.
 *
 * @export
 * @template T
 * @param {function(): T} factory The factory function.
 * @returns {function(): T} A function that produces the singleton value returned from `factory`.
 */
export function singleton(factory) {
  let instance = void 0, doOnce = false;
  return () => doOnce ? instance : (doOnce = true, instance = factory(), instance);
}

/**
 * Compares all the arguments provided to this function, returning whether they are all equivalent, according
 * to `Object.is`.  Has short-circuits up to arity-3.
 *
 * @export
 * @param {...*} arguments The arguments to compare.
 * @returns {boolean} Whether the arguments were all equivalent.
 * @throws When no arguments were provided.
 */
export function allEq() {
  switch (arguments.length) {
    case 0: throw new BadArgumentError("no arguments to compare were provided");
    case 1: return true;
    case 2: return Object.is(arguments[0], arguments[1]);
    case 3: return Object.is(arguments[0], arguments[1]) && Object.is(arguments[0], arguments[2]);
    default: {
      const value = arguments[0];
      for (let i = 1, len = arguments.length; i < len; i++)
        if (!Object.is(value, arguments[i]))
          return false;
      return true;
    }
  }
}