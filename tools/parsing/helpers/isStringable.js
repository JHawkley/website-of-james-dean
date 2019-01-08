import { isEmpty } from "./isEmpty";
import { isRegExpExecArray } from "./isRegExpExecArray";

/**
 * Determines whether the given object can be converted into a string with `resultToString`.
 * 
 * @export
 * @param {*} obj The object to test.
 * @returns {boolean}
 */
export const isStringable = (obj) => {
  if (isEmpty(obj)) return true;
  if (typeof obj === "string") return true;
  if (isRegExpExecArray(obj)) return true;
  return false;
}