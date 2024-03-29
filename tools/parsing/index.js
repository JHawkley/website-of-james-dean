export * as parsers from "./parsers";
export * as atomic from "./atomic";
export * as combinators from "./combinators";
export * as extensions from "./extensions";
export * as helpers from "./helpers";
export * as modifiers from "./modifiers";
export * as template from "./template";
export * from "./core";

/**
 * @module tools/parsing
 */

/**
 * A basic parser function.
 * 
 * @template T
 * @callback Parser
 * @param {ParserState} state The state for the current parse run.
 * @returns {T|undefined} The result of the parse; `undefined` if the parse failed.
 */

/**
 * A parser that will backtrack on failures.
 * 
 * @template T
 * @typedef {Parser<T>} BacktrackingParser
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
 * @callback ParserModifier
 * @param {Parser<T>} parser The input parser.
 * @returns {Parser<U>} The output parser.
 */

/**
 * Represents something that is stringable; that is, something that will pass `helpers.isStringable`.
 * 
 * @typedef {string|RegExpExecArray} Stringable
 */