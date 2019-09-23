import BadArgumentError from "lib/BadArgumentError";
import { dew } from "tools/common";

const isIterable = (obj) => typeof obj[Symbol.iterator] === "function";

export const CoercionMethods = {
  arrayLike(obj) {
    if (typeof this.length !== "number")
      throw new BadArgumentError(`cannot coerce to an iterable; a numeric \`length\` property is required`, "obj", obj);
    return dew(function* () {
      for (let i = 0, len = this.length; i <= len; i++) yield obj[i];
    });
  },
  countable(obj) {
    if (typeof this.count !== "number")
    throw new BadArgumentError(`cannot coerce to an iterable; a numeric \`count\` property is required`, "obj", obj);
    return dew(function* () {
      for (let i = 0, len = this.count; i <= len; i++) yield obj[i];
    });
  }
}

/**
 * Coerces this object into an iterable.
 *
 * @export
 * @param {function(*): IterableIterator} [coercionMethod=CoercionMethods.arrayLike]
 *   A function that will produce an iterable that supports this object.
 * @returns {IterableIterator} Yields this object's elements.
 * @throws When the `coercionMethod` fails to produce an iterable object.
 */
export function coerce(coercionMethod = CoercionMethods.arrayLike) {
  if (Array.isArray(this)) return this;
  if (isIterable(this)) return this;
  const result = coercionMethod(this);
  if (isIterable(result)) return result;
  throw new BadArgumentError("could not produce an iterable for the bound object", "coercionMethod", coercionMethod);
}

/**
 * Creates an iterable that will yield this iterable's content in reverse order.  Note that this is very inefficient
 * for iterables that are not arrays and cannot be used on iterables that will never terminate.
 *
 * @export
 * @template T
 * @this {Iterable<T>}
 * @returns {IterableIterator<T>} Yields this iterable's elements in reverse-order.
 */
export function* reverse() {
  if (Array.isArray(this))
    for (let i = this.length - 1; i >= 0; i--) yield this[i];
  else
    yield* [...this]::reverse();
}

/**
 * Iterates over this iterable, applying `iteratorFn` for each element yielded.
 *
 * @export
 * @template T
 * @this {Iterable<T>}
 * @param {function(T): void} iteratorFn The iterator function.
 */
export function forEach(iteratorFn) {
  if (Array.isArray(this))
    this.forEach(iteratorFn);
  else
    for (const value of this) iteratorFn(value);
}

/**
 * Transforms this iterable, applying `transformationFn` to each element yielded and yielding its result.
 *
 * @export
 * @template T, U
 * @this {Iterable<T>}
 * @param {function(T): U} transformationFn The transformation to apply to each element.
 * @returns {IterableIterator<U>} Yields the transformed elements of this iterable.
 */
export function* map(transformationFn) {
  if (Array.isArray(this))
    for (let i = 0, len = this.length; i < len; i++) yield transformationFn(this[i]);
  else
    for (const value of this) yield transformationFn(value);
}

/**
 * Filters elements of this iterable based on the given `predicateFn`.
 *
 * @export
 * @template T
 * @this {Iterable<T>}
 * @param {function(T): boolean} predicateFn The predicate to apply to each element.
 * @returns {IterableIterator<T>} Yields the elements of this iterable that passed `predicateFn`.
 */
export function* filter(predicateFn) {
  if (Array.isArray(this)) {
    for (let i = 0, len = this.length; i < len; i++) {
      const value = this[i];
      if (predicateFn(value))
        yield value;
    }
  }
  else {
    for (const value of this)
      if (predicateFn(value))
        yield value;
  }
}

/**
 * The inverse of `filter`; filters the iterable to those elements that did not pass the given `predicateFn`.
 *
 * @export
 * @template T
 * @this {Iterable<T>}
 * @param {function(T): boolean} predicateFn The predicate function.
 * @returns {T[]}
 */
export function reject(predicateFn) {
  return this::filter(v => !predicateFn(v))
}

