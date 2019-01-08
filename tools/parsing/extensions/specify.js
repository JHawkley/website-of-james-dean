/**
 * Curries the specified, additional arguments for this parser modifier, creating a parser modifier that can
 * be applied by just supplying the parser.  Intended to be used with `chain` and `pipe`.
 * 
 * @example
 * const words = regex(new RegExp("\w*", "g"));
 * // Functionally equivalent to: `join(takeWhile(words), ",")`
 * const joinWithCommas = words::chain(takeWhile, join::specify(","));
 * // Logs a string, "1,2,3,4,5"
 * console.log(run(joinWithCommas, "1 2 3 4 5"));
 *
 * @export
 * @template T, P
 * @this {function(Parser<T>, ...P): Parser<T>}
 * @param {...P} args The arguments to supply.
 * @returns {ParserModifier<T>} A parser-modifier that only needs the `parser` argument.
 */
export function specify(...args) {
  return (parser) => this(parser, ...args);
}