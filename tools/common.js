import { is } from "tools/extensions/common";

// Re-export extension methods.
export * as extensions from "tools/extensions/common";
// Also re-export `is`; it's just too useful.
export { is };

/**
 * The global object.
 */
export const global = Function('return this')();

/**
 * An empty, immutable object.  Useful as `options` defaults.
 */
export const nil = Object.freeze({});

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
    if (!Object.is(left[key], right[key]))
      return false;
  return true;
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
 * Calculates the disjunctive-union of the two given objects; that is, it produces an object that contains only
 * the properties that are unique between each of the given objects.
 *
 * @export
 * @param {Object.<string, any>} left The first object.
 * @param {Object.<string, any>} right The second object.
 * @returns {Object.<string, any>} 
 */
export function disjunctiveUnion(left, right) {
  const result = {};
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  addDifference(result, left, leftKeys, new Set(rightKeys));
  addDifference(result, right, rightKeys, new Set(leftKeys));
  return result;
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
  let instance = void 0;
  return () => instance::is.undefined() ? (instance = factory()) : instance;
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
    case 0: throw new Error("no arguments to compare were provided");
    case 1: return true;
    case 2: return Object.is(arguments[0], arguments[1]);
    case 3: return Object.is(arguments[0], arguments[1]) && Object.is(arguments[1], arguments[2]);
    default:
      for (let i = 1, len = arguments.length; i < len; i++)
        if (!Object.is(arguments[i - 1], arguments[i]))
          return false;
      return true;
  }
}

/**
 * A class to aid object composition.
 *
 * @export
 * @class Composition
 */
export class Composition {

  /**
   * Creates an instance of Composition.
   * 
   * @param {Object.<string, any>} [start=null] An object to clone, to act as the start of the composition.
   * @memberof Composition
   */
  constructor(start = null) {
    /**
     * Whether any composition has occurred.  Will only be `false` if a `start` was not provided and no
     * other composition operations have occurred.
     * 
     * @property {boolean} composed
     * @memberof Composition
     * @instance
     */
    this.composed = Boolean(start);

    /**
     * The current result of the composition.
     * 
     * @property {boolean} result
     * @memberof Composition
     * @instance
     */
    this.result = start ? Object.assign({}, start) : {};
  }

  /**
   * Adds the own-properties of the given object to the composition.
   *
   * @param {Object.<string, any>} source
   * @returns {this}
   * @memberof Composition
   */
  compose(source) {
    this.composed = true;
    Object.assign(this.result, source);
    return this;
  }

  /**
   * Assigns the given `value` to the property identified by the given `key` to the composition.
   *
   * @param {string} key The key of the property.
   * @param {any} value The value of the property.
   * @returns {this}
   * @memberof Composition
   */
  add(key, value) {
    this.composed = true;
    this.result[key] = value;
    return this;
  }

  /**
   * Removes the property identified by the given `key` from the composition.
   *
   * @param {string} key
   * @returns {this}
   * @memberof Composition
   */
  delete(key) {
    this.composed = true;
    delete this.result[key];
    return this;
  }

}