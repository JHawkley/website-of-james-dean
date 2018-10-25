import { map } from "./numbers";
const { random } = Math;

/**
 * Executes the given function and returns its result.  A helper for immediately-invoked function expressions.
 * 
 * @export
 * @template T
 * @param {() => T} fn The function to immediately invoke.
 * @returns {T} The result of the function.
 */
export function dew(fn) {
  return fn();
}

/**
 * Represents a no-operation function.
 *
 * @export
 */
export function noop() { return; }

/**
 * Creates an array with the specified count, calling the given function for each element and populating the element
 * with its return value.
 * 
 * @export
 * @template T
 * @param {number} count The number of elements to create.
 * @param {(index: number) => T} fn The initializer function.
 * @returns {T[]} An array.
 */
export function makeArray(count, fn) {
  const arr = new Array(count);
  for (let i = 0; i < count; i++) arr[i] = fn(i);
  return arr;
}

/**
 * Matches each element of `a` to an element of `b`, passing the couple to a given function as arguments
 * along with the index they share.
 *
 * @export
 * @template T,U
 * @param {T[]} a The first array.
 * @param {U[]} b The second Array.
 * @param {(elA: T, elB: U, index: number) => void} fn
 */
export function forZipped(a, b, fn) {
  const lim = Math.min(a.length, b.length);
  for (let i = 0; i < lim; i++) fn(a[i], b[i], i);
}

/**
 * Matches each element to its immediate neighbor, going through each possible pair and supplying them
 * to the given function as arguments.
 *
 * @export
 * @template T
 * @param {T[]} arr The array to run through.
 * @param {(first: T, second: T) => void} fn The function to apply for each pair.
 */
export function forPair(arr, fn) {
  const lim = arr.length - 1;
  for (let i = 0; i < lim; i++) fn(arr[i], arr[i + 1]);
}

/**
 * Iterates through each own-property of this object.
 *
 * @export
 * @this {*} This object.
 * @param {(value: *, key: (string|symbol)) => void} fn A function applied to each property key-value-pair.
 */
export function forOwnProps(fn) {
  'use strict'; // Allows binding to `null`.
  if (this == null) return;
  Object.keys(this).forEach(k => fn(this[k], k));
}

/**
 * Creates a shallow copy of this simple object, where a "simple object" is one that has a prototype that is
 * `Object.prototype` or `null`.  If the value does not qualify as a simple object, an error is thrown.
 *
 * @export
 * @template T
 * @this {T} The object to copy.
 * @returns {T} A shallow copy of the own-properties of the bound object.
 */
export function copyOwn() {
  'use strict'; // Allows binding to `null`.
  if (typeof this !== "object")
    throw new Error("the bound value must be an object reference");
  
  if (this === null) return null;

  const proto = Object.getPrototypeOf(this);

  if (proto == null)
    return Object.assign(Object.create(null), this);
  if (proto === Object.prototype)
    return Object.assign({}, this);
  throw new Error("can only copy simple objects");
}

/**
 * Produces a random number between `min` and `max`.
 *
 * @export
 * @param {number} min The minimum of the range.
 * @param {number} max The maximum of the range.
 * @returns {number} A random number.
 */
export function randomBetween(min, max) {
  if (min === max) return min;
  return random()::map(0.0, 1.0, min, max);
}

/**
 * Selectively executes a function based on whether `object` is defined.
 *
 * @export
 * @template T,U
 * @param {T} subject The object to test.
 * @param {(T) => U} [whenDefined] The function to run when `subject` is defined.
 * @param {() => U} [whenUndefined] The function to run when `subject` is undefined.
 * @returns {U} The result of the function that executed.
 */
export function matchDefined(subject, whenDefined, whenUndefined) {
  if (typeof subject !== "undefined") return whenDefined(subject);
  return whenUndefined();
}