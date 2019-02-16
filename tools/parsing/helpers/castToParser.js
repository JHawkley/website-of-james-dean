import BadArgumentError from "lib/BadArgumentError";
import { str } from "../atomic/str";
import { regex } from "../atomic/regex";

/**
 * Tries to cast the given object to a compatible parser.  Assumes that a function is a parser.
 * 
 * @export
 * @param {*} obj The object to cast to a parser.
 * @returns {Parser} A parser for that object.
 * @throws When no parser could be determined to suit the `obj`.
 */
export const castToParser = (obj) => {
  if (typeof obj === "function") return obj;
  if (typeof obj === "string") return str(obj);
  if (obj instanceof RegExp) return regex(obj);
  throw new BadArgumentError("cannot locate a parser", "obj", obj);
};