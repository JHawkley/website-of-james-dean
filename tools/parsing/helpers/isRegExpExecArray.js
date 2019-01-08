/**
 * Determines whether the given object is most-likely a `RegExpExecArray`.
 * 
 * @export
 * @param {*} obj The object to test.
 * @returns {boolean}
 */
export const isRegExpExecArray = (obj) => {
  if (typeof obj.index !== "number") return false;
  if (typeof obj.input !== "string") return false;
  if (typeof obj[0] === "string") return true;
  return false;
}