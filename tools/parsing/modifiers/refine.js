import { run } from "../core/run";

/**
 * Creates a parser that will run `refinementParser` on the result of `parser` and return the result.
 * 
 * @export
 * @template T
 * @param {Parser<string>} parser
 * @param {Parser<T>} refinementParser
 * @returns {Parser<T>} A parser.
 */
export const refine = (parser, refinementParser) => (state) => {
  return run(refinementParser, parser(state), state.position + state.nestedOffset);
};