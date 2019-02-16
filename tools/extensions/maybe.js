"use strict";
import BadBindingError from "lib/BadBindingError";
import { some, option, nothing } from "tools/maybe";

/**
 * Returns this value when the `condition` held true, otherwise returns `null`.
 *
 * @export
 * @template T
 * @param {?T} value This nullable value.
 * @param {boolean} condition The condition.
 * @returns {?T} This value if `condition` was true, otherwise `null`.
 */
export function when(condition) {
  return condition ? this : null;
}

/**
 * Determines if this value is empty, that is either `null` or `undefined`.
 *
 * @export
 * @template T
 * @this {?T} This nullable value.
 * @returns {boolean} Whether the value is empty.
 */
export function isEmpty() {
  return this == null;
}

/**
 * Determines if this value is defined.
 *
 * @export
 * @template T
 * @this {?T} This nullable value.
 * @returns {boolean} Whether the value is defined.
 */
export function isDefined() {
  return this != null;
}

/**
 * Asserts that this value is defined.
 *
 * @export
 * @template T
 * @this {?T} This nullable value.
 * @returns {!T} This value, which is definitely defined.
 * @throws When this value was empty.
 */
export function get() {
  if (this::isEmpty())
    throw new BadBindingError("cannot get a value; it was not defined", this);
  return this;
}

/**
 * Attempts to apply the given `transformationFn` to this value if it is defined and return the result, otherwise
 * it will return `ifEmpty`.
 *
 * @export
 * @template T,U
 * @this {?T} This nullable value.
 * @param {!U} ifEmpty The value to produce is this value is empty.
 * @param {function(!T): !U} transformationFn A function to apply if this value is defined.
 * @returns {!U} The transformed value or `null`.
 */
export function fold(ifEmpty, transformationFn) {
  return some(this::isDefined() ? transformationFn(this) : ifEmpty);
}

/**
 * Transforms this value, if it is defined.
 *
 * @export
 * @template T,U
 * @this {?T} This nullable value.
 * @param {function(!T): !U} transformationFn The transformation function.
 * @returns {?U} The transformed value or `null`.
 */
export function map(transformationFn) {
  return this::isDefined() ? some(transformationFn(this)) : null;
}

/**
 * Transforms this value, if it is defined.  If the `transformationFn` throws an exception, the result will
 * be `null`.
 *
 * @export
 * @template T,U
 * @this {?T} This nullable value.
 * @param {function(!T): !U} transformationFn The transformation function.
 * @returns {?U} The transformed value or `null`.
 */
export function tryMap(transformationFn) {
  if (this::isEmpty()) return nothing;
  try { return transformationFn(this) }
  catch { return nothing; }
}

/**
 * Will return `null` when this value is either empty of fails the predicate defined by the `filterFn`.
 *
 * @export
 * @template T
 * @this {?T} This nullable value.
 * @param {function(!T): boolean} filterFn The filter function.
 * @returns {?T} This value of `null`.
 */
export function filter(filterFn) {
  return this::isDefined() && filterFn(this) ? this : null;
}

/**
 * Determines if this value satisfies the predicate of the given `predicateFn`.  If it is empty, it will always fail.
 *
 * @export
 * @template T
 * @this {?T} This nullable value.
 * @param {function(!T): boolean} predicateFn The predicate function.
 * @returns {boolean} Whether the predicate was satisfied.
 */
export function every(predicateFn) {
  return this::isDefined() ? predicateFn(this) : false;
}

/**
 * Transforms this value, but will coerce `undefined` into `null`.
 *
 * @export
 * @template T,U
 * @this {?T} This nullable value.
 * @param {function(!T): ?U} partialFn The collection partial-function.
 * @returns {?U} The transformed value or `null`.
 */
export function collect(partialFn) {
  return this::isDefined() ? option(partialFn(this)) : null;
}

/**
 * Runs the given `iteratorFn` on this value if it is defined, otherwise does nothing.
 *
 * @export
 * @template T
 * @this {?T} This nullable value.
 * @param {function(!T): void} iteratorFn The iterator function.
 */
export function forEach(iteratorFn) {
  if (this::isDefined()) iteratorFn(this);
}