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

/**
 * Folds two arrays into each other.  An element of `a` will follow an element of `b`, ending when no more
 * elements can follow according to the pattern.
 * 
 * @export
 * @template T
 * @param {T[]} a The array that will begin the pattern.
 * @param {T[]} b The array whose elements will follow each `a` element.
 * @returns {T[]}
 */
export const fold = (a, b) => {
  const result = [];
  let curArr = a;
  let i = 0;
  while (i < curArr.length) {
    result.push(curArr[i]);
    curArr = curArr === a ? b : (i += 1, a);
  }
  return result;
}

/**
 * Determines if the two arrays have identical contents.  This is a shallow check, using `Object.is`.
 *
 * @param {Array} a The first array.
 * @param {Array} b The second array.
 * @returns {boolean} Whether the two arrays are identical.
 */
export const identical = (a, b) => {
  if (Object.is(a, b)) return true;
  if (a.length !== b.length) return false;
  for (let i = 0, len = a.length; i < len; i++)
    if (!Object.is(a[i], b[i]))
      return false;
  return true;
}