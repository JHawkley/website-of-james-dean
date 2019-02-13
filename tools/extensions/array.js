import { dew } from "tools/common";
import { nothing } from "tools/maybe";
import { isEmpty as maybeIsEmpty } from "tools/extensions/maybe";

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
 * Gets the first element of this array or `undefined` if there is none.
 *
 * @export
 * @template T
 * @this {T[]} This array.
 * @returns {T | undefined} The first element of the array.
 */
export function head() {
  return this.length > 0 ? this[0] : void 0;
}

/**
 * Gets all the elements of this array except the first, or an empty-array if `length <= 1`.
 *
 * @export
 * @template T
 * @this {T[]} This array.
 * @returns {T[]} An array containing all the elements of this array except the first.
 */
export function tail() {
  if (this.length <= 1) return [];
  return this.slice(1);
}

/**
 * Gets all the elements of this array except the last, or an empty-array if `length <= 1`.
 *
 * @export
 * @template T
 * @this {T[]} This array.
 * @returns {T[]} An array containing all the elements of this array except the last.
 */
export function init() {
  if (this.length <= 1) return [];
  return this.slice(0, -1);
}

/**
 * Gets the last element of this array or `undefined` if there is none.
 *
 * @export
 * @template T
 * @this {T[]} This array.
 * @returns {T | undefined} The last element of the array.
 */
export function last() {
  const length = this.length;
  return length > 0 ? this[length - 1] : void 0;
}

/**
 * Performs a combination filter + map on each element of the array.  The `partialFn` should return `undefined`
 * for values that should be filtered out.  Any other value will be added to the result array.
 *
 * @export
 * @template T,U
 * @this {T[]} This array.
 * @param {PartialFunction<T, U>} partialFn The partial-function.
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
 * Finds the first element in the array that does not cause the given `partialFn` to return `undefined`.
 * If all elements return `undefined`, the result will be `undefined`.
 *
 * @export
 * @template T,U
 * @this {T[]} This array.
 * @param {PartialFunction<T, U>} partialFn The partial-function.
 * @returns {U | undefined} 
 */
export function collectFirst(partialFn) {
  const length = this.length;
  if (length === 0) return void 0;

  for (let i = 0; i < length; i++) {
    const collectedValue = partialFn(this[i], i, this);
    if (typeof collectedValue === "undefined") continue;
    return collectedValue;
  }
  return void 0;
}

/**
 * Filters the array to those values that did not pass the given `predicateFn`; the inverse of `filter`.
 *
 * @export
 * @template T
 * @this {T[]} This array.
 * @param {PredicateFunction<T>} predicateFn The predicate function.
 * @returns {T[]}
 */
export function reject(predicateFn) {
  return this.filter((v, i, arr) => !predicateFn(v, i, arr));
}

/**
 * Joins this string together by joining all but the last element with `initSeparator`, then joins the
 * last element with `lastSeparator`.  Always returns and empty-string if the array is empty.
 * 
 * @example
 * const problems = ["the following argument cannot be"];
 * if (!nullAllowed) problems.push("`null`");
 * if (!falseAllowed) problems.push("`false`");
 * if (!emptyStringAllowed) problems.push("empty-string");
 * problems.push("someArgument");
 * 
 * const problemList = problems::joinWith(", ", ": ");
 * // Logs: "the following argument cannot be `null`, `false`, empty-string: someArgument"
 * console.log(`Should we look for him at ${orList}?`);
 *
 * @export
 * @template T
 * @this {T[]} This array.
 * @returns {string}
 */
export function joinWith(initSeparator, lastSeparator) {
  switch (this.length) {
    case 0: return "";
    case 1: return this[0].toString();
    default: return [this::init().join(initSeparator), lastSeparator, this::last()].join("");
  }
}

