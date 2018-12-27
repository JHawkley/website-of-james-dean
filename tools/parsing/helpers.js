import { str, regex } from "./atomic";

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
 * Wraps the parser such that it will backtrack when it fails.  If the parser is already known
 * to backtrack, it will just return the same parser.
 * 
 * @export
 * @template T
 * @param {Parser<T>} parser The parser to wrap.
 * @returns {BacktrackingParser<T>} A parser that will backtrack.
 */
export const backtrack = (parser) => {
  if (parser._willBacktrackOnFailure === true) return parser;
  return backtrack.mark((state) => {
    const { position } = state;
    const result = parser(state);
    if (isResult(result)) return result;
    state.position = position;
    return void 0;
  });
}

/**
 * Marks the given parser as a backtracking-parser.
 * 
 * @template T
 * @param {Parser<T>} parser The parser to mark.
 * @returns {BacktrackingParser<T>} The same parser, marked as backtracking.
 */
backtrack.mark = (parser) => {
  parser._willBacktrackOnFailure = true;
  return parser;
};

/**
 * Tries to cast the given object to a compatible parser.  Assumes that a function is a parser.
 * 
 * @param {*} obj The object to cast to a parser.
 * @returns {Parser<*>} A parser for that object.
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
 * @param {*} obj The object to cast try to cast.
 * @returns {string|undefined} The string or `undefined` if it couldn't be converted.
 */
export const resultToString = (obj) => {
  // Is it `null`?  We convert those to an empty value.
  if (obj === null) return "";
  // Is it already a string?
  if (typeof obj === "string") return obj;
  // Is it a regular-expression `exec` match?
  if (isRegExpExecArray(obj)) return obj[0];
  return void 0;
}

/**
 * Tries to cast the given object to a string.  Only has special handling for `null` and the `RegExpExecArray`;
 * otherwise it will just return `obj.toString()`.
 * 
 * @param {*} obj The object to convert to a string.
 * @returns {string} The string representation of `obj`.
 */
resultToString.force = (obj) => {
  if (obj === null) return "";
  if (isRegExpExecArray(obj)) return obj[0];
  return obj.toString();
}

/**
 * Determines whether the given object can be converted into a string with `resultToString`.
 * 
 * @param {*} obj The object to test.
 * @returns {boolean}
 */
export const isStringable = (obj) => {
  if (obj === null) return true;
  if (typeof obj === "string") return true;
  if (isRegExpExecArray(obj)) return true;
  return false;
}

/**
 * Determines whether the given object is most-likely a `RegExpExecArray`.
 * 
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
 * so on.  Defaults to `null` for pretty much anything else, except `undefined`, which will raise an error.
 * 
 * @param {*} obj The object to find an empty value for.
 * @returns {*}
 * @throws When `obj` is `undefined`.
 */
export const emptyFor = (obj) => {
  if (isUndefined(obj)) throw new Error("cannot get an empty value for `undefined`");
  if (typeof obj === "string") return "";
  if (Array.isArray(obj)) return [];
  return null;
}