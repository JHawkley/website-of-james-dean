import BadBindingError from "lib/BadBindingError";
import BadArgumentError from "lib/BadArgumentError";
import isSimpleObject from "tools/extensions/common/isSimpleObject";
import * as is from "tools/extensions/common/is";
import { nil } from "tools/common";

export { is };

function newObjectBasedOn(original) {
  if (original::is.valueType())
    throw new BadArgumentError("must not be a value-type", "original", original);
  
  if (Object.getPrototypeOf(original) === null)
    return Object.create(null);

  return {};
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
  if (this === nil) return true;
  if (isSimpleObject(this)) return Object.keys(this).length === 0;
  return false;
}

/**
 * Iterates through each own-property of this object.
 *
 * @export
 * @template T
 * @this {Object.<string, T>} This object.
 * @param {function(T, string): void} fn A function applied to each property key-value-pair.
 * @throws When this object is a value-type.
 */
export function forOwnProps(fn) {
  "use strict"; // Allows binding to `null`.

  if (this == null)
    return;
  if (this::is.valueType())
    throw new BadBindingError("must not be a value-type", this);
  
  Object.keys(this).forEach(k => fn(this[k], k));
}

/**
 * Uses a function to filter an object's own-properties into a new object.  If the function returns `true`,
 * then that property will be added to the result object.
 *
 * @export
 * @template T,U
 * @this {Object.<string, T>} The object to collect the properties from.
 * @param {function(string, T): boolean} fn The filter function.
 * @returns {Object.<string, T>} A new object.
 * @throws When this object is a value-type.
 */
export function filterProps(fn) {
  "use strict"; // Allows binding to `null`.

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
 * Applies the given `partialFn` to each key-value-pair of the object's own-properties and returns a new
 * object whose keys correspond to the result of `partialFn`, except where it returned `undefined`. 
 *
 * @export
 * @template T,U
 * @this {Object.<string, T>} The object to collect the properties from.
 * @param {function(string, T): (U | void)} partialFn The partial-function.
 * @returns {Object.<string, U>} A new object.
 * @throws When this object is a value-type.
 */
export function collectProps(partialFn) {
  "use strict"; // Allows binding to `null`.

  if (this == null) return this;

  const result = newObjectBasedOn(this);

  Object.keys(this).forEach(k => {
    const val = partialFn(k, this[k]);
    if (typeof val === "undefined") return;
    result[k] = val;
  });

  return result;
}

/**
 * Applies the given `partialFn` to each key-value-pair of the object's own-properties and returns the first
 * result for which `partialFn` does not to return `undefined`.  If all key-value-pairs return `undefined`,
 * the result will be `undefined`.
 *
 * @export
 * @template T,U
 * @this {Object.<string, T>} The object to collect the properties from.
 * @param {function(string, T): (U | void)} partialFn The partial-function.
 * @returns {(U | void)}
 * @throws When this object is a value-type.
 */
export function collectFirstProp(partialFn) {
  "use strict"; // Allows binding to `null`.

  if (this == null)
    return void 0;
  if (this::is.valueType())
    throw new BadBindingError("must not be a value-type", this);

  for (const k of Object.keys(this)) {
    const val = partialFn(k, this[k]);
    if (typeof val !== "undefined") return val;
  }

  return void 0;
}

/**
 * Creates a shallow copy of this object's own-properties.
 *
 * @export
 * @template T
 * @this {T} The object to copy.
 * @returns {T} A shallow copy of the own-properties of the bound object.
 * @throws When this object is a value-type.
 */
export function copyOwn() {
  "use strict"; // Allows binding to `null`.

  if (this == null) return this;
  return Object.keys(this).reduce(
    (result, k) => (result[k] = this[k], result),
    newObjectBasedOn(this)
  );
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
 * @throws When this object is a value-type.
 */
export function verifyProps(obj) {
  if (this::is.valueType())
    throw new BadBindingError("must not be a value-type", this);
  if (Object.is(this, obj))
    return true;
  
  return Object.keys(obj).every(k => Object.is(this[k], obj[k]));
}