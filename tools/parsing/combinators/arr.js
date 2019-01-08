import * as arrEx from "tools/extensions/array";
import { backtrack } from "../modifiers/backtrack";
import { isUndefined } from "../helpers/isUndefined";
import { isResult } from "../helpers/isResult";

/**
 * Creates a parser that will try to map the given array of parsers to their results.  The parser will fail if any
 * parser in the array fails.
 *
 * @export
 * @template T
 * @param {Parser<T>[]} parsers The array of parsers.
 * @returns {BacktrackingParser<T[]>} A parser that results in an array of parsing results.
 */
export const arr = (parsers) => backtrack((state) => {
  const result = parsers::arrEx.reduceWhile([], isResult, (arr, parser) => {
    const value = parser(state);
    if (isUndefined(value)) return void 0;
    arr.push(value);
    return arr;
  });
  return result;
});