import { map } from "./map";

/**
 * Flattens the result array of `parser` by some number of `levels`.
 *
 * @export
 * @param {Parser<Array} parser The parser whose result will be flattened.
 * @param {number} levels The number of levels to flatten by.
 * @returns {Parser<Array>} A parser that produces an array.
 */
export const flattenBy = (parser, levels) => map(parser, (parserResult) => {
  return parserResult.flatten(levels);
});