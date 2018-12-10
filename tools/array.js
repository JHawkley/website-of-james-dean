// Re-export extension methods.
export * as extensions from "tools/extensions/array";

/**
 * Creates an array with the specified count, calling the given function for each element and populating the element
 * with its return value.
 * 
 * @export
 * @template T
 * @param {number} count The number of elements to create.
 * @param {function(number): T} fn The initializer function.
 * @returns {T[]} An array.
 */
export const makeArray = (count, fn) => {
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
 * @param {function(T, U, number): void} fn
 */
export const forZipped = (a, b, fn) => {
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
 * @param {function(T, T): void} fn The function to apply for each pair.
 */
export const forPair = (arr, fn) => {
  const lim = arr.length - 1;
  for (let i = 0; i < lim; i++) fn(arr[i], arr[i + 1]);
}