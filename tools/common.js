function newObjectBasedOn(original) {
  const proto = Object.getPrototypeOf(original);
  if (proto == null) return Object.create(null);
  if (proto === Object.prototype) return {};
  throw new Error(`cannot base a new object on \`${original}\`; it is not a simple object`);
}

/**
 * Iterates through each own-property of this object.
 *
 * @template T
 * @this {Object.<string, T>} This object.
 * @param {function(T, string): void} fn A function applied to each property key-value-pair.
 */
function forOwnProps(fn) {
  'use strict'; // Allows binding to `null`.
  if (this == null) return;
  Object.keys(this).forEach(k => fn(this[k], k));
}

/**
 * Uses a function to filter a simple object's own-properties into a new object.  If the function returns
 * `true`, that property will be added to the result object.  A "simple object" is one that has a prototype
 * that is `Object.prototype` or `null`.
 *
 * @template T,U
 * @this {Object.<string, T>} The object to collect the properties from.
 * @param {function(string, T): boolean} fn The filter function.
 * @returns {Object.<string, T>} A new object.
 * @throws When this object is not a simple object.
 */
function filterProps(fn) {
  'use strict'; // Allows binding to `null`.
  if (this == null) return this;
  const result = newObjectBasedOn(this);
  Object.keys(this).forEach(k => {
    const val = this[k];
    if (fn(k, val) !== true) return;
    result[k] = val;
  });
  return result;
}

/**
 * Uses a function to filter and map a simple object's own-properties into a new object.  If the function
 * returns `undefined`, then that property will be dropped from the result.  A "simple object" is one that
 * has a prototype that is `Object.prototype` or `null`.
 *
 * @template T,U
 * @this {Object.<string, T>} The object to collect the properties from.
 * @param {function(string, T): (U|undefined)} fn The collector function.
 * @returns {Object.<string, U>} A new object.
 * @throws When this object is not a simple object.
 */
function collectProps(fn) {
  'use strict'; // Allows binding to `null`.
  if (this == null) return this;
  const result = newObjectBasedOn(this);
  Object.keys(this).forEach(k => {
    const val = fn(k, this[k]);
    if (typeof val === "undefined") return;
    result[k] = val;
  });
  return result;
}

/**
 * Creates a shallow copy of this simple object, where a "simple object" is one that has a prototype that is
 * `Object.prototype` or `null`.  If the value does not qualify as a simple object, an error is thrown.
 *
 * @template T
 * @this {T} The object to copy.
 * @returns {T} A shallow copy of the own-properties of the bound object.
 * @throws When this object is not an object.
 * @throws When this object is not a simple object.
 */
function copyOwn() {
  'use strict'; // Allows binding to `null`.
  if (typeof this !== "object")
    throw new Error("the bound value must be an object reference");
  
  if (this == null) return this;
  return Object.assign(newObjectBasedOn(this), this);
}

/**
 * Compares the own-properties of two objects.
 *
 * @export
 * @param {!Object} left The first object.
 * @param {!Object} right The second object.
 * @returns {boolean} Whether the objects have equivalent own-properties.
 * @throws When any argument provided is not an object.
 * @throws When any argument provided was `null`.
 */
export function compareOwnProps(left, right) {
  if (left === null || typeof left !== "object")
    throw new Error("the `left` value must be an object reference");
  if (right === null || typeof right !== "object")
    throw new Error("the `right` value must be an object reference");
  if (left === right) return true;

  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys)
    if (left[key] !== right[key])
      return false;
  return true;
}

/**
 * Executes the given function and returns its result.  A helper for immediately-invoked function expressions.
 * 
 * @export
 * @template T
 * @param {function(): T} fn The function to immediately invoke.
 * @returns {T} The result of the function.
 */
export function dew(fn) {
  return fn();
}

/**
 * Executes the given function and returns its result.  If the function throws an exception, `undefined`
 * will be returned instead.
 *
 * @export
 * @template T,U
 * @param {function(...U): T} fn The function that may throw an exception.
 * @param {...U} args The arguments to provide to the function.
 * @returns {T|undefined} The result of `fn` or `undefined`.
 */
export function tryDew(fn, ...args) {
  try { return args.length === 0 ? fn() : fn(...args); }
  catch { return void 0; }
}

/**
 * Represents a no-operation function.
 *
 * @export
 */
export function noop() { return; }

/**
 * Represents the identity function.
 *
 * @export
 * @template T
 * @param {T} v Some value.
 * @returns {T} The same value as `v`.
 */
export function identityFn(v) { return v; }

/** 
 * An object containing extension-methods.  Use the ESNext bind operator `::` to make use of these.
 * 
 * @export
 */
export const extensions = Object.freeze({
  forOwnProps, filterProps, collectProps, copyOwn
});