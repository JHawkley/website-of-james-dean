import * as iterEx from "tools/extensions/iterables";
import { dew } from "tools/common";
import { emptyResult } from "./core";
import { backtrack } from "./helpers";
import { skip } from "./modifiers";

/**
 * Creates a parser that will parse the exact, given string.
 *
 * @export
 * @param {string} pattern The string to parse.
 * @returns {Parser<string>}
 */
export const str = (pattern) => tag(pattern, (state) => {
  const { input, position } = state;
  if (!input.startsWith(pattern, position)) return void 0;
  state.position += pattern.length;
  return pattern;
});

/**
 * Creates a parser that will parse the exact, given string, but return an empty-result instead of the string.
 *
 * @export
 * @param {string} pattern The string to parse.
 * @returns {Parser<emptyResult>}
 */
str.skip = (pattern) => tag(pattern, (state) => {
  const { input, position } = state;
  if (!input.startsWith(pattern, position)) return void 0;
  state.position += pattern.length;
  return emptyResult;
});

/**
 * Creates a parser that will parse a string value using a regular-expression.
 * 
 * Global regular-expressions can jump through the input to find their match.  Non-global regular-expressions are
 * always matched as if they are sticky; they must begin their match at the current position or the match will
 * be considered a failure.
 *
 * @export
 * @param {RegExp|string} pattern The regular expression or a string to use as a pattern to create one.
 * @param {string} [flags] When `pattern` is a string, the flags to apply to the regular-expression.
 * @returns {Parser<RegExpExecArray>} A parser that will result in the execution result of the regular-expression.
 */
export const regex = (pattern, flags = "y") => {
  return typeof pattern === "string" ? normalizeString(pattern, flags) : normalizeRegex(pattern);
};

/**
 * Creates a parser that will parse a string value using a regular-expression, but returns an empty-result
 * when it matches.
 * 
 * Global regular-expressions can jump through the input to find their match.  Non-global regular-expressions are
 * always matched as if they are sticky; they must begin their match at the current position or the match will
 * be considered a failure.
 *
 * @export
 * @param {RegExp|string} pattern The regular expression or a string to use as a pattern to create one.
 * @param {string} [flags] When `pattern` is a string, the flags to apply to the regular-expression.
 * @returns {Parser<RegExpExecArray>} A parser that will result in the execution result of the regular-expression.
 */
regex.skip = (pattern, flags = "y") => {
  const parser = regex(parser, flags);
  return tag(parser.parserSource, skip(parser));
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

const normalRegex = (rgx) => tag(rgx, (state) => {
  const { input, position } = state;
  rgx.lastIndex = position;
  const result = rgx.exec(input);
  if (result == null) return void 0;
  state.position = rgx.lastIndex;
  return result;
});

const nonStickRegex = (rgx) => tag(rgx, (state) => {
  const { input, position } = state;
  rgx.lastIndex = position;
  const result = rgx.exec(input);
  if (result == null) return void 0;
  if (result.index !== position) return void 0;
  state.position = rgx.lastIndex;
  return result;
});

const tag = (pattern, parser) => {
  parser.parserSource = pattern;
  return backtrack.mark(parser);
};