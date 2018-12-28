import { forOwnProps } from "tools/extensions/common";
import { fold, extensions as arrEx } from "tools/array";
import * as iterEx from "tools/extensions/iterables";
import { str, regex } from "./atomic";
import { any, rest, endOfInput } from "./parsers";
import { seq } from "./combinators";
import { takeUntil, map, asString } from "./modifiers";
import { isUndefined, isEmpty } from "./helpers";

const preservedEmpty = Symbol("template:preserved-empty");
const preserveResult = (result) => isEmpty(result) ? preservedEmpty : result;
const restoreResult = (result) => result === preservedEmpty ? null : result;
const finalizeResult = (result) => [...result::iterEx.reject(isEmpty)::iterEx.map(restoreResult)];
const emptyToVoid = (v) => v === "" ? void 0 : str.skip(v);
const mark = (p) => (p.preserveResult = true, p);
const wrap = (parser) => Object.assign((state) => parser(state), parser);

const prepareParser = (parser) => {
  if (parser == null) throw new Error("a placeholder in the template-literal contained `null` or `undefined`");
  // Ignore the interpolation placeholders.  We'll deal with them later.
  if (parser === interpolate) return parser;
  if (parser instanceof AppliedInterpolation) return parser;
  // Wrap functional parsers so we can attach our marker to it safely.
  if (typeof parser === "function") return mark(wrap(parser));
  // Otherwise, build the standard parsers.
  if (typeof obj === "string") return mark(str(parser));
  if (parser instanceof RegExp) return mark(regex(parser));
  throw new Error(`no parser could be located for \`${parser}\` in the template-literal`);
};

const processParser = (cur, last) => {
  if (cur.preserveResult) return map(cur, preserveResult);

  if (last) switch (true) {
    case cur === interpolate: return takeUntil.string(any, last);
    case cur instanceof AppliedInterpolation: return takeUntil(cur.parser, last);
  }

  switch (true) {
    case cur === interpolate: return asString(rest);
    case cur instanceof AppliedInterpolation: return takeUntil(cur.parser, endOfInput);
    default: return cur;
  }
}

/**
 * Creates a parser from a string template literal, when used as a tag.  Each placeholder will produce a result in
 * an output array, transforming an empty-result into `null`.
 * 
 * Strings and regular-expressions provided directly in the placeholders will be automatically converted to an
 * appropriate parser.  Use `interpolate` to indicate that you want to match between the previous string-fragment
 * and the next.
 * 
 * @export
 * @template T
 * @param {string[]} strings The string-fragments between placeholders.
 * @param {string|RegExp|Parser<T>} parsers The parsers to use to extract values.
 * @returns {Parser<T[]>} A parser constructed from a string template literal.
 */
export const parser = (strings, ...parsers) => {
  const combined = fold(
    strings.map(emptyToVoid),
    parsers.map(prepareParser)
  )::arrEx.reject(isUndefined);

  let last = null;
  for (let i = combined.length - 1; i >= 0; i--)
    last = combined[i] = processParser(combined[i], last);
  return map(seq(...combined), finalizeResult);
};

/**
 * When used in a placeholder of a template-literal tagged with `parse`, it will convert to a parser that will
 * parse any character until the immediate next string-fragment or parser matches.  If `interpolate` is applied
 * with a parser, then it will repeatedly apply the parser and accumulate the results into an array until the
 * given parser matches.
 * 
 * It is not necessary to call this function when using it in a placeholder.
 * 
 * @export
 * @param {Parser<T>} [parser] The parser to use during interpolation.
 * @returns {AppliedInterpolation} A class storing the parser and identifying it as an interpolation.
 */
export const interpolate = (parser) => {
  if (isUndefined(parser)) return interpolate;
  return new AppliedInterpolation(parser);
}

class AppliedInterpolation {
  constructor(parser) { this.parser = parser; Object.lock(this); }
}