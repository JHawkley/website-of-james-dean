import { dew } from "tools/common";
import * as iterEx from "tools/extensions/iterables";

/**
 * Creates a parser that will parse the exact, given string.
 *
 * @export
 * @param {string} pattern The string to parse.
 * @returns {Parser<string>}
 */
export const str = (pattern) => (state) => {
  const { input, position } = state;
  if (!input.startsWith(pattern, position)) return void 0;
  state.position += pattern.length;
  return pattern;
};

/**
 * Creates a parser that will parse using a regular-expression.  Global regular-expressions can jump through
 * the input to find their match.  Non-global regular-expressions are always matched as if they are sticky;
 * they must begin their match at the current position or the match will be considered a failure.
 *
 * @export
 * @param {RegExp|string} pattern The regular expression or a string to use as a pattern to create one.
 * @param {string} [flags] When `pattern` is a string, the flags to apply to the regular-expression.
 * @returns {Parser<RegExpExecArray>} A parser that will result in the execution result of the regular-expression.
 */
export const regex = (pattern, flags = "y") => {
  return typeof pattern === "string" ? normalizeString(pattern, flags) : normalizeRegex(pattern);
};

const stickySupported = dew(() => {
  try {
    const test = new RegExp(".", "y");
    if (test.sticky === true) return true;
    return false;
  }
  catch {
    return false;
  }
});

const normalizeString = (source, flags) => {
  const set = new Set(flags[Symbol.iterator]());
  const isGlobal = set.has("g");
  if (!stickySupported) {
    set.add("g");
    set.delete("y");
  }
  else if (!isGlobal) {
    set.add("y");
  }
  const modeFn = !stickySupported && !isGlobal ? nonStickRegex : normalRegex;
  return modeFn(new RegExp(source, set::iterEx.join("")));
};

const normalizeRegex = (rgx) => {
  if (rgx.global || rgx.sticky)
    return normalRegex(new RegExp(rgx));
  if (stickySupported)
    return normalRegex(new RegExp(rgx.source, rgx.flags + "y"));
  return nonStickRegex(new RegExp(rgx.source, rgx.flags + "g"));
};

const normalRegex = (rgx) => (state) => {
  const { input, position } = state;
  rgx.lastIndex = position;
  const result = rgx.exec(input);
  if (result == null) return void 0;
  state.position = rgx.lastIndex;
  return result;
};

const nonStickRegex = (rgx) => (state) => {
  const { input, position } = state;
  rgx.lastIndex = position;
  const result = rgx.exec(input);
  if (result == null) return void 0;
  if (result.index !== position) return void 0;
  state.position = rgx.lastIndex;
  return result;
};