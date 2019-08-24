import { flattenBy } from "./flattenBy";

/**
 * Flattens the result array of `parser` by one level.
 *
 * @export
 * @template T
 * @param {Parser<Array<T|T[]>>} parser The parser whose result will be flattened.
 * @returns {Parser<T[]>} A parser that produces an array.
 */
export const flatten = (parser) => flattenBy(parser, 1);