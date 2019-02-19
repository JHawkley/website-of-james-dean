import BadBindingError from "lib/BadBindingError";
import BadArgumentError from "lib/BadArgumentError";

function newObjectBasedOn(original) {
  switch (Object.getPrototypeOf(original)) {
    case Object.prototype: return {};
    case null: return Object.create(null);
    default: throw new BadArgumentError("must be a simple object", "original", original);
  }
}

/**
 * Determines if this is an empty simple object.  A "simple object" is one that has a prototype that
 * is `Object.prototype` or `null`.
 *
 * @export
 * @template T
 * @this {Object.<string, T>} This object.
 * @returns {boolean}
 */
export function isEmpty() {
  switch (Object.getPrototypeOf(this)) {
    case Object.prototype:
    case null:
      return Object.keys(this).length === 0;
    default:
      return false;
  }
}

/**
 * Iterates through each own-property of this object.
 *
 * @export
 * @template T
 * @this {Object.<string, T>} This object.
 * @param {function(T, string): void} fn A function applied to each property key-value-pair.
 */
export function forOwnProps(fn) {
  'use strict'; // Allows binding to `null`.
  if (this == null) return;
  Object.keys(this).forEach(k => fn(this[k], k));
}

/**
 * Uses a function to filter a simple object's own-properties into a new object.  If the function returns
 * `true`, that property will be added to the result object.  A "simple object" is one that has a prototype
 * that is `Object.prototype` or `null`.
 *
 * @export
 * @template T,U
 * @this {Object.<string, T>} The object to collect the properties from.
 * @param {function(string, T): boolean} fn The filter function.
 * @returns {Object.<string, T>} A new object.
 * @throws When this object is not a simple object.
 */
export function filterProps(fn) {
  'use strict'; // Allows binding to `null`.
  if (this == null) return this;
  const result = newObjectBasedOn(this);
  Object.keys(this).forEach(k => {
    const val = this[k];
    if (fn(k, val) !== true) return;
    result[k] = val;
  });
  return result;
}

/**
 * Uses a function to filter and map a simple object's own-properties into a new object.  If the function
 * returns `undefined`, then that property will be dropped from the result.  A "simple object" is one that
 * has a prototype that is `Object.prototype` or `null`.
 *
 * @export
 * @template T,U
 * @this {Object.<string, T>} The object to collect the properties from.
 * @param {function(string, T): (U|undefined)} fn The collector function.
 * @returns {Object.<string, U>} A new object.
 * @throws When this object is not a simple object.
 */
export function collectProps(fn) {
  'use strict'; // Allows binding to `null`.
  if (this == null) return this;
  const result = newObjectBasedOn(this);
  Object.keys(this).forEach(k => {
    const val = fn(k, this[k]);
    if (typeof val === "undefined") return;
    result[k] = val;
  });
  return result;
}

/**
 * Creates a shallow copy of this simple object, where a "simple object" is one that has a prototype that is
 * `Object.prototype` or `null`.  If the value does not qualify as a simple object, an error is thrown.
 *
 * @export
 * @template T
 * @this {T} The object to copy.
 * @returns {T} A shallow copy of the own-properties of the bound object.
 * @throws When this object is not an object.
 * @throws When this object is not a simple object.
 */
export function copyOwn() {
  'use strict'; // Allows binding to `null`.
  if (typeof this !== "object")
    throw new BadBindingError("must be an object reference", this);
  
  if (this == null) return this;
  return Object.assign(newObjectBasedOn(this), this);
}

/**
 * Creates and fills an array with `count` references of this object.
 *
 * @export
 * @template T
 * @this {T} The object to fill an array with.
 * @param {number} count The number of elements of the array.
 * @returns {T[]} An array.
 */
export function times(count) {
  const arr = new Array(count);
  for (let i = 0; i < count; i++) arr[i] = this;
  return arr;
}

/**
 * Transforms this value into something else.
 *
 * @export
 * @template T,U
 * @this {T} The object to be transformed.
 * @param {function(T): U} transformationFn The transformation function.
 * @returns {U} The result of the transformation.
 */
export function map(transformationFn) {
  "use strict";
  return transformationFn(this);
}

/**
 * Verifies that the own-properties of `obj` have a match in this object.  A match is determined via `Object.is`.
 *
 * @export
 * @this {Object} The object to match `obj` to.
 * @param {Object} obj The object whose own-properties to match.
 * @returns {boolean}
 */
export function verifyProps(obj) {
  if (Object.is(this, obj)) return true;
  return Object.keys(obj).every(k => Object.is(this[k], obj[k]));
}

/**
 * Contains several extension methods for matching based on type.
*/
export const is = {
  string() { "use strict"; return typeof this === "string"; },
  array() { "use strict"; return Array.isArray(this); },
  number() { "use strict"; return typeof this === "number"; },
  func() { "use strict"; return typeof this === "function"; },
  symbol() { "use strict"; return typeof this === "symbol"; },
  boolean() { "use strict"; return typeof this === "boolean"; },
  defined() { "use strict"; return this != null; },
  undefined() { "use strict"; return typeof this === "undefined"; },
  null() { "use strict"; return this === null; },
  finite() { "use strict"; return Number.isFinite(this); },
  NaN() { "use strict"; return typeof this !== "number" || Number.isNaN(this); },
  object() { "use strict"; return this != null && typeof this === "object"; },
  error() { "use strict"; return this instanceof Error },
  instanceOf(klass) { "use strict"; return this instanceof klass; },
  that(other) { "use strict"; return Object.is(this, other); }
};