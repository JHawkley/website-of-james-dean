import { dew } from "./common";


const maybe = dew(() => {
  const nothing = Object.freeze([]);
  const one = (value) => Object.freeze([value]);
  const some = (...values) => values.length > 0 ? Object.freeze(values) : nothing;

  const fn = (...values) => {
    if (values.length === 0)
      return nothing;
    if (values.length === 1)
      return values[0] != null ? Object.freeze(values) : nothing;
    return some(...values.filter(v => v != null));
  };

  return Object.freeze(Object.assign(fn, { nothing, one, some }));
});

/**
 * Produces the first value of an array, or else the `defaultValue`.  The `defaultValue` can be a function.
 *
 * @export
 * @template T
 * @param {Array<T>} this This maybe object.
 * @param {T | (() => T)} defaultValue The value to use in case `this` is empty.
 * @returns {T} The value.
 */
export function firstOrElse(defaultValue) {
  if (this.length > 0)
    return this[0];

  if (typeof defaultValue === "function")
    return defaultValue();
  return defaultValue;
}

/**
 * Transforms this array with a function.  Unlike `Array..map`, the result is an immutable array.
 *
 * @export
 * @template T,U
 * @param {Array<T>} this This array.
 * @param {T => U} xformFn The transformation function.
 * @returns {U} A new array, containing the results of the transformation.
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
 * @param {Array<U>} this The bound object, which should be an array.
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