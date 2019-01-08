import { concat as combConcat } from "../combinators/concat";

/**
 * Combines this parser with the next, creating a parser that will yield the array-concatenation of the two parsers.
 *
 * @export
 * @template T
 * @this {Parser<T[]>}
 * @param {Parser<T>} nextParser The parser whose result to concatenate to this parser.
 * @returns {ConcatParser<T[]>}
 */
export function concat(nextParser) {
  return combConcat(this, nextParser);
}