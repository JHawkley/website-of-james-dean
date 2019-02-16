import BadArgumentError from "lib/BadArgumentError";
import { emptyResult } from "../core/emptyResult";
import { isUndefined } from "./isUndefined";

/**
 * Tries to determine a suitable "empty" value for an object.  Strings get empty-string, arrays an empty-array and
 * so on.  Defaults to `emptyResult` for pretty much anything else, except `undefined`, which will raise an error.
 * 
 * @export
 * @param {*} obj The object to find an empty value for.
 * @returns {*}
 * @throws When `obj` is `undefined`.
 */
export const emptyFor = (obj) => {
  if (isUndefined(obj))
    throw new BadArgumentError("cannot get an empty value for `undefined`", "obj", obj);

  if (typeof obj === "string")
    return "";

  if (Array.isArray(obj))
    return [];
    
  return emptyResult;
}