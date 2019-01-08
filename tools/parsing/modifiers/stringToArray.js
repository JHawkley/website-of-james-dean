import { map } from "./map";
import { asString } from "./asString";

/**
 * Creates a parser that will convert the given parser's result from something stringable to an array of characters.
 * 
 * @export
 * @template T
 * @param {Parser<Stringable>} parser The parser to wrap.
 * @returns {Parser<string[]>} A parser.
 */
export const stringToArray = (parser) => map(asString(parser), (str) => [...str]);