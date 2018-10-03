/**
 * Executes the given function and returns its result.  Intended to emulate CoffeeScript's `do` keyword.
 *
 * @template T
 * @param {() => T} fn
 */
const dew = (fn) => fn();

/**
 * Creates an array with the specified count, calling the given function for each element and populating the element
 * with its return value.
 *
 * @template T
 * @param {Number} count The number of elements to create.
 * @param {(index: Number) => T} fn The initializer function.
 * @returns {T[]} An array.
 */
const makeArray = (count, fn) => {
  const arr = new Array(count);
  for (let i = 0; i < count; i++) arr[i] = fn(i);
  return arr;
};

/**
 * Matches each element of `a` to an element of `b`, passing the couple to a given function as arguments.
 *
 * @template T,U
 * @param {T[]} a The first array.
 * @param {U[]} b The second Array.
 * @param {(elA: T, elB: U) => void} fn
 */
const marry = (a, b, fn) => {
  const lim = Math.min(a.length, b.length);
  for (let i = 0; i < lim; i++) fn(a[i], b[i]);
};

const maybe = Object.freeze({
  nothing: Object.freeze([]),
  one: (value) => Object.freeze([value]),
  some: (...values) => Object.freeze(values)
});

export { dew, makeArray, marry, maybe };