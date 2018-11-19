import { dew } from "./common";


const maybe = dew(() => {
  const nothing = Object.freeze([]);
  const one = (value) => Object.freeze([value]);
  const some = (...values) => values.length > 0 ? Object.freeze(values) : nothing;
  const from = (array) => array.length > 0 ? Object.freeze(array) : nothing;

  const fn = (...values) => {
    if (values.length === 0)
      return nothing;
    if (values.length === 1)
      return values[0] != null ? Object.freeze(values) : nothing;
    return some(...values.filter(v => v != null));
  };

  return Object.freeze(Object.assign(fn, { nothing, one, some, from }));
});

/**
 * Determines if this array is empty.
 *
 * @export
 * @template T
 * @this {Array<T>} This array.
 * @returns {boolean} Whether this array is empty.
 */
export function isEmpty() {
  return this === maybe.nothing || (Array.isArray(this) && this.length === 0);
}

/**
 * Determines if this array has at least one item in it.
 *
 * @export
 * @template T
 * @this {Array<T>} This array.
 * @returns {boolean} Whether this array has at least one item in it.
 */
export function isNotEmpty() {
  return Array.isArray(this) && this.length > 0;
}

/**
 * Produces the first value of an array, or else the `defaultValue`.  The `defaultValue` can be a function.
 *
 * @export
 * @template T
 * @this {Array<T>} This maybe object.
 * @param {T | (() => T)} defaultValue The value to use in case `this` is empty.
 * @returns {T} The value.
 */
export function firstOrElse(defaultValue) {
  if (this.length > 0) return this[0];
  if (typeof defaultValue === "function") return defaultValue();
  return defaultValue;
}

/**
 * Results in this array if it is not empty, otherwise it will produce a new maybe object from the given values
 * and return it instead.
 *
 * @export
 * @template T
 * @this {Array<T>} This maybe object.
 * @param {Array<T>} defaultValues The values to provide in case this array is empty.
 * @returns {ReadonlyArray<T>} A maybe object that contains the `defaultValues`.
 */
export function orElse(...defaultValues) {
  if (this.length > 0) return this;
  return maybe.from(defaultValues);
}

/**
 * Results in this array if it is not empty, otherwise it will produce a new maybe object from the values returned
 * from the given function.
 *
 * @export
 * @template T
 * @this {Array<T>} This maybe object.
 * @param {() => Array<T>} defaultValuesFn A function that produces an array of default values.
 * @returns {ReadonlyArray<T>} A maybe object that contains the results of calling `defaultValuesFn`.
 */
export function orElseFrom(defaultValuesFn) {
  if (this.length > 0) return this;
  return maybe.from(defaultValuesFn());
}

/**
 * Transforms this array with a function.  Unlike `Array..map`, the result is an immutable array.
 *
 * @export
 * @template T,U
 * @this {Array<T>} This array.
 * @param {(value: T) => U} xformFn The transformation function.
 * @returns {Array<U>} A new array, containing the results of the transformation.
 */
export function map(xformFn) {
  return this.length > 0 ? Object.freeze(this.map(xformFn)) : maybe.nothing;
}

/**
 * A helper for simple pattern-matching.  If `expr` evaluates to an array, it will be applied to `xformFn`.
 * If the result of that application is a non-empty array, it will be the result of the match.  This function
 * can be chained with the bind-operator `::`, and the bound object will be returned if it is not an empty-array.
 *
 * @export
 * @template T,U
 * @this {Array<U>} The bound object, which should be an array.
 * @param {Array<T>} expr An `Array` with at least one element; otherwise the match fails.
 * @param {(option: Array<T>) => Array<U>} xformFn A function to call in the case of a match; should return a `maybe`.
 * @returns {Array<U>} May be an object that was matched.
 */
export function match(expr, xformFn) {
  'use strict';
  if (Array.isArray(this) && this.length > 0) return this;
  if (Array.isArray(expr) && expr.length > 0) return xformFn(expr) ?? maybe.nothing;
  return maybe.nothing;
}

export default maybe;