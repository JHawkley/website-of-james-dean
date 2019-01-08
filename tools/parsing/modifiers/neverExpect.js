import { isUndefined } from "../helpers/isUndefined";
import { ParsingError } from "../core/parsingError";

/**
 * Creates a parser that will throw a custom error if the given parser matches successfully, or otherwise
 * returns `undefined`.
 * 
 * This version throws a basic `ParserError`.  To throw a custom error type, use `neverExpect.custom`.
 *
 * @export
 * @template T
 * @param {Parser<T>} parser The parser to wrap.
 * @param {string} [message] The message to give to the thrown `ParsingError`.
 * @returns {Parser<T>}
 */
export const neverExpect = (parser, message = "expected parser to fail") => (state) => {
  if (isUndefined(parser(state))) return void 0;
  throw new ParsingError(state, message);
};

/**
 * Creates a parser that will throw an error if the given parser matches successfully, or otherwise return its
 * `undefined`. The return value from `errorFactory` will be immediately thrown, no matter what that value happens
 * to be.
 *
 * @export
 * @template T
 * @param {Parser<T>} parser The parser to wrap.
 * @param {function(ParserState): Error} errorFactory A factory creating a custom error.
 * @returns {Parser<T>}
 */
neverExpect.custom = (parser, errorFactory) => (state) => {
  if (isUndefined(parser(state))) return void 0;
  throw errorFactory(state);
};