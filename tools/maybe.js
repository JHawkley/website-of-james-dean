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

export default maybe;