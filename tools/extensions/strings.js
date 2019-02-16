import BadBindingError from "lib/BadBindingError";

/**
 * Determines if this string is `null` or the empty-string.
 * 
 * @export
 * @this {string} This string.
 * @returns {boolean} Whether this string is `null` or empty-string.
 */
export function isNullishOrEmpty() {
  'use strict'; // Allows binding to `null`.

  if (this == null) return true;
  if (this === "") return true;
  if (typeof this !== "string")
    throw new BadBindingError(`expected a string`, this);
  return false;
}