import { is } from "tools/common";
import BadBindingError from "lib/BadBindingError";

/**
 * Determines if this string is `null`, `undefined`, or the empty-string.
 * 
 * @export
 * @this {?string} This string.
 * @returns {boolean} Whether this string is `null`, `undefined`, or empty-string.
 */
export function isNullishOrEmpty() {
  "use strict"; // Allows binding to `null`.
  if (this == null) return true;
  if (this === "") return true;
  if (this::is.string()) return false;
  throw new BadBindingError(`expected a string`, this);
}

/**
 * Converts `null`, `undefined`, and the empty-string into `null`, but leaves any other string as-is.
 *
 * @export
 * @this {?string} This string.
 * @returns {?string}
 */
export function orNull() {
  "use strict"; // Allows binding to `null`.
  if (this == null) return null;
  if (this === "") return null;
  if (this::is.string()) return this;
  throw new BadBindingError(`expected a string`, this);
}