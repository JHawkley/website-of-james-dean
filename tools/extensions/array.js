import { dew } from "tools/common";
import { nothing } from "tools/maybe";
import { isEmpty as maybeIsEmpty } from "tools/extensions/maybe";
import { flattenBy as iterFlattenBy } from "tools/extensions/iterables";

const { floor, random: randomNum } = Math;

// Some functions that apply to iterables are good to have for arrays too.
export { reduceWhile } from "tools/extensions/iterables";

/**
 * Checks to see if this array is empty.
 *
 * @export
 * @template T
 * @this {T[]} This array.
 * @returns {boolean} Whether this array is empty.
 */
export function isEmpty() {
  return this.length === 0;
}

/**
 * Checks to see if this array contains at least one item.
 *
 * @export
 * @template T
 * @this {T[]} This array.
 * @returns {boolean} Whether this array contains something.
 */
export function isNonEmpty() {
  return this.length > 0;
}

/**
 * Returns this array if it has at least one item in it, otherwise it returns `null`.
 *
 * @export
 * @template T
 * @this {?T[]} This array.
 * @returns {?T[]} Maybe this array.
 */
export function orNothing() {
  if (this::maybeIsEmpty()) return nothing;
  if (this::isEmpty()) return nothing;
  return this;
}

/**
 * Shuffles this array.
 *
 * @export
 * @template T
 * @this {T[]} This array.
 * @returns {T[]} This array, with its elements shuffled.
 */
export function shuffle() {
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
 * @export
 * @template T
 * @this {T[]} This array.
 * @returns {T | undefined} A random element of this array.
 */
export function randomElement() {
  const length = this.length;
  if (length === 0) return void 0;
  return this[floor(randomNum() * length)];
}

/**
 * Performs a combination filter + map on each element of the array.  The `collectFn` should return `undefined`
 * for values that should be filtered out.  Any other value will be added to the result array.
 *
 * @export
 * @template T,U
 * @this {T[]} This array.
 * @param {function(T, number, T[]): (U|undefined)} partialFn The collection partial-function.
 * @returns {U[]} A new array.
 */
export function collect(partialFn) {
  const length = this.length;
  if (length === 0) return [];

  const resultArray = [];
  for (let i = 0; i < length; i++) {
    const collectedValue = partialFn(this[i], i, this);
    if (typeof collectedValue === "undefined") continue;
    resultArray.push(collectedValue);
  }
  return resultArray;
}

/**
 * Partitions this array into two arrays, based on the result of a predicate.  The returned value is a tuple,
 * where the first element contains an array of values where the predicate held true, and the second element
 * contains values where the predicate was false.
 *
 * @export
 * @template T
 * @this {T[]} This array.
 * @param {function(T, number, T[]): boolean} predicateFn The predicate function.
 * @returns {[T[], T[]]} A tuple; element 1 has values that held true, while element 2 all held false.
 */
export function partition(predicateFn) {
  const length = this.length;
  const whenTrue = [];
  const whenFalse = [];
  if (length === 0) return [whenTrue, whenFalse];

  for (let i = 0; i < length; i++) {
    const value = this[i];
    const resultArr = predicateFn(value, i, this) ? whenTrue : whenFalse;
    resultArr.push(value);
  }

  return [whenTrue, whenFalse];
}

/**
 * Creates an array of arrays based on a segregation function.  When the segregation function returns `true`,
 * the value will be added to the current group.  It it returns false, the value will create a new group, to which
 * it will be added.
 *
 * @export
 * @template T
 * @param {function(T, T, number, T[]): boolean} segregationFn The segregation function.
 * @returns {T[][]} An array of all the groupings created by the segregation function.
 */
export function segregate(segregationFn) {
  const length = this.length;
  const result = [];
  if (length === 0) return result;

  let prevValue = this[0];
  let currentGroup = [prevValue];

  for (let i = 1; i < length; i++) {
    const value = this[i];
    const belongsWithPrevious = segregationFn(prevValue, value, i, this);
    if (belongsWithPrevious) currentGroup.push(value);
    else {
      result.push(currentGroup);
      currentGroup = [value];
    }
    prevValue = value;
  }

  if (currentGroup.length > 0)
    result.push(currentGroup);

  return result;
}

const arrayFlattenBy = Array.prototype.flat ?? dew(() => {
  return function flattenBy(levels) {
    if (levels <= 0) return this;
    return flattenBy_recursive(this, [], levels);
  }

  function flattenBy_recursive(arr, result, levels) {
    if (levels < 0) result.push(arr);
    else {
      for (let i = 0, len = arr.length; i < len; i++) {
        const value = arr[i];
        if (Array.isArray(value)) flattenBy_recursive(value, result, levels - 1);
        else result.push(value);
      }
    }
    return result;
  }
});

/**
 * Flattens this array by one level.
 *
 * @export
 * @template T
 * @this {Array<T|T[]>}
 * @returns {Iterable<T>} An iterable that has been flattened one level.
 */
export function flatten() { return this::arrayFlattenBy(1); }

/**
 * Flattens this array by some number of `levels`.
 *
 * @export
 * @this {Array<*>}
 * @param {number} [levels=1] The number of levels to flatten by.
 * @returns {Array<*>} A copy of this array that has been flattened by some number of levels.
 */
export function flattenBy(levels = 1) { return this::arrayFlattenBy(levels); }