/**
 * Reduces this iterable object.
 *
 * @export
 * @template T, U
 * @this {Iterable<T>}
 * @param {U} initialValue The initial value of the reduce.
 * @param {function(U, T, number, Iterable<T>): U} reducerFn The function that reduces the iterable.
 * @returns {U} The reduced value.
 */
export function reduce(initialValue, reducerFn) {
  if (Array.isArray(this))
    return this.reduce(reducerFn, initialValue);
  else {
    let value = initialValue;
    let count = 0;
    for (const thisValue of this) {
      value = reducerFn(value, thisValue, count, this);
      count += 1;
    }
    return value;
  }
}

/**
 * Reduces this iterable object while the `predicate` holds truthy.  When the `predicate` becomes falsy,
 * the reduced value will be returned.
 *
 * @export
 * @template T, U
 * @this {Iterable<T>}
 * @param {U} initialValue The initial value of the reduce.
 * @param {function(U, number): boolean} predicate The predicate function to test the reduced value against.
 * @param {function(U, T, number, Iterable<T>): U} fn The function that reduces the iterable.
 * @returns {U} The reduced value.
 */
export function reduceWhile(initialValue, predicate, fn) {
  let value = initialValue;
  let count = 0;
  for (const thisValue of this) {
    if (!predicate(value, count)) break;
    value = fn(value, thisValue, count, this);
    count += 1;
  }
  return value;
}

/**
 * Flattens this iterable by one level.
 *
 * @export
 * @template T
 * @this {Iterable<T|Iterable<T>>}
 * @returns {IterableIterator<T>} Yields this iterable's elements, flattened by one level.
 */
export function flatten() {
  return this::flattenBy(1);
}

/**
 * Flattens this iterable by some number of `levels`.
 *
 * @export
 * @this {Iterable}
 * @param {number} [levels=1] The number of levels to flatten by.
 * @returns {IterableIterator} Yields this iterable's elements, flattened by some number of levels.
 */
export function* flattenBy(levels = 1) {
  if (levels === 0) {
    yield* this;
    return;
  }

  for (const value of this) {
    if (isIterable(value)) yield* value::flattenBy(levels - 1);
    else yield value;
  }
}

/**
 * Computes the intersection of this iterable with the `other` iterable, yielding those elements that are
 * members of both.
 * 
 * Internally, the iterables are converted into sets (as needed), so any iterables that do not terminate
 * will cause this iterator to never terminate as well.  This could lead to excessive memory usage.
 * Use with care!
 * 
 * There are fast-paths in the case that one or both iterables are sets.
 * 
 * @export
 * @template T
 * @this {Iterable<T>}
 * @param {Iterable<T>} other The other iterable.
 * @returns {IterableIterator<T>} Yields only the elements shared by this iterable and the `other` iterable.
 */
export function* intersection(other) {
  const thisIsSet = this instanceof Set;
  const otherIsSet = other instanceof Set;
  switch (true) {
    case thisIsSet && otherIsSet:
      yield* intersection_SetSet(this, other);
      break;
    case thisIsSet && !otherIsSet:
      yield* intersection_SetElse(this, other);
      break;
    case !thisIsSet && otherIsSet:
      yield* intersection_SetElse(other, this);
      break;
    default:
      yield* intersection_SetElse(new Set(this), other);
      break;
  }
}

function* intersection_SetSet(set, other) {
  for (const value of other)
    if (set.has(value))
      yield value;
}

function* intersection_SetElse(set, other) {
  const foundSet = new Set();
  for (const value of other) {
    if (!foundSet.has(value) && set.has(value)){
      foundSet.add(value);
      yield value;
    }
  }
}

/**
 * Joins all the members of this iterator into a string.
 *
 * @export
 * @this {Iterable<string>}
 * @param {string} [separator=","] A string to use as a separator.
 * @returns {string}
 */
export function join(separator = ",") {
  if (Array.isArray(this)) return this.join(separator);
  return [...this].join(separator);
}