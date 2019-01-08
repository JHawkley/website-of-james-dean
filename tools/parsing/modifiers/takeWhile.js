import { isResult } from "../helpers/isResult";
import { any } from "../parsers/any";
import { rest } from "../parsers/rest";
import { stringToArray } from "./stringToArray";
import { join } from "./join";

/**
 * Creates a parser that will apply the given parser until it fails, accumulating valid results, then returns
 * those results as an array.  If the given parser never matched, the array will be empty.
 *
 * @export
 * @template T
 * @param {Parser<T>} parser The parser to accumulate results from.
 * @returns {Parser<T[]>} A parser that produces the accumulated results of `parser`.
 */
export const takeWhile = (parser) => parser === any ? stringToArray(rest) : (state) => {
  const result = [];
  let value = parser(state);
  while(isResult(value)) {
    result.push(value);
    value = parser(state);
  }
  return result;
};

/**
 * Creates a parser that will apply the given parser until it fails, joining the results into a string
 * and returning it.  If the given parser never matched, the string will be empty.
 *
 * @export
 * @param {Parser<Stringable>} parser The parser to accumulate results from.
 * @returns {Parser<string>} A parser that produces the accumulated results of `parser`.
 */
takeWhile.string = (parser) => parser === any ? rest : join.all(takeWhile(parser), "");