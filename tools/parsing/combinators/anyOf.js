import { backtrack } from "../modifiers/backtrack";
import { map } from "../modifiers/map";
import { emptyResult } from "../core/emptyResult";
import { isResult } from "../helpers/isResult";
import { isEmpty } from "../helpers/isEmpty";

/**
 * Creates a parser that will apply as many of the given parsers to the input as possible and return their results
 * in an array.  The parsers are applied in the given order, and any that fail to match will have an empty-result
 * in their position.
 * 
 * For a version that will fail if none of the parsers match, use `anyOf.required` instead.
 *
 * @export
 * @template T
 * @param {...Parser<T>} parsers An array of parsers to attempt to apply to the input.
 * @returns {Parser<T[]>} A parser producing an array.
 */
export const anyOf = (...parsers) => {
  const backtrackingParsers = parsers.map(backtrack);
  return (state) => {
    return backtrackingParsers.map((parser) => {
      const parserResult = parser(state);
      return isResult(parserResult) ? parserResult : emptyResult;
    });
  };
};

/**
 * Creates a parser that will apply as many of the given parsers to the input as possible and return their results
 * in an array.  The parsers are applied in the given order, and any that fail to match will have an empty-result
 * in their position.
 * 
 * If none of the given parsers match, the whole parser will fail.
 *
 * @export
 * @template T
 * @param {...Parser<T>} parsers An array of parsers to attempt to apply to the input.
 * @returns {BacktrackingParser<T[]>} A parser producing an array.
 */
anyOf.required = (...parsers) => backtrack(map(anyOf(...parsers), (result) => result.every(isEmpty) ? void 0 : result));