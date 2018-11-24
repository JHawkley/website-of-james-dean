"use strict";

/**
 * Returns this value when the `condition` held true, otherwise returns `null`.
 *
 * @template T
 * @param {?T} value This nullable value.
 * @param {boolean} condition The condition.
 * @returns {?T} This value if `condition` was true, otherwise `null`.
 */
function when(condition) {
  return condition ? this : null;
}

/**
 * Determines if this value is empty, that is either `null` or `undefined`.
 *
 * @template T
 * @this {?T} This nullable value.
 * @returns {boolean} Whether the value is empty.
 */
function isEmpty() {
  return this == null;
}

/**
 * Determines if this value is defined.
 *
 * @template T
 * @this {?T} This nullable value.
 * @returns {boolean} Whether the value is defined.
 */
function isDefined() {
  return this != null;
}

/**
 * Asserts that this value is defined.
 *
 * @template T
 * @this {?T} This nullable value.
 * @returns {!T} This value, which is definitely defined.
 * @throws When this value was empty.
 */
function get() {
  if (this::isEmpty())
    throw new Error("cannot get a maybe value; it was not defined");
  return this;
}

/**
 * Returns this value when it is defined, otherwise it will return `defaultValue`.
 *
 * @template T
 * @this {?T} This nullable value.
 * @param {!T} alternative The alternative value.
 * @returns {!T} Either this value or `alternative`.
 * @throws When `alternative` is nullish.
 */
function orElse(alternative) {
  return this ?? some(alternative);
}

/**
 * Returns this value when it is defined, otherwise it will call `alternativeFn` and return its result.
 *
 * @template T
 * @this {?T} This nullable value.
 * @param {() => !T} alternativeFn A function to call to get an alternative value.
 * @returns {!T} Either this value or the result of calling `alternativeFn`.
 * @throws When the result of calling `alternativeFn` is nullish.
 */
function orFrom(alternativeFn) {
  return this ?? some(alternativeFn());
}

/**
 * Attempts to apply the given `transformationFn` to this value if it is defined and return the result, otherwise
 * it will return `ifEmpty`.
 *
 * @template T,U
 * @this {?T} This nullable value.
 * @param {!U} ifEmpty The value to produce is this value is empty.
 * @param {(definedValue: !T) => !U} transformationFn A function to apply if this value is defined.
 * @returns {!U} The transformed value or `null`.
 */
function fold(ifEmpty, transformationFn) {
  return some(this::isDefined() ? transformationFn(this) : ifEmpty);
}

/**
 * Transforms this value, if it is defined.
 *
 * @template T,U
 * @this {?T} This nullable value.
 * @param {(definedValue: !T) => !U} transformationFn The transformation function.
 * @returns {?U} The transformed value or `null`.
 */
function map(transformationFn) {
  return this::isDefined() ? some(transformationFn(this)) : null;
}

/**
 * Will return `null` when this value is either empty of fails the predicate defined by the `filterFn`.
 *
 * @template T
 * @this {?T} This nullable value.
 * @param {(definedValue: !T) => boolean} filterFn The filter function.
 * @returns {?T} This value of `null`.
 */
function filter(filterFn) {
  return this::isDefined() && filterFn(this) ? this : null;
}

/**
 * Determines if this value satisfies the predicate of the given `predicateFn`.  If it is empty, it will always fail.
 *
 * @template T
 * @this {?T} This nullable value.
 * @param {(definedValue: !T) => boolean} predicateFn The predicate function.
 * @returns {boolean} Whether the predicate was satisfied.
 */
function every(predicateFn) {
  return this::isDefined() ? predicateFn(this) : false;
}

/**
 * Transforms this value, but will coerce `undefined` into `null`.
 *
 * @template T,U
 * @this {?T} This nullable value.
 * @param {(definedValue: !T) => ?U} partialFn The collection function.
 * @returns {?U} The transformed value or `null`.
 */
function collect(partialFn) {
  return this::isDefined() ? option(partialFn(this)) : null;
}

/**
 * Runs the given `iteratorFn` on this value if it is defined, otherwise does nothing.
 *
 * @template T
 * @this {?T} This nullable value.
 * @param {(definedValue: !T) => void} iteratorFn The iterator function.
 */
function forEach(iteratorFn) {
  if (this::isDefined()) iteratorFn(this);
}

/**
 * The empty value.
 * 
 * @type {null}
*/
export const nothing = null;

/**
 * Ensures a value is either a defined value or `null`.  This will convert `undefined` into `null`.
 *
 * @export
 * @template T
 * @param {?T} value The potentially-undefined, nullable value.
 * @returns {?T} Either `value` or `null`.
 */
export const option = (value) => typeof value !== "undefined" ? value : null;

/**
 * Asserts that the value is something, returning it if it is and otherwise throwing an error.
 *
 * @template T
 * @param {?T} value The value.
 * @returns {!T} The value, which is definitely something.
 * @throws When `value` is nullish.
 */
export const some = (value) => {
  if (value::extensions.isEmpty())
    throw new Error(`value cannot be \`some\` thing, since it was \`${value}\``);
  return value;
};

/** 
 * An object containing extension-methods.  Use the ESNext bind operator `::` to make use of these.
 * 
 * @export
 */
export const extensions = Object.freeze({
  when, isEmpty, isDefined, get, orElse, orFrom,
  fold, map, filter, every, collect, forEach
});