import BadArgumentError from "lib/BadArgumentError";
import { fold, extensions as arrEx } from "tools/array";
import * as iterEx from "tools/extensions/iterables";
import { any } from "../parsers/any";
import { rest } from "../parsers/rest";
import { endOfInput } from "../parsers/endOfInput";
import { str } from "../atomic/str";
import { regex } from "../atomic/regex";
import { arr } from "../combinators/arr";
import { interpose } from "../combinators/interpose";
import { oneOf } from "../combinators/oneOf";
import { map } from "../modifiers/map";
import { asString } from "../modifiers/asString";
import { isUndefined } from "../helpers/isUndefined";
import { isEmpty } from "../helpers/isEmpty";
import { interpolate, AppliedInterpolation } from "./interpolate";

const $emptyPlaceholder = "a placeholder in the template-literal contained `null` or `undefined`";
const $badInterpolator = "arrays used as placeholders in the template-literal cannot contain an interpolation";
const $noParser = "no parser could be located for a placeholder in the template-literal";

const preservedEmpty = Symbol("template:preserved-empty");
const preserveResult = (result) => isEmpty(result) ? preservedEmpty : result;
const restoreResult = (result) => result === preservedEmpty ? null : result;
const finalizeResult = (result) => [...result::iterEx.reject(isEmpty)::iterEx.map(restoreResult)];
const emptyToVoid = (v) => v === "" ? void 0 : str.skip(v);
const mark = (p) => (p.preserveResult = true, p);
const wrap = (parser) => Object.assign((state) => parser(state), parser);

const isAnInterpolation = (parser) => parser === interpolate || parser instanceof AppliedInterpolation;

const coerceToParser = (placeholder) => {
  if (placeholder == null)
    throw new BadArgumentError($emptyPlaceholder, "placeholder", placeholder);

  // Ignore the interpolation placeholders.  We'll deal with them later.
  if (isAnInterpolation(placeholder))
    return placeholder;

  // Wrap functional parsers so we can attach our marker to it safely.
  if (typeof placeholder === "function")
    return mark(wrap(placeholder));

  // Otherwise, build the standard parsers.
  if (typeof placeholder === "string")
    return mark(str(placeholder));

  if (placeholder instanceof RegExp)
    return mark(regex(placeholder));

  // Treat an array as a `oneOf` combinator.
  if (Array.isArray(placeholder)) {
    if (placeholder.some(isAnInterpolation))
      throw new BadArgumentError($badInterpolator, "placeholder", placeholder);
    return oneOf(...placeholder.map(coerceToParser));
  }

  throw new BadArgumentError($noParser, "placeholder", placeholder);
};

const processParser = (cur, next) => {
  if (cur.preserveResult)
    return map(cur, preserveResult);

  if (cur === interpolate)
    return next ? interpose.string(any, next) : asString(rest);
  
  if (cur instanceof AppliedInterpolation)
    return next ? interpose(cur.parser, next) : interpose(cur.parser, endOfInput);

  return cur;
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
 * @param {string|RegExp|Parser} placeholders The parsers to use to extract values.
 * @returns {Parser<Array>} A parser constructed from a string template literal.
 */
export const parser = (strings, ...placeholders) => {
  const combined = fold(
    strings.map(emptyToVoid),
    placeholders.map(coerceToParser)
  )::arrEx.reject(isUndefined);

  // Start from the end, and work back.
  // `next` means "the parser after the current parser", naturally.
  let next = null;
  for (let i = combined.length - 1; i >= 0; i--)
    next = combined[i] = processParser(combined[i], next);
  
  return map(arr(combined), finalizeResult);
};