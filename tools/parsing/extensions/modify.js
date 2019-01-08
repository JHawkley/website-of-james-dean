/**
 * Applies the given `parserModifier` to the result of this parser.
 *
 * @export
 * @template T, U
 * @this {Parser<T>}
 * @param {ParserModifier<T, U>} parserModifier
 * @returns {Parser<U>}
 */
export function modify(parserModifier) {
  return parserModifier(this);
}