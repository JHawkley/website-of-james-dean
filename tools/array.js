import { extensions as maybe, nothing } from "./maybe";

// function makeArray
// function forZipped
// function forPair
// object extensions

const { floor, random: randomNum } = Math;

/**
 * Checks to see if this array is empty.
 *
 * @template T
 * @this {T[]} This array.
 * @returns {boolean} Whether this array is empty.
 */
function isEmpty() {
  return this.length === 0;
}

/**
 * Checks to see if this array contains at least one item.
 *
 * @template T
 * @this {T[]} This array.
 * @returns {boolean} Whether this array contains something.
 */
function isNonEmpty() {
  return this.length > 0;
}

/**
 * Returns this array if it has at least one item in it, otherwise it returns `null`.
 *
 * @template T
 * @this {?T[]} This array.
 * @returns {?T[]} Maybe this array.
 */
function orNothing() {
  if (this::maybe.isEmpty()) return nothing;
  if (this::isEmpty()) return nothing;
  return this;
}

/**
 * Shuffles this array.
 *
 * @template T
 * @this {T[]} This array.
 * @returns {T[]} This array, with its elements shuffled.
 */
function shuffle() {
  let currentIndex = this.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {

    // Pick a remaining element...
    randomIndex = floor(randomNum() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = this[currentIndex];
    this[currentIndex] = this[randomIndex];
    this[randomIndex] = temporaryValue;
  }

  return this;
}

/**
 * Selects a random element from this array.  Returns `undefined` if the array is empty.
 *
 * @template T
 * @this {T[]} This array.
 * @returns {T | undefined} A random element of this array.
 */
function randomElement() {
  const length = this.length;
  if (length === 0) return void 0;
  return this[floor(randomNum() * length)];
}

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
 * An object containing extension-methods.  Use the ESNext bind operator `::` to make use of these.
 * 
 * @export
 */
export const extensions = Object.freeze({
  isEmpty, isNonEmpty, orNothing, shuffle, randomElement
});