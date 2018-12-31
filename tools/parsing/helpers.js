import { dew } from "tools/common";
import * as iterEx from "tools/extensions/iterables";
import { str, regex } from "./atomic";
import { emptyResult } from "./core";

/**
 * Determines if the value is `undefined`.
 *
 * @export
 * @param {*} v The value to test.
 * @returns {boolean}
 */
export const isUndefined = (v) => typeof v === "undefined";

/**
 * Determines if the value is valid parsing result; anything that is not `undefined`.
 *
 * @export
 * @param {*} v The value to test.
 * @returns {boolean}
 */
export const isResult = (v) => typeof v !== "undefined";

/**
 * Determines if the value is some kind of empty-value.
 *
 * @export
 * @param {*} v The value to test.
 * @returns {boolean}
 */
export const isEmpty = (v) => v === emptyResult;

/**
 * Creates a new parser by applying it sequentially to the given `parserModifiers` from left-to-right.
 * Use this to perform multiple transformations on a parser's result in a sequence.
 * 
 * @example
 * const joinSpaces = chain(str(" "), [takeWhile, join]);
 * console.log(run(joinSpaces, "    Four space indentation!"));
 * // Logs a string with four spaces, "    ".
 * 
 * @export
 * @param {Parser} parser The initial parser.
 * @param {ParserModifier[]} parserModifiers
 *   An array of functions that take a parser and produce a new parser.
 * @returns {Parser}
 */
export const chain = (parser, parserModifiers) => {
  return parserModifiers::iterEx.reduce(parser, (last, factory) => factory(last));
};

/**
 * Creates a new parser by applying it sequentially to the given `parserModifiers` from right-to-left.
 * Use this to perform multiple transformations on a parser's result in a sequence.
 * 
 * @example
 * const joinSpaces = pipe([join, takeWhile], str(" "));
 * console.log(run(joinSpaces, "    Four space indentation!"));
 * // Logs a string with four spaces, "    ".
 * 
 * @export
 * @param {ParserModifier[]} parserModifiers
 * @param {Parser} parser The initial parser.
 *   An array of functions that take a parser and produce a new parser.
 * @returns {Parser}
 */
export const pipe = (parserModifiers, parser) => {
  return chain(parser, parserModifiers::iterEx.reverse());
}

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
  throw new Error(`cannot locate a parser for ${obj}`);
};

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

/**
 * Decomposes a regular-expression into its source followed by the flags, ensuring that the "global" flag is set
 * and the "sticky" flag is unset.
 * 
 * @export
 * @param {RegExp} rgx The regular expression to base off of.
 * @returns {[string, string]} A tuple of the source and new flags for a new `RegExp`.
 */
export const globalizedRegExpData = (rgx) => {
  const set = new Set(rgx.flags[Symbol.iterator]());
  set.delete("y");
  set.add("g");
  return [rgx.source, set::iterEx.join("")];
}

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
  if (isUndefined(obj)) throw new Error("cannot get an empty value for `undefined`");
  if (typeof obj === "string") return "";
  if (Array.isArray(obj)) return [];
  return emptyResult;
}