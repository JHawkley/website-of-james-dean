import * as iterEx from "tools/extensions/iterables";
import { chain } from "./chain";

/**
 * Creates a new parser by applying it sequentially to the given `parserModifiers` from right-to-left.
 * Use this to perform multiple transformations on a parser's result in a sequence.
 * 
 * @example
 * const joinSpaces = pipe([join, takeWhile], str(" "));
 * console.log(run(joinSpaces, "    Four space indentation!"));
 * // Logs a string with four spaces, "    ".
 * 
 * @export
 * @param {ParserModifier[]} parserModifiers
 * @param {Parser} parser The initial parser.
 *   An array of functions that take a parser and produce a new parser.
 * @returns {Parser}
 */
export const pipe = (parserModifiers, parser) => {
  return chain(parser, parserModifiers::iterEx.reverse());
}