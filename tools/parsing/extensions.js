import * as helpers from "./helpers";
import * as modifiers from "./modifiers";
import * as combinators from "./combinators"; 

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
  return helpers.chain(this, parserModifiers);
}

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

/**
 * Modifies this parser with the expectation that it will match successfully.  If it does not, an error will
 * be thrown with the given message.
 *
 * @export
 * @template T
 * @this {Parser<T>}
 * @param {string} [message]
 * @returns {Parser<T>}
 */
export function expect(message) {
  return modifiers.expect(this, message);
}

/**
 * Modifies this parser with the expectation that it will never match successfully.  If it does, an error will
 * be thrown with the given message.
 *
 * @export
 * @template T
 * @this {Parser<T>}
 * @param {string} [message]
 * @returns {Parser<T>}
 */
export function neverExpect(message) {
  return modifiers.neverExpect(this, message);
}

/**
 * Combines this parser with the next, creating a parser that will yield the array-concatenation of the two parsers.
 *
 * @export
 * @template T
 * @this {Parser<T[]>}
 * @param {Parser<T>} nextParser The parser whose result to concatenate to this parser.
 * @returns {ConcatParser<T[]>}
 */
export function concat(nextParser) {
  return combinators.concat(this, nextParser);
}

/**
 * Combines this parser with the next, creating a parser that will yield the string-concatenation of the two parsers.
 *
 * @export
 * @this {Parser<Stringable>}
 * @param {Parser<Stringable>} nextParser The parser whose result to concatenate to this parser.
 * @returns {ConcatParser<string>}
 */
export function then(nextParser) {
  return combinators.concat.string(this, nextParser);
}

/**
 * Modifies this parser by mapping its result using the given `transformationFn`.
 *
 * @export
 * @template T, U
 * @this {Parser<T>}
 * @param {function(T): U} transformationFn The function to transform this parser's result.
 * @returns {Parser<U>}
 */
export function map(transformationFn) {
  return modifiers.map(this, transformationFn);
}

/**
 * Flattens the result array of this parser by one level.
 *
 * @export
 * @template T
 * @this {Parser<Array<T|T[]>>}
 * @returns {Parser<T[]>} A parser that produces an array.
 */
export function flatten() {
  return modifiers.flattenBy(this, 1);
}

/**
 * Flattens the result array of this parser by some number of `levels`.
 *
 * @export
 * @this {Parser<Array}
 * @param {number} levels The number of levels to flatten by.
 * @returns {Parser<Array>} A parser that produces an array.
 */
export function flattenBy(levels) {
  return modifiers.flattenBy(this, levels);
}