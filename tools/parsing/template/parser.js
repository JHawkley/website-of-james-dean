import { fold, extensions as arrEx } from "tools/array";
import * as iterEx from "tools/extensions/iterables";
import { any } from "../parsers/any";
import { rest } from "../parsers/rest";
import { endOfInput } from "../parsers/endOfInput";
import { str } from "../atomic/str";
import { regex } from "../atomic/regex";
import { seq } from "../combinators/seq";
import { interpose } from "../combinators/interpose";
import { map } from "../modifiers/map";
import { asString } from "../modifiers/asString";
import { isUndefined } from "../helpers/isUndefined";
import { isEmpty } from "../helpers/isEmpty";
import { interpolate, AppliedInterpolation } from "./interpolate";

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
  if (typeof parser === "string") return mark(str(parser));
  if (parser instanceof RegExp) return mark(regex(parser));
  throw new Error(`no parser could be located for \`${parser}\` in the template-literal`);
};

const processParser = (cur, last) => {
  if (cur.preserveResult) return map(cur, preserveResult);

  if (last) switch (true) {
    case cur === interpolate: return interpose.string(any, last);
    case cur instanceof AppliedInterpolation: return interpose(cur.parser, last);
  }

  switch (true) {
    case cur === interpolate: return asString(rest);
    case cur instanceof AppliedInterpolation: return interpose(cur.parser, endOfInput);
    default: return cur;
  }
}

/**
 * Creates a parser from a string template literal, when used as a tag.  Each placeholder will produce a result in
 * an output array, transforming an empty-result into `null`.  The string-fragments between placeholders will not
 * be included in the result.
 * 
 * Strings and regular-expressions provided directly in the placeholders will be automatically converted to an
 * appropriate parser.  Use `interpolate` to indicate that you want to match everything between the previous
 * string-fragment and the next.
 * 
 * @example <caption>Decomposing a height in the foot-inch notation to a number in inches.</caption>
 * const integer = map(regex(/\d+/), Number);
 * const parseHeight = map(parser`${integer}'${integer}"`, ([feet, inches]) => feet * 12 + inches);
 * const myHeightInInches = run(parseHeight, `5'6"`);  // myHeightInInches === 66
 * 
 * @export
 * @param {string[]} strings The string-fragments between placeholders.
 * @param {string|RegExp|Parser} parsers The parsers to use to extract values.
 * @returns {Parser<Array>} A parser constructed from a string template literal.
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