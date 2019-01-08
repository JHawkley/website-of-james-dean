import { concat as combConcat } from "../combinators/concat";

/**
 * Combines this parser with the next, creating a parser that will yield the string-concatenation of the two parsers.
 *
 * @export
 * @this {Parser<Stringable>}
 * @param {Parser<Stringable>} nextParser The parser whose result to concatenate to this parser.
 * @returns {ConcatParser<string>}
 */
export function then(nextParser) {
  return combConcat.string(this, nextParser);
}