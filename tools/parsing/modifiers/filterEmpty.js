import * as arrEx from "tools/extensions/array";
import { isEmpty } from "../helpers/isEmpty";
import { map } from "./map";

/**
 * Creates a parser that removes empty-results from the given parser's result.  If the result is not an array,
 * it will be wrapped in one.
 * 
 * This modifier will return an empty array in the case all the results were empty.  For a more-strict version
 * that expects at least one result to remain, use `filterEmpty.required`.
 *
 * @export
 * @template T
 * @param {Parser<T>} parser The parser whose result to be filtered.
 * @returns {Parser<T[]>} A parser that produces an array containing the results.
 */
export const filterEmpty = (parser) => map(parser, (parserResult) => {
  if (isEmpty(parserResult)) return [];
  if (!Array.isArray(parserResult)) return [parserResult];
  return parserResult::arrEx.reject(isEmpty);
});

/**
 * Creates a parser that removes empty-results from the given parser's result.  If the result is not an array,
 * it will be wrapped in one.
 * 
 * This version expects that at least one result will remain after filtering.  If not, the parser will consider
 * it a failure.
 *
 * @export
 * @template T
 * @param {Parser<T>} parser The parser whose result to be filtered.
 * @returns {Parser<T[]>} A parser that produces an array containing the results.
 */
filterEmpty.required = (parser) => map(parser, (parserResult) => {
  if (isEmpty(parserResult)) return void 0;
  if (!Array.isArray(parserResult)) return [parserResult];
  const result = parserResult::arrEx.reject(isEmpty);
  if (result.length === 0) return void 0;
  return result;
});