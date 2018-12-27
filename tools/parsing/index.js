export * as atomic from "./atomic";
export * as combinators from "./combinators";
export * as extensions from "./extensions";
export * as helpers from "./helpers";
export * as modifiers from "./modifiers";
export * as parsers from "./parsers";
export * from "./core";

/**
 * A basic parser function.
 * 
 * @typedef {function(ParserState): T} Parser
 * @template T
 * @param {ParserState} state The state for the current parse run.
 * @returns {T|undefined} The result of the parse; `undefined` if the parse failed.
 */

/**
 * A parser that will backtrack on failures.
 * 
 * @typedef {Parser<T>} BacktrackingParser
 * @template T
 * @property {true} _willBacktrackOnFailure Identifies the parser as one that will backtrack.
*/

/**
 * The state object for a parsing run.
 * 
 * @typedef ParserState
 * @type {Object}
 * @property {number} position The current position of the parser in the input string.
 * @property {string} input The string being parsed.
 */

/**
 * A function that takes a parser and produces a new parser.
 * 
 * @template T, U
 * @typedef {function(Parser<T>): Parser<U>} ParserModifier
 * @param {Parser<T>} parser The input parser.
 * @returns {Parser<U>} The output parser.
 */

/**
 * Represents something that is stringable; that is, something that will pass `helpers.isStringable`.
 * 
 * @typedef {string|RegExpExecArray} Stringable
 */