/**
 * Joins this string together into a grammatically-correct list using "or".
 * 
 * @example
 * const orList = ["school", "the diner", "his home"]::joinWithOr();
 * // Logs: "Should we look for him at school, the diner, or his home?"
 * console.log(`Should we look for him at ${orList}?`);
 *
 * @export
 * @template T
 * @this {T[]} This array.
 * @returns {string}
 */
export function joinWithOr() {
  return this.length === 2 ? this.join(" or ") : this::joinWith(", ", ", or ");
}

/**
 * Joins this string together into a grammatically-correct list using "and".
 * 
 * @example
 * const andList = ["the school", "the diner", "his home"]::joinWithAnd();
 * // Logs: "We've looked for him at the school, the diner, and his home."
 * console.log(`We've looked for him at ${andList}.`);
 *
 * @export
 * @template T
 * @this {T[]} This array.
 * @returns {string}
 */
export function joinWithAnd() {
  return this.length === 2 ? this.join(" and ") : this::joinWith(", ", ", and ");
}

/**
 * Partitions this array into two arrays, based on the result of a predicate.  The returned value is a tuple,
 * where the first element contains an array of values where the predicate held true, and the second element
 * contains values where the predicate was false.
 *
 * @export
 * @template T
 * @this {T[]} This array.
 * @param {PredicateFunction<T>} predicateFn The predicate function.
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
 * @this {T[]} This array.
 * @param {SegregationFunction<T>} segregationFn The segregation function.
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

/**
 * Flattens this array by one level.
 *
 * @export
 * @template T
 * @this {Array<T|T[]>} This array.
 * @returns {Iterable<T>} An iterable that has been flattened one level.
 */
export function flatten() {
  return this::arrayFlattenBy(1);
}

/**
 * Flattens this array by some number of `levels`.
 *
 * @export
 * @this {Array} This array.
 * @param {number} [levels=1] The number of levels to flatten by.
 * @returns {Array} A copy of this array that has been flattened by some number of levels.
 */
export function flattenBy(levels = 1) {
  return this::arrayFlattenBy(levels);
}

const arrayFlattenBy = Array.prototype.flat ?? Array.prototype.flatten ?? dew(() => {
  return function flattenByImpl(levels) {
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
 * Performs a map on each element of the array, then flattens the result by one level.
 *
 * @export
 * @template T,U
 * @this {T[]} This array.
 * @param {FlatMapperFunction<T, U>} xformFn The transformation function.
 * @returns {U[]} A new array.
 */
export function flatMap(xformFn) {
  return this::arrayFlatMap(xformFn);
}

const arrayFlatMap = Array.prototype.flatMap ?? dew(() => {
  return function flatMapImpl(xformFn) {
    const result = [];
    for (let i = 0, len = this.length; i < len; i++) {
      const oldVal = this[i];
      const newVal = xformFn(oldVal, i, this);
      if (Array.isArray(newVal)) result.push(...newVal);
      else result.push(newVal);
    }
    return result;
  }
});

/**
 * @template T,U
 * @callback PartialFunction
 * @param {T} value The current value.
 * @param {number} index The current index into the array.
 * @param {T[]} arr The array being iterated.
 * @returns {U|void} A new value or `undefined` in the case the function could not be applied to the value.
 */

/**
 * @template T
 * @callback PredicateFunction
 * @param {T} value The current value.
 * @param {number} index The current index into the array.
 * @param {T[]} arr The array being iterated.
 * @returns {boolean} Whether the `value` passes the predicate.
 */

/**
 * @template T
 * @callback SegregationFunction
 * @param {T} previousValue The previous value.
 * @param {T} currentValue The current value.
 * @param {number} index The current index into the array.
 * @param {T[]} arr The array being iterated.
 * @returns {boolean} Whether the `currentValue` should belong to the same group as `previousValue`.
 */

/**
 * @template T,U
 * @callback FlatMapperFunction
 * @param {T} value The current value.
 * @param {number} index The current index.
 * @param {T[]} arr The array being iterated.
 * @return {U|U[]} The transformed value.
 */