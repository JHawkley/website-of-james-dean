import { resultToString } from "../helpers/resultToString";
import { map } from "./map";

/**
 * Creates a parser that will apply the given parser and convert its stringable result to a string.  Will return
 * `undefined` if the result was not stringable.  Handy for converting the results of the `regex` parser into a
 * proper string.
 * 
 * For a less-strict version, use `asString.force`.
 *
 * @export
 * @template T
 * @param {Parser<Stringable>} parser The parser to convert to a string.
 * @returns {Parser<string>} A parser that produces a string.
 */
export const asString = (parser) => map(parser, resultToString);

/**
 * Creates a parser that will apply the given parser and convert its result to a string.  If the result is not
 * stringable, it will use the object's `toString` method to convert it.
 *
 * @export
 * @template T
 * @param {Parser} parser The parser to convert to a string.
 * @returns {Parser<string>} A parser that produces a string.
 */
asString.force = (parser) => map(parser, resultToString.force);