// function dew
// function noop
// object extensions

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
 * Uses a function to filter and map a simple object's own-properties into a new object.  If the function
 * returns `undefined`, then that property will be dropped from the result.  A "simple object" is one that
 * has a prototype that is `Object.prototype` or `null`.
 *
 * @template T,U
 * @this {Object.<string, T>} The object to collect the properties from.
 * @param {function(string, T): U} fn The transformation function.
 * @returns {Object.<string, U>} A new object.
 * @throws When this object is not a simple object.
 */
function collectProps(fn) {
  'use strict'; // Allows binding to `null`.
  if (this == null) return null;
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
  
  if (this === null) return null;
  return Object.assign(newObjectBasedOn(this), this);
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
 * Represents a no-operation function.
 *
 * @export
 */
export function noop() { return; }

/** 
 * An object containing extension-methods.  Use the ESNext bind operator `::` to make use of these.
 * 
 * @export
 */
export const extensions = Object.freeze({
  forOwnProps, collectProps, copyOwn
});