function newObjectBasedOn(original) {
  const proto = Object.getPrototypeOf(original);
  if (proto == null) return Object.create(null);
  if (proto === Object.prototype) return {};
  throw new Error(`cannot base a new object on \`${original}\`; it is not a simple object`);
}

/**
 * Iterates through each own-property of this object.
 *
 * @export
 * @template T
 * @this {Object.<string, T>} This object.
 * @param {function(T, string): void} fn A function applied to each property key-value-pair.
 */
export function forOwnProps(fn) {
  'use strict'; // Allows binding to `null`.
  if (this == null) return;
  Object.keys(this).forEach(k => fn(this[k], k));
}

/**
 * Uses a function to filter a simple object's own-properties into a new object.  If the function returns
 * `true`, that property will be added to the result object.  A "simple object" is one that has a prototype
 * that is `Object.prototype` or `null`.
 *
 * @export
 * @template T,U
 * @this {Object.<string, T>} The object to collect the properties from.
 * @param {function(string, T): boolean} fn The filter function.
 * @returns {Object.<string, T>} A new object.
 * @throws When this object is not a simple object.
 */
export function filterProps(fn) {
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
 * @export
 * @template T,U
 * @this {Object.<string, T>} The object to collect the properties from.
 * @param {function(string, T): (U|undefined)} fn The collector function.
 * @returns {Object.<string, U>} A new object.
 * @throws When this object is not a simple object.
 */
export function collectProps(fn) {
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
 * @export
 * @template T
 * @this {T} The object to copy.
 * @returns {T} A shallow copy of the own-properties of the bound object.
 * @throws When this object is not an object.
 * @throws When this object is not a simple object.
 */
export function copyOwn() {
  'use strict'; // Allows binding to `null`.
  if (typeof this !== "object")
    throw new Error("the bound value must be an object reference");
  
  if (this == null) return this;
  return Object.assign(newObjectBasedOn(this), this);
}

/**
 * Contains several extension methods for matching based on type.
*/
export const is = {
  string() { "use strict"; return typeof this === "string"; },
  array() { "use strict"; return Array.isArray(this); },
  number() { "use strict"; return typeof this === "number"; },
  function() { "use strict"; return typeof this === "function"; },
  symbol() { "use strict"; return typeof this === "symbol"; },
  boolean() { "use strict"; return typeof this === "boolean"; },
  undefined() { "use strict"; return typeof this === "undefined"; },
  null() { "use strict"; return this === null; },
  object() { "use strict"; return typeof this === "object" && this !== null; },
  instanceOf(klass) { "use strict"; return this instanceof klass; }
};