import { isResult } from "../helpers/isResult";
import { ParsingError } from "../core/parsingError";

/**
 * Creates a parser that will throw an error with the given `message` if the given parser fails to match,
 * or otherwise return its value.
 * 
 * This version throws a basic `ParserError`.  To throw a custom error type, use `expect.custom`.
 *
 * @export
 * @template T
 * @param {Parser<T>} parser The parser to wrap.
 * @param {string} [message] The message to give to the thrown `ParsingError`.
 * @returns {Parser<T>}
 */
export const expect = (parser, message = "expected parser to succeed") => (state) => {
  const value = parser(state);
  if (isResult(value)) return value;
  throw new ParsingError(state, message);
};

/**
 * Creates a parser that will throw a custom error if the given parser fails to match, or otherwise return
 * its value.  The return value from `errorFactory` will be immediately thrown, no matter what that value
 * happens to be.
 *
 * @export
 * @template T
 * @param {Parser<T>} parser The parser to wrap.
 * @param {function(ParserState): Error} errorFactory A factory creating a custom error.
 * @returns {Parser<T>}
 */
expect.custom = (parser, errorFactory) => (state) => {
  const value = parser(state);
  if (isResult(value)) return value;
  throw errorFactory(state);
}