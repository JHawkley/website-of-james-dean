import { isEmpty } from "./isEmpty";
import { isRegExpExecArray } from "./isRegExpExecArray";

/**
 * Tries to cast the given object to a string.  Only matches `string` and `RegExpExecArray` types.
 * Returns `undefined` if it is not one of those types.
 * 
 * @export
 * @param {*} obj The object to cast try to cast.
 * @returns {string|undefined} The string or `undefined` if it couldn't be converted.
 */
export const resultToString = (obj) => {
  // Is it the empty-value?  We convert those to an empty value.
  if (isEmpty(obj)) return "";
  // Is it already a string?
  if (typeof obj === "string") return obj;
  // Is it a regular-expression `exec` match?
  if (isRegExpExecArray(obj)) return obj[0];
  return void 0;
}

/**
 * Tries to cast the given object to a string.  Only has special handling for `emptyResult` and the `RegExpExecArray`;
 * otherwise it will just return `obj.toString()`.
 * 
 * @param {*} obj The object to convert to a string.
 * @returns {string} The string representation of `obj`.
 */
resultToString.force = (obj) => {
  if (isEmpty(obj)) return "";
  if (isRegExpExecArray(obj)) return obj[0];
  return obj.toString();
}