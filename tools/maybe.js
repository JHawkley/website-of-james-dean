import BadArgumentError from "lib/BadArgumentError";
import { isEmpty } from "tools/extensions/maybe";

// Re-export extension methods.
export * as extensions from "tools/extensions/maybe";

/**
 * The empty value.
 * 
 * @export
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
 * @export
 * @template T
 * @param {?T} value The value.
 * @returns {!T} The value, which is definitely something.
 * @throws When `value` is nullish.
 */
export const some = (value) => {
  if (value::isEmpty())
    throw new BadArgumentError("was `null` or `undefined`", "value", value);
  return value;
};