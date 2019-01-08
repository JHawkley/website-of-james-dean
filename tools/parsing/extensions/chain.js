import { chain as helpChain } from "../helpers/chain";

/**
 * Chains the results of this parser through the given `parserModifiers` from left-to-right.
 * 
 * @example
 * // Functionally equivalent to: `join(takeWhile(str(" ")))`
 * const joinSpaces = str(" ")::chain(takeWhile, join);
 * // Logs a string with four spaces, "    ".
 * console.log(run(joinSpaces, "    Four space indentation!"));
 *
 * @export
 * @this {Parser}
 * @param {...ParserModifier} parserModifiers
 * @returns
 */
export function chain(...parserModifiers) {
  return helpChain(this, parserModifiers);
}