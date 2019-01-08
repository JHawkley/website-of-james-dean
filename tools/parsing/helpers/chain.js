import * as iterEx from "tools/extensions/iterables";

/**
 * Creates a new parser by applying it sequentially to the given `parserModifiers` from left-to-right.
 * Use this to perform multiple transformations on a parser's result in a sequence.
 * 
 * @example
 * const joinSpaces = chain(str(" "), [takeWhile, join]);
 * console.log(run(joinSpaces, "    Four space indentation!"));
 * // Logs a string with four spaces, "    ".
 * 
 * @export
 * @param {Parser} parser The initial parser.
 * @param {ParserModifier[]} parserModifiers
 *   An array of functions that take a parser and produce a new parser.
 * @returns {Parser}
 */
export const chain = (parser, parserModifiers) => {
  return parserModifiers::iterEx.reduce(parser, (last, factory) => factory(last));
};